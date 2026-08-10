import express from "express";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import {
  placeMyOrder,
  getMyOrders,
  getAllOrders,
  getOrder,
  updateOrderStatus,
} from "../controllers/orderController.js";

const router = express.Router();

router.use(protect);

// Self-scoped: any authenticated role can place/view their own orders.
router.route('/mine').get(getMyOrders);
router.post('/', placeMyOrder);

router.get('/', authorize('admin', 'staff', 'superadmin'), getAllOrders);
router.patch('/:id/status', authorize('admin', 'staff', 'superadmin'), updateOrderStatus);

// Ownership-checked in the controller (admin/staff always allowed, a
// retailer only for their own order) — same split as /retailers/me vs /retailers/:id.
router.get('/:id', getOrder);

export default router;
