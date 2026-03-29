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

const priorityStyle: Record<TaskPriority, string> = {
  high: 'border-black bg-black text-white',
  medium: 'border-black text-black',
  low: 'border-gray-400 text-gray-500',
};

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

  const handleSave = (data: Partial<Task>) => {
    onUpdate(task.id, data);
    setEditing(false);
  };

  return (
    <>
      <div
        className={`border rounded bg-white transition-all ${
          task.status === 'running' ? 'border-black shadow-md' : 'border-gray-300'
        } ${task.status === 'completed' ? 'opacity-60' : ''}`}
      >
        {/* Main row */}
        <div className="flex gap-3 items-start p-3">
          {/* Timer circle */}
          <TimerDisplay
            elapsedSeconds={task.elapsedSeconds}
            durationMinutes={task.durationMinutes}
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-start gap-2 justify-between">
              <h3
                className={`text-sm font-semibold leading-tight ${
                  task.status === 'completed'
                    ? 'line-through text-gray-400'
                    : 'text-black'
                }`}
              >
                {task.title}
              </h3>
              <div className="flex items-center gap-1 shrink-0">
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide ${priorityStyle[task.priority]}`}
                >
                  {priorityLabel[task.priority]}
                </span>
              </div>
            </div>

            {/* Project + sub-items progress */}
            {(task.project || task.subItems.length > 0) && (
              <div className="flex items-center gap-2 mt-0.5">
                {task.project && (
                  <span className="text-[10px] text-gray-500 font-medium"># {task.project}</span>
                )}
                {task.subItems.length > 0 && (
                  <span className="text-[10px] text-gray-500">
                    ☑ {completedSubItems}/{task.subItems.length}
                  </span>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-1 mt-2 flex-wrap">
              {task.status === 'pending' && (
                <button
                  onClick={() => onStart(task.id)}
                  className="text-[11px] px-2 py-0.5 rounded bg-black text-white hover:bg-gray-800 transition-colors"
                >
                  ▶ Start
                </button>
              )}
              {task.status === 'running' && (
                <button
                  onClick={() => onPause(task.id)}
                  className="text-[11px] px-2 py-0.5 rounded border border-black text-black hover:bg-gray-100 transition-colors"
                >
                  ⏸ Pause
                </button>
              )}
              {task.status === 'paused' && (
                <button
                  onClick={() => onStart(task.id)}
                  className="text-[11px] px-2 py-0.5 rounded bg-black text-white hover:bg-gray-800 transition-colors"
                >
                  ▶ Resume
                </button>
              )}
              {(task.status === 'running' || task.status === 'paused') && (
                <button
                  onClick={() => onComplete(task.id)}
                  className="text-[11px] px-2 py-0.5 rounded border border-black text-black hover:bg-gray-100 transition-colors"
                >
                  ✓ Done
                </button>
              )}
              {task.status !== 'pending' && (
                <button
                  onClick={() => onReset(task.id)}
                  className="text-[11px] px-2 py-0.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  ↺ Reset
                </button>
              )}
              {task.status !== 'running' && (
                <button
                  onClick={() => setEditing(true)}
                  className="text-[11px] px-2 py-0.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  ✎ Edit
                </button>
              )}
              {confirmDelete ? (
                <>
                  <button
                    onClick={() => onDelete(task.id)}
                    className="text-[11px] px-2 py-0.5 rounded bg-black text-white hover:bg-gray-800 transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-[11px] px-2 py-0.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="text-[11px] px-2 py-0.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  🗑
                </button>
              )}
              {hasDetails && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="text-[11px] px-2 py-0.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {expanded ? '▲ Less' : '▼ More'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Expanded panel */}
        {expanded && hasDetails && (
          <div className="border-t border-gray-200 px-3 py-3 flex flex-col gap-3">
            {task.description.trim() && (
              <MarkdownRenderer content={task.description} className="text-xs text-gray-700" />
            )}
            {task.subItems.length > 0 && (
              <ul className="flex flex-col gap-1">
                {task.subItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-2 cursor-pointer group"
                    onClick={() => onToggleSubItem(task.id, item.id)}
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
                      className={`text-xs transition-colors ${
                        item.completed ? 'line-through text-gray-400' : 'text-black'
                      }`}
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
