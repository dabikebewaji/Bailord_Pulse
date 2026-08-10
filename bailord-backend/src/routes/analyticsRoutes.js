import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { getDashboardStats, getRetailerPerformance, getProjectStats } from "../controllers/analyticsController.js";

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Dashboard overview stats
router.get('/dashboard', getDashboardStats);

// Retailer performance metrics
router.get('/retailer-performance', getRetailerPerformance);

// Project statistics
router.get('/project-stats', getProjectStats);

export default router;