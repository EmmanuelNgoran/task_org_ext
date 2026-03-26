import { useState } from 'react';
import type { Task } from '../types/task';
import { TimerDisplay } from './TimerDisplay';
import { TaskModal } from './TaskModal';

interface TaskItemProps {
  task: Task;
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onReset: (id: string) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: { title: string; description: string; durationMinutes: number }) => void;
}

const statusColors: Record<Task['status'], string> = {
  pending: 'bg-gray-100 text-gray-500',
  running: 'bg-indigo-100 text-indigo-700',
  paused: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
};

const statusLabel: Record<Task['status'], string> = {
  pending: 'Pending',
  running: 'Running',
  paused: 'Paused',
  completed: 'Done',
};

export function TaskItem({
  task,
  onStart,
  onPause,
  onReset,
  onComplete,
  onDelete,
  onUpdate,
}: TaskItemProps) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = (data: { title: string; description: string; durationMinutes: number }) => {
    onUpdate(task.id, data);
    setEditing(false);
  };

  return (
    <>
      <div
        className={`rounded-xl border p-3 flex gap-3 items-start transition-all
          ${task.status === 'completed' ? 'border-green-200 bg-green-50 opacity-80' : 'border-gray-200 bg-white'}
          ${task.status === 'running' ? 'border-indigo-300 shadow-sm' : ''}
        `}
      >
        {/* Timer circle */}
        <TimerDisplay
          elapsedSeconds={task.elapsedSeconds}
          durationMinutes={task.durationMinutes}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <h3
              className={`text-sm font-semibold leading-tight truncate ${
                task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'
              }`}
            >
              {task.title}
            </h3>
            <span
              className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusColors[task.status]}`}
            >
              {statusLabel[task.status]}
            </span>
          </div>

          {task.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{task.description}</p>
          )}

          {/* Action buttons */}
          <div className="flex gap-1 mt-2 flex-wrap">
            {task.status === 'pending' && (
              <button
                onClick={() => onStart(task.id)}
                className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                ▶ Start
              </button>
            )}
            {task.status === 'running' && (
              <button
                onClick={() => onPause(task.id)}
                className="text-[11px] px-2 py-0.5 rounded-md bg-amber-500 text-white hover:bg-amber-600 transition-colors"
              >
                ⏸ Pause
              </button>
            )}
            {task.status === 'paused' && (
              <button
                onClick={() => onStart(task.id)}
                className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                ▶ Resume
              </button>
            )}
            {(task.status === 'running' || task.status === 'paused') && (
              <button
                onClick={() => onComplete(task.id)}
                className="text-[11px] px-2 py-0.5 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                ✓ Done
              </button>
            )}
            {task.status !== 'pending' && (
              <button
                onClick={() => onReset(task.id)}
                className="text-[11px] px-2 py-0.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                ↺ Reset
              </button>
            )}
            {task.status !== 'running' && (
              <button
                onClick={() => setEditing(true)}
                className="text-[11px] px-2 py-0.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                ✎ Edit
              </button>
            )}
            {confirmDelete ? (
              <>
                <button
                  onClick={() => onDelete(task.id)}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-[11px] px-2 py-0.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-[11px] px-2 py-0.5 rounded-md border border-red-300 text-red-500 hover:bg-red-50 transition-colors"
              >
                🗑
              </button>
            )}
          </div>
        </div>
      </div>

      {editing && (
        <TaskModal
          task={task}
          onSave={handleSave}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}
