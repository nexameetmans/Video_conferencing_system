import httpStatus from "http-status";
import { AuthService, EMAIL_REGEX } from "../services/auth.service.js";

// ── POST /api/auth/send-otp ────────────────────────────
export const sendOTP = async (req, res) => {
    const { email } = req.body;

    if (!email || !EMAIL_REGEX.test(email.trim())) {
        return res
            .status(httpStatus.BAD_REQUEST)
            .json({ message: "A valid email address is required" });
    }

    try {
        await AuthService.sendOTP(email);
        console.log(`[sendOTP] OTP sent to ${email.trim().toLowerCase()}`);
        return res
            .status(httpStatus.OK)
            .json({ message: "OTP sent successfully. Please check your email." });

    } catch (err) {
        if (err.message === "ACCOUNT_EXISTS") {
            return res
                .status(httpStatus.CONFLICT)
                .json({ message: "An account with this email already exists. Please sign in." });
        }
        console.error("[sendOTP]", err);
        return res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({ message: "Failed to send OTP. Please try again." });
    }
};

// ── POST /api/auth/verify-otp ──────────────────────────
export const verifyOTP = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res
            .status(httpStatus.BAD_REQUEST)
            .json({ message: "Email and OTP are required" });
    }

    try {
        await AuthService.verifyOTP(email, otp);
        console.log(`[verifyOTP] Email verified: ${email.trim().toLowerCase()}`);
        return res
            .status(httpStatus.OK)
            .json({ message: "Email verified successfully. Please complete your registration." });

    } catch (err) {
        if (err.message === "NOT_FOUND") {
            return res.status(httpStatus.NOT_FOUND).json({ message: "No OTP request found for this email. Please request a new OTP." });
        }
        if (err.message === "EXPIRED_OTP") {
            return res.status(httpStatus.BAD_REQUEST).json({ message: "OTP has expired. Please request a new one." });
        }
        if (err.message === "INVALID_OTP") {
            return res.status(httpStatus.BAD_REQUEST).json({ message: "Invalid OTP. Please try again." });
        }

        console.error("[verifyOTP]", err);
        return res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({ message: "Verification failed. Please try again." });
    }
};

// ── POST /api/auth/register ────────────────────────────
export const register = async (req, res) => {
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
        return res
            .status(httpStatus.BAD_REQUEST)
            .json({ message: "Email, name, and password are required" });
    }

    if (password.length < 8) {
        return res
            .status(httpStatus.BAD_REQUEST)
            .json({ message: "Password must be at least 8 characters" });
    }

    const strongPassRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!strongPassRegex.test(password)) {
        return res
            .status(httpStatus.BAD_REQUEST)
            .json({ message: "Password must contain at least one uppercase letter and one number" });
    }

    try {
        const deviceInfo = req.headers["user-agent"] || "Unknown Device";
        const { user, token } = await AuthService.register(email, name, password, deviceInfo);
        console.log(`[register] New user registered: ${user.email}`);
        
        return res.status(httpStatus.CREATED).json({
            message: "Account created successfully",
            token,
            user: {
                id:    user._id.toString(),
                name:  user.name,
                email: user.email,
            },
        });

    } catch (err) {
        if (err.message === "NO_OTP_COMPLETED") {
            return res.status(httpStatus.BAD_REQUEST).json({ message: "Please complete OTP verification first." });
        }
        if (err.message === "NOT_VERIFIED") {
            return res.status(httpStatus.FORBIDDEN).json({ message: "Email not verified. Please complete OTP verification." });
        }
        if (err.message === "ACCOUNT_EXISTS") {
            return res.status(httpStatus.CONFLICT).json({ message: "Account already registered. Please sign in." });
        }
        
        console.error("[register]", err);
        return res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({ message: "Registration failed. Please try again." });
    }
};

// ── POST /api/auth/login ───────────────────────────────
export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res
            .status(httpStatus.BAD_REQUEST)
            .json({ message: "Email and password are required" });
    }

    try {
        const deviceInfo = req.headers["user-agent"] || "Unknown Device";
        const { user, token } = await AuthService.login(email, password, deviceInfo);
        console.log(`[login] User logged in: ${user.email}`);
        
        return res.status(httpStatus.OK).json({
            message: "Login successful",
            token,
            user: {
                id:    user._id.toString(),
                name:  user.name,
                email: user.email,
            },
        });

    } catch (err) {
        if (err.message === "INVALID_CREDENTIALS") {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid email or password" });
        }

        console.error("[login]", err);
        return res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({ message: "Login failed. Please try again." });
    }
};
