import { Request, Response, NextFunction } from 'express';
import { TodoService } from '../services/todo.service';
import { createTodoSchema, updateTodoSchema } from '../schemas/todo.schema';
import { ZodError } from 'zod';

export class TodoController {
  static async getTodos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await TodoService.getAllTodos(req.query);
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTodoById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const todo = await TodoService.getTodoById(id);

      if (!todo) {
        res.status(404).json({ success: false, message: 'Todo not found' });
        return;
      }

      res.status(200).json({ success: true, data: todo });
    } catch (error) {
      next(error);
    }
  }

  static async createTodo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = createTodoSchema.parse(req.body);
      const todo = await TodoService.createTodo(validatedData);

      res.status(201).json({ success: true, data: todo });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: error.issues[0]?.message || 'Invalid input',
          errors: error.issues,
        });
        return;
      }
      next(error);
    }
  }

  static async updateTodo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const validatedData = updateTodoSchema.parse(req.body);
      const todo = await TodoService.updateTodo(id, validatedData);

      if (!todo) {
        res.status(404).json({ success: false, message: 'Todo not found' });
        return;
      }

      res.status(200).json({ success: true, data: todo });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: error.issues[0]?.message || 'Invalid input',
          errors: error.issues,
        });
        return;
      }
      next(error);
    }
  }

  static async toggleTodo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const todo = await TodoService.toggleTodo(id);

      if (!todo) {
        res.status(404).json({ success: false, message: 'Todo not found' });
        return;
      }

      res.status(200).json({ success: true, data: todo });
    } catch (error) {
      next(error);
    }
  }

  static async deleteTodo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const deleted = await TodoService.deleteTodo(id);

      if (!deleted) {
        res.status(404).json({ success: false, message: 'Todo not found' });
        return;
      }

      res.status(200).json({ success: true, message: 'Todo deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

// Export individual functions for direct route usage if needed
export const getTodos = TodoController.getTodos;
export const getTodoById = TodoController.getTodoById;
export const createTodo = TodoController.createTodo;
export const updateTodo = TodoController.updateTodo;
export const toggleTodo = TodoController.toggleTodo;
export const deleteTodo = TodoController.deleteTodo;
