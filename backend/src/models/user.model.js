import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        name: { type: String, required: true },
        password: { type: String, required: true },
        isVerified: { type: Boolean, default: true },
        profilePic: { type: String, default: "" },
        sessions: [
            {
                token: { type: String, required: true },
                deviceInfo: { type: String, default: "Unknown Device" },
                lastActive: { type: Date, default: Date.now },
            }
        ],
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export { User };