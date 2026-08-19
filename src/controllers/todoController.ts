import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z, ZodError } from 'zod';
import { Prisma } from '@prisma/client';

const todoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  dueDate: z.string().datetime().optional().nullable(),
});

export const getTodos = async (req: Request, res: Response): Promise<void> => {
  try {
    const search = req.query.search as string | undefined;
    const completed = req.query.completed as string | undefined;
    const priority = req.query.priority as string | undefined;
    const sort = req.query.sort as string | undefined;
    const page = (req.query.page as string) || '1';
    const limit = (req.query.limit as string) || '10';

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const where: Prisma.TodoWhereInput = {};

    if (search) {
      where.title = { contains: search };
    }
    if (completed !== undefined) {
      where.completed = completed === 'true';
    }
    if (priority) {
      where.priority = priority as 'LOW' | 'MEDIUM' | 'HIGH';
    }

    let orderBy: Prisma.TodoOrderByWithRelationInput = { createdAt: 'desc' };
    if (sort === 'dueDate') {
      orderBy = { dueDate: 'asc' };
    } else if (sort === 'priority') {
      orderBy = { priority: 'desc' };
    }

    const [todos, total] = await Promise.all([
      prisma.todo.findMany({
        where,
        orderBy,
        skip,
        take: limitNumber,
      }),
      prisma.todo.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: todos,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const getTodoById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const todo = await prisma.todo.findUnique({ where: { id } });

    if (!todo) {
      res.status(404).json({ success: false, message: 'Todo not found' });
      return;
    }

    res.status(200).json({ success: true, data: todo });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const createTodo = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = todoSchema.parse(req.body);

    const todo = await prisma.todo.create({
      data,
    });

    res.status(201).json({ success: true, data: todo });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ success: false, message: error.issues[0].message });
      return;
    }
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const updateTodo = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const data = todoSchema.parse(req.body);

    const existingTodo = await prisma.todo.findUnique({ where: { id } });
    if (!existingTodo) {
      res.status(404).json({ success: false, message: 'Todo not found' });
      return;
    }

    const todo = await prisma.todo.update({
      where: { id },
      data,
    });

    res.status(200).json({ success: true, data: todo });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ success: false, message: error.issues[0].message });
      return;
    }
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const toggleTodo = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existingTodo = await prisma.todo.findUnique({ where: { id } });
    if (!existingTodo) {
      res.status(404).json({ success: false, message: 'Todo not found' });
      return;
    }

    const todo = await prisma.todo.update({
      where: { id },
      data: { completed: !existingTodo.completed },
    });

    res.status(200).json({ success: true, data: todo });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const deleteTodo = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existingTodo = await prisma.todo.findUnique({ where: { id } });
    if (!existingTodo) {
      res.status(404).json({ success: false, message: 'Todo not found' });
      return;
    }

    await prisma.todo.delete({ where: { id } });

    res.status(200).json({ success: true, message: 'Todo deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
