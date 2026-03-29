import { useState } from 'react';
import type { Task, TaskPriority } from '../types/task';
import { TaskItem } from './TaskItem';
import { TaskModal } from './TaskModal';
import { useTasks } from '../hooks/useTasks';

type StatusFilter = 'all' | 'active' | 'completed';
type SortField = 'created' | 'priority' | 'dueDate';

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
      if (sortBy === 'dueDate') {
        const aD = a.dueDate ?? '9999-12-31';
        const bD = b.dueDate ?? '9999-12-31';
        if (aD !== bD) return aD < bD ? -1 : 1;
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 128, color: '#787774', fontSize: 13 }}>
        Loading…
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid var(--notion-border)',
          flexShrink: 0,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#37352f', letterSpacing: '0.04em' }}>
            Task Organizer
          </h1>
          <p style={{ margin: '1px 0 0', fontSize: 10, color: '#787774' }}>
            {activeCount} active · {completedCount} done
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={openFullPage}
            title="Open full page"
            className="notion-icon-btn"
            aria-label="Open full page"
            style={{ fontSize: 16 }}
          >
            ⤢
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="notion-btn-primary"
            style={{ padding: '5px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <span style={{ fontSize: 14, lineHeight: 1 }}>+</span> New
          </button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--notion-border)', flexShrink: 0 }}>
        {(['all', 'active', 'completed'] as StatusFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            style={{
              flex: 1,
              fontSize: 11,
              padding: '7px 0',
              fontWeight: 500,
              textTransform: 'capitalize',
              background: 'none',
              border: 'none',
              borderBottom: statusFilter === f ? '2px solid #37352f' : '2px solid transparent',
              color: statusFilter === f ? '#37352f' : '#aeacaa',
              cursor: 'pointer',
              transition: 'color 0.15s',
              fontFamily: 'var(--notion-font)',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Project filter + sort row */}
      {(allProjects.length > 0 || tasks.some((t) => !t.project)) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 10px',
            borderBottom: '1px solid var(--notion-border)',
            overflowX: 'auto',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 9, fontWeight: 700, color: '#aeacaa', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>
            Project:
          </span>
          {[
            { key: 'all', label: 'All' },
            ...(tasks.some((t) => !t.project) ? [{ key: '', label: 'None' }] : []),
            ...allProjects.map((p) => ({ key: p, label: p })),
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setProjectFilter(key)}
              style={{
                fontSize: 10,
                padding: '2px 7px',
                borderRadius: 3,
                border: `1px solid ${projectFilter === key ? '#37352f' : 'var(--notion-border)'}`,
                background: projectFilter === key ? '#37352f' : 'transparent',
                color: projectFilter === key ? '#fff' : '#787774',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s',
                fontFamily: 'var(--notion-font)',
              }}
            >
              {label}
            </button>
          ))}
          <div style={{ marginLeft: 'auto', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#aeacaa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortField)}
              style={{
                fontSize: 10,
                border: '1px solid var(--notion-border)',
                borderRadius: 3,
                padding: '2px 4px',
                color: '#787774',
                background: '#fff',
                outline: 'none',
                fontFamily: 'var(--notion-font)',
              }}
            >
              <option value="created">Date</option>
              <option value="priority">Priority</option>
              <option value="dueDate">Due date</option>
            </select>
          </div>
        </div>
      )}

      {/* Task list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 120, color: '#aeacaa', fontSize: 12, gap: 6 }}>
            <span style={{ fontSize: 28 }}>📋</span>
            <p style={{ margin: 0 }}>
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
