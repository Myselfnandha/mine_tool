#!/usr/bin/env python3
"""
Mine Notes Automated Link Queue Processor
24/7 Automated Link Processing & Domain Classification Script for GitHub Actions / HF Server
"""

import sys
import json
import re
import urllib.request
import urllib.parse
from html.parser import HTMLParser
from datetime import datetime, timezone

DOMAIN_RULES = [
    {
        "patterns": ["github.com", "gitlab.com", "bitbucket.org", "stackoverflow.com", "gist.github.com", "npmjs.com", "pypi.org", "dev.to"],
        "category": "Development & Code",
        "color": "#005EA4",
        "icon": "code",
    },
    {
        "patterns": ["arxiv.org", "nature.com", "biorxiv.org", "researchgate.net", "scholar.google.com", "semanticscholar.org"],
        "category": "Research & Papers",
        "color": "#8B5CF6",
        "icon": "science",
    },
    {
        "patterns": ["dribbble.com", "behance.net", "figma.com", "awwwards.com", "pinterest.com"],
        "category": "Design & Visuals",
        "color": "#C25E00",
        "icon": "palette",
    },
    {
        "patterns": ["notion.so", "linear.app", "supabase.com", "vercel.com", "stripe.com", "aws.amazon.com"],
        "category": "Tools & SaaS",
        "color": "#3F6212",
        "icon": "build",
    },
    {
        "patterns": ["medium.com", "substack.com", "theverge.com", "wired.com", "arstechnica.com", "paulgraham.com"],
        "category": "Writing & Essays",
        "color": "#F59E0B",
        "icon": "article",
    },
    {
        "patterns": ["bloomberg.com", "wsj.com", "ft.com", "ycombinator.com", "news.ycombinator.com"],
        "category": "Finance & Tech",
        "color": "#059669",
        "icon": "trending_up",
    },
    {
        "patterns": ["youtube.com", "youtu.be", "vimeo.com", "spotify.com"],
        "category": "Media & Audio",
        "color": "#BA1A1A",
        "icon": "play_circle",
    },
]

class MetaHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ""
        self.description = ""
        self.in_title = False
        self.text_content = []

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        if tag == "title" and not self.title:
            self.in_title = True
        elif tag == "meta":
            prop = attrs_dict.get("property") or attrs_dict.get("name", "")
            content = attrs_dict.get("content", "")
            if prop in ["og:title", "twitter:title"] and not self.title:
                self.title = content.strip()
            elif prop in ["description", "og:description", "twitter:description"] and not self.description:
                self.description = content.strip()

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False

    def handle_data(self, data):
        if self.in_title and not self.title:
            self.title = data.strip()
        self.text_content.append(data)

def classify_url(url: str):
    parsed = urllib.parse.urlparse(url)
    hostname = (parsed.hostname or "").lower()
    if hostname.startswith("www."):
        hostname = hostname[4:]

    for rule in DOMAIN_RULES:
        for p in rule["patterns"]:
            if hostname == p or hostname.endswith("." + p):
                return {
                    "domain": hostname,
                    "category": rule["category"],
                    "color": rule["color"],
                    "icon": rule["icon"]
                }

    clean_name = hostname.split(".")[0].capitalize() if hostname else "Web"
    return {
        "domain": hostname or "web",
        "category": f"{clean_name} Shelf",
        "color": "#564337",
        "icon": "bookmark"
    }

def process_url(url: str):
    cls = classify_url(url)
    title = ""
    description = ""
    read_time = "1 min read"

    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0 (compatible; MineNotesBot/1.0)"}
        )
        with urllib.request.urlopen(req, timeout=8) as resp:
            charset = resp.headers.get_content_charset() or "utf-8"
            html_text = resp.read().decode(charset, errors="ignore")
            parser = MetaHTMLParser()
            parser.feed(html_text)
            title = parser.title
            description = parser.description
            total_words = len(" ".join(parser.text_content).split())
            read_time = f"{max(1, round(total_words / 220))} min read"
    except Exception as e:
        pass

    if not title:
        parsed = urllib.parse.urlparse(url)
        title = parsed.path.strip("/").split("/")[-1] or parsed.hostname or url
        title = title.replace("-", " ").replace("_", " ").capitalize()
    if not description:
        description = f"Captured reference link from {cls['domain']}"

    return {
        "url": url,
        "domain": cls["domain"],
        "folderCategory": cls["category"],
        "folderColor": cls["color"],
        "folderIcon": cls["icon"],
        "title": title[:160],
        "description": description[:320],
        "readTime": read_time,
        "processedAt": datetime.now(timezone.utc).isoformat(),
        "status": "completed"
    }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        test_url = sys.argv[1]
        print(json.dumps(process_url(test_url), indent=2))
    else:
        print("Usage: ./process_link_queue.py <url>")
