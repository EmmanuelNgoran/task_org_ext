import { useState, useEffect, useCallback } from 'react';
import type { Task } from '../types/task';
import { loadTasks, saveTasks } from '../utils/storage';
import { playCompletionSound } from '../utils/sound';
import { calcElapsedSeconds } from '../utils/timerUtils';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Load tasks from storage on mount, catching up elapsed time for running tasks
  useEffect(() => {
    loadTasks().then((loaded) => {
      const now = Date.now();
      let needsSave = false;

      const initialized = loaded.map((t): Task => {
        if (t.status === 'running' && t.startedAt) {
          // Catch up seconds accumulated while the popup was closed.
          // We then re-anchor startedAt to `now` so the background service worker
          // continues counting from the correct baseline after the popup saves.
          // saveTasks below is a single atomic write, so there is no window where
          // the background could observe a mismatched (elapsedSeconds, startedAt) pair.
          const newElapsed = calcElapsedSeconds(t.elapsedSeconds, t.startedAt, now);
          const limitSeconds = t.durationMinutes * 60;
          needsSave = true;

          if (limitSeconds > 0 && newElapsed >= limitSeconds) {
            return {
              ...t,
              elapsedSeconds: limitSeconds,
              status: 'completed',
              completedAt: now,
              startedAt: undefined,
            };
          }
          // Re-anchor startedAt to now so the background worker counts from here
          return { ...t, elapsedSeconds: newElapsed, startedAt: now };
        }
        return t;
      });

      if (needsSave) saveTasks(initialized);
      setTasks(initialized);
      setLoading(false);
    });
  }, []);

  // Tick running tasks every second (updates local display state;
  // storage is only written when a task completes)
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks((prev) => {
        let needsSave = false;
        let hasRunning = false;

        const next = prev.map((task) => {
          if (task.status !== 'running') return task;
          hasRunning = true;

          const newElapsed = task.elapsedSeconds + 1;
          const limitSeconds = task.durationMinutes * 60;
          const isComplete = limitSeconds > 0 && newElapsed >= limitSeconds;

          if (isComplete) {
            playCompletionSound();
            needsSave = true;
            return {
              ...task,
              elapsedSeconds: limitSeconds,
              status: 'completed' as const,
              completedAt: Date.now(),
              startedAt: undefined,
            };
          }
          return { ...task, elapsedSeconds: newElapsed };
        });

        if (needsSave) saveTasks(next);
        return hasRunning ? next : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Sync popup state when the background service worker updates storage
  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.storage) return;

    const STORAGE_KEY = 'task_organizer_tasks';
    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (!changes[STORAGE_KEY]) return;
      const storedTasks = (changes[STORAGE_KEY].newValue as Task[]) ?? [];
      const oldTasks = (changes[STORAGE_KEY].oldValue as Task[]) ?? [];

      // Build a map for O(1) lookups instead of O(n) scans per task
      const oldTaskMap = new Map(oldTasks.map((t) => [t.id, t]));

      setTasks((prev) => {
        const localMap = new Map(prev.map((t) => [t.id, t]));

        return storedTasks.map((storedTask) => {
          const localTask = localMap.get(storedTask.id);
          // Play sound for tasks completed by the background worker
          if (storedTask.status === 'completed') {
            const wasRunning = oldTaskMap.get(storedTask.id)?.status === 'running';
            if (wasRunning && localTask?.status === 'running') {
              playCompletionSound();
            }
          }
          // Keep local (tick-updated) state for tasks still actively running in the popup
          if (localTask?.status === 'running' && storedTask.status === 'running') {
            return localTask;
          }
          return storedTask;
        });
      });
    };

    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const persist = useCallback((updater: (prev: Task[]) => Task[]) => {
    setTasks((prev) => {
      const next = updater(prev);
      saveTasks(next);
      return next;
    });
  }, []);

  const addTask = useCallback(
    (data: Omit<Task, 'id' | 'elapsedSeconds' | 'status' | 'createdAt' | 'startedAt'>) => {
      const task: Task = {
        ...data,
        id: crypto.randomUUID(),
        elapsedSeconds: 0,
        status: 'pending',
        createdAt: Date.now(),
      };
      persist((prev) => [...prev, task]);
    },
    [persist],
  );

  const updateTask = useCallback(
    (id: string, changes: Partial<Task>) => {
      persist((prev) => prev.map((t) => (t.id === id ? { ...t, ...changes } : t)));
    },
    [persist],
  );

  const deleteTask = useCallback(
    (id: string) => {
      persist((prev) => prev.filter((t) => t.id !== id));
    },
    [persist],
  );

  const startTask = useCallback(
    (id: string) => updateTask(id, { status: 'running', startedAt: Date.now() }),
    [updateTask],
  );

  const pauseTask = useCallback(
    (id: string) => updateTask(id, { status: 'paused', startedAt: undefined }),
    [updateTask],
  );

  const resetTask = useCallback(
    (id: string) =>
      updateTask(id, {
        status: 'pending',
        elapsedSeconds: 0,
        completedAt: undefined,
        startedAt: undefined,
      }),
    [updateTask],
  );

  const completeTask = useCallback(
    (id: string) =>
      updateTask(id, {
        status: 'completed',
        completedAt: Date.now(),
        startedAt: undefined,
      }),
    [updateTask],
  );

  const toggleSubItem = useCallback(
    (taskId: string, subItemId: string) => {
      persist((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                subItems: t.subItems.map((s) =>
                  s.id === subItemId ? { ...s, completed: !s.completed } : s,
                ),
              }
            : t,
        ),
      );
    },
    [persist],
  );

  return {
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
  };
}

