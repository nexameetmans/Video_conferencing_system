import httpStatus from "http-status";
import bcrypt from "bcrypt";
import { User } from "../models/user.model.js";

// ── GET /api/user/profile ──────────────────────────────
export const getProfile = async (req, res) => {
    try {
        // req.user is already populated by authMiddleware
        const user = req.user;
        return res.status(httpStatus.OK).json({
            id: user._id,
            name: user.name,
            email: user.email,
            profilePic: user.profilePic,
            isVerified: user.isVerified,
            sessions: user.sessions // might be useful to return all active sessions
        });
    } catch (err) {
        console.error("[getProfile]", err);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Failed to fetch profile" });
    }
};

// ── PUT /api/user/update ───────────────────────────────
export const updateProfile = async (req, res) => {
    try {
        const { name, profilePic } = req.body;
        const user = req.user;

        if (name) user.name = name.trim();
        if (profilePic !== undefined) user.profilePic = profilePic;

        await user.save();
        
        return res.status(httpStatus.OK).json({
            message: "Profile updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profilePic: user.profilePic,
            }
        });
    } catch (err) {
        console.error("[updateProfile]", err);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Failed to update profile" });
    }
};

// ── PUT /api/user/change-password ──────────────────────
export const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = req.user;

        if (!oldPassword || !newPassword) {
            return res.status(httpStatus.BAD_REQUEST).json({ message: "Old and new passwords are required" });
        }

        const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
        if (!isPasswordCorrect) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Incorrect old password" });
        }

        if (newPassword.length < 8) {
            return res.status(httpStatus.BAD_REQUEST).json({ message: "New password must be at least 8 characters" });
        }

        const strongPassRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!strongPassRegex.test(newPassword)) {
            return res.status(httpStatus.BAD_REQUEST).json({ message: "New password must contain at least one uppercase letter and one number" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        user.password = hashedPassword;
        await user.save();

        return res.status(httpStatus.OK).json({ message: "Password updated successfully" });
    } catch (err) {
        console.error("[changePassword]", err);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Failed to change password" });
    }
};

// ── DELETE /api/user/logout-session/:sessionId ─────────
export const logoutDevice = async (req, res) => {
    try {
        const { sessionId } = req.params; // this is the token id
        const user = req.user;

        user.sessions = user.sessions.filter(s => s._id.toString() !== sessionId && s.token !== sessionId);
        await user.save();

        return res.status(httpStatus.OK).json({ message: "Device logged out successfully" });
    } catch (err) {
        console.error("[logoutDevice]", err);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Failed to logout device" });
    }
};

// ── POST /api/user/logout-all ──────────────────────────
export const logoutAll = async (req, res) => {
    try {
        const user = req.user;
        const currentToken = req.token;

        // Optionally, we can keep the current session but task says "from all devices".
        // Usually, logging out of all logs out the current one too or keeps the current one.
        // Let's clear all. 
        user.sessions = [];
        await user.save();

        return res.status(httpStatus.OK).json({ message: "Logged out from all devices" });
    } catch (err) {
        console.error("[logoutAll]", err);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Failed to logout all devices" });
    }
};
