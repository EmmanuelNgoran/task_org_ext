import type { Task } from '../types/task';

const STORAGE_KEY = 'task_organizer_tasks';

function isChrome(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.storage;
}

/** Add default values for fields that were added in later versions. */
function migrateTask(raw: Partial<Task>): Task {
  return {
    priority: 'medium',
    project: '',
    subItems: [],
    ...raw,
  } as Task;
}

export async function loadTasks(): Promise<Task[]> {
  if (isChrome()) {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        const tasks = ((result[STORAGE_KEY] as Partial<Task>[]) || []).map(migrateTask);
        resolve(tasks);
      });
    });
  }
  // Fallback for dev/non-extension context
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Partial<Task>[]).map(migrateTask) : [];
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  if (isChrome()) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [STORAGE_KEY]: tasks }, resolve);
    });
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}
