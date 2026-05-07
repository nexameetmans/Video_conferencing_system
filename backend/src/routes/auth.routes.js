import { Router } from "express";
import rateLimit from "express-rate-limit";
import { sendOTP, verifyOTP, register, login, forgotPasswordSendOTP, forgotPasswordVerifyOTP, resetPassword } from "../controllers/auth.controller.js";

// ── Rate limiters ──────────────────────────────────────
// Tight limiter for OTP endpoint to prevent abuse / email spamming
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === "production" ? 5 : 1000,
    message: { message: "Too many OTP requests. Please wait 15 minutes and try again." },
    standardHeaders: true,
    legacyHeaders: false,
});

// General auth limiter for login / register
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === "production" ? 20 : 1000,
    message: { message: "Too many attempts. Please try again after 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
});

const router = Router();

// ── Auth Routes ────────────────────────────────────────
// POST /api/auth/send-otp    — Step 1: send OTP to email (registration)
// POST /api/auth/verify-otp  — Step 2: verify OTP (registration)
// POST /api/auth/register    — Step 3: complete registration
// POST /api/auth/login       — Login with email + password
// POST /api/auth/forgot-password/send-otp  — Send OTP for password reset
// POST /api/auth/forgot-password/verify-otp — Verify OTP for password reset
// POST /api/auth/reset-password — Reset password with new password

router.post("/send-otp",   otpLimiter,  sendOTP);
router.post("/verify-otp", otpLimiter,  verifyOTP);
router.post("/register",   authLimiter, register);
router.post("/login",      authLimiter, login);
router.post("/forgot-password/send-otp", otpLimiter, forgotPasswordSendOTP);
router.post("/forgot-password/verify-otp", otpLimiter, forgotPasswordVerifyOTP);
router.post("/reset-password", authLimiter, resetPassword);

export default router;
