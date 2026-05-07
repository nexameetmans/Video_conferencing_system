import httpStatus from "http-status";
import { verifyToken } from "../utils/jwt.js";
import { User } from "../models/user.model.js";

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res
                .status(httpStatus.UNAUTHORIZED)
                .json({ message: "Authorization token required" });
        }

        const token = authHeader.split(" ")[1];
        const payload = verifyToken(token);

        const user = await User.findById(payload.id);
        if (!user) {
            return res
                .status(httpStatus.UNAUTHORIZED)
                .json({ message: "User not found" });
        }

        const hasSession = user.sessions.some(session => session.token === token);
        if (!hasSession) {
            return res
                .status(httpStatus.UNAUTHORIZED)
                .json({ message: "Session expired or revoked. Please sign in again." });
        }

        req.user = user;
        req.token = token;
        next();

    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res
                .status(httpStatus.UNAUTHORIZED)
                .json({ message: "Session expired. Please sign in again." });
        }
        return res
            .status(httpStatus.UNAUTHORIZED)
            .json({ message: "Invalid or expired token" });
    }
};

export default authMiddleware;
