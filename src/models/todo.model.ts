import { query, getOne, run } from '../config/db';

export interface TodoRow {
  id: string;
  title: string;
  description: string | null;
  completed: number; // 0 or 1 in SQLite
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Todo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

// Convert SQLite row (completed as 0/1) to Todo domain model (completed as boolean)
export const mapRowToTodo = (row: TodoRow): Todo => ({
  id: row.id,
  title: row.title,
  description: row.description,
  completed: Boolean(row.completed),
  priority: row.priority,
  dueDate: row.dueDate,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export interface FindTodosOptions {
  search?: string;
  completed?: boolean;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  sort?: string;
  skip?: number;
  limit?: number;
}

export class TodoModel {
  static async findAll(options: FindTodosOptions = {}): Promise<Todo[]> {
    const { search, completed, priority, sort, skip = 0, limit = 10 } = options;
    const conditions: string[] = [];
    const params: any[] = [];

    if (search) {
      conditions.push('(title LIKE ? OR description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (completed !== undefined) {
      conditions.push('completed = ?');
      params.push(completed ? 1 : 0);
    }

    if (priority) {
      conditions.push('priority = ?');
      params.push(priority);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let orderByClause = 'ORDER BY datetime(createdAt) DESC';
    if (sort === 'dueDate') {
      orderByClause = 'ORDER BY datetime(dueDate) ASC';
    } else if (sort === 'priority') {
      orderByClause = `ORDER BY CASE priority
        WHEN 'HIGH' THEN 1
        WHEN 'MEDIUM' THEN 2
        WHEN 'LOW' THEN 3
        ELSE 4 END ASC`;
    }

    const sql = `
      SELECT * FROM todos
      ${whereClause}
      ${orderByClause}
      LIMIT ? OFFSET ?
    `;
    params.push(limit, skip);

    const rows = await query<TodoRow>(sql, params);
    return rows.map(mapRowToTodo);
  }

  static async count(options: Omit<FindTodosOptions, 'skip' | 'limit' | 'sort'> = {}): Promise<number> {
    const { search, completed, priority } = options;
    const conditions: string[] = [];
    const params: any[] = [];

    if (search) {
      conditions.push('(title LIKE ? OR description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (completed !== undefined) {
      conditions.push('completed = ?');
      params.push(completed ? 1 : 0);
    }

    if (priority) {
      conditions.push('priority = ?');
      params.push(priority);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT COUNT(*) as total FROM todos ${whereClause}`;

    const result = await getOne<{ total: number }>(sql, params);
    return result ? result.total : 0;
  }

  static async findById(id: string): Promise<Todo | null> {
    const row = await getOne<TodoRow>('SELECT * FROM todos WHERE id = ?', [id]);
    return row ? mapRowToTodo(row) : null;
  }

  static async create(data: {
    id: string;
    title: string;
    description?: string | null;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    dueDate?: string | null;
    createdAt: string;
    updatedAt: string;
  }): Promise<Todo> {
    const { id, title, description = null, priority = 'MEDIUM', dueDate = null, createdAt, updatedAt } = data;
    await run(
      `INSERT INTO todos (id, title, description, completed, priority, dueDate, createdAt, updatedAt)
       VALUES (?, ?, ?, 0, ?, ?, ?, ?)`,
      [id, title, description, priority, dueDate, createdAt, updatedAt]
    );

    const created = await this.findById(id);
    if (!created) throw new Error('Failed to retrieve newly created todo');
    return created;
  }

  static async update(
    id: string,
    data: Partial<{
      title: string;
      description: string | null;
      priority: 'LOW' | 'MEDIUM' | 'HIGH';
      dueDate: string | null;
      completed: boolean;
      updatedAt: string;
    }>
  ): Promise<Todo | null> {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.title !== undefined) {
      updates.push('title = ?');
      params.push(data.title);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description);
    }
    if (data.priority !== undefined) {
      updates.push('priority = ?');
      params.push(data.priority);
    }
    if (data.dueDate !== undefined) {
      updates.push('dueDate = ?');
      params.push(data.dueDate);
    }
    if (data.completed !== undefined) {
      updates.push('completed = ?');
      params.push(data.completed ? 1 : 0);
    }

    const updatedAt = data.updatedAt || new Date().toISOString();
    updates.push('updatedAt = ?');
    params.push(updatedAt);

    params.push(id);

    const sql = `UPDATE todos SET ${updates.join(', ')} WHERE id = ?`;
    const result = await run(sql, params);

    if (result.changes === 0) return null;
    return this.findById(id);
  }

  static async delete(id: string): Promise<boolean> {
    const result = await run('DELETE FROM todos WHERE id = ?', [id]);
    return result.changes > 0;
  }
}
