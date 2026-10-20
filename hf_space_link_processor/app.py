import asyncio
import datetime
import html
import logging
import os
import re
import sqlite3
import time
from typing import Dict, List, Optional
from urllib.parse import urlparse

from bs4 import BeautifulSoup
from fastapi import BackgroundTasks, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
import httpx
from pydantic import BaseModel, HttpUrl

# Setup Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("MineNotesLinkProcessor")

# App Startup Timestamp
START_TIME = time.time()

# Database Setup (Persistent SQLite in Space)
DB_PATH = os.environ.get("DB_PATH", "link_queue.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS link_jobs (
            id TEXT PRIMARY KEY,
            url TEXT NOT NULL,
            domain TEXT,
            category TEXT,
            category_color TEXT,
            category_icon TEXT,
            title TEXT,
            description TEXT,
            read_time TEXT,
            preview_image TEXT,
            status TEXT NOT NULL,
            error_message TEXT,
            created_at TEXT NOT NULL,
            processed_at TEXT
        )
    """)
    conn.commit()
    conn.close()

init_db()

# Models
class EnqueueRequest(BaseModel):
    url: str
    priority: Optional[str] = "normal"
    noteId: Optional[str] = None

class ProcessRequest(BaseModel):
    url: str

class LinkJobResult(BaseModel):
    id: str
    url: str
    domain: str
    category: str
    categoryColor: str
    categoryIcon: str
    title: str
    description: str
    readTime: str
    previewImage: Optional[str] = None
    status: str
    createdAt: str
    processedAt: Optional[str] = None
    errorMessage: Optional[str] = None

# Domain Categorization Rules
DOMAIN_RULES = [
    {
        "patterns": ["github.com", "gitlab.com", "bitbucket.org", "stackoverflow.com", "gist.github.com", "npmjs.com", "pypi.org", "dev.to"],
        "category": "Development & Code",
        "color": "#005EA4",
        "icon": "code",
    },
    {
        "patterns": ["arxiv.org", "nature.com", "biorxiv.org", "researchgate.net", "scholar.google.com", "semanticscholar.org", "sciencemag.org"],
        "category": "Research & Papers",
        "color": "#8B5CF6",
        "icon": "science",
    },
    {
        "patterns": ["dribbble.com", "behance.net", "figma.com", "awwwards.com", "pinterest.com", "artstation.com"],
        "category": "Design & Visuals",
        "color": "#C25E00",
        "icon": "palette",
    },
    {
        "patterns": ["notion.so", "linear.app", "supabase.com", "vercel.com", "stripe.com", "aws.amazon.com", "cloud.google.com", "hubspot.com"],
        "category": "Tools & SaaS",
        "color": "#3F6212",
        "icon": "build",
    },
    {
        "patterns": ["medium.com", "substack.com", "theverge.com", "wired.com", "arstechnica.com", "paulgraham.com", "nytimes.com", "theatlantic.com"],
        "category": "Writing & Essays",
        "color": "#F59E0B",
        "icon": "article",
    },
    {
        "patterns": ["bloomberg.com", "wsj.com", "ft.com", "ycombinator.com", "news.ycombinator.com", "reuters.com", "forbes.com"],
        "category": "Finance & Tech",
        "color": "#059669",
        "icon": "trending_up",
    },
    {
        "patterns": ["youtube.com", "youtu.be", "vimeo.com", "spotify.com", "twitch.tv", "soundcloud.com", "podcasts.apple.com"],
        "category": "Media & Audio",
        "color": "#BA1A1A",
        "icon": "play_circle",
    },
]

def classify_url(url: str):
    try:
        parsed = urlparse(url)
        hostname = (parsed.hostname or "").lower()
        if hostname.startswith("www."):
            hostname = hostname[4:]

        for rule in DOMAIN_RULES:
            for pattern in rule["patterns"]:
                if hostname == pattern or hostname.endswith("." + pattern):
                    return {
                        "domain": hostname,
                        "category": rule["category"],
                        "color": rule["color"],
                        "icon": rule["icon"],
                    }

        # Fallback category based on root domain
        clean_domain = hostname.split(".")[0].capitalize() if hostname else "Web"
        return {
            "domain": hostname or "web",
            "category": f"{clean_domain} Shelf",
            "color": "#564337",
            "icon": "bookmark",
        }
    except Exception:
        return {
            "domain": "web",
            "category": "Web Shelf",
            "color": "#564337",
            "icon": "bookmark",
        }

async def fetch_link_metadata(url: str) -> Dict[str, str]:
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; MineNotesLinkBot/1.0; +https://huggingface.co/spaces/nandhaalagesan248/mine-notes-link-processor)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }
    title = ""
    description = ""
    image = None
    read_time = "1 min read"

    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, "html.parser")

                # Extract Title
                og_title = soup.find("meta", property="og:title")
                tw_title = soup.find("meta", attrs={"name": "twitter:title"})
                if og_title and og_title.get("content"):
                    title = og_title["content"].strip()
                elif tw_title and tw_title.get("content"):
                    title = tw_title["content"].strip()
                elif soup.title and soup.title.string:
                    title = soup.title.string.strip()

                # Extract Description
                og_desc = soup.find("meta", property="og:description")
                meta_desc = soup.find("meta", attrs={"name": "description"})
                if og_desc and og_desc.get("content"):
                    description = og_desc["content"].strip()
                elif meta_desc and meta_desc.get("content"):
                    description = meta_desc["content"].strip()

                # Extract Image
                og_img = soup.find("meta", property="og:image")
                if og_img and og_img.get("content"):
                    image = og_img["content"].strip()

                # Estimate Read Time based on text
                body_text = soup.get_text()
                word_count = len(body_text.split())
                minutes = max(1, round(word_count / 220))
                read_time = f"{minutes} min read"
    except Exception as e:
        logger.warning(f"Error fetching URL {url}: {e}")

    parsed = urlparse(url)
    if not title:
        title = parsed.path.strip("/").split("/")[-1] or parsed.hostname or url
        title = title.replace("-", " ").replace("_", " ").capitalize()
    if not description:
        description = f"Captured reference link from {parsed.hostname or url}"

    return {
        "title": title[:180],
        "description": description[:350],
        "image": image,
        "read_time": read_time,
    }

# Asynchronous Background Queue Worker
link_queue: asyncio.Queue = asyncio.Queue()

async def queue_worker():
    logger.info("24/7 Automated Link Queue Worker started.")
    while True:
        try:
            job_id, url = await link_queue.get()
            logger.info(f"Processing job {job_id} for URL: {url}")

            # Update status to processing
            conn = sqlite3.connect(DB_PATH)
            cur = conn.cursor()
            cur.execute("UPDATE link_jobs SET status = 'processing' WHERE id = ?", (job_id,))
            conn.commit()

            # Classify and scrape
            cls = classify_url(url)
            meta = await fetch_link_metadata(url)
            now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

            cur.execute("""
                UPDATE link_jobs
                SET domain = ?, category = ?, category_color = ?, category_icon = ?,
                    title = ?, description = ?, read_time = ?, preview_image = ?,
                    status = 'completed', processed_at = ?
                WHERE id = ?
            """, (
                cls["domain"], cls["category"], cls["color"], cls["icon"],
                meta["title"], meta["description"], meta["read_time"], meta["image"],
                now_iso, job_id
            ))
            conn.commit()
            conn.close()

            link_queue.task_done()
            logger.info(f"Successfully processed job {job_id} -> {meta['title']}")
        except Exception as e:
            logger.error(f"Error in queue_worker: {e}")
            await asyncio.sleep(2)

# FastAPI App
app = FastAPI(
    title="Mine Notes Automated Link Queue Processor",
    description="24/7 background link processor and zero-confirmation domain categorizer for Mine Notes.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(queue_worker())

# API Endpoints
@app.get("/health")
def health():
    uptime = round(time.time() - START_TIME)
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT count(*) FROM link_jobs")
    total_jobs = cur.fetchone()[0]
    conn.close()

    return {
        "status": "healthy",
        "service": "mine-notes-link-queue-processor",
        "uptime_seconds": uptime,
        "queue_backlog": link_queue.qsize(),
        "total_jobs_recorded": total_jobs,
        "server_time": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }

@app.post("/api/queue")
async def enqueue_link(req: EnqueueRequest):
    if not req.url or not req.url.startswith("http"):
        raise HTTPException(status_code=400, detail="Invalid URL protocol. Must start with http:// or https://")

    job_id = f"job_{int(time.time() * 1000)}_{os.urandom(2).hex()}"
    cls = classify_url(req.url)
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO link_jobs (id, url, domain, category, category_color, category_icon, title, description, read_time, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'queued', ?)
    """, (
        job_id, req.url, cls["domain"], cls["category"], cls["color"], cls["icon"],
        f"Processing {cls['domain']}...", "Link queued for background extraction and reader mode sync.",
        "1 min read", now_iso
    ))
    conn.commit()
    conn.close()

    await link_queue.put((job_id, req.url))

    return {
        "jobId": job_id,
        "status": "queued",
        "url": req.url,
        "domain": cls["domain"],
        "category": cls["category"],
        "queuePosition": link_queue.qsize(),
    }

