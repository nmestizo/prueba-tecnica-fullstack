import { Router, type NextFunction, type Request, type Response } from 'express';
import { AppError } from './app.error.js';
import { TaskRepository } from './task.repository.js';
import type { TaskPriority, TaskStatus, UpdateTaskDTO } from './task.types.js';

export const tasksRouter = Router();
const repository = new TaskRepository();

// TODO: endpoints
const VALID_STATUSES: TaskStatus[] = ['todo', 'doing', 'done'];
const VALID_PRIORITIES: TaskPriority[] = [1, 2, 3];

// GET /tasks
tasksRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, page, limit } = req.query;

    // Validar status si viene en query
    let parsedStatus: TaskStatus | undefined;
    if (status !== undefined) {
      if (typeof status !== 'string' || !VALID_STATUSES.includes(status as TaskStatus)) {
        throw new AppError(400, 'Invalid status filter. Allowed: todo, doing, done');
      }
      parsedStatus = status as TaskStatus;
    }

    // Validar page
    const parsedPage = page !== undefined ? Number(page) : 1;
    if (!Number.isInteger(parsedPage) || parsedPage < 1) {
      throw new AppError(400, 'Page must be a positive integer');
    }

    // Validar limit (máximo 50)
    const parsedLimit = limit !== undefined ? Number(limit) : 10;
    if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
      throw new AppError(400, 'Limit must be an integer between 1 and 50');
    }

    const result = repository.findAll({
      status: parsedStatus,
      page: parsedPage,
      limit: parsedLimit,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// POST /tasks
tasksRouter.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, priority } = req.body;

    // Validar title
    if (typeof title !== 'string') {
      throw new AppError(400, 'Title is required and must be a string');
    }
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 3 || trimmedTitle.length > 100) {
      throw new AppError(400, 'Title must be between 3 and 100 characters');
    }

    // Validar priority
    if (priority !== undefined) {
      if (typeof priority !== 'number' || !VALID_PRIORITIES.includes(priority as TaskPriority)) {
        throw new AppError(400, 'Priority must be 1, 2, or 3');
      }
    }

    const createdTask = repository.create({
      title: trimmedTitle,
      priority: priority as TaskPriority | undefined,
    });

    res.status(201).json(createdTask);
  } catch (error) {
    next(error);
  }
});

// PATCH /tasks/:id
tasksRouter.patch('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      throw new AppError(400, 'Invalid task ID');
    }

    const existingTask = repository.findById(id);
    if (!existingTask) {
      throw new AppError(404, 'Task not found');
    }

    const { title, status, priority } = req.body;
    const updates: UpdateTaskDTO = {};

    // Validar que haya al menos un campo para actualizar
    if (title === undefined && status === undefined && priority === undefined) {
      throw new AppError(400, 'At least one field (title, status, priority) must be provided');
    }

    // Validar title
    if (title !== undefined) {
      if (typeof title !== 'string') {
        throw new AppError(400, 'Title must be a string');
      }
      const trimmedTitle = title.trim();
      if (trimmedTitle.length < 3 || trimmedTitle.length > 100) {
        throw new AppError(400, 'Title must be between 3 and 100 characters');
      }
      updates.title = trimmedTitle;
    }

    // Validar status y regla de negocio
    if (status !== undefined) {
      if (typeof status !== 'string' || !VALID_STATUSES.includes(status as TaskStatus)) {
        throw new AppError(400, 'Invalid status. Allowed: todo, doing, done');
      }
      if (existingTask.status === 'done' && status === 'todo') {
        throw new AppError(400, 'A task with status "done" cannot revert to "todo"');
      }
      updates.status = status as TaskStatus;
    }

    // Validar priority
    if (priority !== undefined) {
      if (typeof priority !== 'number' || !VALID_PRIORITIES.includes(priority as TaskPriority)) {
        throw new AppError(400, 'Priority must be 1, 2, or 3');
      }
      updates.priority = priority as TaskPriority;
    }

    const updatedTask = repository.update(id, updates);
    res.status(200).json(updatedTask);
  } catch (error) {
    next(error);
  }
});
