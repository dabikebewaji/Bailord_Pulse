import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createRetailer,
  getAllRetailers,
  getRetailerProfile,
  updateRetailer,
  deleteRetailer,
  updateRetailerMetrics
} from "../controllers/retailerController.js";

const router = express.Router();

// Apply protection to all routes
router.use(protect);

router
  .route('/')
  .get(getAllRetailers)
  .post(createRetailer);

router
  .route('/:id')
  .get(getRetailerProfile)
  .patch(updateRetailer)
  .delete(deleteRetailer);

router.patch('/:id/metrics', updateRetailerMetrics);

export default router;