@app.get("/api/queue")
def list_queue(limit: int = 50):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("""
        SELECT * FROM link_jobs ORDER BY created_at DESC LIMIT ?
    """, (limit,))
    rows = cur.fetchall()
    conn.close()

    return [
        {
            "id": r["id"],
            "url": r["url"],
            "domain": r["domain"],
            "category": r["category"],
            "categoryColor": r["category_color"],
            "categoryIcon": r["category_icon"],
            "title": r["title"],
            "description": r["description"],
            "readTime": r["read_time"],
            "previewImage": r["preview_image"],
            "status": r["status"],
            "errorMessage": r["error_message"],
            "createdAt": r["created_at"],
            "processedAt": r["processed_at"],
        }
        for r in rows
    ]

@app.get("/api/queue/{job_id}")
def get_job(job_id: str):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("SELECT * FROM link_jobs WHERE id = ?", (job_id,))
    row = cur.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "id": row["id"],
        "url": row["url"],
        "domain": row["domain"],
        "category": row["category"],
        "categoryColor": row["category_color"],
        "categoryIcon": row["category_icon"],
        "title": row["title"],
        "description": row["description"],
        "readTime": row["read_time"],
        "previewImage": row["preview_image"],
        "status": row["status"],
        "errorMessage": row["error_message"],
        "createdAt": row["created_at"],
        "processedAt": row["processed_at"],
    }

