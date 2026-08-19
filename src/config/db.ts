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
  const createTodosSql = `
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

  const createProductsSql = `
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL DEFAULT 0,
      originalPrice REAL NOT NULL DEFAULT 0,
      category TEXT NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT '1 Unit',
      rating REAL DEFAULT 5.0,
      reviewsCount INTEGER DEFAULT 0,
      badge TEXT,
      image TEXT,
      seller TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `;

  try {
    await run(createTodosSql);
    await run(createProductsSql);

    // Seed demo products if empty
    const existingProducts = await query('SELECT id FROM products LIMIT 1');
    if (existingProducts.length === 0) {
      const now = new Date().toISOString();
      const seedProducts = [
        {
          id: uuidv4(),
          title: 'शुद्ध A2 देशी गिर गाय का बिलोना घी (1 लीटर)',
          description: 'पारंपरिक वैदिक बिलोना पद्धति से बना 100% शुद्ध और औषधीय गुणों से भरपूर A2 गाय का घी।',
          price: 1450,
          originalPrice: 1800,
          category: 'डेयरी व घी',
          stock: 24,
          unit: '1 लीटर काँच का जार',
          rating: 4.9,
          reviewsCount: 88,
          badge: 'बेस्टसेलर ★',
          image: 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=600&auto=format&fit=crop&q=80',
          seller: 'रामेश्वर जैविक गोशाला, सूर्यपुरा',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: uuidv4(),
          title: 'कच्ची घानी शुद्ध जैविक सरसों तेल (1 लीटर)',
          description: 'सूर्यपुरा के खेतों में उगाई गई पीली सरसों से लकड़ी के कोल्हू द्वारा निकाला गया ताज़ा तेल।',
          price: 210,
          originalPrice: 260,
          category: 'जैविक खाद्य तेल',
          stock: 45,
          unit: '1 लीटर बोतल',
          rating: 4.8,
          reviewsCount: 64,
          badge: '100% जैविक',
          image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80',
          seller: 'सूर्यपुरा किसान उत्पादक संगठन (FPO)',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: uuidv4(),
          title: 'हाथ से बुनी पारंपरिक खादी शॉल व स्टोल',
          description: 'गाँव की महिला बुनकरों द्वारा चरखे पर सूत कातकर बुनी गई आरामदायक और सुरुचिपूर्ण शॉल।',
          price: 890,
          originalPrice: 1250,
          category: 'हस्तशिल्प व खादी',
          stock: 12,
          unit: '1 पीस (2.2 मीटर)',
          rating: 5.0,
          reviewsCount: 42,
          badge: 'हस्तनिर्मित',
          image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
          seller: 'माँ दुर्गा महिला स्वयं सहायता समूह',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: uuidv4(),
          title: 'शुद्ध अरावली वन तुलसी शहद (500 ग्राम)',
          description: 'प्राकृतिक जंगलों से निकाला गया असंसाधित कच्चा शहद। इम्युनिटी बढ़ाने में सर्वोत्तम।',
          price: 399,
          originalPrice: 520,
          category: 'आयुर्वेदिक व शहद',
          stock: 30,
          unit: '500 ग्राम जार',
          rating: 4.9,
          reviewsCount: 51,
          badge: 'प्राकृतिक',
          image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80',
          seller: 'सूर्यपुरा मधुमक्खी पालन संघ',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: uuidv4(),
          title: 'पारंपरिक हस्तनिर्मित मिट्टी के चाय कुल्हड़ (सेट ऑफ़ 6)',
          description: 'गाँव के कुम्हारों द्वारा प्राकृतिक चिकनी मिट्टी से गढ़े गए व पके हुए पर्यावरण-अनुकूल कुल्हड़।',
          price: 249,
          originalPrice: 350,
          category: 'हस्तशिल्प व कुम्हारी',
          stock: 18,
          unit: '6 पीस का सेट',
          rating: 4.7,
          reviewsCount: 39,
          badge: 'इको-फ्रेंडली',
          image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600&auto=format&fit=crop&q=80',
          seller: 'प्रजापति कुम्हार शिल्प केंद्र',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: uuidv4(),
          title: 'जैविक साबुत सेलम हल्दी गांठ (1 किग्रा)',
          description: 'उच्च करक्यूमिन (Curcumin 5%+) युक्त प्राकृतिक धूप में सुखाई गई शुद्ध साबुत हल्दी।',
          price: 280,
          originalPrice: 360,
          category: 'देशी मसाले व अनाज',
          stock: 50,
          unit: '1 किग्रा थैला',
          rating: 4.9,
          reviewsCount: 73,
          badge: 'हाई करक्यूमिन',
          image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80',
          seller: 'बलदेव जैविक फार्म, सूर्यपुरा',
          createdAt: now,
          updatedAt: now,
        },
      ];

      for (const p of seedProducts) {
        await run(
          `INSERT INTO products (id, title, description, price, originalPrice, category, stock, unit, rating, reviewsCount, badge, image, seller, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            p.id,
            p.title,
            p.description,
            p.price,
            p.originalPrice,
            p.category,
            p.stock,
            p.unit,
            p.rating,
            p.reviewsCount,
            p.badge,
            p.image,
            p.seller,
            p.createdAt,
            p.updatedAt,
          ]
        );
      }
      console.log('Database initialized and demo products seeded successfully.');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};
