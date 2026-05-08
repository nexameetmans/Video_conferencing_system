import mongoose, { Schema } from "mongoose";


const participantSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        username: { type: String, required: true },
        joinedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const meetingSchema = new Schema(
    {
        user_id: { type: Schema.Types.ObjectId, ref: 'User', index: true },
        meetingCode: { type: String, required: true },
        participants: { type: [participantSchema], default: [] },
        transcript: { type: String, default: "" },
        summary: { type: String, default: "" },
        summaryGeneratedAt: { type: Date, default: null },
        date: { type: Date, default: Date.now, required: true }
    }
)

// Index on participants.userId so history lookups for joined meetings are fast
meetingSchema.index({ "participants.userId": 1 });

const Meeting = mongoose.model("Meeting", meetingSchema);

export { Meeting };