@app.post("/api/process-link")
async def process_link_synchronous(req: ProcessRequest):
    if not req.url or not req.url.startswith("http"):
        raise HTTPException(status_code=400, detail="Invalid URL protocol. Must start with http:// or https://")

    cls = classify_url(req.url)
    meta = await fetch_link_metadata(req.url)
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    return {
        "url": req.url,
        "domain": cls["domain"],
        "category": cls["category"],
        "categoryColor": cls["color"],
        "categoryIcon": cls["icon"],
        "title": meta["title"],
        "description": meta["description"],
        "readTime": meta["read_time"],
        "previewImage": meta["image"],
        "processedAt": now_iso,
    }

@app.get("/api/stats")
def get_stats():
    uptime = round(time.time() - START_TIME)
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT count(*) FROM link_jobs")
    total = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM link_jobs WHERE status = 'completed'")
    completed = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM link_jobs WHERE status = 'queued'")
    queued = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM link_jobs WHERE status = 'processing'")
    processing = cur.fetchone()[0]
    conn.close()

    return {
        "uptimeSeconds": uptime,
        "totalProcessed": completed,
        "activeQueue": queued + processing,
        "successRate": f"{(completed / total * 100):.1f}%" if total > 0 else "100%",
        "activeWorkers": 1,
        "huggingFaceTier": "Free (2 vCPU, 16GB RAM)",
    }

