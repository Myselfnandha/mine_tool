import { describe, it, expect } from 'vitest';
import { WidgetBridge } from './widgetBridge';
import { StorageAdapter } from '../storage/storageAdapter';

describe('WidgetBridge Module', () => {
  it('dispatches a quick thought silently without opening windows', () => {
    const result = WidgetBridge.handleWidgetDispatch({
      type: 'quick_note',
      text: 'Immediate thought from home screen widget',
    });

    expect(result.success).toBe(true);
    expect(result.targetId).toBeDefined();

    const notes = StorageAdapter.getNotes();
    const captured = notes.find((n) => n.id === result.targetId);
    expect(captured).toBeDefined();
    expect(captured?.content).toBe('Immediate thought from home screen widget');
  });

  it('dispatches a quick task directly to the action tracker', () => {
    const result = WidgetBridge.handleWidgetDispatch({
      type: 'quick_task',
      text: 'Order 300gsm paper samples',
      category: 'Studio',
    });

    expect(result.success).toBe(true);
    const tasks = StorageAdapter.getTasks();
    const captured = tasks.find((t) => t.id === result.targetId);
    expect(captured).toBeDefined();
    expect(captured?.title).toBe('Order 300gsm paper samples');
  });

  it('dispatches a shared URL silently into domain folder', () => {
    const result = WidgetBridge.handleWidgetDispatch({
      type: 'quick_link',
      text: 'https://github.com/microsoft/vscode',
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Dev & Engineering');

    const links = StorageAdapter.getLinks();
    const saved = links.find((l) => l.domain === 'github.com');
    expect(saved).toBeDefined();
    expect(saved?.folderCategory).toBe('Dev & Engineering');
  });

  it('rejects empty inputs gracefully', () => {
    const result = WidgetBridge.handleWidgetDispatch({
      type: 'quick_note',
      text: '   ',
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain('Empty input');
  });
});
