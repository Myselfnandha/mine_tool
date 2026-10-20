import { describe, it, expect, beforeEach } from 'vitest';
import { StorageAdapter } from './storageAdapter';
import { Note, SharedLink, TaskItem } from '../../types';

describe('StorageAdapter Module', () => {
  beforeEach(() => {
    StorageAdapter.flushAllData();
  });

  it('starts with clean empty arrays when demo data is flushed', () => {
    const notes = StorageAdapter.getNotes();
    expect(notes.length).toBe(0);
    const links = StorageAdapter.getLinks();
    expect(links.length).toBe(0);
    const tasks = StorageAdapter.getTasks();
    expect(tasks.length).toBe(0);
  });

  it('can save and retrieve a new note', () => {
    const newNote: Note = {
      id: 'test_note_' + Date.now(),
      title: 'Architectural Blueprint Note',
      category: 'Dev',
      content: 'Testing deep modular interface',
      isPinned: false,
      tags: ['test', 'architecture'],
      readTime: '1 min read',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    StorageAdapter.saveNote(newNote);
    const notes = StorageAdapter.getNotes();
    expect(notes.length).toBe(1);
    expect(notes[0].title).toBe('Architectural Blueprint Note');
  });

  it('can toggle pin on a note', () => {
    const newNote: Note = {
      id: 'test_pin_' + Date.now(),
      title: 'Pinnable Item',
      category: 'Design',
      content: 'Content',
      isPinned: false,
      tags: ['pin'],
      readTime: '1 min read',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    StorageAdapter.saveNote(newNote);
    StorageAdapter.togglePinNote(newNote.id);
    const updated = StorageAdapter.getNotes().find((n) => n.id === newNote.id);
    expect(updated?.isPinned).toBe(true);
  });

  it('can save and retrieve a shared link', () => {
    const testLink: SharedLink = {
      id: 'test_link_1',
      url: 'https://github.com/my/repo',
      title: 'My Repo',
      description: 'Test repository',
      domain: 'github.com',
      folderCategory: 'Dev & Engineering',
      folderIcon: 'terminal',
      folderColor: '#005EA4',
      savedAt: new Date().toISOString(),
      isRead: false,
    };
    StorageAdapter.saveLink(testLink);
    const links = StorageAdapter.getLinks();
    expect(links.find((l) => l.id === 'test_link_1')).toBeDefined();
  });

  it('can toggle task completion status', () => {
    const task: TaskItem = {
      id: 'test_task_1',
      title: 'Test task',
      category: 'Studio',
      categoryColor: '#3F6212',
      dueDate: 'Today',
      priority: 'high',
      status: 'todo',
    };
    StorageAdapter.saveTask(task);
    StorageAdapter.toggleTask(task.id);
    const updated = StorageAdapter.getTasks().find((t) => t.id === task.id);
    expect(updated?.status).toBe('completed');
  });

  it('can flush all data back to empty', () => {
    StorageAdapter.saveNote({
      id: 'dummy',
      title: 'To be flushed',
      category: 'General',
      content: 'Gone soon',
      isPinned: false,
      tags: [],
      readTime: '1 min',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    expect(StorageAdapter.getNotes().length).toBe(1);
    StorageAdapter.flushAllData();
    expect(StorageAdapter.getNotes().length).toBe(0);
  });
});
