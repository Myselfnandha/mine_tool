import { StorageAdapter } from '../storage/storageAdapter';
import { LinkCategorizer } from '../links/linkCategorizer';
import { Note, TaskItem } from '../../types';

export interface WidgetCapturePayload {
  type: 'quick_note' | 'quick_task' | 'quick_link' | 'voice_memo';
  text: string;
  category?: string;
  isChecklist?: boolean;
}

export class WidgetBridge {
  /**
   * Dispatches a quick capture from the home screen widget directly to storage
   * without launching the main window or showing confirmation prompts.
   */
  public static handleWidgetDispatch(payload: WidgetCapturePayload): {
    success: boolean;
    message: string;
    targetId: string;
  } {
    const trimmed = payload.text.trim();
    if (!trimmed) {
      return { success: false, message: 'Empty input received from widget', targetId: '' };
    }

    if (payload.type === 'quick_link' || /^https?:\/\//i.test(trimmed)) {
      const link = LinkCategorizer.processIncomingShare(trimmed);
      StorageAdapter.saveLink(link);
      return {
        success: true,
        message: `Saved to ${link.folderCategory} / ${link.domain}`,
        targetId: link.id,
      };
    }

    if (payload.type === 'quick_task') {
      const newTask: TaskItem = {
        id: 'task_' + Date.now(),
        title: trimmed,
        category: payload.category || 'Quick Inbox',
        categoryColor: '#C25E00',
        dueDate: 'Today',
        priority: 'high',
        status: 'todo',
      };
      StorageAdapter.saveTask(newTask);
      return {
        success: true,
        message: 'Action task pinned to tracker',
        targetId: newTask.id,
      };
    }

    // Default: Quick Note
    const isUrl = /(https?:\/\/[^\s]+)/.test(trimmed);
    const newNote: Note = {
      id: 'note_widget_' + Date.now(),
      title: trimmed.length > 40 ? trimmed.substring(0, 40) + '...' : trimmed,
      category: payload.category || 'Quick Capture',
      categoryEmoji: payload.type === 'voice_memo' ? '🎙️' : '⚡',
      content: trimmed,
      isPinned: false,
      tags: ['widget', payload.type === 'voice_memo' ? 'audio' : 'scratchpad'],
      readTime: '1 min read',
      voiceMemoDuration: payload.type === 'voice_memo' ? '00:32' : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    StorageAdapter.saveNote(newNote);

    // If it contained a URL, also auto-save link to Link Shelf silently
    if (isUrl) {
      const link = LinkCategorizer.processIncomingShare(trimmed);
      StorageAdapter.saveLink(link);
    }

    return {
      success: true,
      message: 'Quick note captured silently from widget',
      targetId: newNote.id,
    };
  }
}
