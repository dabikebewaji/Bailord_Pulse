import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { globalSearch } from "../controllers/searchController.js";

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Global search endpoint
router.get('/', globalSearch);

export default router;