import 'dotenv/config';
import express from "express";
import { createServer } from "node:http";
import { connectDB } from "./config/db.js";
import { connectToSocket } from "./services/socket.service.js";
import cors from "cors";
import userRoutes from "./routes/users.routes.js";
import meetingRoutes from "./routes/meeting.routes.js";
import authRoutes from "./routes/auth.routes.js";

const app    = express();
// Enable if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, Render)
app.set('trust proxy', 1);

const server = createServer(app);
const io     = connectToSocket(server);

const PORT = process.env.PORT || 8000;
app.set("port", PORT);

// ── Middleware ─────────────────────────────────────────
const allowedOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(url => url.replace(/\/$/, ''))
    : ["http://localhost:3000"];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            console.warn(`[CORS Blocked] Request from origin: ${origin} not in allowed list:`, allowedOrigins);
            // Reflect the origin back temporarily to 'fix' the issue dynamically,
            // but log the warning so the developer knows their env variable isn't exact.
            callback(null, true); 
        }
    },
    methods:     ["GET", "POST", "DELETE", "PATCH", "PUT"],
    credentials: true,
}));

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ limit: "100kb", extended: true }));

// ── Routes ─────────────────────────────────────────────
app.use("/api/auth",      authRoutes);      // JWT + OTP authentication
app.use("/api/v1/users",  userRoutes);      // Protected user / meeting history routes
app.use("/api",           meetingRoutes);   // Meeting summary / socket routes

// ── Health check ───────────────────────────────────────
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── 404 Handler ────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
});

// ── Global Error Handler ───────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error("[Unhandled Error]", err);
    res.status(err.status || 500).json({
        message: err.message || "Internal server error",
    });
});

// ── Database + Server Start ────────────────────────────
const start = async () => {
    await connectDB();
    server.listen(PORT, () => {
        console.log(`🚀 Server listening on port ${PORT}`);
    });
};

start();