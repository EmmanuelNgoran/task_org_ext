import { useState } from 'react';
import type { Task } from '../types/task';
import { TaskItem } from './TaskItem';
import { TaskModal } from './TaskModal';
import { useTasks } from '../hooks/useTasks';

type FilterType = 'all' | 'active' | 'completed';

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
  } = useTasks();

  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = tasks.filter((t) => {
    if (filter === 'active') return t.status !== 'completed';
    if (filter === 'completed') return t.status === 'completed';
    return true;
  });

  const handleUpdate = (
    id: string,
    data: { title: string; description: string; durationMinutes: number },
  ) => {
    updateTask(id, data);
  };

  const activeCount = tasks.filter((t) => t.status !== 'completed').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div>
          <h1 className="text-base font-bold text-gray-800">Task Organizer</h1>
          <p className="text-[11px] text-gray-500">
            {activeCount} active · {completedCount} done
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1 bg-indigo-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <span className="text-base leading-none">+</span> New Task
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-gray-200">
        {(['all', 'active', 'completed'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 text-xs py-2 font-medium capitalize transition-colors
              ${filter === f
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-sm gap-2">
            <span className="text-3xl">📋</span>
            <p>{filter === 'completed' ? 'No completed tasks yet.' : 'No tasks yet. Create one!'}</p>
          </div>
        ) : (
          filtered.map((task: Task) => (
            <TaskItem
              key={task.id}
              task={task}
              onStart={startTask}
              onPause={pauseTask}
              onReset={resetTask}
              onComplete={completeTask}
              onDelete={deleteTask}
              onUpdate={handleUpdate}
            />
          ))
        )}
      </div>

      {showModal && (
        <TaskModal
          onSave={addTask}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
