import axios from "axios";

export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 globally — clear stale token
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            // Let individual callers decide whether to redirect
        }
        return Promise.reject(error);
    }
);

// ── Auth endpoints ──────────────────────────────────────
export const authAPI = {
    sendOTP:   (email)                          => api.post("/api/auth/send-otp",   { email }),
    verifyOTP: (email, otp)                     => api.post("/api/auth/verify-otp", { email, otp }),
    register:  (email, name, password)          => api.post("/api/auth/register",   { email, name, password }),
    login:     (email, password)                => api.post("/api/auth/login",       { email, password }),
};

// ── User / Meeting endpoints ────────────────────────────
export const userAPI = {
    getHistory:        ()                                              => api.get("/api/v1/users/get_all_activity"),
    addToHistory:      (meeting_code, transcript = "", summary = "")  => api.post("/api/v1/users/add_to_activity", { meeting_code, transcript, summary }),
    getMeeting:        (meetingCode)                                   => api.get(`/api/v1/users/meeting/${meetingCode}`),
    deleteMeeting:     (id)                                            => api.delete(`/api/v1/users/meeting/${id}`),
    deleteMeetings:    (ids)                                           => api.post("/api/v1/users/meeting/delete", { ids }),
    summarizeMeeting:  (meetingCode)                                   => api.post("/api/summarize-meeting", { meetingCode }),

    // Profile & Security
    getProfile:        ()                                              => api.get("/api/v1/users/profile"),
    updateProfile:     (data)                                          => api.put("/api/v1/users/update", data),
    changePassword:    (oldPassword, newPassword)                      => api.put("/api/v1/users/change-password", { oldPassword, newPassword }),
    logoutDevice:      (sessionId)                                     => api.delete(`/api/v1/users/logout-session/${sessionId}`),
    logoutAll:         ()                                              => api.post("/api/v1/users/logout-all"),
};

export default api;
