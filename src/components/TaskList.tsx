import { useState } from 'react';
import type { Task, TaskPriority } from '../types/task';
import { TaskItem } from './TaskItem';
import { TaskModal } from './TaskModal';
import { useTasks } from '../hooks/useTasks';

type StatusFilter = 'all' | 'active' | 'completed';
type SortField = 'created' | 'priority';

const PRIORITY_ORDER: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };

export function TaskList() {
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortField>('created');

  const allProjects = Array.from(
    new Set(tasks.map((t) => t.project).filter(Boolean)),
  ).sort();

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

  const existingProjects = allProjects;

  const openFullPage = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.tabs.create({ url: chrome.runtime.getURL('tab.html') });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-black">
        <div>
          <h1 className="text-sm font-bold text-black uppercase tracking-widest">Task Organizer</h1>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {activeCount} active · {completedCount} done
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openFullPage}
            title="Open full page"
            className="text-black hover:opacity-60 transition-opacity text-base"
            aria-label="Open full page"
          >
            ⤢
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 bg-black text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-gray-800 transition-colors"
          >
            <span className="text-sm leading-none">+</span> New
          </button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex border-b border-gray-200">
        {(['all', 'active', 'completed'] as StatusFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`flex-1 text-xs py-2 font-medium capitalize transition-colors ${
              statusFilter === f
                ? 'text-black border-b-2 border-black'
                : 'text-gray-400 hover:text-black'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Project filter + sort row */}
      {(allProjects.length > 0 || tasks.some((t) => !t.project)) && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 overflow-x-auto">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide shrink-0">
            Project:
          </span>
          <button
            onClick={() => setProjectFilter('all')}
            className={`text-[10px] px-2 py-0.5 rounded border shrink-0 transition-colors ${
              projectFilter === 'all'
                ? 'bg-black text-white border-black'
                : 'border-gray-300 text-gray-600 hover:border-black'
            }`}
          >
            All
          </button>
          {tasks.some((t) => !t.project) && (
            <button
              onClick={() => setProjectFilter('')}
              className={`text-[10px] px-2 py-0.5 rounded border shrink-0 transition-colors ${
                projectFilter === ''
                  ? 'bg-black text-white border-black'
                  : 'border-gray-300 text-gray-600 hover:border-black'
              }`}
            >
              None
            </button>
          )}
          {allProjects.map((p) => (
            <button
              key={p}
              onClick={() => setProjectFilter(p)}
              className={`text-[10px] px-2 py-0.5 rounded border shrink-0 transition-colors ${
                projectFilter === p
                  ? 'bg-black text-white border-black'
                  : 'border-gray-300 text-gray-600 hover:border-black'
              }`}
            >
              {p}
            </button>
          ))}
          <div className="ml-auto shrink-0 flex items-center gap-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortField)}
              className="text-[10px] border border-gray-300 rounded px-1 py-0.5 text-gray-600 bg-white outline-none focus:border-black"
            >
              <option value="created">Date</option>
              <option value="priority">Priority</option>
            </select>
          </div>
        </div>
      )}

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-sm gap-2">
            <span className="text-3xl">📋</span>
            <p>
              {statusFilter === 'completed' ? 'No completed tasks yet.' : 'No tasks. Create one!'}
            </p>
          </div>
        ) : (
          filtered.map((task: Task) => (
            <TaskItem
              key={task.id}
              task={task}
              existingProjects={existingProjects}
              onStart={startTask}
              onPause={pauseTask}
              onReset={resetTask}
              onComplete={completeTask}
              onDelete={deleteTask}
              onUpdate={(id, data) => updateTask(id, data)}
              onToggleSubItem={toggleSubItem}
            />
          ))
        )}
      </div>

      {showModal && (
        <TaskModal
          existingProjects={existingProjects}
          onSave={addTask}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
