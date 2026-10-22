# Architecture Decisions & Invariants

Durable architectural decisions and interface contracts. Implementation details live in `.agents/rules/core.md` (§0–§12).

---

## Active Invariants

### 1. Dual-Layer Codebase Analysis Engine
- **Decision**: Codebase context via injected KIs and `codebase_summary.md`, accessed natively. `analyze.py` preserved for offline CLI use only.
- **Rationale**: Eliminates process latency and shell token overhead.

### 2. Multi-Tier Security & Verification Gates
- **Decision**: All modified files pass AAA unit tests and Skylos SAST / AI hallucination verification before commit.

### 3. Native MCP Server Protocol
- **Decision**: External tool integrations use MCP in `.agents/mcp_config.json`. Zero-default (empty `mcpServers`), on-demand enable/disable.

### 4. Reactive Async Task Notification
- **Decision**: Reactive wakeup over polling loops or timers. IDE event loop auto-resumes on task completion.

### 5. Single-File Whole-Read Invariant
- **Decision**: Read entire file in one `view_file` call. No piecemeal slicing.

### 6. Pre-Execution Tool Optimization
- **Decision**: Select most token-efficient tool primitive before action. Contract matrix in `core.md` §0.

### 7. Workflow Frontmatter Contract & Dual Global Path
- **Decision**: Workflows contain `description:`-only frontmatter. Global workflows dual-sync to `~/.gemini/antigravity-ide/global_workflows/` and `~/.gemini/config/workflows/`.

### 8. Auto-Learn & Post-Execution Grill-Me
- **Decision**: Auto-distill lessons to memory + quick `/grill-me` on major execution completion (multi-file features, `/build-feature`, `/ship`).

### 9. Context-Driven Workflow Adaptation
- **Decision**: Auto-activate matching domain workflows on-demand. Load via single `view_file`. Never preload or dump into context.

### 10. Native Integrated Tools Over Internal Subprocesses
- **Decision**: NEVER invoke internal Python scripts for agent memory/context ops. Use native IDE tools exclusively. Scripts preserved for external CLI/unit tests.

### 11. Context-Driven Skill Auto-Activation
- **Decision**: Auto-inspect matching `SKILL.md` (single `view_file`) before executing specialized domain tasks.

### 12. Mine Notes: Zero-Confirmation Link Intake & Deep Modular Architecture
- **Decision**: URLs captured via Android share intent or clipboard are immediately classified by domain, automatically filed into domain folders (e.g. `github.com` → "Code & Repositories"), and persisted locally with zero confirmation dialogues. Android Home Screen Widget communicates directly via background intents to the local storage adapter with sub-15ms latency without launching full application windows.

### 13. Hugging Face Cloud Dataset Vault Synchronization
- **Decision**: In static Hugging Face Spaces where backend servers are absent, cloud synchronization targets an official Hugging Face Hub Dataset Vault (`nandhaalagesan248/mine-notes-vault`) via direct REST reads (`raw/main/vault.json` with cache busting) and native NDJSON commits (`api/datasets/{repo}/commit/main`). All clients run Last-Write-Wins (LWW) conflict resolution with soft-deletion tombstones, and React state is reactively updated upon sync completion, visibility change, and window focus.

