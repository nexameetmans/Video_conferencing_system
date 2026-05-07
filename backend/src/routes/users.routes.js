import { Router } from "express";
import { addToHistory, getUserHistory, getMeetingById, deleteMeeting, deleteMeetings } from "../controllers/user.controller.js";
import { getProfile, updateProfile, changePassword, logoutDevice, logoutAll } from "../controllers/profile.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = Router();

// ── Protected Routes (require JWT) ─────────────────────
// Meeting History
router.post("/add_to_activity",   authMiddleware, addToHistory);
router.get("/get_all_activity",   authMiddleware, getUserHistory);
router.post("/meeting/delete",    authMiddleware, deleteMeetings);
router.get("/meeting/:meetingCode", authMiddleware, getMeetingById);
router.delete("/meeting/:id",     authMiddleware, deleteMeeting);

// Profile & Security
router.get("/profile",            authMiddleware, getProfile);
router.put("/update",             authMiddleware, updateProfile);
router.put("/change-password",    authMiddleware, changePassword);
router.post("/logout-all",        authMiddleware, logoutAll);
router.delete("/logout-session/:sessionId", authMiddleware, logoutDevice);

export default router;