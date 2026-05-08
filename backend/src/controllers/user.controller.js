import httpStatus from "http-status";
import { MeetingService } from "../services/meeting.service.js";

// ── Get History ────────────────────────────────────────
const getUserHistory = async (req, res) => {
    try {
        const mappedMeetings = await MeetingService.getUserHistory(req.user._id);
        return res.status(httpStatus.OK).json(mappedMeetings);
    } catch (e) {
        console.error("[getUserHistory]", e);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Could not fetch history" });
    }
};

// ── Add to History ─────────────────────────────────────
const addToHistory = async (req, res) => {
    try {
        await MeetingService.addMeetingToHistory(req.user._id, req.body);
        return res.status(httpStatus.CREATED).json({ message: "Added to history" });
    } catch (e) {
        if (e.message === "MISSING_CODE") {
            return res.status(httpStatus.BAD_REQUEST).json({ message: "Meeting code is required" });
        }
        console.error("[addToHistory]", e);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Could not save meeting" });
    }
};

// ── Get Single Meeting by Code ──────────────────────────
const getMeetingById = async (req, res) => {
    try {
        const meetingObj = await MeetingService.getMeetingByCode(req.user._id, req.params.meetingCode);
        return res.status(httpStatus.OK).json(meetingObj);
    } catch (e) {
        if (e.message === "NOT_FOUND") {
            return res.status(httpStatus.NOT_FOUND).json({ message: "Meeting not found" });
        }
        console.error("[getMeetingById]", e);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Could not fetch meeting" });
    }
};

// ── Delete Single Meeting ──────────────────────────────
const deleteMeeting = async (req, res) => {
    try {
        await MeetingService.deleteSingleMeeting(req.user._id, req.params.id);
        return res.status(httpStatus.OK).json({ message: "Meeting deleted" });
    } catch (e) {
        if (e.message === "NOT_FOUND") {
            return res.status(httpStatus.NOT_FOUND).json({ message: "Meeting not found" });
        }
        console.error("[deleteMeeting]", e);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Could not delete meeting" });
    }
};

// ── Bulk Delete Meetings ────────────────────────────────
const deleteMeetings = async (req, res) => {
    try {
        const count = await MeetingService.deleteMultipleMeetings(req.user._id, req.body.ids);
        return res.status(httpStatus.OK).json({ message: `Deleted ${count} meeting(s)` });
    } catch (e) {
        if (e.message === "BAD_REQUEST") {
            return res.status(httpStatus.BAD_REQUEST).json({ message: "ids array is required" });
        }
        console.error("[deleteMeetings]", e);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Could not delete meetings" });
    }
};

// ── Join Meeting (record participant) ──────────────────
const joinMeeting = async (req, res) => {
    try {
        const { meetingCode, username } = req.body;
        if (!meetingCode || !meetingCode.trim()) {
            return res.status(httpStatus.BAD_REQUEST).json({ message: "meetingCode is required" });
        }
        await MeetingService.joinMeeting(req.user._id, meetingCode, username || "Unknown");
        return res.status(httpStatus.OK).json({ message: "Joined meeting recorded" });
    } catch (e) {
        console.error("[joinMeeting]", e);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Could not record join" });
    }
};

export { getUserHistory, addToHistory, getMeetingById, deleteMeeting, deleteMeetings, joinMeeting };