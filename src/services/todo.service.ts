import { v4 as uuidv4 } from 'uuid';
import { TodoModel, Todo } from '../models/todo.model';
import { CreateTodoInput, UpdateTodoInput } from '../schemas/todo.schema';

export interface GetTodosQuery {
  search?: string;
  completed?: string;
  priority?: string;
  sort?: string;
  page?: string;
  limit?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class TodoService {
  static async getAllTodos(query: GetTodosQuery): Promise<PaginatedResult<Todo>> {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(query.limit || '10', 10)));
    const skip = (page - 1) * limit;

    let completedBool: boolean | undefined = undefined;
    if (query.completed === 'true') completedBool = true;
    if (query.completed === 'false') completedBool = false;

    const priorityVal =
      query.priority && ['LOW', 'MEDIUM', 'HIGH'].includes(query.priority.toUpperCase())
        ? (query.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH')
        : undefined;

    const filterOptions = {
      search: query.search?.trim(),
      completed: completedBool,
      priority: priorityVal,
    };

    const [todos, total] = await Promise.all([
      TodoModel.findAll({
        ...filterOptions,
        sort: query.sort,
        skip,
        limit,
      }),
      TodoModel.count(filterOptions),
    ]);

    return {
      data: todos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async getTodoById(id: string): Promise<Todo | null> {
    return TodoModel.findById(id);
  }

  static async createTodo(input: CreateTodoInput): Promise<Todo> {
    const now = new Date().toISOString();
    return TodoModel.create({
      id: uuidv4(),
      title: input.title.trim(),
      description: input.description?.trim() || null,
      priority: (input.priority as 'LOW' | 'MEDIUM' | 'HIGH') || 'MEDIUM',
      dueDate: input.dueDate || null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static async updateTodo(id: string, input: UpdateTodoInput): Promise<Todo | null> {
    const existing = await TodoModel.findById(id);
    if (!existing) return null;

    return TodoModel.update(id, {
      title: input.title !== undefined ? input.title.trim() : undefined,
      description: input.description !== undefined ? (input.description?.trim() || null) : undefined,
      priority: input.priority,
      dueDate: input.dueDate !== undefined ? input.dueDate : undefined,
      completed: input.completed,
      updatedAt: new Date().toISOString(),
    });
  }

  static async toggleTodo(id: string): Promise<Todo | null> {
    const existing = await TodoModel.findById(id);
    if (!existing) return null;

    return TodoModel.update(id, {
      completed: !existing.completed,
      updatedAt: new Date().toISOString(),
    });
  }

  static async deleteTodo(id: string): Promise<boolean> {
    return TodoModel.delete(id);
  }
}
