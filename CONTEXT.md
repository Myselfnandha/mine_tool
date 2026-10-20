# Mine Notes — Domain Model Context

Ubiquitous Language and Core Concepts for **Mine Notes**.

## Domain Glossary

### Note
A persistent written artifact containing formatted text, inline annotations, tags, checklist items, and optional attachments.
- **Attributes**: `id`, `title`, `content` (markdown/rich), `folderId`, `tags`, `isPinned`, `createdAt`, `updatedAt`, `wordCount`, `readTimeMinutes`.

### Highlight
A marked text segment within a Note or web clip, associated with a distinct tint.
- **Tints**:
  - `amber` (Focal insight / critical thought)
  - `sage` (Methodology, action item, or reference)
  - `blue` (Citation, quote, or external link)
- **Attributes**: `id`, `noteId`, `startOffset`, `endOffset`, `text`, `color`, `annotation` (optional margin thought).

### SharedLink
A web resource captured via system share intent, browser extension, or quick capture bar without requiring modal confirmation.
- **Zero-Confirmation Invariant**: Upon receiving a URL, the system automatically resolves metadata (title, icon, description, domain), determines or creates the appropriate domain folder, and persists the link immediately.
- **Attributes**: `id`, `url`, `title`, `description`, `domain`, `folderId`, `faviconUrl`, `savedAt`, `readStatus` (`unread`, `archived`), `highlights`.

### DomainFolder
A category container automatically grouped by domain name (e.g., `github.com` → "Dev & Code", `youtube.com` → "Media & Video", `arxiv.org` → "Academic & Research").
- **Attributes**: `id`, `domain`, `categoryName`, `folderName`, `icon`, `itemCount`, `color`.

### TaskItem
An actionable checklist element that can exist inside a note or independently in the Action Tracker.
- **Attributes**: `id`, `noteId` (optional link to source note), `title`, `dueDate`, `priority` (`urgent`, `high`, `medium`, `low`), `status` (`todo`, `in_progress`, `completed`), `category`.

### VoiceMemo
An audio capture or transcribed memo encapsulated as a tactile waveform audio capsule.
- **Attributes**: `id`, `noteId`, `durationMs`, `audioUrl`, `transcript`, `recordedAt`.

### WidgetIntent
A lightweight background payload dispatched from the Android Home Screen Widget to capture quick thoughts or voice memos without launching the full heavy application window.
- **Attributes**: `action` (`quick_note`, `voice_record`, `pin_toggle`), `payload`, `timestamp`.

### WorkspaceDay
A chronological focus entity tracking daily creative streaks, primary focus notebooks, voice canvases, and recent workspace logs.
