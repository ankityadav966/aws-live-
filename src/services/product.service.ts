import { v4 as uuidv4 } from 'uuid';
import { ProductModel, Product, ProductFilterOptions } from '../models/product.model';
import { CreateProductInput, UpdateProductInput } from '../schemas/product.schema';

export class ProductService {
  static async getAllProducts(filters: ProductFilterOptions = {}) {
    const page = filters.page ? Number(filters.page) : 1;
    const limit = filters.limit ? Number(filters.limit) : 50;

    const [products, total] = await Promise.all([
      ProductModel.findAll({ ...filters, page, limit }),
      ProductModel.count(filters),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getProductById(id: string): Promise<Product | null> {
    return ProductModel.findById(id);
  }

  static async createProduct(data: CreateProductInput): Promise<Product> {
    const newProduct = {
      id: uuidv4(),
      title: data.title,
      description: data.description || null,
      price: data.price,
      originalPrice: data.originalPrice || data.price,
      category: data.category,
      stock: data.stock !== undefined ? data.stock : 0,
      unit: data.unit || '1 Unit',
      rating: data.rating || 5.0,
      reviewsCount: 1,
      badge: data.badge || null,
      image: data.image || null,
      seller: data.seller || null,
    };

    return ProductModel.create(newProduct);
  }

  static async updateProduct(id: string, data: UpdateProductInput): Promise<Product | null> {
    return ProductModel.update(id, data);
  }

  static async deleteProduct(id: string): Promise<boolean> {
    return ProductModel.delete(id);
  }

  static async getStats() {
    return ProductModel.getStats();
  }
}
