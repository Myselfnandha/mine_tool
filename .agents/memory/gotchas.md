# 🛡️ ZeroGravity OS: Known Gotchas & Immunization Protocol

Anti-patterns (AP-001 through AP-017) are maintained in the machine-readable single source of truth: [`anti_patterns.json`](file:///home/nandha/Desktop/agent/.agents/memory/anti_patterns.json).

---

## 🛠️ Platform & Tooling Gotchas

### 1. Skylos SAST on Meta-Directories
- **Gotcha**: Scanning directories containing 1,450+ offline skill scripts causes slow traversal.
- **Rule**: Pass `--exclude .agents --exclude .agent --exclude venv` when running whole-project audits.

### 2. PEP 668 & Linux System Python Isolation
- **Gotcha**: Modern Linux distros (Arch, Debian 12+, Ubuntu 24+) block system-wide `pip install`.
- **Rule**: Provision isolated virtual environments under `~/.local/share/<tool>/venv` and symlink CLI entrypoints to `~/.local/bin/`.

### 3. NPM Remote Package Authorization (`EALLOWREMOTE`)
- **Gotcha**: npm v12+ defaults `allow-remote="none"`, failing to install git-based tarball dependencies.
- **Rule**: Configure `npm config set allow-remote all` during environment setup.

### 4. Static Hugging Face Space Has No Backend REST Handlers
- **Gotcha**: Hugging Face Spaces with static HTML/JS cannot accept dynamic `POST /api/...` calls; any fetch returning 404/405 was previously caught silently by connection probes, misleading sync status without actually persisting changes.
- **Rule**: In static spaces, connect bidirectional sync directly to a Hugging Face Hub Dataset Vault (`/datasets/{repo}/raw/...` and `/api/datasets/{repo}/commit/...`) with NDJSON payloads.

---

## 🔄 The 2-Way Immunization Protocol
1. **Pre-Action Check**: Before executing a tool call or creating a component, verify against `anti_patterns.json`.
2. **Post-Failure Distillation**: When a mistake, test failure, or user correction occurs:
   - Identify the exact root cause.
   - Formulate an Invariant Prevention Strategy.
   - Append to `anti_patterns.json` via `zg learn add`.
