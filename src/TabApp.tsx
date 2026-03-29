import { useState } from 'react';
import type { Task, TaskPriority } from './types/task';
import { useTasks } from './hooks/useTasks';
import { TaskModal } from './components/TaskModal';
import { TimerDisplay } from './components/TimerDisplay';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import './index.css';

type StatusFilter = 'all' | 'active' | 'completed';
type SortField = 'created' | 'priority' | 'dueDate';

const PRIORITY_ORDER: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };

const priorityLabel: Record<TaskPriority, string> = {
  high: '↑ High',
  medium: '— Med',
  low: '↓ Low',
};

const priorityColors: Record<TaskPriority, { bg: string; color: string; border: string }> = {
  high:   { bg: '#37352f', color: '#fff',     border: '#37352f' },
  medium: { bg: 'transparent', color: '#37352f', border: '#37352f' },
  low:    { bg: 'transparent', color: '#aeacaa', border: '#d3d1cb' },
};

function formatDueDate(dueDate: string): { label: string; cls: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  const diff = Math.round((due.getTime() - today.getTime()) / 86400000);

  if (diff < 0)  return { label: `Overdue (${dueDate})`, cls: 'due-overdue' };
  if (diff === 0) return { label: 'Due today', cls: 'due-today' };
  if (diff === 1) return { label: 'Due tomorrow', cls: 'due-upcoming' };
  return { label: `Due ${dueDate}`, cls: 'due-upcoming' };
}

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
      if (sortBy === 'dueDate') {
        const aD = a.dueDate ?? '9999-12-31';
        const bD = b.dueDate ?? '9999-12-31';
        if (aD !== bD) return aD < bD ? -1 : 1;
      }
      return b.createdAt - a.createdAt;
    });

  const activeCount = tasks.filter((t) => t.status !== 'completed').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--notion-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#787774', fontSize: 13 }}>
        Loading…
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--notion-bg-subtle)', fontFamily: 'var(--notion-font)', color: 'var(--notion-text)' }}>
      {/* Top bar */}
      <header
        style={{
          borderBottom: '1px solid var(--notion-border)',
          padding: '12px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          background: 'var(--notion-bg)',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#37352f', letterSpacing: '0.04em' }}>
            📋 Task Organizer
          </h1>
          <span style={{ fontSize: 12, color: '#787774' }}>{activeCount} active · {completedCount} done</span>
        </div>
        <button
          onClick={() => { setEditingTask(undefined); setShowModal(true); }}
          className="notion-btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> New Task
        </button>
      </header>

      <div style={{ display: 'flex', height: 'calc(100vh - 57px)' }}>
        {/* Sidebar */}
        <aside
          style={{
            width: 200,
            flexShrink: 0,
            borderRight: '1px solid var(--notion-border)',
            display: 'flex',
            flexDirection: 'column',
            padding: '16px 8px',
            gap: 2,
            background: 'var(--notion-bg)',
            overflowY: 'auto',
          }}
        >
          {/* Status */}
          <p style={{ fontSize: 10, fontWeight: 700, color: '#aeacaa', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 8px', marginBottom: 4, marginTop: 0 }}>
            Status
          </p>
          {(['all', 'active', 'completed'] as StatusFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              style={{
                textAlign: 'left',
                padding: '5px 10px',
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 500,
                textTransform: 'capitalize',
                background: statusFilter === f ? '#37352f' : 'transparent',
                color: statusFilter === f ? '#fff' : '#787774',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontFamily: 'var(--notion-font)',
              }}
              onMouseEnter={(e) => { if (statusFilter !== f) (e.currentTarget as HTMLButtonElement).style.background = 'var(--notion-bg-hover)'; }}
              onMouseLeave={(e) => { if (statusFilter !== f) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              {f}
            </button>
          ))}

          {/* Project */}
          <p style={{ fontSize: 10, fontWeight: 700, color: '#aeacaa', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 8px', marginBottom: 4, marginTop: 12 }}>
            Project
          </p>
          {[
            { key: 'all', label: 'All projects' },
            ...(tasks.some((t) => !t.project) ? [{ key: '', label: 'No project' }] : []),
            ...allProjects.map((p) => ({ key: p, label: `# ${p}` })),
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setProjectFilter(key)}
              style={{
                textAlign: 'left',
                padding: '5px 10px',
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 500,
                background: projectFilter === key ? '#37352f' : 'transparent',
                color: projectFilter === key ? '#fff' : '#787774',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontFamily: 'var(--notion-font)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => { if (projectFilter !== key) (e.currentTarget as HTMLButtonElement).style.background = 'var(--notion-bg-hover)'; }}
              onMouseLeave={(e) => { if (projectFilter !== key) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              {label}
            </button>
          ))}

          {/* Sort */}
          <p style={{ fontSize: 10, fontWeight: 700, color: '#aeacaa', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 8px', marginBottom: 4, marginTop: 12 }}>
            Sort by
          </p>
          {([['priority', 'Priority'], ['created', 'Date created'], ['dueDate', 'Due date']] as [SortField, string][]).map(([s, label]) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              style={{
                textAlign: 'left',
                padding: '5px 10px',
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 500,
                background: sortBy === s ? '#37352f' : 'transparent',
                color: sortBy === s ? '#fff' : '#787774',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontFamily: 'var(--notion-font)',
              }}
              onMouseEnter={(e) => { if (sortBy !== s) (e.currentTarget as HTMLButtonElement).style.background = 'var(--notion-bg-hover)'; }}
              onMouseLeave={(e) => { if (sortBy !== s) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              {label}
            </button>
          ))}
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
          {filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 192, color: '#aeacaa', fontSize: 13, gap: 8 }}>
              <span style={{ fontSize: 36 }}>📋</span>
              <p style={{ margin: 0 }}>
                {statusFilter === 'completed' ? 'No completed tasks yet.' : 'No tasks here. Create one!'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 800, margin: '0 auto' }}>
              {filtered.map((task) => {
                const isExpanded = expandedId === task.id;
                const completedSub = task.subItems.filter((s) => s.completed).length;
                const pc = priorityColors[task.priority];
                const dueInfo = task.dueDate ? formatDueDate(task.dueDate) : null;

                return (
                  <div
                    key={task.id}
                    style={{
                      border: `1px solid ${task.status === 'running' ? '#37352f' : 'var(--notion-border)'}`,
                      borderRadius: 6,
                      background: 'var(--notion-bg)',
                      boxShadow: task.status === 'running' ? '0 2px 8px rgba(55,53,47,0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
                      opacity: task.status === 'completed' ? 0.65 : 1,
                      transition: 'all 0.15s',
                    }}
                  >
                    {/* Card header */}
                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '14px 16px' }}>
                      <TimerDisplay
                        elapsedSeconds={task.elapsedSeconds}
                        durationMinutes={task.durationMinutes}
                      />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, justifyContent: 'space-between' }}>
                          <h3
                            style={{
                              margin: 0,
                              fontSize: 14,
                              fontWeight: 600,
                              lineHeight: 1.4,
                              color: task.status === 'completed' ? '#aeacaa' : '#37352f',
                              textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                              wordBreak: 'break-word',
                            }}
                          >
                            {task.title}
                          </h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                            {task.project && (
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 500,
                                  color: '#787774',
                                  border: '1px solid var(--notion-border)',
                                  borderRadius: 3,
                                  padding: '1px 6px',
                                }}
                              >
                                # {task.project}
                              </span>
                            )}
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: 3,
                                border: `1px solid ${pc.border}`,
                                background: pc.bg,
                                color: pc.color,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {priorityLabel[task.priority]}
                            </span>
                          </div>
                        </div>

                        {/* Meta: sub-items + due date */}
                        {(task.subItems.length > 0 || dueInfo) && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '3px 10px', marginTop: 3 }}>
                            {task.subItems.length > 0 && (
                              <span style={{ fontSize: 11, color: '#787774' }}>
                                ☑ {completedSub}/{task.subItems.length} sub-tasks
                              </span>
                            )}
                            {dueInfo && (
                              <span className={dueInfo.cls} style={{ fontSize: 11, fontWeight: 500 }}>
                                📅 {dueInfo.label}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                          {task.status === 'pending' && (
                            <button onClick={() => startTask(task.id)} className="notion-task-btn notion-task-btn--primary">
                              ▶ Start
                            </button>
                          )}
                          {task.status === 'running' && (
                            <button onClick={() => pauseTask(task.id)} className="notion-task-btn">
                              ⏸ Pause
                            </button>
                          )}
                          {task.status === 'paused' && (
                            <button onClick={() => startTask(task.id)} className="notion-task-btn notion-task-btn--primary">
                              ▶ Resume
                            </button>
                          )}
                          {(task.status === 'running' || task.status === 'paused') && (
                            <button onClick={() => completeTask(task.id)} className="notion-task-btn">
                              ✓ Done
                            </button>
                          )}
                          {task.status !== 'pending' && (
                            <button onClick={() => resetTask(task.id)} className="notion-task-btn">
                              ↺ Reset
                            </button>
                          )}
                          {task.status !== 'running' && (
                            <button
                              onClick={() => { setEditingTask(task); setShowModal(true); }}
                              className="notion-task-btn"
                            >
                              ✎ Edit
                            </button>
                          )}
                          {confirmDeleteId === task.id ? (
                            <>
                              <button
                                onClick={() => { deleteTask(task.id); setConfirmDeleteId(null); }}
                                className="notion-task-btn notion-task-btn--danger"
                              >
                                Confirm delete
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="notion-task-btn"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(task.id)}
                              className="notion-task-btn"
                            >
                              🗑 Delete
                            </button>
                          )}
                          {(task.description.trim() || task.subItems.length > 0) && (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : task.id)}
                              className="notion-task-btn"
                            >
                              {isExpanded ? '▲ Collapse' : '▼ Details'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded section */}
                    {isExpanded && (
                      <div
                        style={{
                          borderTop: '1px solid var(--notion-border)',
                          padding: '14px 16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 14,
                        }}
                      >
                        {task.description.trim() && (
                          <MarkdownRenderer content={task.description} className="prose-bw" />
                        )}
                        {task.subItems.length > 0 && (
                          <div>
                            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#aeacaa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              Sub-tasks
                            </p>
                            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {task.subItems.map((item) => (
                                <li
                                  key={item.id}
                                  style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                                  onClick={() => toggleSubItem(task.id, item.id)}
                                >
                                  <span
                                    style={{
                                      width: 16,
                                      height: 16,
                                      flexShrink: 0,
                                      borderRadius: 3,
                                      border: `1px solid ${item.completed ? '#37352f' : '#aeacaa'}`,
                                      background: item.completed ? '#37352f' : 'transparent',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: 10,
                                      color: '#fff',
                                    }}
                                  >
                                    {item.completed ? '✓' : ''}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 13,
                                      color: item.completed ? '#aeacaa' : '#37352f',
                                      textDecoration: item.completed ? 'line-through' : 'none',
                                    }}
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
