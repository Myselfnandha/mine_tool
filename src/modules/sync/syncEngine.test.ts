import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SyncEngine, DEFAULT_HF_SPACE_URL } from './syncEngine';
import { Note, SharedLink } from '../../types';

describe('SyncEngine', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('resolveConflict (Last-Write-Wins)', () => {
    it('merges new remote items that do not exist locally', () => {
      const localNotes: Partial<Note>[] = [
        { id: 'note_1', title: 'Local Note', updatedAt: '2026-10-20T10:00:00Z' },
      ];
      const remoteNotes: Partial<Note>[] = [
        { id: 'note_2', title: 'Remote Note', updatedAt: '2026-10-20T11:00:00Z' },
      ];

      const merged = SyncEngine.resolveConflict(localNotes as Note[], remoteNotes as Note[]);
      expect(merged).toHaveLength(2);
      expect(merged.map((n) => n.id)).toContain('note_1');
      expect(merged.map((n) => n.id)).toContain('note_2');
    });

    it('keeps local item if local updatedAt is newer than remote', () => {
      const local: Partial<Note>[] = [
        { id: 'note_1', title: 'Newer Local Edit', updatedAt: '2026-10-21T15:00:00Z' },
      ];
      const remote: Partial<Note>[] = [
        { id: 'note_1', title: 'Older Remote Version', updatedAt: '2026-10-20T10:00:00Z' },
      ];

      const merged = SyncEngine.resolveConflict(local as Note[], remote as Note[]);
      expect(merged).toHaveLength(1);
      expect(merged[0].title).toBe('Newer Local Edit');
    });

    it('updates local item if remote updatedAt is newer than local', () => {
      const local: Partial<Note>[] = [
        { id: 'note_1', title: 'Old Local Edit', updatedAt: '2026-10-20T08:00:00Z' },
      ];
      const remote: Partial<Note>[] = [
        { id: 'note_1', title: 'Fresh Cloud Update', updatedAt: '2026-10-22T09:00:00Z' },
      ];

      const merged = SyncEngine.resolveConflict(local as Note[], remote as Note[]);
      expect(merged).toHaveLength(1);
      expect(merged[0].title).toBe('Fresh Cloud Update');
    });

    it('handles savedAt timestamps for SharedLinks correctly', () => {
      const localLinks: Partial<SharedLink>[] = [
        { id: 'link_1', url: 'https://github.com', savedAt: '2026-10-20T08:00:00Z', isRead: false },
      ];
      const remoteLinks: Partial<SharedLink>[] = [
        { id: 'link_1', url: 'https://github.com', savedAt: '2026-10-21T12:00:00Z', isRead: true },
      ];

      const merged = SyncEngine.resolveConflict(localLinks as SharedLink[], remoteLinks as SharedLink[]);
      expect(merged).toHaveLength(1);
      expect(merged[0].isRead).toBe(true);
    });
  });

  describe('Reactive Subscriptions', () => {
    it('notifies subscribers when markDirty is invoked', () => {
      const listener = vi.fn();
      const unsubscribe = SyncEngine.subscribe(listener);

      // Initial call on subscribe
      expect(listener).toHaveBeenCalled();

      SyncEngine.markDirty(1);
      const latest = listener.mock.calls[listener.mock.calls.length - 1][0];
      expect(latest.pendingChangesCount).toBeGreaterThanOrEqual(1);

      unsubscribe();
    });
  });

  describe('Offline Handling & Connection Probing', () => {
    it('sets status to offline and returns gracefully if device is offline', async () => {
      vi.spyOn(SyncEngine, 'isOnline').mockReturnValue(false);

      const result = await SyncEngine.sync();
      expect(result.success).toBe(false);
      expect(result.message).toContain('Offline');
      expect(SyncEngine.getStatus().status).toBe('offline');
    });

    it('probes default Hugging Face Space URL successfully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);

      const result = await SyncEngine.testConnection(DEFAULT_HF_SPACE_URL);
      expect(result.success).toBe(true);
      expect(result.message).toContain('Connected');
    });

    it('reports meaningful error message if probe fails', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('DNS lookup failed'));

      const result = await SyncEngine.testConnection('https://invalid.test');
      expect(result.success).toBe(false);
      expect(result.message).toContain('failed');
    });
  });
});
