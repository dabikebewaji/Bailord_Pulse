import express from "express";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";

const router = express.Router();

router.use(protect);

// Browsing the catalog is open to any authenticated role — retailers need
// this to place orders.
router
  .route('/')
  .get(getAllProducts)
  .post(authorize('admin', 'staff', 'superadmin'), createProduct);

router
  .route('/:id')
  .get(getProduct)
  .patch(authorize('admin', 'staff', 'superadmin'), updateProduct)
  .delete(authorize('admin', 'staff', 'superadmin'), deleteProduct);

export default router;
