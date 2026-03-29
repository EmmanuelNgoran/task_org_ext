import { useState } from 'react';
import { marked } from 'marked';
import type { Task, TaskPriority, SubItem } from '../types/task';
import { ProjectCombobox } from './ProjectCombobox';

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
  const [durationInput, setDurationInput] = useState(String(task?.durationMinutes ?? 25));
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium');
  const [project, setProject] = useState(task?.project ?? '');
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '');
  const [subItems, setSubItems] = useState<SubItem[]>(task?.subItems ?? []);
  const [newSubItem, setNewSubItem] = useState('');
  const [editingSubItemId, setEditingSubItemId] = useState<string | null>(null);
  const [editingSubItemText, setEditingSubItemText] = useState('');
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
    if (editingSubItemId === id) setEditingSubItemId(null);
  };

  const handleStartEditSubItem = (item: SubItem) => {
    setEditingSubItemId(item.id);
    setEditingSubItemText(item.text);
  };

  const handleSaveEditSubItem = (id: string) => {
    const text = editingSubItemText.trim();
    if (text) {
      setSubItems((prev) =>
        prev.map((s) => (s.id === id ? { ...s, text } : s)),
      );
    }
    setEditingSubItemId(null);
  };

  const handleSubItemKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSubItem();
    }
  };

  const handleEditSubItemKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEditSubItem(id);
    }
    if (e.key === 'Escape') {
      setEditingSubItemId(null);
    }
  };

  const handleDurationInputChange = (val: string) => {
    setDurationInput(val);
    const n = parseInt(val, 10);
    if (!isNaN(n) && n >= 0 && n <= 480) {
      setDurationMinutes(n);
    }
  };

  const handleDurationInputBlur = () => {
    const n = parseInt(durationInput, 10);
    if (isNaN(n) || n < 0) {
      setDurationMinutes(0);
      setDurationInput('0');
    } else if (n > 480) {
      setDurationMinutes(480);
      setDurationInput('480');
    } else {
      setDurationMinutes(n);
      setDurationInput(String(n));
    }
  };

  const handleSliderChange = (val: number) => {
    setDurationMinutes(val);
    setDurationInput(String(val));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim(),
      durationMinutes,
      dueDate: dueDate || undefined,
      priority,
      project: project.trim(),
      subItems,
    });
    onClose();
  };

  const uniqueProjects = Array.from(new Set(existingProjects.filter(Boolean)));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="notion-modal flex flex-col"
        style={{
          width: 580,
          maxHeight: '90vh',
          background: '#fff',
          borderRadius: 8,
          boxShadow: 'rgba(15,15,15,0.05) 0 0 0 1px, rgba(15,15,15,0.1) 0 3px 6px, rgba(15,15,15,0.2) 0 9px 24px',
          overflow: 'hidden',
        }}
      >
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid #e9e9e7' }}
        >
          <h2 className="notion-title-sm" style={{ fontWeight: 600, fontSize: 15 }}>
            {task ? 'Edit task' : 'New task'}
          </h2>
          <button
            onClick={onClose}
            className="notion-icon-btn"
            aria-label="Close"
            style={{ color: '#787774', fontSize: 18, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 4, padding: '2px 6px' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {/* Title */}
          <div>
            <label className="notion-label">Title <span style={{ color: '#eb5757' }}>*</span></label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title…"
              maxLength={100}
              className="notion-input"
              required
            />
          </div>

          {/* Row: Priority + Project + Due date */}
          <div className="flex gap-3">
            <div style={{ flex: '0 0 120px' }}>
              <label className="notion-label">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="notion-input"
              >
                {PRIORITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="notion-label">Project</label>
              <ProjectCombobox
                value={project}
                onChange={setProject}
                options={uniqueProjects}
              />
            </div>

            <div style={{ flex: '0 0 150px' }}>
              <label className="notion-label">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="notion-input"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
              <label className="notion-label" style={{ marginBottom: 0 }}>
                Description
                <span style={{ marginLeft: 4, fontSize: 10, fontWeight: 400, color: '#aeacaa', textTransform: 'none', letterSpacing: 0 }}>(markdown)</span>
              </label>
              <button
                type="button"
                onClick={() => setShowPreview((v) => !v)}
                className="notion-small-btn"
              >
                {showPreview ? 'Edit' : 'Preview'}
              </button>
            </div>
            {showPreview ? (
              <div className="notion-preview prose-bw">
                {description.trim() ? (
                  <div dangerouslySetInnerHTML={{ __html: marked.parse(description) as string }} />
                ) : (
                  <span style={{ color: '#aeacaa', fontStyle: 'italic', fontSize: 12 }}>Nothing to preview.</span>
                )}
              </div>
            ) : (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional details… (supports **bold**, _italic_, `code`, lists)"
                rows={4}
                className="notion-input"
                style={{ resize: 'vertical' }}
              />
            )}
          </div>

          {/* Sub-items */}
          <div>
            <label className="notion-label">Sub-tasks</label>
            <div className="flex gap-2" style={{ marginBottom: 8 }}>
              <input
                type="text"
                value={newSubItem}
                onChange={(e) => setNewSubItem(e.target.value)}
                onKeyDown={handleSubItemKeyDown}
                placeholder="Add a sub-task…"
                maxLength={120}
                className="notion-input"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={handleAddSubItem}
                className="notion-btn-primary"
              >
                Add
              </button>
            </div>
            {subItems.length > 0 && (
              <ul className="flex flex-col gap-1">
                {subItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-2"
                    style={{
                      border: '1px solid #e9e9e7',
                      borderRadius: 4,
                      padding: '4px 8px',
                      background: editingSubItemId === item.id ? '#f7f6f3' : '#fff',
                    }}
                  >
                    {editingSubItemId === item.id ? (
                      <input
                        autoFocus
                        type="text"
                        value={editingSubItemText}
                        onChange={(e) => setEditingSubItemText(e.target.value)}
                        onBlur={() => handleSaveEditSubItem(item.id)}
                        onKeyDown={(e) => handleEditSubItemKeyDown(e, item.id)}
                        className="notion-input"
                        style={{ flex: 1, padding: '1px 4px', fontSize: 13 }}
                      />
                    ) : (
                      <span className="flex-1 text-sm truncate" style={{ color: '#37352f', cursor: 'text' }}>
                        {item.text}
                      </span>
                    )}
                    {editingSubItemId !== item.id && (
                      <button
                        type="button"
                        onClick={() => handleStartEditSubItem(item)}
                        className="notion-icon-btn"
                        aria-label="Edit sub-task"
                        title="Edit"
                        style={{ fontSize: 12, color: '#aeacaa', padding: '1px 4px' }}
                      >
                        ✎
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveSubItem(item.id)}
                      className="notion-icon-btn"
                      aria-label="Remove sub-task"
                      title="Remove"
                      style={{ fontSize: 11, color: '#aeacaa', padding: '1px 4px' }}
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
            <label className="notion-label">Duration</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={480}
                step={5}
                value={durationMinutes}
                onChange={(e) => handleSliderChange(Number(e.target.value))}
                style={{ flex: 1, accentColor: '#37352f' }}
              />
              <div className="flex items-center gap-1" style={{ flexShrink: 0 }}>
                <input
                  type="number"
                  min={0}
                  max={480}
                  value={durationInput}
                  onChange={(e) => handleDurationInputChange(e.target.value)}
                  onBlur={handleDurationInputBlur}
                  className="notion-input"
                  style={{ width: 64, textAlign: 'right', padding: '4px 8px' }}
                />
                <span style={{ fontSize: 12, color: '#787774', whiteSpace: 'nowrap' }}>min</span>
              </div>
            </div>
            {durationMinutes === 0 && (
              <p style={{ fontSize: 10, color: '#aeacaa', marginTop: 2 }}>Set to 0 for an open-ended timer.</p>
            )}
          </div>

          {/* Actions */}
          <div
            className="flex gap-2 pt-1"
            style={{ borderTop: '1px solid #e9e9e7' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="notion-btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="notion-btn-primary flex-1"
            >
              {task ? 'Save changes' : 'Create task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
