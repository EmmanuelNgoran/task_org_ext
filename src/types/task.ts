export type TaskStatus = 'pending' | 'running' | 'paused' | 'completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  durationMinutes: number; // planned duration in minutes
  elapsedSeconds: number;  // accumulated seconds before the current running period
  status: TaskStatus;
  createdAt: number;       // timestamp
  completedAt?: number;    // timestamp when completed
  startedAt?: number;      // timestamp when timer was last started/resumed
}
