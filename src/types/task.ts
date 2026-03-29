export type TaskStatus = 'pending' | 'running' | 'paused' | 'completed';

export type TaskPriority = 'low' | 'medium' | 'high';

export interface SubItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;       // supports markdown
  priority: TaskPriority;
  project: string;           // project / group name (empty string = no project)
  subItems: SubItem[];       // checklist sub-tasks
  durationMinutes: number;   // planned duration in minutes
  dueDate?: string;          // optional due date (YYYY-MM-DD)
  elapsedSeconds: number;    // accumulated seconds before the current running period
  status: TaskStatus;
  createdAt: number;         // timestamp
  completedAt?: number;      // timestamp when completed
  startedAt?: number;        // timestamp when timer was last started/resumed
}
