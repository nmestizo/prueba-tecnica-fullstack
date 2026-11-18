import type { CreateTaskDTO, PaginatedTasks, Task, TaskStatus, UpdateTaskDTO } from './task.types.js';

export class TaskRepository {
  private tasks: Task[] = [];
  private nextId = 1;

  // TODO: findAll, findById, create, update
   findAll(filters: {
    status?: TaskStatus;
    page: number;
    limit: number;
  }): PaginatedTasks {
    let filtered = this.tasks;

    if (filters.status) {
      filtered = filtered.filter((task) => task.status === filters.status);
    }

    const total = filtered.length;
    const startIndex = (filters.page - 1) * filters.limit;
    const data = filtered.slice(startIndex, startIndex + filters.limit);

    return {
      data,
      page: filters.page,
      limit: filters.limit,
      total,
    };
  }

  findById(id: number): Task | undefined {
    return this.tasks.find((task) => task.id === id);
  }

  create(dto: CreateTaskDTO): Task {
    const newTask: Task = {
      id: this.nextId++,
      title: dto.title.trim(),
      status: 'todo',
      priority: dto.priority ?? 2,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.tasks.push(newTask);
    return newTask;
  }

  update(id: number, dto: UpdateTaskDTO): Task | undefined {
    const task = this.findById(id);
    if (!task) return undefined;

    if (dto.title !== undefined) {
      task.title = dto.title.trim();
    }
    if (dto.status !== undefined) {
      task.status = dto.status;
    }
    if (dto.priority !== undefined) {
      task.priority = dto.priority;
    }

    return task;
  }
}
