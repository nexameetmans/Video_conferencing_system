import { Meeting } from "../models/meeting.model.js";
import { Transcript } from "../models/transcript.model.js";

export const MeetingService = {
    /**
     * Returns all meetings for a user — both hosted and joined.
     * Uses $or so participants see meetings in their history too.
     */
    async getUserHistory(userId) {
        const meetings = await Meeting.find({
            $or: [
                { user_id: userId },
                { "participants.userId": userId }
            ]
        }).sort({ date: -1 });

        // Deduplicate by meetingCode — keep the richest doc (has summary)
        const seen = new Map();
        for (const m of meetings) {
            const key = m.meetingCode;
            if (!seen.has(key)) {
                seen.set(key, m);
            } else {
                // Keep whichever doc has a summary; prefer existing
                const existing = seen.get(key);
                if (!existing.summary && m.summary) {
                    seen.set(key, m);
                }
            }
        }

        return Array.from(seen.values()).map(m => {
            const meetingObj = m.toObject();
            meetingObj.meetingId = meetingObj.meetingCode;
            meetingObj.userId = meetingObj.user_id ? meetingObj.user_id.toString() : null;
            return meetingObj;
        });
    },

    /**
     * Called when host ends the meeting or a participant leaves.
     * Finds the canonical meeting doc for this code and updates it with
     * user_id, transcript, and summary. Creates a new doc only if none exists.
     */
    async addMeetingToHistory(userId, meetingData) {
        let { meeting_code, meetingCode, meetingId, summary, transcript } = meetingData;

        if (!meeting_code && meetingCode) meeting_code = meetingCode;
        if (!meeting_code && meetingId)   meeting_code = meetingId;

        if (!meeting_code) {
            throw new Error("MISSING_CODE");
        }

        const code = meeting_code.trim();

        // ── Resolve transcript if not provided ─────────────────────────────
        if (!transcript || !transcript.trim()) {
            const transcriptDocs = await Transcript.find({ meetingCode: code }).sort({ timestamp: 1 });
            if (transcriptDocs.length > 0) {
                transcript = transcriptDocs
                    .map(t => `${t.speakerName || "Unknown"}: ${t.text}`)
                    .join("\n");
            }
        }

        // ── Resolve summary if not provided ────────────────────────────────
        if (!summary || !summary.trim()) {
            const withSummary = await Meeting.findOne({
                meetingCode: code,
                summary: { $ne: "" }
            }).sort({ date: -1 });
            if (withSummary) {
                summary = withSummary.summary;
            }
        }

        // ── Find existing meeting doc for this code ────────────────────────
        const existingMeeting = await Meeting.findOne({ meetingCode: code }).sort({ date: -1 });

        if (existingMeeting) {
            // Build targeted $set — only overwrite fields that improve the doc
            const setFields = {};

            // Always set user_id if the doc doesn't have one yet
            if (!existingMeeting.user_id) {
                setFields.user_id = userId;
            }

            // Only overwrite transcript/summary if we have non-empty values
            if (transcript && transcript.trim()) {
                setFields.transcript = transcript;
            }
            if (summary && summary.trim()) {
                setFields.summary = summary;
                // Also set summaryGeneratedAt if the existing doc didn't have a summary
                if (!existingMeeting.summary) {
                    setFields.summaryGeneratedAt = new Date();
                }
            }

            if (Object.keys(setFields).length > 0) {
                await Meeting.updateOne({ _id: existingMeeting._id }, { $set: setFields });
            }

            // Also add this user as a participant if not already there
            await Meeting.updateOne(
                {
                    _id: existingMeeting._id,
                    "participants.userId": { $ne: userId }
                },
                {
                    $push: {
                        participants: {
                            userId: userId,
                            username: "Host",
                            joinedAt: new Date()
                        }
                    }
                }
            );

            return existingMeeting;
        }

        // ── No existing doc — create a new one ─────────────────────────────
        const newMeeting = new Meeting({
            user_id:      userId,
            meetingCode:  code,
            participants: [{
                userId: userId,
                username: "Host",
                joinedAt: new Date()
            }],
            transcript:         transcript || "",
            summary:            summary || "",
            summaryGeneratedAt: summary ? new Date() : null,
        });

        await newMeeting.save();
        return newMeeting;
    },

    /**
     * Add a user to an existing meeting's participants array.
     * Prevents duplicates by checking participants.userId doesn't exist.
     * If no meeting doc exists yet, create one.
     */
    async joinMeeting(userId, meetingCode, username) {
        if (!meetingCode) {
            throw new Error("MISSING_CODE");
        }

        const code = meetingCode.trim();

        // Try to find the existing meeting document for this code
        const existing = await Meeting.findOne({ meetingCode: code }).sort({ date: -1 });

        if (existing) {
            // Only add if this userId is NOT already in participants
            await Meeting.updateOne(
                {
                    _id: existing._id,
                    "participants.userId": { $ne: userId }
                },
                {
                    $push: {
                        participants: {
                            userId: userId,
                            username: username,
                            joinedAt: new Date()
                        }
                    }
                }
            );
            return existing;
        } else {
            // No meeting doc exists yet — create one with this user as a participant
            const newMeeting = new Meeting({
                meetingCode: code,
                participants: [{
                    userId: userId,
                    username: username,
                    joinedAt: new Date()
                }],
            });
            await newMeeting.save();
            return newMeeting;
        }
    },

    /**
     * Get a single meeting by code. Looks up where user is host OR participant.
     * Falls back to any doc with that meetingCode that has a summary.
     */
    async getMeetingByCode(userId, meetingCode) {
        const code = meetingCode.trim();

        // First: find doc where user is host or participant
        let meeting = await Meeting.findOne({
            meetingCode: code,
            $or: [
                { user_id: userId },
                { "participants.userId": userId }
            ]
        }).sort({ date: -1 });

        // If that doc has no summary, look for ANY doc with this code that has one
        // and merge the summary/transcript into the user's doc
        if (meeting && !meeting.summary) {
            const richer = await Meeting.findOne({
                meetingCode: code,
                summary: { $ne: "" },
            }).sort({ date: -1 });

            if (richer) {
                // Persist the merge so future fetches don't need this fallback
                const mergeFields = {};
                if (richer.summary)    mergeFields.summary = richer.summary;
                if (richer.transcript && !meeting.transcript) mergeFields.transcript = richer.transcript;
                if (richer.summaryGeneratedAt) mergeFields.summaryGeneratedAt = richer.summaryGeneratedAt;

                if (Object.keys(mergeFields).length > 0) {
                    await Meeting.updateOne({ _id: meeting._id }, { $set: mergeFields });
                }

                meeting.summary = richer.summary;
                if (!meeting.transcript) meeting.transcript = richer.transcript;
                if (richer.summaryGeneratedAt) meeting.summaryGeneratedAt = richer.summaryGeneratedAt;
            }
        }

        // If no user-scoped doc exists, try any doc with this meetingCode
        if (!meeting) {
            meeting = await Meeting.findOne({ meetingCode: code }).sort({ date: -1 });
        }

        if (!meeting) {
            throw new Error("NOT_FOUND");
        }

        const meetingObj = meeting.toObject();
        meetingObj.meetingId = meetingObj.meetingCode;
        return meetingObj;
    },

    async deleteSingleMeeting(userId, meetingId) {
        // Allow delete if user is host OR a participant
        const result = await Meeting.findOneAndDelete({
            _id: meetingId,
            $or: [
                { user_id: userId },
                { "participants.userId": userId }
            ]
        });
        if (!result) {
            throw new Error("NOT_FOUND");
        }
        return result;
    },

    async deleteMultipleMeetings(userId, ids) {
        if (!Array.isArray(ids) || ids.length === 0) {
            throw new Error("BAD_REQUEST");
        }
        const result = await Meeting.deleteMany({
            _id: { $in: ids },
            $or: [
                { user_id: userId },
                { "participants.userId": userId }
            ]
        });
        return result.deletedCount;
    }
};
