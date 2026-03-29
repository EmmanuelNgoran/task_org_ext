import { useState } from 'react';
import type { Task, TaskPriority } from '../types/task';
import { TimerDisplay } from './TimerDisplay';
import { TaskModal } from './TaskModal';
import { MarkdownRenderer } from './MarkdownRenderer';

interface TaskItemProps {
  task: Task;
  existingProjects: string[];
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onReset: (id: string) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<Task>) => void;
  onToggleSubItem: (taskId: string, subItemId: string) => void;
}

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

export function TaskItem({
  task,
  existingProjects,
  onStart,
  onPause,
  onReset,
  onComplete,
  onDelete,
  onUpdate,
  onToggleSubItem,
}: TaskItemProps) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const hasDetails = task.description.trim() || task.subItems.length > 0;
  const completedSubItems = task.subItems.filter((s) => s.completed).length;
  const dueInfo = task.dueDate ? formatDueDate(task.dueDate) : null;

  const handleSave = (data: Partial<Task>) => {
    onUpdate(task.id, data);
    setEditing(false);
  };

  const pc = priorityColors[task.priority];

  return (
    <>
      <div
        style={{
          border: `1px solid ${task.status === 'running' ? '#37352f' : 'var(--notion-border)'}`,
          borderRadius: 6,
          background: 'var(--notion-bg)',
          boxShadow: task.status === 'running' ? '0 2px 8px rgba(55,53,47,0.15)' : 'none',
          opacity: task.status === 'completed' ? 0.6 : 1,
          transition: 'all 0.15s',
        }}
      >
        {/* Main row */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px' }}>
          {/* Timer circle */}
          <TimerDisplay
            elapsedSeconds={task.elapsedSeconds}
            durationMinutes={task.durationMinutes}
          />

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Title row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, justifyContent: 'space-between' }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 600,
                  lineHeight: 1.4,
                  color: task.status === 'completed' ? '#aeacaa' : '#37352f',
                  textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                  wordBreak: 'break-word',
                }}
              >
                {task.title}
              </h3>
              <span
                style={{
                  flexShrink: 0,
                  fontSize: 9,
                  fontWeight: 700,
                  padding: '2px 5px',
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

            {/* Meta row: project, sub-items count, due date */}
            {(task.project || task.subItems.length > 0 || dueInfo) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 8px', marginTop: 2 }}>
                {task.project && (
                  <span style={{ fontSize: 10, color: '#787774', fontWeight: 500 }}>
                    # {task.project}
                  </span>
                )}
                {task.subItems.length > 0 && (
                  <span style={{ fontSize: 10, color: '#787774' }}>
                    ☑ {completedSubItems}/{task.subItems.length}
                  </span>
                )}
                {dueInfo && (
                  <span className={dueInfo.cls} style={{ fontSize: 10, fontWeight: 500 }}>
                    📅 {dueInfo.label}
                  </span>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
              {task.status === 'pending' && (
                <button onClick={() => onStart(task.id)} className="notion-task-btn notion-task-btn--primary">
                  ▶ Start
                </button>
              )}
              {task.status === 'running' && (
                <button onClick={() => onPause(task.id)} className="notion-task-btn">
                  ⏸ Pause
                </button>
              )}
              {task.status === 'paused' && (
                <button onClick={() => onStart(task.id)} className="notion-task-btn notion-task-btn--primary">
                  ▶ Resume
                </button>
              )}
              {(task.status === 'running' || task.status === 'paused') && (
                <button onClick={() => onComplete(task.id)} className="notion-task-btn">
                  ✓ Done
                </button>
              )}
              {task.status !== 'pending' && (
                <button onClick={() => onReset(task.id)} className="notion-task-btn">
                  ↺ Reset
                </button>
              )}
              {task.status !== 'running' && (
                <button onClick={() => setEditing(true)} className="notion-task-btn">
                  ✎ Edit
                </button>
              )}
              {confirmDelete ? (
                <>
                  <button onClick={() => onDelete(task.id)} className="notion-task-btn notion-task-btn--danger">
                    Confirm
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className="notion-task-btn">
                    Cancel
                  </button>
                </>
              ) : (
                <button onClick={() => setConfirmDelete(true)} className="notion-task-btn">
                  🗑
                </button>
              )}
              {hasDetails && (
                <button onClick={() => setExpanded((v) => !v)} className="notion-task-btn">
                  {expanded ? '▲ Less' : '▼ More'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Expanded panel */}
        {expanded && hasDetails && (
          <div
            style={{
              borderTop: '1px solid var(--notion-border)',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {task.description.trim() && (
              <MarkdownRenderer content={task.description} className="prose-bw" />
            )}
            {task.subItems.length > 0 && (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {task.subItems.map((item) => (
                  <li
                    key={item.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                    onClick={() => onToggleSubItem(task.id, item.id)}
                  >
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        flexShrink: 0,
                        borderRadius: 3,
                        border: `1px solid ${item.completed ? '#37352f' : '#aeacaa'}`,
                        background: item.completed ? '#37352f' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 9,
                        color: '#fff',
                      }}
                    >
                      {item.completed ? '✓' : ''}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: item.completed ? '#aeacaa' : '#37352f',
                        textDecoration: item.completed ? 'line-through' : 'none',
                      }}
                    >
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {editing && (
        <TaskModal
          task={task}
          existingProjects={existingProjects}
          onSave={handleSave}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}
