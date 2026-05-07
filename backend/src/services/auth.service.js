import bcrypt from "bcrypt";
import { User } from "../models/user.model.js";
import { OtpModel } from "../models/otp.model.js";
import { generateToken } from "../utils/jwt.js";
import { sendOTPEmail } from "../utils/email.js";

// ── Helpers ────────────────────────────────────────────
export const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

/** Generate a random 6-digit OTP string */
const generateOTP = () =>
    Math.floor(100000 + Math.random() * 900000).toString();

/** OTP lifetime — 5 minutes */
const OTP_TTL_MS = 5 * 60 * 1000;

export const AuthService = {
    // ── Step 1: /send-otp ─────────────────────────────
    async sendOTP(email) {
        const normalizedEmail = email.trim().toLowerCase();

        // Reject if a fully-registered account already exists
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            throw new Error("ACCOUNT_EXISTS");
        }

        const otp       = generateOTP();
        const expiresAt = new Date(Date.now() + OTP_TTL_MS);

        // $set is critical here — a plain object update acts as a REPLACEMENT
        // and strips the `email` field from the document on subsequent upserts.
        await OtpModel.findOneAndUpdate(
            { email: normalizedEmail },
            { $set: { otp, verified: false, expiresAt } },
            { upsert: true, new: true }
        );

        console.log(`[sendOTP] OTP saved to DB for ${normalizedEmail}`);
        await sendOTPEmail(normalizedEmail, otp);
        return normalizedEmail;
    },

    // ── Step 2: /verify-otp ───────────────────────────
    async verifyOTP(email, otp) {
        const normalizedEmail = email.trim().toLowerCase();

        // Look up the existing OTP record — do NOT create one here
        const entry = await OtpModel.findOne({ email: normalizedEmail });

        if (!entry) {
            throw new Error("NOT_FOUND");
        }

        // Eagerly check expiry — MongoDB TTL reaper can lag up to 60 s
        if (new Date() > entry.expiresAt) {
            await OtpModel.deleteOne({ email: normalizedEmail });
            throw new Error("EXPIRED_OTP");
        }

        const submittedOtp = String(otp).trim(); // guard against number type
        console.log(`[verifyOTP] stored="${entry.otp}" submitted="${submittedOtp}" match=${entry.otp === submittedOtp}`);

        if (entry.otp !== submittedOtp) {
            throw new Error("INVALID_OTP");
        }

        // Mark as verified in DB.
        // The record is kept alive so /register can confirm verification
        // even across server restarts (nodemon, crashes, etc.).
        await OtpModel.updateOne(
            { email: normalizedEmail },
            { $set: { verified: true } }
        );
        console.log(`[verifyOTP] OTP verified for ${normalizedEmail}`);
        return normalizedEmail;
    },

    // ── Step 3: /register ─────────────────────────────
    async register(email, name, password, deviceInfo = "Unknown Device") {
        const normalizedEmail = email.trim().toLowerCase();

        // Gate: find the OTP entry and confirm it was verified
        const entry = await OtpModel.findOne({ email: normalizedEmail });

        if (!entry) {
            throw new Error("NO_OTP_COMPLETED");
        }
        if (!entry.verified) {
            throw new Error("NOT_VERIFIED");
        }

        // Guard against race conditions / duplicate submissions
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            await OtpModel.deleteOne({ email: normalizedEmail });
            throw new Error("ACCOUNT_EXISTS");
        }

        // Hash password and create the user
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await User.create({
            email:    normalizedEmail,
            name:     name.trim(),
            password: hashedPassword,
        });

        const token = generateToken(user._id.toString());
        user.sessions.push({ token, deviceInfo });
        await user.save();

        // Registration complete — OTP entry is no longer needed
        await OtpModel.deleteOne({ email: normalizedEmail });
        console.log(`[register] User created and session saved for ${normalizedEmail}`);

        return { user, token };
    },

    // ── Login ─────────────────────────────────────────
    async login(email, password, deviceInfo = "Unknown Device") {
        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user || !user.password) {
            throw new Error("INVALID_CREDENTIALS");
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            throw new Error("INVALID_CREDENTIALS");
        }

        const token = generateToken(user._id.toString());
        user.sessions.push({ token, deviceInfo });
        await user.save();
        
        return { user, token };
    },
};
