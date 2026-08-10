import express from "express";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import {
	createProject,
	getProjects,
	getMyProjects,
	updateProject,
	deleteProject,
	assignRetailers,
	removeRetailer,
	getAssignedRetailers,
} from "../controllers/projectController.js";

const router = express.Router();

// Was previously public (no auth at all) and unfiltered. Now requires login
// and is admin/staff/superadmin-only — a retailer's own view is /mine below.
router.get("/", protect, authorize("admin", "staff", "superadmin"), getProjects);

// Any authenticated role — scoped to the caller's own linked retailer
// record. Placed before /:id-shaped routes so "mine" is never matched as an id.
router.get("/mine", protect, getMyProjects);

// Protected routes (requires login)
router.post("/", protect, createProject);
router.put("/:id", protect, updateProject);
router.delete("/:id", protect, authorize("admin", "superadmin"), deleteProject);
router.post("/:id/retailers", protect, assignRetailers);
router.delete("/:projectId/retailers/:retailerId", protect, removeRetailer);
router.get("/:id/retailers", protect, getAssignedRetailers);

export default router; // ✅ THIS IS VERY IMPORTANT
