import express from "express";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import {
  createRetailer,
  getAllRetailers,
  getRetailerProfile,
  getMyRetailerProfile,
  updateRetailer,
  updateMyRetailerProfile,
  deleteRetailer,
  updateRetailerMetrics
} from "../controllers/retailerController.js";

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Self-service routes — any authenticated role, scoped to the caller's own
// linked business record. Must come before /:id or Express would match
// "me" as an id param.
router
  .route('/me')
  .get(getMyRetailerProfile)
  .patch(updateMyRetailerProfile);

// Everything below manages OTHER retailers' records — staff/admin/superadmin
// only. Previously any authenticated role (including retailers themselves)
// could browse every retailer's profile, bank details included.
router.use(authorize('admin', 'staff', 'superadmin'));

router
  .route('/')
  .get(getAllRetailers)
  .post(createRetailer);

router
  .route('/:id')
  .get(getRetailerProfile)
  .patch(updateRetailer)
  .delete(authorize('admin', 'superadmin'), deleteRetailer);

router.patch('/:id/metrics', updateRetailerMetrics);

export default router;
