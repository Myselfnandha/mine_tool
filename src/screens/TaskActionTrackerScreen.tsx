import React, { useState } from 'react';
import { TaskItem, TaskPriority } from '../types';

interface TaskActionTrackerScreenProps {
  tasks: TaskItem[];
  onToggleTask: (id: string) => void;
  onAddTask: (task: Partial<TaskItem>) => void;
  onDeleteTask: (id: string) => void;
}

export const TaskActionTrackerScreen: React.FC<TaskActionTrackerScreenProps> = ({
  tasks,
  onToggleTask,
  onAddTask,
  onDeleteTask,
}) => {
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'all' | 'completed'>('today');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState('Studio');
  const [quickPriority, setQuickPriority] = useState<TaskPriority>('high');

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const todayTasks = tasks.filter((t) => t.dueDate.toLowerCase().includes('today') && t.status !== 'completed');
  const upcomingTasks = tasks.filter((t) => !t.dueDate.toLowerCase().includes('today') && t.status !== 'completed');
  const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    onAddTask({
      title: quickTitle.trim(),
      category: quickCategory,
      priority: quickPriority,
      dueDate: activeTab === 'upcoming' ? 'Tomorrow' : 'Today',
      dueTime: '6:00 PM',
      categoryColor: quickCategory === 'Design' ? '#C25E00' : quickCategory === 'Dev' ? '#005EA4' : '#3F6212',
    });
    setQuickTitle('');
  };

  const getFilteredTasks = () => {
    switch (activeTab) {
      case 'today':
        return tasks.filter((t) => t.dueDate.toLowerCase().includes('today') && t.status !== 'completed');
      case 'upcoming':
        return upcomingTasks;
      case 'completed':
        return tasks.filter((t) => t.status === 'completed');
      case 'all':
      default:
        return tasks;
    }
  };

  const displayedTasks = getFilteredTasks();

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">
      {/* Top Velocity Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-3.5 shadow-card">
          <p className="text-[11px] font-sans font-medium uppercase tracking-wider text-outline">
            Due Today
          </p>
          <p className="text-2xl font-mono font-bold text-on-surface mt-1">{todayTasks.length}</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-3.5 shadow-card">
          <p className="text-[11px] font-sans font-medium uppercase tracking-wider text-outline">
            Upcoming
          </p>
          <p className="text-2xl font-mono font-bold text-on-surface mt-1">{upcomingTasks.length}</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-3.5 shadow-card">
          <p className="text-[11px] font-sans font-medium uppercase tracking-wider text-outline">
            Completed
          </p>
          <p className="text-2xl font-mono font-bold text-secondary mt-1">{completedCount}</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-3.5 shadow-card">
          <p className="text-[11px] font-sans font-medium uppercase tracking-wider text-outline">
            Velocity
          </p>
          <p className="text-2xl font-mono font-bold text-primary mt-1">{completionRate}%</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-container-high pb-2">
        <button
          onClick={() => setActiveTab('today')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'today'
              ? 'bg-on-surface text-surface-container-lowest shadow-xs'
              : 'text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          Today ({todayTasks.length})
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'upcoming'
              ? 'bg-on-surface text-surface-container-lowest shadow-xs'
              : 'text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          Upcoming ({upcomingTasks.length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'all'
              ? 'bg-on-surface text-surface-container-lowest shadow-xs'
              : 'text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          All ({tasks.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'completed'
              ? 'bg-on-surface text-surface-container-lowest shadow-xs'
              : 'text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          Completed ({completedCount})
        </button>
      </div>

      {/* Quick Task Creation Form */}
      <form
        onSubmit={handleCreate}
        className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-3 shadow-card space-y-2.5"
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-primary">add_task</span>
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Type a new task action and press Enter..."
            className="flex-1 bg-transparent font-sans text-sm text-on-surface placeholder:text-outline focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-surface-container-low text-xs">
          <div className="flex items-center gap-2">
            <select
              value={quickCategory}
              onChange={(e) => setQuickCategory(e.target.value)}
              className="bg-surface-container-low border border-outline-variant/40 rounded-lg px-2 py-1 text-on-surface text-xs focus:outline-none"
            >
              <option value="Studio">💼 Studio</option>
              <option value="Design">🎨 Design</option>
              <option value="Dev">💻 Dev & Code</option>
              <option value="Research">🔬 Research</option>
            </select>

            <select
              value={quickPriority}
              onChange={(e) => setQuickPriority(e.target.value as TaskPriority)}
              className="bg-surface-container-low border border-outline-variant/40 rounded-lg px-2 py-1 text-on-surface text-xs focus:outline-none"
            >
              <option value="urgent">🔴 Urgent</option>
              <option value="high">🟠 High Priority</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={!quickTitle.trim()}
            className="px-3.5 py-1.5 rounded-lg bg-primary text-on-primary font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            Add Task
          </button>
        </div>
      </form>

      {/* Tasks List */}
      <div className="space-y-2.5">
        {displayedTasks.length === 0 ? (
          <div className="text-center py-12 bg-surface-container-low/40 rounded-xl border border-dashed border-outline-variant/50">
            <span className="material-symbols-outlined text-[36px] text-outline mb-1">
              task_alt
            </span>
            <p className="font-headline text-base text-on-surface">No tasks in this view</p>
            <p className="font-sans text-xs text-outline mt-0.5">
              All targeted deliverables are cleared. Enjoy the silence.
            </p>
          </div>
        ) : (
          displayedTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            return (
              <div
                key={task.id}
                className={`group flex items-start justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                  isCompleted
                    ? 'bg-surface-container-low/40 border-outline-variant/30 opacity-75'
                    : 'bg-surface-container-lowest border-outline-variant/40 shadow-card hover:shadow-card-hover'
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => onToggleTask(task.id)}
                    className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-secondary text-white'
                        : 'border border-outline hover:border-primary text-transparent'
                    }`}
                  >
                    ✓
                  </button>

                  <div className="space-y-1 min-w-0 flex-1">
                    <p
                      className={`text-xs sm:text-sm font-sans ${
                        isCompleted
                          ? 'line-through text-outline'
                          : 'text-on-surface font-medium'
                      }`}
                    >
                      {task.title}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] text-outline flex-wrap">
                      <span
                        className="px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: `${task.categoryColor}15`,
                          color: task.categoryColor,
                        }}
                      >
                        {task.category}
                      </span>
                      <span>Due {task.dueDate} {task.dueTime ? `at ${task.dueTime}` : ''}</span>
                      <span
                        className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                          task.priority === 'urgent'
                            ? 'bg-red-100 text-red-700 font-bold'
                            : task.priority === 'high'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {task.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-outline hover:text-error p-1 rounded transition-opacity"
                  title="Delete task"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
