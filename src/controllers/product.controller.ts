import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';
import { createProductSchema, updateProductSchema } from '../schemas/product.schema';
import { ZodError } from 'zod';

export class ProductController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = req.query as any;
      const result = await ProductService.getAllProducts(filters);
      res.status(200).json({
        success: true,
        data: result.products,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const product = await ProductService.getProductById(id);

      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Product not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedBody = createProductSchema.shape.body.parse(req.body);
      const product = await ProductService.createProduct(validatedBody);
      res.status(201).json({
        success: true,
        data: product,
        message: 'Product created successfully',
      });
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

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const validatedBody = updateProductSchema.shape.body.parse(req.body);
      const updated = await ProductService.updateProduct(id, validatedBody);

      if (!updated) {
        res.status(404).json({
          success: false,
          message: 'Product not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Product updated successfully',
      });
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

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const success = await ProductService.deleteProduct(id);

      if (!success) {
        res.status(404).json({
          success: false,
          message: 'Product not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await ProductService.getStats();
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const getAllProducts = ProductController.getAll;
export const getProductById = ProductController.getById;
export const createProduct = ProductController.create;
export const updateProduct = ProductController.update;
export const deleteProduct = ProductController.delete;
export const getProductStats = ProductController.getStats;
