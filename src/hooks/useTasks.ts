import { useState, useEffect, useCallback } from 'react';
import type { Task } from '../types/task';
import { loadTasks, saveTasks } from '../utils/storage';
import { playCompletionSound } from '../utils/sound';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Load tasks from storage on mount
  useEffect(() => {
    loadTasks().then((loaded) => {
      // Reset any previously-running tasks to paused (extension was closed)
      const normalized = loaded.map((t) =>
        t.status === 'running' ? { ...t, status: 'paused' as const } : t,
      );
      setTasks(normalized);
      setLoading(false);
    });
  }, []);

  // Tick running tasks every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks((prev) => {
        let changed = false;
        const next = prev.map((task) => {
          if (task.status !== 'running') return task;

          const newElapsed = task.elapsedSeconds + 1;
          const limitSeconds = task.durationMinutes * 60;
          const isComplete = limitSeconds > 0 && newElapsed >= limitSeconds;

          changed = true;
          if (isComplete) {
            playCompletionSound();
            return {
              ...task,
              elapsedSeconds: limitSeconds,
              status: 'completed' as const,
              completedAt: Date.now(),
            };
          }
          return { ...task, elapsedSeconds: newElapsed };
        });

        if (changed) {
          saveTasks(next);
        }
        return changed ? next : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const persist = useCallback((updater: (prev: Task[]) => Task[]) => {
    setTasks((prev) => {
      const next = updater(prev);
      saveTasks(next);
      return next;
    });
  }, []);

  const addTask = useCallback(
    (data: Omit<Task, 'id' | 'elapsedSeconds' | 'status' | 'createdAt'>) => {
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
    (id: string) => updateTask(id, { status: 'running' }),
    [updateTask],
  );

  const pauseTask = useCallback(
    (id: string) => updateTask(id, { status: 'paused' }),
    [updateTask],
  );

  const resetTask = useCallback(
    (id: string) =>
      updateTask(id, { status: 'pending', elapsedSeconds: 0, completedAt: undefined }),
    [updateTask],
  );

  const completeTask = useCallback(
    (id: string) =>
      updateTask(id, {
        status: 'completed',
        completedAt: Date.now(),
      }),
    [updateTask],
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
  };
}

