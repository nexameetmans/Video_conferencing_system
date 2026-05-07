import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import {
  Box, Typography, IconButton, Chip, CircularProgress,
  Tooltip, Divider, Alert
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ArticleIcon from "@mui/icons-material/Article";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import Navbar from "../components/Navbar";

export default function MeetingTranscript() {
  const { meetingCode } = useParams();
  const { getMeetingDetails } = useContext(AuthContext);
  const navigate = useNavigate();

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getMeetingDetails(meetingCode);
        setMeeting(data);
      } catch (err) {
        setError("Could not load meeting details. Please go back and try again.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingCode]);

  const formatDate = (ds) => {
    if (!ds) return "N/A";
    const d = new Date(ds);
    if (isNaN(d.getTime())) return "Invalid Date";
    return d.toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  // Parse markdown-style summary into sections
  const parseSummary = (text) => {
    if (!text) return null;
    const sections = [];
    const lines = text.split("\n");
    let current = null;

    for (const line of lines) {
      const headingMatch = line.match(/^#+\s+(.+)/) || line.match(/^\d+\.\s+\*\*(.+?)\*\*/);
      const boldHeading = line.match(/^\*\*(.+?)\*\*/);
      if (headingMatch) {
        if (current) sections.push(current);
        current = { title: headingMatch[1], items: [] };
      } else if (boldHeading && !current) {
        if (current) sections.push(current);
        current = { title: boldHeading[1], items: [] };
      } else if (line.trim().startsWith("*") || line.trim().startsWith("-") || line.trim().startsWith("•")) {
        const item = line.replace(/^[\*\-•]\s*/, "").replace(/\*\*/g, "").trim();
        if (item && current) current.items.push(item);
      } else if (line.trim() && current) {
        const cleaned = line.replace(/\*\*/g, "").trim();
        if (cleaned) current.items.push(cleaned);
      }
    }
    if (current) sections.push(current);
    return sections.filter(s => s.items.length > 0 || s.title);
  };

  const parseTranscript = (text) => {
    if (!text) return [];
    const lines = text.split("\n");
    const grouped = [];
    
    let currentSpeaker = null;
    let currentMessages = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      
      const colonIdx = line.indexOf(":");
      if (colonIdx !== -1 && colonIdx < 30) { 
        const speaker = line.slice(0, colonIdx).trim();
        const msg = line.slice(colonIdx + 1).trim();
        
        if (currentSpeaker === speaker) {
          if (msg) currentMessages.push(msg);
        } else {
          if (currentSpeaker !== null) {
            grouped.push({ speaker: currentSpeaker, messages: currentMessages });
          }
          currentSpeaker = speaker;
          currentMessages = msg ? [msg] : [];
        }
      } else {
        if (currentSpeaker !== null) {
          currentMessages.push(line.trim());
        } else {
          grouped.push({ speaker: "Unknown", messages: [line.trim()] });
        }
      }
    }
    
    if (currentSpeaker !== null || currentMessages.length > 0) {
      grouped.push({ speaker: currentSpeaker || "Unknown", messages: currentMessages });
    }
    
    return grouped;
  };

  const sectionColors = ["#a78bfa", "#34d399", "#f59e0b"];
  const sectionBg = [
    "rgba(167,139,250,0.08)",
    "rgba(52,211,153,0.08)",
    "rgba(245,158,11,0.08)",
  ];
  const sectionBorder = [
    "rgba(167,139,250,0.25)",
    "rgba(52,211,153,0.25)",
    "rgba(245,158,11,0.25)",
  ];

  return (
    <>
      <Navbar />
      <Box
        sx={{
          minHeight: "calc(100vh - 65px)",
        background: `
          radial-gradient(ellipse 70% 50% at 20% 5%, rgba(124,92,252,0.12) 0%, transparent 60%),
          radial-gradient(ellipse 50% 40% at 80% 90%, rgba(0,212,255,0.07) 0%, transparent 55%),
          #06061a
        `,
        px: { xs: 2, sm: 4, md: 6 },
        py: 4,
      }}
    >
      {/* ── Header ── */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
        <Tooltip title="Back to History">
          <IconButton
            onClick={() => navigate("/history")}
            sx={{
              background: "rgba(124,92,252,0.1)",
              border: "1px solid rgba(124,92,252,0.25)",
              color: "#a78bfa",
              "&:hover": { background: "rgba(124,92,252,0.22)" },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              background: "linear-gradient(135deg, #a78bfa, #00d4ff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.02em",
            }}
          >
            Meeting Details
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.45)", mt: 0.2 }}>
            Transcript & AI-powered summary
          </Typography>
        </Box>
      </Box>

      {/* ── Loading / Error ── */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
          <CircularProgress sx={{ color: "#a78bfa" }} />
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ maxWidth: 600, mx: "auto", mt: 4, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* ── Content ── */}
      {!loading && meeting && (
        <Box sx={{ maxWidth: 820, mx: "auto" }}>
          {/* Meeting meta */}
          <Box
            sx={{
              background: "rgba(13,13,43,0.7)",
              border: "1px solid rgba(124,92,252,0.2)",
              borderRadius: 3,
              p: 3,
              mb: 3,
              backdropFilter: "blur(10px)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
              <MeetingRoomIcon sx={{ color: "#7c5cfc", fontSize: "1.8rem" }} />
              <Typography
                sx={{
                  fontFamily: "monospace",
                  fontSize: "1.3rem",
                  fontWeight: 800,
                  color: "#fff",
                  letterSpacing: "0.08em",
                }}
              >
                # {meeting.meetingCode}
              </Typography>
              <Chip
                label="Completed"
                size="small"
                sx={{
                  background: "rgba(74,222,128,0.12)",
                  border: "1px solid rgba(74,222,128,0.3)",
                  color: "#4ade80",
                  fontWeight: 600,
                  fontSize: "0.7rem",
                  ml: "auto",
                }}
              />
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.7, mt: 1.5 }}>
              <AccessTimeIcon sx={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.4)" }} />
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.45)" }}>
                {formatDate(meeting.date)}
              </Typography>
            </Box>
          </Box>

          {/* ── Transcript Section ── */}
          <Box
            sx={{
              background: "rgba(13,13,43,0.65)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 3,
              p: 3,
              mb: 3,
              backdropFilter: "blur(10px)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <ArticleIcon sx={{ color: "#64748b", fontSize: "1.1rem" }} />
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Full Transcript
              </Typography>
            </Box>
            <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 2 }} />

            {meeting.transcript ? (
              <Box
                sx={{
                  maxHeight: 340,
                  overflowY: "auto",
                  pr: 1,
                  "&::-webkit-scrollbar": { width: 4 },
                  "&::-webkit-scrollbar-track": { background: "transparent" },
                  "&::-webkit-scrollbar-thumb": { background: "rgba(124,92,252,0.4)", borderRadius: 4 },
                }}
                className="flex flex-col gap-3"
              >
                {parseTranscript(meeting.transcript).map((block, idx) => {
                  const hue = block.speaker && block.speaker !== "Unknown"
                    ? (block.speaker.charCodeAt(0) * 37 + block.speaker.charCodeAt(block.speaker.length - 1) * 17) % 360
                    : 200;
                  return (
                    <div 
                      key={idx} 
                      className="bg-[#0d0d2b]/60 border border-white/10 rounded-xl p-3 shadow-md hover:bg-[#0d0d2b]/80 hover:border-white/20 transition-all duration-200"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span 
                          className="text-[0.75rem] font-bold px-2.5 py-0.5 rounded-full bg-black/40 tracking-wider shadow-sm"
                          style={{ color: `hsl(${hue}, 70%, 65%)` }}
                        >
                          {block.speaker}
                        </span>
                      </div>
                      <div className="text-[0.875rem] text-white/85 leading-relaxed flex flex-col gap-2 pl-1">
                        {block.messages.map((m, i) => (
                           <p key={i} className="m-0">{m}</p>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
                No transcript was recorded for this meeting. Enable live captions during your next session to capture the conversation.
              </Typography>
            )}
          </Box>

          {/* ── AI Summary Section ── */}
          <Box
            sx={{
              background: "linear-gradient(135deg, rgba(124,92,252,0.07) 0%, rgba(0,212,255,0.04) 100%)",
              border: "1px solid rgba(167,139,250,0.2)",
              borderRadius: 3,
              p: 3,
              backdropFilter: "blur(10px)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <AutoAwesomeIcon sx={{ color: "#a78bfa", fontSize: "1.1rem" }} />
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  color: "#a78bfa",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                AI Summary
              </Typography>
              <Chip
                label="Gemini 1.5 Flash"
                size="small"
                sx={{
                  ml: "auto",
                  background: "rgba(167,139,250,0.12)",
                  border: "1px solid rgba(167,139,250,0.25)",
                  color: "#c4b5fd",
                  fontSize: "0.65rem",
                  fontWeight: 600,
                }}
              />
            </Box>
            <Divider sx={{ borderColor: "rgba(167,139,250,0.15)", mb: 2.5 }} />

            {meeting.summary ? (
              (() => {
                const sections = parseSummary(meeting.summary);
                if (!sections || sections.length === 0) {
                  return (
                    <Typography
                      sx={{ color: "rgba(255,255,255,0.75)", fontSize: "0.9rem", lineHeight: 1.8 }}
                    >
                      {meeting.summary}
                    </Typography>
                  );
                }
                return (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {sections.map((section, si) => (
                      <Box
                        key={si}
                        sx={{
                          background: sectionBg[si % 3],
                          border: "1px solid",
                          borderColor: sectionBorder[si % 3],
                          borderRadius: 2.5,
                          p: 2,
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.82rem",
                            color: sectionColors[si % 3],
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            mb: 1.2,
                            display: "flex",
                            alignItems: "center",
                            gap: 0.6,
                          }}
                        >
                          <span style={{ fontSize: "1rem" }}>
                            {si === 0 ? "💬" : si === 1 ? "✅" : "📋"}
                          </span>
                          {section.title}
                        </Typography>
                        <Box component="ul" sx={{ m: 0, pl: 2 }}>
                          {section.items.map((item, ii) => (
                            <Box
                              component="li"
                              key={ii}
                              sx={{
                                fontSize: "0.85rem",
                                color: "rgba(255,255,255,0.82)",
                                lineHeight: 1.7,
                                mb: 0.4,
                              }}
                            >
                              {item}
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                );
              })()
            ) : (
              <Typography
                variant="body2"
                sx={{ color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}
              >
                No AI summary available. Summary is generated when the host enables captions and ends the meeting via "End Meeting for All".
              </Typography>
            )}
          </Box>
        </Box>
      )}
    </Box>
    </>
  );
}
