import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../dev.db');

// Ensure directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', DB_PATH);
    initDatabase();
  }
});

// Helper for SELECT queries returning multiple rows
export const query = <T = any>(sql: string, params: any[] = []): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
};

// Helper for SELECT queries returning single row
export const getOne = <T = any>(sql: string, params: any[] = []): Promise<T | null> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve((row as T) || null);
    });
  });
};

// Helper for INSERT / UPDATE / DELETE
export const run = (sql: string, params: any[] = []): Promise<{ changes: number; lastID: number }> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ changes: this.changes, lastID: this.lastID });
    });
  });
};

// Auto-create tables & seed demo data
const initDatabase = async () => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      completed INTEGER DEFAULT 0,
      priority TEXT DEFAULT 'MEDIUM',
      dueDate TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `;

  try {
    await run(createTableSql);

    // Seed demo data if empty
    const existing = await query('SELECT id FROM todos LIMIT 1');
    if (existing.length === 0) {
      const now = new Date().toISOString();
      const seedTodos = [
        {
          id: uuidv4(),
          title: 'Complete Todo Application',
          description: 'Finish the full-stack todo application using MVC layered architecture.',
          completed: 0,
          priority: 'HIGH',
          dueDate: null,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: uuidv4(),
          title: 'Review Pull Requests',
          description: 'Review pending pull requests on GitHub.',
          completed: 0,
          priority: 'MEDIUM',
          dueDate: null,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: uuidv4(),
          title: 'Buy Groceries',
          description: 'Milk, Eggs, Bread, Vegetables.',
          completed: 1,
          priority: 'LOW',
          dueDate: null,
          createdAt: now,
          updatedAt: now,
        },
      ];

      for (const t of seedTodos) {
        await run(
          `INSERT INTO todos (id, title, description, completed, priority, dueDate, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [t.id, t.title, t.description, t.completed, t.priority, t.dueDate, t.createdAt, t.updatedAt]
        );
      }
      console.log('Database initialized and demo todos seeded successfully.');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};
