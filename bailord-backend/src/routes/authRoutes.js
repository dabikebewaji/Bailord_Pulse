import express from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  changePassword,
  refreshToken,
  invalidateToken,
  verifyOtp,
  resendOtp,
  createStaffOrAdmin,
} from "../controllers/authController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", loginUser);
router.post("/refresh", refreshToken);
router.post("/invalidate", protect, invalidateToken);
router.get("/profile", protect, getUserProfile);
router.patch("/profile", protect, updateUserProfile);
router.post("/change-password", protect, changePassword);

// Superadmin-only: create admin/staff accounts directly.
router.post("/admin/users", protect, authorize("superadmin"), createStaffOrAdmin);

export default router;
