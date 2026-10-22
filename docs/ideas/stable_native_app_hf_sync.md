# Stable Native App (Offline-First) with Hugging Face Space Server & REST Sync

## Problem Statement
How might we transform Mine Notes from a remote PWA/web wrapper into a rock-solid, offline-first native Android APK that boots instantaneously with local assets, while utilizing a Hugging Face Space server as the default bidirectional REST synchronization hub?

## Recommended Direction
1. **Self-Contained Local-First Native APK (No PWA)**:
   - Strip `server.url` from Capacitor configuration. All JavaScript, CSS, typography, and layout assets are embedded directly inside the Android APK.
   - The app boots in 0ms on device, works 100% offline, and never flashes a white screen or connectivity error on startup.
   - Data is stored on-device in local storage / SQLite first. The device is always the source of immediate truth.

2. **Full Client-Server REST Sync (`/api/sync/push` & `/api/sync/pull`)**:
   - Default remote server pre-configured to `https://nandhaalagesan248-mine-notes.static.hf.space` with optional custom server URL and HF User Token in Settings.
   - Bidirectional sync engine:
     - Local mutations are tracked with `updatedAt` timestamps and dirty flags.
     - Pulls remote state and merges changes using Last-Write-Wins (LWW) conflict resolution.
     - Pushes local updates and acknowledges sync status.
   - Live visual status indicator in the app header (🟢 Synced, 🟡 Syncing, ⚪ Offline, 🔴 Error) with one-tap manual "Sync Now".
   - Automated background debounced sync on edits and network reconnect.

3. **Native Widget & Share Sheet Integration**:
   - Home screen widget captures thoughts and clips shared URLs directly into local storage instantly, then queues background synchronization with the Hugging Face Space.

## Key Assumptions to Validate
- [ ] Local bundled assets load via `https://localhost` inside Capacitor with zero network latency.
- [ ] Bidirectional REST sync merges local and remote changes without duplicating notes or links.
- [ ] When completely offline (airplane mode), the app launches and performs full editing, highlighting, and search operations without errors.
- [ ] Reconnecting to the network automatically triggers background synchronization with the Hugging Face Space.

## MVP Scope
- Remove remote `server.url` from Capacitor config so the APK is 100% self-contained.
- Deep module `syncEngine.ts` with push, pull, status reporting, and conflict resolution.
- Live sync status badge and manual "Sync Now" button in the global Header.
- Hugging Face Space Server settings in Settings screen with connection tester.
- Comprehensive unit test suite for the sync engine.
- GitHub Actions CI workflow build producing the updated native APK artifact.

## Not Doing (and Why)
- **Real-time WebSockets / Peer-to-Peer WebRTC**: Over-engineering for note-taking; REST sync with debounced background triggers and Last-Write-Wins is simpler, battery-efficient, and rock-solid.
- **Requiring Cloud Login to Use App**: Mine Notes is local-first; the app must be 100% functional without an account or internet connection.
- **Third-Party Proprietary Cloud Locks (Firebase/Supabase)**: Staying with open Hugging Face Spaces / Hub architecture with user data portability.

## Open Questions
- None. User selected Full Client-Server REST Sync with pre-configured live Hugging Face Space server default.
