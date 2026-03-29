import { useState } from 'react';
import type { Task, TaskPriority } from './types/task';
import { useTasks } from './hooks/useTasks';
import { TaskModal } from './components/TaskModal';
import { TimerDisplay } from './components/TimerDisplay';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import './index.css';

type StatusFilter = 'all' | 'active' | 'completed';
type SortField = 'created' | 'priority';

const PRIORITY_ORDER: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };

const priorityLabel: Record<TaskPriority, string> = {
  high: '↑ High',
  medium: '— Med',
  low: '↓ Low',
};

const priorityStyle: Record<TaskPriority, string> = {
  high: 'border-black bg-black text-white',
  medium: 'border-black text-black',
  low: 'border-gray-400 text-gray-500',
};

export function TabApp() {
  const {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    startTask,
    pauseTask,
    resetTask,
    completeTask,
    toggleSubItem,
  } = useTasks();

  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortField>('priority');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const allProjects = Array.from(
    new Set(tasks.map((t) => t.project).filter(Boolean)),
  ).sort();

  const existingProjects = allProjects;

  const filtered = tasks
    .filter((t) => {
      if (statusFilter === 'active') return t.status !== 'completed';
      if (statusFilter === 'completed') return t.status === 'completed';
      return true;
    })
    .filter((t) => {
      if (projectFilter === 'all') return true;
      if (projectFilter === '') return !t.project;
      return t.project === projectFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'priority') {
        const diff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        if (diff !== 0) return diff;
      }
      return b.createdAt - a.createdAt;
    });

  const activeCount = tasks.filter((t) => t.status !== 'completed').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-gray-500 text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Top bar */}
      <header className="border-b border-black px-8 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-base font-bold text-black uppercase tracking-widest">Task Organizer</h1>
          <span className="text-xs text-gray-500">{activeCount} active · {completedCount} done</span>
        </div>
        <button
          onClick={() => { setEditingTask(undefined); setShowModal(true); }}
          className="flex items-center gap-1 bg-black text-white text-xs font-medium px-4 py-2 rounded hover:bg-gray-800 transition-colors"
        >
          <span className="text-sm leading-none">+</span> New Task
        </button>
      </header>

      <div className="flex h-[calc(100vh-57px)]">
        {/* Sidebar */}
        <aside className="w-48 shrink-0 border-r border-gray-200 flex flex-col py-4 px-3 gap-1">
          {/* Status filters */}
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-1">Status</p>
          {(['all', 'active', 'completed'] as StatusFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`text-left px-3 py-1.5 rounded text-xs font-medium capitalize transition-colors ${
                statusFilter === f ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f}
            </button>
          ))}

          {/* Project filters */}
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mt-3 mb-1">Project</p>
          <button
            onClick={() => setProjectFilter('all')}
            className={`text-left px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              projectFilter === 'all' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All projects
          </button>
          {tasks.some((t) => !t.project) && (
            <button
              onClick={() => setProjectFilter('')}
              className={`text-left px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                projectFilter === '' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              No project
            </button>
          )}
          {allProjects.map((p) => (
            <button
              key={p}
              onClick={() => setProjectFilter(p)}
              className={`text-left px-3 py-1.5 rounded text-xs font-medium truncate transition-colors ${
                projectFilter === p ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              # {p}
            </button>
          ))}

          {/* Sort */}
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mt-3 mb-1">Sort by</p>
          {(['priority', 'created'] as SortField[]).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`text-left px-3 py-1.5 rounded text-xs font-medium capitalize transition-colors ${
                sortBy === s ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {s === 'created' ? 'Date created' : 'Priority'}
            </button>
          ))}
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-6 py-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm gap-2">
              <span className="text-4xl">📋</span>
              <p>
                {statusFilter === 'completed'
                  ? 'No completed tasks yet.'
                  : 'No tasks here. Create one!'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-w-3xl mx-auto">
              {filtered.map((task) => {
                const isExpanded = expandedId === task.id;
                const completedSub = task.subItems.filter((s) => s.completed).length;

                return (
                  <div
                    key={task.id}
                    className={`border rounded bg-white transition-all ${
                      task.status === 'running' ? 'border-black shadow-md' : 'border-gray-300'
                    } ${task.status === 'completed' ? 'opacity-60' : ''}`}
                  >
                    {/* Card header */}
                    <div className="flex gap-4 items-start p-4">
                      <TimerDisplay
                        elapsedSeconds={task.elapsedSeconds}
                        durationMinutes={task.durationMinutes}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 justify-between">
                          <h3
                            className={`text-sm font-semibold leading-snug ${
                              task.status === 'completed'
                                ? 'line-through text-gray-400'
                                : 'text-black'
                            }`}
                          >
                            {task.title}
                          </h3>
                          <div className="flex items-center gap-2 shrink-0">
                            {task.project && (
                              <span className="text-[10px] font-medium text-gray-500 border border-gray-300 rounded px-1.5 py-0.5">
                                # {task.project}
                              </span>
                            )}
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide ${priorityStyle[task.priority]}`}
                            >
                              {priorityLabel[task.priority]}
                            </span>
                          </div>
                        </div>

                        {task.subItems.length > 0 && (
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            ☑ {completedSub}/{task.subItems.length} sub-tasks
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-1.5 mt-3 flex-wrap">
                          {task.status === 'pending' && (
                            <button
                              onClick={() => startTask(task.id)}
                              className="text-xs px-3 py-1 rounded bg-black text-white hover:bg-gray-800 transition-colors"
                            >
                              ▶ Start
                            </button>
                          )}
                          {task.status === 'running' && (
                            <button
                              onClick={() => pauseTask(task.id)}
                              className="text-xs px-3 py-1 rounded border border-black text-black hover:bg-gray-100 transition-colors"
                            >
                              ⏸ Pause
                            </button>
                          )}
                          {task.status === 'paused' && (
                            <button
                              onClick={() => startTask(task.id)}
                              className="text-xs px-3 py-1 rounded bg-black text-white hover:bg-gray-800 transition-colors"
                            >
                              ▶ Resume
                            </button>
                          )}
                          {(task.status === 'running' || task.status === 'paused') && (
                            <button
                              onClick={() => completeTask(task.id)}
                              className="text-xs px-3 py-1 rounded border border-black text-black hover:bg-gray-100 transition-colors"
                            >
                              ✓ Done
                            </button>
                          )}
                          {task.status !== 'pending' && (
                            <button
                              onClick={() => resetTask(task.id)}
                              className="text-xs px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                              ↺ Reset
                            </button>
                          )}
                          {task.status !== 'running' && (
                            <button
                              onClick={() => { setEditingTask(task); setShowModal(true); }}
                              className="text-xs px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                              ✎ Edit
                            </button>
                          )}
                          {confirmDeleteId === task.id ? (
                            <>
                              <button
                                onClick={() => { deleteTask(task.id); setConfirmDeleteId(null); }}
                                className="text-xs px-3 py-1 rounded bg-black text-white hover:bg-gray-800 transition-colors"
                              >
                                Confirm delete
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-xs px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(task.id)}
                              className="text-xs px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                              🗑 Delete
                            </button>
                          )}
                          {(task.description.trim() || task.subItems.length > 0) && (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : task.id)}
                              className="text-xs px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                              {isExpanded ? '▲ Collapse' : '▼ Details'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded section */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 px-4 py-4 flex flex-col gap-4">
                        {task.description.trim() && (
                          <MarkdownRenderer
                            content={task.description}
                            className="text-sm text-gray-800"
                          />
                        )}
                        {task.subItems.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                              Sub-tasks
                            </p>
                            <ul className="flex flex-col gap-1.5">
                              {task.subItems.map((item) => (
                                <li
                                  key={item.id}
                                  className="flex items-center gap-2 cursor-pointer group"
                                  onClick={() => toggleSubItem(task.id, item.id)}
                                >
                                  <span
                                    className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center text-[10px] transition-colors ${
                                      item.completed
                                        ? 'bg-black border-black text-white'
                                        : 'border-gray-400 group-hover:border-black'
                                    }`}
                                  >
                                    {item.completed ? '✓' : ''}
                                  </span>
                                  <span
                                    className={`text-sm transition-colors ${
                                      item.completed
                                        ? 'line-through text-gray-400'
                                        : 'text-black'
                                    }`}
                                  >
                                    {item.text}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {showModal && (
        <TaskModal
          task={editingTask}
          existingProjects={existingProjects}
          onSave={(data) => {
            if (editingTask) {
              updateTask(editingTask.id, data);
            } else {
              addTask(data);
            }
          }}
          onClose={() => { setShowModal(false); setEditingTask(undefined); }}
        />
      )}
    </div>
  );
}
