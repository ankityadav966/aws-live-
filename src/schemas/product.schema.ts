import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Product title is required (min 2 chars)').max(255),
    description: z.string().optional().nullable(),
    price: z.number().min(0, 'Price must be greater than or equal to 0'),
    originalPrice: z.number().min(0).optional().default(0),
    category: z.string().min(1, 'Category is required'),
    stock: z.number().int().min(0, 'Stock must be 0 or more').default(0),
    unit: z.string().optional().default('1 Unit'),
    rating: z.number().min(1).max(5).optional().default(5.0),
    badge: z.string().optional().nullable(),
    image: z.string().optional().nullable(),
    seller: z.string().optional().nullable(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Product ID is required'),
  }),
  body: z.object({
    title: z.string().min(2).max(255).optional(),
    description: z.string().optional().nullable(),
    price: z.number().min(0).optional(),
    originalPrice: z.number().min(0).optional(),
    category: z.string().min(1).optional(),
    stock: z.number().int().min(0).optional(),
    unit: z.string().optional(),
    rating: z.number().min(1).max(5).optional(),
    reviewsCount: z.number().int().min(0).optional(),
    badge: z.string().optional().nullable(),
    image: z.string().optional().nullable(),
    seller: z.string().optional().nullable(),
  }),
});

export const getProductSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Product ID is required'),
  }),
});

export const queryProductSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    stockStatus: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK']).optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    sortBy: z.enum(['price_asc', 'price_desc', 'rating', 'popular', 'newest']).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>['body'];
export type UpdateProductInput = z.infer<typeof updateProductSchema>['body'];
