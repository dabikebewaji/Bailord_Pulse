import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
	createProject,
	getProjects,
	updateProject,
	deleteProject,
	assignRetailers,
	removeRetailer,
	getAssignedRetailers,
} from "../controllers/projectController.js";

const router = express.Router();

// Public route
router.get("/", getProjects);

// Protected route (requires login)
router.post("/", protect, createProject);
// Protected routes (requires login)
router.put("/:id", protect, updateProject);
router.delete("/:id", protect, deleteProject);
router.post("/:id/retailers", protect, assignRetailers);
router.delete("/:projectId/retailers/:retailerId", protect, removeRetailer);
router.get("/:id/retailers", protect, getAssignedRetailers);

export default router; // ✅ THIS IS VERY IMPORTANT
