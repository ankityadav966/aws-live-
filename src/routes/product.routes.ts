import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats,
} from '../controllers/product.controller';

const router = Router();

// Stats endpoint
router.get('/stats', getProductStats);

// Main collection endpoints
router.route('/')
  .get(getAllProducts)
  .post(createProduct);

// Item specific endpoints
router.route('/:id')
  .get(getProductById)
  .put(updateProduct)
  .delete(deleteProduct);

export default router;
