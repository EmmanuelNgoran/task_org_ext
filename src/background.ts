/**
 * Chrome Extension Service Worker
 *
 * Keeps task timers running in the background using chrome.alarms.
 * Sends a Chrome notification when a task timer completes while the popup is closed.
 */

import type { Task } from './types/task';
import { calcElapsedSeconds } from './utils/timerUtils';

const ALARM_NAME = 'task-timer-tick';
const STORAGE_KEY = 'task_organizer_tasks';

// Register the recurring alarm on install and browser startup
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 });
});

// Ensure the alarm exists after a service-worker restart
chrome.alarms.get(ALARM_NAME, (alarm) => {
  if (!alarm) {
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 });
  }
});

// Check running tasks on every alarm tick
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    checkRunningTasks();
  }
});

async function checkRunningTasks(): Promise<void> {
  const tasks = await loadTasks();
  const now = Date.now();
  let changed = false;

  const updated = tasks.map((task) => {
    if (task.status !== 'running' || !task.startedAt) return task;

    const elapsed = calcElapsedSeconds(task.elapsedSeconds, task.startedAt, now);
    const limitSeconds = task.durationMinutes * 60;
    const isComplete = limitSeconds > 0 && elapsed >= limitSeconds;

    if (isComplete) {
      changed = true;
      chrome.notifications.create(`task-complete-${task.id}`, {
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Task Complete! ✓',
        message: `"${task.title}" timer has finished.`,
      });
      return {
        ...task,
        elapsedSeconds: limitSeconds,
        status: 'completed' as const,
        completedAt: now,
        startedAt: undefined,
      };
    }

    return task;
  });

  if (changed) {
    await saveTasks(updated);
  }
}

function loadTasks(): Promise<Task[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      resolve((result[STORAGE_KEY] as Task[]) ?? []);
    });
  });
}

function saveTasks(tasks: Task[]): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: tasks }, resolve);
  });
}
