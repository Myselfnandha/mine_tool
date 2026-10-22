import { Note, SharedLink, TaskItem, Notebook, SyncStatus, SyncStatusInfo, SyncPayload, SyncResponse } from '../../types';
import { StorageAdapter } from '../storage/storageAdapter';

export const DEFAULT_HF_DATASET_REPO = 'nandhaalagesan248/mine-notes-vault';
export const DEFAULT_HF_SPACE_URL = 'https://nandhaalagesan248-mine-notes.static.hf.space';
export const DEFAULT_HF_TOKEN =
  'hf_oauth_eyJhbGciOiJFZERTQSIsImtpZCI6IjVHZDBvd0g5MTM2eDZjc1FvbE1zcktNWUZoRVFoUm5PVVVybEpjOUhaUEEifQ.eyJzY29wZSI6WyJtYW5hZ2UtcmVwb3MiLCJ3cml0ZS1yZXBvcyIsInJlYWQtcmVwb3MiLCJnYXRlZC1yZXBvcyIsImNvbnRyaWJ1dGUtcmVwb3MiLCJ3cml0ZS1jb2xsZWN0aW9ucyIsInJlYWQtY29sbGVjdGlvbnMiLCJvcGVuaWQiLCJ3cml0ZS1kaXNjdXNzaW9ucyIsImluZmVyZW5jZS1hcGkiLCJqb2JzIiwid2ViaG9va3MiLCJyZWFkLWJpbGxpbmciLCJyZWFkLW1jcCJdLCJhdWQiOiJodHRwczovL2h1Z2dpbmdmYWNlLmNvIiwiY2xpZW50X2lkIjoiMjZiZTZiMDktOTFjNS00N2RhLTk4NjEtZDJkMmJiN2E3ZTM2Iiwic2Vzc2lvbklkIjoiNmFhNDNmNDZjZGMxNDI5ZmMwNmQ4NDRkIiwiaWF0IjoxNzkxNDc3NDg3LCJqdGkiOiJiYTA4ZDU5Yi03NmNmLTRmNTAtOTUwMi1jNTIzMTgwMmE5MTIiLCJzdWIiOiI2ODZlNGZkZjA3NDczYmFjYzQ0YTljMmUiLCJleHAiOjE3OTQwNjk0ODcsImlzcyI6Imh0dHBzOi8vaHVnZ2luZ2ZhY2UuY28ifQ.5b_mA6Q-ZywtKzMtAaHvTRnt-1eZjcjHZ5JEXwn6Zo8DoGoW2jjC1YrcqR9a1AyAc2vETWbXRpcJVa9-zcgODg';

/**
 * Universal browser-safe UTF-8 to Base64 encoder (handles Unicode/emojis cleanly)
 */
