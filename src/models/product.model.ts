import { query, getOne, run } from '../config/db';

export interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  originalPrice: number;
  category: string;
  stock: number;
  unit: string;
  rating: number;
  reviewsCount: number;
  badge: string | null;
  image: string | null;
  seller: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilterOptions {
  search?: string;
  category?: string;
  stockStatus?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'popular' | 'newest';
  page?: number;
  limit?: number;
}

export class ProductModel {
  static async findAll(options: ProductFilterOptions = {}): Promise<Product[]> {
    const {
      search,
      category,
      stockStatus,
      minPrice,
      maxPrice,
      sortBy = 'popular',
      page = 1,
      limit = 50,
    } = options;

    let sql = 'SELECT * FROM products WHERE 1=1';
    const params: any[] = [];

    if (search) {
      sql += ' AND (title LIKE ? OR description LIKE ? OR category LIKE ? OR seller LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (category && category !== 'सभी श्रेणियाँ') {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (stockStatus === 'IN_STOCK') {
      sql += ' AND stock > 10';
    } else if (stockStatus === 'LOW_STOCK') {
      sql += ' AND stock > 0 AND stock <= 10';
    } else if (stockStatus === 'OUT_OF_STOCK') {
      sql += ' AND stock = 0';
    }

    if (minPrice !== undefined) {
      sql += ' AND price >= ?';
      params.push(minPrice);
    }

    if (maxPrice !== undefined) {
      sql += ' AND price <= ?';
      params.push(maxPrice);
    }

    // Sorting
    if (sortBy === 'price_asc') {
      sql += ' ORDER BY price ASC';
    } else if (sortBy === 'price_desc') {
      sql += ' ORDER BY price DESC';
    } else if (sortBy === 'rating') {
      sql += ' ORDER BY rating DESC';
    } else if (sortBy === 'newest') {
      sql += ' ORDER BY createdAt DESC';
    } else {
      sql += ' ORDER BY reviewsCount DESC, rating DESC';
    }

    // Pagination
    const offset = (page - 1) * limit;
    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return query<Product>(sql, params);
  }

  static async count(options: ProductFilterOptions = {}): Promise<number> {
    const { search, category, stockStatus, minPrice, maxPrice } = options;

    let sql = 'SELECT COUNT(*) as count FROM products WHERE 1=1';
    const params: any[] = [];

    if (search) {
      sql += ' AND (title LIKE ? OR description LIKE ? OR category LIKE ? OR seller LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (category && category !== 'सभी श्रेणियाँ') {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (stockStatus === 'IN_STOCK') {
      sql += ' AND stock > 10';
    } else if (stockStatus === 'LOW_STOCK') {
      sql += ' AND stock > 0 AND stock <= 10';
    } else if (stockStatus === 'OUT_OF_STOCK') {
      sql += ' AND stock = 0';
    }

    if (minPrice !== undefined) {
      sql += ' AND price >= ?';
      params.push(minPrice);
    }

    if (maxPrice !== undefined) {
      sql += ' AND price <= ?';
      params.push(maxPrice);
    }

    const res = await getOne<{ count: number }>(sql, params);
    return res ? res.count : 0;
  }

  static async findById(id: string): Promise<Product | null> {
    return getOne<Product>('SELECT * FROM products WHERE id = ?', [id]);
  }

  static async create(data: Omit<Product, 'createdAt' | 'updatedAt'>): Promise<Product> {
    const now = new Date().toISOString();
    const sql = `
      INSERT INTO products (id, title, description, price, originalPrice, category, stock, unit, rating, reviewsCount, badge, image, seller, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await run(sql, [
      data.id,
      data.title,
      data.description || null,
      data.price,
      data.originalPrice,
      data.category,
      data.stock,
      data.unit,
      data.rating || 5.0,
      data.reviewsCount || 0,
      data.badge || null,
      data.image || null,
      data.seller || null,
      now,
      now,
    ]);

    return (await this.findById(data.id))!;
  }

  static async update(id: string, data: Partial<Product>): Promise<Product | null> {
    const product = await this.findById(id);
    if (!product) return null;

    const now = new Date().toISOString();
    const fields: string[] = [];
    const params: any[] = [];

    const updateableKeys: (keyof Product)[] = [
      'title',
      'description',
      'price',
      'originalPrice',
      'category',
      'stock',
      'unit',
      'rating',
      'reviewsCount',
      'badge',
      'image',
      'seller',
    ];

    for (const key of updateableKeys) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(data[key]);
      }
    }

    if (fields.length === 0) return product;

    fields.push('updatedAt = ?');
    params.push(now);
    params.push(id);

    await run(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  }

  static async delete(id: string): Promise<boolean> {
    const res = await run('DELETE FROM products WHERE id = ?', [id]);
    return res.changes > 0;
  }

  static async getStats(): Promise<{
    totalProducts: number;
    totalValue: number;
    lowStockCount: number;
    categoriesCount: number;
  }> {
    const all = await query<Product>('SELECT price, stock, category FROM products');
    const totalProducts = all.length;
    const totalValue = all.reduce((sum, p) => sum + p.price * p.stock, 0);
    const lowStockCount = all.filter((p) => p.stock <= 10).length;
    const categoriesCount = new Set(all.map((p) => p.category)).size;

    return { totalProducts, totalValue, lowStockCount, categoriesCount };
  }
}
