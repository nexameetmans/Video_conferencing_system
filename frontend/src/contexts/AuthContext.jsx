import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI, userAPI } from "../services/api";

export const AuthContext = createContext(null);

// ── Decode JWT payload without a library ───────────────
const decodeJWT = (token) => {
    try {
        const base64Url = token.split(".")[1];
        const base64    = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const json      = atob(base64);
        return JSON.parse(json);
    } catch {
        return null;
    }
};

// ── Check if a JWT token is still valid ────────────────
const isTokenValid = (token) => {
    if (!token) return false;
    const payload = decodeJWT(token);
    if (!payload || !payload.exp) return false;
    return payload.exp * 1000 > Date.now();
};

export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();

    // ── State ───────────────────────────────────────────
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem("user")) || null; }
        catch { return null; }
    });

    const isAuthenticated = Boolean(user) && isTokenValid(localStorage.getItem("token"));

    // ── Persistent login: validate stored token on mount ──
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token && !isTokenValid(token)) {
            // Token expired — clear stale session
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setUser(null);
        }
    }, []);

    // ── Internal helper to persist session ─────────────
    const persistSession = useCallback((token, userData) => {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
    }, []);

    // ── Auth Actions ────────────────────────────────────

    /** Step 1: Send OTP to email */
    const sendOTP = async (email) => {
        const res = await authAPI.sendOTP(email);
        return res.data;
    };

    /** Step 2: Verify OTP */
    const verifyOTP = async (email, otp) => {
        const res = await authAPI.verifyOTP(email, otp);
        return res.data;
    };

    /** Step 3: Complete registration — auto-login on success */
    const handleRegister = async (email, name, password) => {
        const res = await authAPI.register(email, name, password);
        if (res.data.token) {
            persistSession(res.data.token, res.data.user);
            navigate("/home");
        }
        return res.data;
    };

    /** Login with email + password */
    const handleLogin = async (email, password) => {
        const res = await authAPI.login(email, password);
        if (res.data.token) {
            persistSession(res.data.token, res.data.user);
            navigate("/home");
        }
        return res.data;
    };

    /** Logout — clear token from DB and local, redirect */
    const logout = useCallback(async (skipApi = false) => {
        const token = localStorage.getItem("token");
        if (token && skipApi !== true) {
            try {
                // Call backend to remove session token
                await userAPI.logoutDevice(token);
            } catch (err) {
                console.error("[logout error]", err);
            }
        }
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        navigate("/auth");
    }, [navigate]);

    // ── Meeting / History Actions (unchanged API surface) ──

    const getHistoryOfUser = async () => {
        const res = await userAPI.getHistory();
        return res.data;
    };

    const addToUserHistory = async (meetingCode, transcript = "", summary = "") => {
        await userAPI.addToHistory(meetingCode, transcript, summary);
    };

    const endMeeting = async (meetingCode) => {
        try {
            const res = await userAPI.summarizeMeeting(meetingCode);
            return res.data;
        } catch (err) {
            console.error("[endMeeting]", err);
            return { summary: "", transcript: "" };
        }
    };

    const getMeetingDetails = async (meetingCode) => {
        const res = await userAPI.getMeeting(meetingCode);
        return res.data;
    };

    const deleteMeeting = async (id) => {
        await userAPI.deleteMeeting(id);
    };

    const deleteMeetings = async (ids) => {
        await userAPI.deleteMeetings(ids);
    };

    // ── Profile / Security Actions ───────────────────────

    const getProfile = async () => {
        const res = await userAPI.getProfile();
        return res.data;
    };

    const updateProfile = async (data) => {
        const res = await userAPI.updateProfile(data);
        if (res.data.user) {
            persistSession(localStorage.getItem("token"), res.data.user);
        }
        return res.data;
    };

    const changePassword = async (oldPassword, newPassword) => {
        const res = await userAPI.changePassword(oldPassword, newPassword);
        return res.data;
    };

    const logoutDevice = async (sessionId) => {
        await userAPI.logoutDevice(sessionId);
    };

    const logoutAll = async () => {
        await userAPI.logoutAll();
        logout(true);
    };

    // ── Context Value ───────────────────────────────────
    const value = {
        // State
        user,
        isAuthenticated,

        // Auth
        sendOTP,
        verifyOTP,
        handleRegister,
        handleLogin,
        logout,

        // Meeting / History
        getHistoryOfUser,
        addToUserHistory,
        endMeeting,
        getMeetingDetails,
        deleteMeeting,
        deleteMeetings,

        // Profile
        getProfile,
        updateProfile,
        changePassword,
        logoutDevice,
        logoutAll,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Convenience hook
export const useAuth = () => useContext(AuthContext);
