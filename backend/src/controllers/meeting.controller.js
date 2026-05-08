import { GoogleGenerativeAI } from "@google/generative-ai";
import { Transcript } from "../models/transcript.model.js";
import { Meeting } from "../models/meeting.model.js";


// ── POST /api/summarize-meeting ─────────────────────────────────────────────
// Fetches transcript from DB, generates AI summary, saves into meetings collection
export const summarizeMeeting = async (req, res) => {
    const { meetingCode } = req.body;

    if (!meetingCode || !meetingCode.trim()) {
        return res.status(400).json({ message: "meetingCode is required" });
    }

    const code = meetingCode.trim();

    // Resolve the authenticated user's ID if available (auth middleware may or
    // may not be present on this route — handle both cases gracefully)
    const userId = req.user?._id || null;

    // ── Step 1: Fetch transcript rows from DB ──────────────────────────────
    let transcriptDocs;
    try {
        transcriptDocs = await Transcript.find({ meetingCode: code }).sort({ timestamp: 1 });
    } catch (err) {
        console.error("[summarizeMeeting] DB fetch error:", err.message);
        return res.status(500).json({ message: "Failed to fetch transcript from database" });
    }

    if (!transcriptDocs || transcriptDocs.length === 0) {
        // No transcript rows — still ensure a meeting record exists so history shows it
        try {
            const updatePayload = {
                $setOnInsert: { meetingCode: code, transcript: "", summary: "", date: new Date() }
            };
            // Set user_id if we know it and the doc doesn't have one yet
            if (userId) {
                updatePayload.$setOnInsert.user_id = userId;
            }
            await Meeting.findOneAndUpdate(
                { meetingCode: code },
                updatePayload,
                { upsert: true, new: true, sort: { date: -1 } }
            );
        } catch (_) { /* non-fatal */ }

        return res.status(200).json({
            summary: "",
            transcript: "",
            message: "No transcript found for this meeting. Captions may not have been enabled.",
        });
    }

    // ── Step 2: Combine transcript into single string ──────────────────────
    // Format: "SpeakerName: text"  — one line per entry
    const fullTranscript = transcriptDocs
        .map(t => `${t.speakerName || "Unknown"}: ${t.text}`)
        .join("\n");

    // ── Step 3: Call Gemini to generate summary ────────────────────────────
    let summary = "";
    try {
        const trimmed = fullTranscript.length > 8000
            ? fullTranscript.slice(-8000)
            : fullTranscript;

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Use gemini-2.5-flash — current stable free-tier model
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `Analyze the following meeting transcript and first identify the type of meeting:
- Formal (project, business, academic)
- Informal (casual discussion, general conversation)
- Brainstorming / planning

Then generate a suitable summary:

If formal:
- Provide:
  1. Key Discussion Points
  2. Important Decisions
  3. Action Items

If informal:
- Provide a clear paragraph summary of the conversation

If brainstorming:
- Provide:
  1. Ideas Discussed
  2. Suggestions
  3. Next Steps

Rules:
- Keep it clear and easy to understand
- Avoid unnecessary repetition
- Use bullet points where appropriate

Transcript:
${trimmed}`;

        console.log("[summarizeMeeting] Calling Gemini for meetingCode:", code, "transcript length:", trimmed.length);
        const result = await model.generateContent(prompt);
        const response = result.response;

        // Try response.text() first, then fall back to extracting from candidates
        try {
            summary = response.text().trim();
        } catch (textErr) {
            console.warn("[summarizeMeeting] response.text() failed, extracting from candidates:", textErr.message);
            const parts = response?.candidates?.[0]?.content?.parts || [];
            summary = parts
                .filter(p => !p.thought && p.text)
                .map(p => p.text)
                .join("\n")
                .trim();
        }

        console.log("[summarizeMeeting] Summary generated, length:", summary.length);
    } catch (err) {
        console.error("[summarizeMeeting] Gemini error:", err?.message || err);
        summary = ""; // non-fatal — still save the transcript
    }

    // ── Step 4: Save into meetings collection ─────────────────────────────
    // Use findOneAndUpdate + upsert so we update an existing doc (created
    // when participants joined) rather than creating a duplicate.
    // IMPORTANT: sort by { date: -1 } so we always target the SAME doc that
    //            getUserHistory / getMeetingByCode would return.
    try {
        const setFields = {
            transcript: fullTranscript,
            summary: summary,
        };
        // Record when the summary was generated (only if we actually got one)
        if (summary) {
            setFields.summaryGeneratedAt = new Date();
        }
        // Set user_id on the doc if we know who the host is
        if (userId) {
            setFields.user_id = userId;
        }

        const savedMeeting = await Meeting.findOneAndUpdate(
            { meetingCode: code },
            {
                $set: setFields,
                $setOnInsert: {
                    meetingCode: code,
                    date: new Date(),
                }
            },
            { upsert: true, new: true, sort: { date: -1 } }
        );

        console.log("[summarizeMeeting] Saved meeting _id:", savedMeeting._id, "summary length:", (savedMeeting.summary || "").length);
    } catch (err) {
        console.error("[summarizeMeeting] Save error:", err.message);
        return res.status(500).json({ message: "Transcript found but could not save meeting record" });
    }

    return res.status(200).json({
        summary,
        transcript: fullTranscript,
        message: "Meeting summarized and saved successfully",
    });
};
