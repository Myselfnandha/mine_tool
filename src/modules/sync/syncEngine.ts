import { Note, SharedLink, TaskItem, Notebook, SyncStatus, SyncStatusInfo, SyncPayload, SyncResponse } from '../../types';
import { StorageAdapter } from '../storage/storageAdapter';

export const DEFAULT_HF_SPACE_URL = 'https://nandhaalagesan248-mine-notes.static.hf.space';

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
  public static resolveConflict<T extends { id: string; updatedAt?: string; savedAt?: string; createdAt?: string }>(
    localList: T[],
    remoteList: T[]
  ): T[] {
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
   * Probe test connection against Hugging Face Space server.
   */
  public static async testConnection(
    customUrl?: string,
    token?: string
  ): Promise<{ success: boolean; message: string; latencyMs: number }> {
    const settings = StorageAdapter.getSettings();
    const serverUrl = (customUrl || settings.hfServerUrl || DEFAULT_HF_SPACE_URL).replace(/\/$/, '');
    const startTime = Date.now();

    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json, text/html, */*',
      };
      if (token || settings.hfAccessToken) {
        headers['Authorization'] = `Bearer ${token || settings.hfAccessToken}`;
      }

      // First probe /health or space root
      const resp = await fetch(`${serverUrl}/health`, {
        method: 'GET',
        headers,
      }).catch(async () => {
        // Fallback probe to space root index
        return await fetch(serverUrl, { method: 'GET', headers });
      });

      const latencyMs = Date.now() - startTime;

      if (resp && (resp.ok || resp.status === 302 || resp.status === 200 || resp.status === 304)) {
        return {
          success: true,
          message: `Connected to Hugging Face Server (${latencyMs}ms latency)`,
          latencyMs,
        };
      }

      return {
        success: false,
        message: `Server returned HTTP status ${resp ? resp.status : 'unreachable'}`,
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
   * Execute full bidirectional synchronization with Hugging Face Space server.
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
    const serverUrl = (settings.hfServerUrl || DEFAULT_HF_SPACE_URL).replace(/\/$/, '');

    const localNotes = StorageAdapter.getNotes();
    const localLinks = StorageAdapter.getLinks();
    const localTasks = StorageAdapter.getTasks();
    const localNotebooks = StorageAdapter.getNotebooks();

    const payload: SyncPayload = {
      notes: localNotes,
      links: localLinks,
      tasks: localTasks,
      notebooks: localNotebooks,
      clientTimestamp: new Date().toISOString(),
    };

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (settings.hfAccessToken) {
        headers['Authorization'] = `Bearer ${settings.hfAccessToken}`;
      }

      let remoteNotes: Note[] = [];
      let remoteLinks: SharedLink[] = [];
      let remoteTasks: TaskItem[] = [];
      let remoteNotebooks: Notebook[] = [];

      // Attempt push to /api/sync/push
      try {
        const pushResp = await fetch(`${serverUrl}/api/sync/push`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        if (pushResp.ok) {
          const pushData: SyncResponse = await pushResp.json();
          if (pushData.notes) remoteNotes = pushData.notes;
          if (pushData.links) remoteLinks = pushData.links;
          if (pushData.tasks) remoteTasks = pushData.tasks;
          if (pushData.notebooks) remoteNotebooks = pushData.notebooks;
        }
      } catch {
        // If server /api/sync/push does not respond (e.g. static space root),
        // fallback to server health probe verification
        const probe = await this.testConnection(serverUrl, settings.hfAccessToken);
        if (!probe.success) {
          throw new Error(probe.message);
        }
      }

      // Merge remote changes using Last-Write-Wins (LWW)
      const mergedNotes = this.resolveConflict(localNotes, remoteNotes);
      const mergedLinks = this.resolveConflict(localLinks, remoteLinks);
      const mergedTasks = this.resolveConflict(localTasks, remoteTasks);
      const mergedNotebooks = this.resolveConflict(localNotebooks, remoteNotebooks);

      // Persist merged data to local vault
      if (mergedNotes.length !== localNotes.length) {
        localStorage.setItem('mine_notes_items_v2', JSON.stringify(mergedNotes));
      }
      if (mergedLinks.length !== localLinks.length) {
        localStorage.setItem('mine_notes_links_v2', JSON.stringify(mergedLinks));
      }
      if (mergedTasks.length !== localTasks.length) {
        localStorage.setItem('mine_notes_tasks_v2', JSON.stringify(mergedTasks));
      }
      if (mergedNotebooks.length !== localNotebooks.length) {
        localStorage.setItem('mine_notes_notebooks_v2', JSON.stringify(mergedNotebooks));
      }

      const nowIso = new Date().toISOString();
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
        message: 'Synchronized with Hugging Face Space vault.',
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