# Web Dashboard UI in Warm Editorial Utilitarian Aesthetic
@app.get("/", response_class=HTMLResponse)
def dashboard():
    return """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mine Notes • 24/7 Link Queue Processor</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #FAF6F4; color: #1C1B1B; }
        .font-serif { font-family: 'Newsreader', serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
    </style>
</head>
<body class="min-h-screen flex flex-col">
    <!-- Header -->
    <header class="bg-[#FAF6F4] border-b border-[#EADDD5] px-6 py-4 sticky top-0 z-30 shadow-xs">
        <div class="max-w-6xl mx-auto flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-[#C25E00] flex items-center justify-center text-white shadow-xs">
                    <span class="material-symbols-outlined text-[24px]">bookmark</span>
                </div>
                <div>
                    <h1 class="font-serif text-xl font-bold tracking-tight text-[#1C1B1B]">Mine Notes</h1>
                    <p class="text-xs text-[#897265] font-sans">Automated Link Queue Processor • 24/7 Hugging Face Server</p>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <span class="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                    24/7 Online
                </span>
                <a href="/docs" target="_blank" class="px-3 py-1.5 rounded-lg border border-[#D5C2B6] text-xs font-semibold text-[#564337] hover:bg-white transition-colors flex items-center gap-1">
                    <span class="material-symbols-outlined text-[16px]">api</span>
                    FastAPI Docs
                </a>
            </div>
        </div>
    </header>

    <!-- Main Container -->
    <main class="flex-1 max-w-6xl w-full mx-auto px-6 py-8 space-y-8">
        <!-- Telemetry Stats Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-white border border-[#EADDD5] rounded-2xl p-5 shadow-xs">
                <div class="flex items-center justify-between text-[#897265] mb-2">
                    <span class="text-xs uppercase font-bold tracking-wider">Total Processed</span>
                    <span class="material-symbols-outlined text-[#C25E00]">task_alt</span>
                </div>
                <div id="stat-total" class="text-3xl font-bold text-[#1C1B1B] font-serif">--</div>
                <p class="text-[11px] text-[#897265] mt-1">Zero-confirmation clips archived</p>
            </div>

            <div class="bg-white border border-[#EADDD5] rounded-2xl p-5 shadow-xs">
                <div class="flex items-center justify-between text-[#897265] mb-2">
                    <span class="text-xs uppercase font-bold tracking-wider">Active Queue</span>
                    <span class="material-symbols-outlined text-[#005EA4]">schedule</span>
                </div>
                <div id="stat-queue" class="text-3xl font-bold text-[#005EA4] font-serif">0</div>
                <p class="text-[11px] text-[#897265] mt-1">Background asyncio consumers</p>
            </div>

            <div class="bg-white border border-[#EADDD5] rounded-2xl p-5 shadow-xs">
                <div class="flex items-center justify-between text-[#897265] mb-2">
                    <span class="text-xs uppercase font-bold tracking-wider">Success Rate</span>
                    <span class="material-symbols-outlined text-emerald-600">verified</span>
                </div>
                <div id="stat-rate" class="text-3xl font-bold text-emerald-700 font-serif">100%</div>
                <p class="text-[11px] text-[#897265] mt-1">Domain extraction fidelity</p>
            </div>

            <div class="bg-white border border-[#EADDD5] rounded-2xl p-5 shadow-xs">
                <div class="flex items-center justify-between text-[#897265] mb-2">
                    <span class="text-xs uppercase font-bold tracking-wider">Server Uptime</span>
                    <span class="material-symbols-outlined text-purple-600">hourglass_top</span>
                </div>
                <div id="stat-uptime" class="text-2xl font-bold text-[#1C1B1B] font-mono">0s</div>
                <p class="text-[11px] text-[#897265] mt-1">Hugging Face Spaces Free Tier</p>
            </div>
        </div>

        <!-- Interactive URL Processor Box -->
        <div class="bg-white border border-[#EADDD5] rounded-2xl p-6 shadow-xs">
            <div class="flex items-center gap-2 mb-2">
                <span class="material-symbols-outlined text-[#C25E00]">electric_bolt</span>
                <h2 class="font-serif text-lg font-bold text-[#1C1B1B]">Live URL Processor & Domain Tester</h2>
            </div>
            <p class="text-xs text-[#897265] mb-4">
                Test the zero-confirmation domain classification and metadata extraction pipeline instantly.
            </p>

            <form id="test-form" class="flex flex-col sm:flex-row gap-3">
                <div class="relative flex-1">
                    <span class="absolute left-3.5 top-3 text-[#897265] material-symbols-outlined text-[18px]">link</span>
                    <input
                        type="url"
                        id="test-url"
                        required
                        placeholder="https://github.com/facebook/react or https://arxiv.org/abs/2312.00752"
                        class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D5C2B6] bg-[#FAF6F4] text-xs sm:text-sm text-[#1C1B1B] placeholder-[#A89487] focus:outline-none focus:border-[#C25E00] focus:ring-1 focus:ring-[#C25E00]"
                    />
                </div>
                <button
                    type="submit"
                    id="btn-process"
                    class="px-5 py-2.5 rounded-xl bg-[#C25E00] text-white font-semibold text-xs sm:text-sm hover:opacity-95 transition-opacity flex items-center justify-center gap-2 shadow-xs"
                >
                    <span class="material-symbols-outlined text-[18px]">bolt</span>
                    Extract & Classify
                </button>
            </form>

            <!-- Result Card (Hidden by default) -->
            <div id="test-result" class="hidden mt-5 p-4 rounded-xl border border-[#EADDD5] bg-[#FAF6F4] space-y-3">
                <div class="flex items-center justify-between">
                    <span id="res-badge" class="px-2.5 py-1 rounded-md text-xs font-bold text-white bg-[#005EA4] flex items-center gap-1.5">
                        <span id="res-icon" class="material-symbols-outlined text-[14px]">code</span>
                        <span id="res-category">Development & Code</span>
                    </span>
                    <span id="res-domain" class="text-xs font-mono font-semibold text-[#897265]">github.com</span>
                </div>
                <h3 id="res-title" class="font-serif text-base font-bold text-[#1C1B1B]">--</h3>
                <p id="res-desc" class="text-xs text-[#564337] leading-relaxed">--</p>
                <div class="flex items-center gap-4 text-[11px] text-[#897265] pt-1 border-t border-[#EADDD5]">
                    <span id="res-readtime" class="flex items-center gap-1">
                        <span class="material-symbols-outlined text-[14px]">timer</span>
                        1 min read
                    </span>
                    <span class="flex items-center gap-1 text-emerald-700 font-semibold">
                        <span class="material-symbols-outlined text-[14px]">check_circle</span>
                        Zero-Confirmation Ready
                    </span>
                </div>
            </div>
        </div>

        <!-- Recent Queue Activity Table -->
        <div class="bg-white border border-[#EADDD5] rounded-2xl p-6 shadow-xs space-y-4">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="font-serif text-lg font-bold text-[#1C1B1B]">Automated Queue Log</h2>
                    <p class="text-xs text-[#897265]">Real-time background worker tasks and offline sync pipeline</p>
                </div>
                <button onclick="loadQueue()" class="p-2 rounded-lg text-[#897265] hover:bg-[#FAF6F4] transition-colors" title="Refresh Queue">
                    <span class="material-symbols-outlined text-[20px]">refresh</span>
                </button>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr class="border-b border-[#EADDD5] text-[#897265] font-semibold">
                            <th class="py-2.5 px-3">Status</th>
                            <th class="py-2.5 px-3">Folder / Domain</th>
                            <th class="py-2.5 px-3">Title & Metadata</th>
                            <th class="py-2.5 px-3">Read Time</th>
                            <th class="py-2.5 px-3">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody id="queue-tbody" class="divide-y divide-[#EADDD5]">
                        <tr>
                            <td colspan="5" class="py-6 text-center text-[#897265]">Loading queue items...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </main>

    <!-- Footer -->
    <footer class="bg-[#FAF6F4] border-t border-[#EADDD5] py-4 text-center text-xs text-[#897265]">
        Mine Notes 24/7 Automated Link Queue Processor • Deployed on Hugging Face Spaces • React 19 & Capacitor Android Integration
    </footer>

    <script>
        async function fetchStats() {
            try {
                const res = await fetch('/api/stats');
                const data = await res.json();
                document.getElementById('stat-total').innerText = data.totalProcessed;
                document.getElementById('stat-queue').innerText = data.activeQueue;
                document.getElementById('stat-rate').innerText = data.successRate;
                const hours = Math.floor(data.uptimeSeconds / 3600);
                const mins = Math.floor((data.uptimeSeconds % 3600) / 60);
                const secs = data.uptimeSeconds % 60;
                document.getElementById('stat-uptime').innerText = `${hours}h ${mins}m ${secs}s`;
            } catch (e) {
                console.error(e);
            }
        }

        async function loadQueue() {
            try {
                const res = await fetch('/api/queue?limit=15');
                const items = await res.json();
                const tbody = document.getElementById('queue-tbody');
                if (items.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5" class="py-6 text-center text-[#897265]">No queued links yet. Submit a link above to start!</td></tr>';
                    return;
                }
                tbody.innerHTML = items.map(item => `
                    <tr class="hover:bg-[#FAF6F4] transition-colors">
                        <td class="py-3 px-3">
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                                item.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                                item.status === 'processing' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                                'bg-sky-100 text-sky-800'
                            }">
                                ${item.status}
                            </span>
                        </td>
                        <td class="py-3 px-3 font-semibold text-[#1C1B1B]">
                            <div class="flex items-center gap-1.5">
                                <span class="material-symbols-outlined text-[15px]" style="color: ${item.categoryColor}">${item.categoryIcon}</span>
                                <span>${item.category}</span>
                            </div>
                            <div class="text-[10px] text-[#897265] font-mono mt-0.5">${item.domain}</div>
                        </td>
                        <td class="py-3 px-3 max-w-md">
                            <div class="font-bold text-[#1C1B1B] truncate">${item.title}</div>
                            <div class="text-[11px] text-[#897265] truncate mt-0.5">${item.description}</div>
                        </td>
                        <td class="py-3 px-3 text-[#564337]">${item.readTime || '1 min'}</td>
                        <td class="py-3 px-3 text-[#897265] font-mono text-[10px]">${item.createdAt ? item.createdAt.substring(11, 19) + ' UTC' : '--'}</td>
                    </tr>
                `).join('');
            } catch (e) {
                console.error(e);
            }
        }

        document.getElementById('test-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const urlInput = document.getElementById('test-url');
            const btn = document.getElementById('btn-process');
            const resultBox = document.getElementById('test-result');

            btn.disabled = true;
            btn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">sync</span> Extracting...';

            try {
                const res = await fetch('/api/process-link', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: urlInput.value })
                });
                const data = await res.json();

                document.getElementById('res-category').innerText = data.category;
                document.getElementById('res-icon').innerText = data.categoryIcon;
                document.getElementById('res-badge').style.backgroundColor = data.categoryColor;
                document.getElementById('res-domain').innerText = data.domain;
                document.getElementById('res-title').innerText = data.title;
                document.getElementById('res-desc').innerText = data.description;
                document.getElementById('res-readtime').innerText = data.readTime;

                resultBox.classList.remove('hidden');

                // Also enqueue it so it shows in the background table
                await fetch('/api/queue', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: urlInput.value })
                });

                fetchStats();
                loadQueue();
            } catch (err) {
                alert('Extraction failed: ' + err.message);
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<span class="material-symbols-outlined text-[18px]">bolt</span> Extract & Classify';
            }
        });

        fetchStats();
        loadQueue();
        setInterval(fetchStats, 5000);
        setInterval(loadQueue, 8000);
    </script>
</body>
</html>
    """
