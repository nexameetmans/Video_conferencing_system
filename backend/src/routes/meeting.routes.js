import { Router } from "express";
import { summarizeMeeting } from "../controllers/meeting.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = Router();

// POST /api/summarize-meeting
// Body: { meetingCode }
// Fetches transcript from DB → generates AI summary via Gemini → saves to meetings collection
// Auth middleware ensures user_id is attached to the meeting doc
router.post("/summarize-meeting", authMiddleware, summarizeMeeting);

export default router;
