export type TaskStatus = 'pending' | 'running' | 'paused' | 'completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  durationMinutes: number; // planned duration in minutes
  elapsedSeconds: number;  // accumulated elapsed seconds
  status: TaskStatus;
  createdAt: number;       // timestamp
  completedAt?: number;    // timestamp when completed
}
