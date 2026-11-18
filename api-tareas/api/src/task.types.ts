export type TaskStatus = 'todo' | 'doing' | 'done';

export type TaskPriority = 1 | 2 | 3;

export interface Task {
  id: number;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskDTO {
  title: string;
  priority?: TaskPriority;
}

export interface UpdateTaskDTO {
  title?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
}

export interface PaginatedTasks {
  data: Task[];
  page: number;
  limit: number;
  total: number;
}