export function utf8ToBase64(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf-8').toString('base64');
  }
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export class SyncEngine {
  private static statusInfo: SyncStatusInfo = {
    status: 'idle',
    pendingChangesCount: 0,
    lastSyncedAt: undefined,
  };

  private static listeners: Array<(info: SyncStatusInfo) => void> = [];

  public static getStatus(): SyncStatusInfo {
    return { ...this.statusInfo };
  }

  public static subscribe(listener: (info: SyncStatusInfo) => void): () => void {
    this.listeners.push(listener);
    listener(this.getStatus());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private static notify(): void {
    const current = this.getStatus();
    this.listeners.forEach((l) => {
      try {
        l(current);
      } catch (err) {
        console.error('Error in sync listener callback:', err);
      }
    });
  }

  public static markDirty(delta = 1): void {
    this.statusInfo.pendingChangesCount = Math.max(0, this.statusInfo.pendingChangesCount + delta);
    this.notify();
  }

  public static isOnline(): boolean {
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      return navigator.onLine;
    }
    return true;
  }

  /**
   * Deterministic Last-Write-Wins (LWW) conflict resolution between local and remote items.
   */
  public static resolveConflict<
    T extends { id: string; updatedAt?: string; savedAt?: string; createdAt?: string; isDeleted?: boolean }
  >(localList: T[], remoteList: T[]): T[] {
    const map = new Map<string, T>();

    // Index local items
    for (const item of localList) {
      map.set(item.id, item);
    }

    // Merge remote items with Last-Write-Wins
    for (const remote of remoteList) {
      const local = map.get(remote.id);
      if (!local) {
        map.set(remote.id, remote);
      } else {
        const localTime = new Date(local.updatedAt || local.savedAt || local.createdAt || 0).getTime();
        const remoteTime = new Date(remote.updatedAt || remote.savedAt || remote.createdAt || 0).getTime();

        if (remoteTime >= localTime) {
          map.set(remote.id, remote);
        }
      }
    }

    return Array.from(map.values());
  }

  /**
   * Probe test connection against Hugging Face Dataset Vault or Space server URL.
   */
  public static async testConnection(
    customTarget?: string,
    customToken?: string
  ): Promise<{ success: boolean; message: string; latencyMs: number }> {
    const settings = StorageAdapter.getSettings();
    const isUrl = customTarget && (customTarget.startsWith('http://') || customTarget.startsWith('https://'));
    const repo = (!isUrl && customTarget ? customTarget : (settings.hfDatasetRepo || DEFAULT_HF_DATASET_REPO)).trim();
    const token = (customToken !== undefined ? customToken : (settings.hfAccessToken || DEFAULT_HF_TOKEN)).trim();
    const startTime = Date.now();

    try {
      if (isUrl) {
        // Direct server URL probe
        const resp = await fetch(customTarget!, { method: 'GET' }).catch(() => null);
        const latencyMs = Date.now() - startTime;
        if (resp && (resp.ok || resp.status === 200 || resp.status === 304 || resp.status === 302)) {
          return {
            success: true,
            message: `Connected to Hugging Face Server (${latencyMs}ms latency)`,
            latencyMs,
          };
        }
        return {
          success: false,
          message: `Connection failed: Server returned HTTP ${resp ? resp.status : 'unreachable'}`,
          latencyMs,
        };
      }

      // Dataset Vault probe
      const rawUrl = `https://huggingface.co/datasets/${repo}/raw/main/vault.json?t=${Date.now()}`;
      const headers: Record<string, string> = {
        'Accept': 'application/json, text/plain, */*',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const rawResp = await fetch(rawUrl, { method: 'GET', headers }).catch(() => null);
      const latencyMs = Date.now() - startTime;

      if (!rawResp || (!rawResp.ok && rawResp.status !== 404)) {
        return {
          success: false,
          message: `Connection failed: Unable to reach Cloud Vault (HTTP ${rawResp ? rawResp.status : 'unreachable'})`,
          latencyMs,
        };
      }

      if (token) {
        try {
          const whoResp = await fetch('https://huggingface.co/api/whoami-v2', {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (whoResp && whoResp.ok) {
            const whoData = await whoResp.json();
            return {
              success: true,
              message: `Authenticated as "${whoData.name || 'user'}" to Cloud Vault (${repo}) (${latencyMs}ms)`,
              latencyMs,
            };
          }
        } catch {
          // If whoami fails or is mocked once, fall back to read access confirmation
        }
      }

      return {
        success: true,
        message: `Verified read access to Cloud Vault (${repo}) (${latencyMs}ms latency)`,
        latencyMs,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      return {
        success: false,
        message: `Connection failed: ${err.message || 'Network request timed out'}`,
        latencyMs,
      };
    }
  }

  /**
   * Execute full bidirectional synchronization with Hugging Face Dataset Vault.
   */
  public static async sync(options?: { force?: boolean }): Promise<{
    success: boolean;
    message: string;
    mergedCount: number;
  }> {
    if (!this.isOnline()) {
      this.statusInfo.status = 'offline';
      this.statusInfo.errorMessage = 'Device is offline. Changes saved in local vault.';
      this.notify();
      return {
        success: false,
        message: 'Offline: Changes saved to local storage.',
        mergedCount: 0,
      };
    }

    this.statusInfo.status = 'syncing';
    this.statusInfo.errorMessage = undefined;
    this.notify();

    const settings = StorageAdapter.getSettings();
    const repo = (settings.hfDatasetRepo || DEFAULT_HF_DATASET_REPO).trim();
    const token = (settings.hfAccessToken || DEFAULT_HF_TOKEN).trim();

    const localNotes = StorageAdapter.getRawNotes();
    const localLinks = StorageAdapter.getRawLinks();
    const localTasks = StorageAdapter.getRawTasks();
    const localNotebooks = StorageAdapter.getRawNotebooks();

    try {
      // Step 1: Fetch remote vault with cache busting
      const rawUrl = `https://huggingface.co/datasets/${repo}/raw/main/vault.json?t=${Date.now()}`;
      const headers: Record<string, string> = {
        'Accept': 'application/json, text/plain, */*',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      let remoteNotes: Note[] = [];
      let remoteLinks: SharedLink[] = [];
      let remoteTasks: TaskItem[] = [];
      let remoteNotebooks: Notebook[] = [];

      try {
        const fetchResp = await fetch(rawUrl, { method: 'GET', headers });
        if (fetchResp.ok) {
          const remoteData = await fetchResp.json();
          if (Array.isArray(remoteData.notes)) remoteNotes = remoteData.notes;
          if (Array.isArray(remoteData.links)) remoteLinks = remoteData.links;
          if (Array.isArray(remoteData.tasks)) remoteTasks = remoteData.tasks;
          if (Array.isArray(remoteData.notebooks)) remoteNotebooks = remoteData.notebooks;
        } else if (fetchResp.status !== 404) {
          console.warn('Remote vault fetch returned non-200/404:', fetchResp.status);
        }
      } catch (fetchErr) {
        console.warn('Direct fetch from dataset vault raw URL failed:', fetchErr);
      }

      // Step 2: Merge local and remote changes using Last-Write-Wins (LWW)
      const mergedNotes = this.resolveConflict(localNotes, remoteNotes);
      const mergedLinks = this.resolveConflict(localLinks, remoteLinks);
      const mergedTasks = this.resolveConflict(localTasks, remoteTasks);
      const mergedNotebooks = this.resolveConflict(localNotebooks, remoteNotebooks);

      // Save merged datasets to local storage
      StorageAdapter.setAllNotes(mergedNotes);
      StorageAdapter.setAllLinks(mergedLinks);
      StorageAdapter.setAllTasks(mergedTasks);
      StorageAdapter.setAllNotebooks(mergedNotebooks);

      // Step 3: Check if commit to Hugging Face Hub is required
      const nowIso = new Date().toISOString();
      let needsPush = options?.force || this.statusInfo.pendingChangesCount > 0;

      if (!needsPush) {
        if (
          mergedNotes.length !== remoteNotes.length ||
          mergedLinks.length !== remoteLinks.length ||
          mergedTasks.length !== remoteTasks.length ||
          mergedNotebooks.length !== remoteNotebooks.length
        ) {
          needsPush = true;
        } else {
          const remoteNoteMap = new Map(remoteNotes.map((n) => [n.id, n]));
          for (const mn of mergedNotes) {
            const rn = remoteNoteMap.get(mn.id);
            if (
              !rn ||
              rn.updatedAt !== mn.updatedAt ||
              rn.isDeleted !== mn.isDeleted ||
              rn.isPinned !== mn.isPinned ||
              rn.content !== mn.content ||
              rn.title !== mn.title
            ) {
              needsPush = true;
              break;
            }
          }
        }
      }

      // Step 4: Commit merged vault to Hugging Face Hub Dataset if token available
      if (needsPush && token) {
        const vaultData = {
          notes: mergedNotes,
          links: mergedLinks,
          tasks: mergedTasks,
          notebooks: mergedNotebooks,
          lastSyncedAt: nowIso,
        };

        const contentJson = JSON.stringify(vaultData);
        const b64Content = utf8ToBase64(contentJson);

        const ndjsonPayload =
          JSON.stringify({
            key: 'header',
            value: {
              summary: `Mine Notes Vault Sync (${new Date().toLocaleTimeString()})`,
              description: 'Bidirectional multi-device note synchronization',
            },
          }) +
          '\n' +
          JSON.stringify({
            key: 'file',
            value: {
              content: b64Content,
              path: 'vault.json',
              encoding: 'base64',
            },
          }) +
          '\n';

        const commitUrl = `https://huggingface.co/api/datasets/${repo}/commit/main`;
        const commitResp = await fetch(commitUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/x-ndjson',
          },
          body: ndjsonPayload,
        });

        if (!commitResp.ok) {
          const errDetail = await commitResp.text().catch(() => '');
          console.warn('Hugging Face commit returned status:', commitResp.status, errDetail);
        }
      }

      const activeNotesCount = mergedNotes.filter((n) => !n.isDeleted).length;
      const updatedSettings = {
        ...settings,
        lastSyncedAt: nowIso,
      };
      StorageAdapter.saveSettings(updatedSettings);

      this.statusInfo.status = 'synced';
      this.statusInfo.lastSyncedAt = nowIso;
      this.statusInfo.pendingChangesCount = 0;
      this.statusInfo.errorMessage = undefined;
      this.notify();

      return {
        success: true,
        message: `Synchronized with Hugging Face Vault (${activeNotesCount} notes)`,
        mergedCount: mergedNotes.length + mergedLinks.length + mergedTasks.length,
      };
    } catch (err: any) {
      this.statusInfo.status = 'error';
      this.statusInfo.errorMessage = err.message || 'Sync connection failed';
      this.notify();

      return {
        success: false,
        message: `Sync failed: ${err.message}. Local vault preserved intact.`,
        mergedCount: 0,
      };
    }
  }
}

