import { useState } from 'react';
import { marked } from 'marked';
import type { Task, TaskPriority, SubItem } from '../types/task';

interface TaskModalProps {
  task?: Task;
  existingProjects?: string[];
  onSave: (data: Omit<Task, 'id' | 'elapsedSeconds' | 'status' | 'createdAt' | 'startedAt'>) => void;
  onClose: () => void;
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'high', label: '↑ High' },
  { value: 'medium', label: '— Medium' },
  { value: 'low', label: '↓ Low' },
];

export function TaskModal({ task, existingProjects = [], onSave, onClose }: TaskModalProps) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [durationMinutes, setDurationMinutes] = useState(task?.durationMinutes ?? 25);
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium');
  const [project, setProject] = useState(task?.project ?? '');
  const [subItems, setSubItems] = useState<SubItem[]>(task?.subItems ?? []);
  const [newSubItem, setNewSubItem] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const handleAddSubItem = () => {
    const text = newSubItem.trim();
    if (!text) return;
    setSubItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text, completed: false },
    ]);
    setNewSubItem('');
  };

  const handleRemoveSubItem = (id: string) => {
    setSubItems((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSubItemKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSubItem();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim(),
      durationMinutes,
      priority,
      project: project.trim(),
      subItems,
    });
    onClose();
  };

  const uniqueProjects = Array.from(new Set(existingProjects.filter(Boolean)));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white border border-black rounded-lg shadow-2xl w-[420px] max-h-[90vh] overflow-y-auto">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black">
          <h2 className="text-sm font-bold text-black tracking-wide uppercase">
            {task ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            onClick={onClose}
            className="text-black hover:opacity-60 transition-opacity text-lg leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4">
          {/* Title */}
          <div>
            <label className="block text-[11px] font-bold text-black uppercase tracking-wider mb-1">
              Title <span className="text-black">*</span>
            </label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title…"
              maxLength={100}
              className="w-full border border-black rounded px-3 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-black placeholder:text-gray-400"
              required
            />
          </div>

          {/* Priority + Project row */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-black uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full border border-black rounded px-3 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-black bg-white"
              >
                {PRIORITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-[11px] font-bold text-black uppercase tracking-wider mb-1">
                Project
              </label>
              <input
                type="text"
                list="project-list"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                placeholder="e.g. Work, Personal…"
                maxLength={50}
                className="w-full border border-black rounded px-3 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-black placeholder:text-gray-400"
              />
              {uniqueProjects.length > 0 && (
                <datalist id="project-list">
                  {uniqueProjects.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              )}
            </div>
          </div>

          {/* Description with preview toggle */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-black uppercase tracking-wider">
                Description
                <span className="ml-1 text-[10px] font-normal normal-case text-gray-500">(markdown)</span>
              </label>
              <button
                type="button"
                onClick={() => setShowPreview((v) => !v)}
                className="text-[10px] font-medium text-black border border-black rounded px-2 py-0.5 hover:bg-black hover:text-white transition-colors"
              >
                {showPreview ? 'Edit' : 'Preview'}
              </button>
            </div>
            {showPreview ? (
              <div className="border border-black rounded px-3 py-2 min-h-[80px] text-sm prose-bw">
                {description.trim() ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: marked.parse(description) as string }}
                  />
                ) : (
                  <span className="text-gray-400 italic text-xs">Nothing to preview.</span>
                )}
              </div>
            ) : (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional details… (supports **bold**, _italic_, `code`, lists)"
                rows={4}
                className="w-full border border-black rounded px-3 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-black resize-y placeholder:text-gray-400"
              />
            )}
          </div>

          {/* Sub-items */}
          <div>
            <label className="block text-[11px] font-bold text-black uppercase tracking-wider mb-1">
              Sub-tasks
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newSubItem}
                onChange={(e) => setNewSubItem(e.target.value)}
                onKeyDown={handleSubItemKeyDown}
                placeholder="Add a sub-task…"
                maxLength={120}
                className="flex-1 border border-black rounded px-3 py-1.5 text-sm text-black outline-none focus:ring-2 focus:ring-black placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={handleAddSubItem}
                className="px-3 py-1.5 bg-black text-white text-sm rounded hover:bg-gray-800 transition-colors"
              >
                Add
              </button>
            </div>
            {subItems.length > 0 && (
              <ul className="flex flex-col gap-1">
                {subItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-2 border border-gray-200 rounded px-2 py-1"
                  >
                    <span className="flex-1 text-sm text-black truncate">{item.text}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubItem(item.id)}
                      className="text-gray-400 hover:text-black transition-colors text-xs"
                      aria-label="Remove sub-task"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Duration */}
          <div>
            <label className="block text-[11px] font-bold text-black uppercase tracking-wider mb-1">
              Duration (minutes)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={120}
                step={5}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="flex-1 accent-black"
              />
              <span className="w-10 text-center text-sm font-bold text-black">
                {durationMinutes === 0 ? '∞' : `${durationMinutes}m`}
              </span>
            </div>
            <p className="text-[10px] text-gray-500 mt-0.5">Set to 0 for an open-ended timer.</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-black rounded py-2 text-sm font-medium text-black hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-black rounded py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
            >
              {task ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
