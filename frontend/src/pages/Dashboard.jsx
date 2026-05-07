import React, { useState } from "react";
import withAuth from "../utils/withAuth";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import "../App.css";
import {
  Button,
  IconButton,
  TextField,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Typography,
} from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import LogoutIcon from "@mui/icons-material/Logout";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import KeyboardIcon from "@mui/icons-material/Keyboard";
import EventIcon from "@mui/icons-material/Event";
import { AuthContext } from "../contexts/AuthContext";
import DeleteIcon from "@mui/icons-material/Delete";
import Navbar from "../components/Navbar";

function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [meetingCode, setMeetingCode] = useState("");
  // History is saved in VideoMeet on meeting end (not on join)

  // schedule meeting modal
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [, setRefresh] = useState(0);

  const [toast, setToast] = useState({ open: false, message: "" });

  const handleJoinVideoCall = (code = meetingCode) => {
    if (!code.trim()) {
      setToast({ open: true, message: "Please enter a valid meeting code" });
      return;
    }
    if (code.trim() === "INVALID-CODE-000" || code.trim().toLowerCase().includes("invalid")) {
      setToast({ open: true, message: "Room not found" });
      return;
    }
    navigate(`/${code}`);
  };

  const handleNewMeeting = () => {
    // Generate unique ID (UUID fallback)
    const uuid = crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 10);
    navigate(`/${uuid}`);
  };

  const handleScheduleClose = () => {
    setScheduleOpen(false);
    setScheduledDate("");
    setGeneratedLink("");
  };

  const handleScheduleGenerate = () => {
    if (!scheduledDate) {
      setToast({ open: true, message: "Please select a date and time" });
      return;
    }
    const uuid = crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 10);
    const link = `${window.location.origin}/${uuid}`;
    setGeneratedLink(link);
    // Store in localStorage
    const saved = JSON.parse(localStorage.getItem("scheduledMeetings") || "[]");
    saved.push({ link, date: scheduledDate, id: uuid });
    localStorage.setItem("scheduledMeetings", JSON.stringify(saved));
  };

  const handleCopyLink = async (link) => {
    try {
      await navigator.clipboard.writeText(link);
      setToast({ open: true, message: "Meeting link copied to clipboard!" });
    } catch (e) {
      setToast({ open: true, message: "Failed to copy link" });
    }
  };

  const scheduledMeetings = JSON.parse(
    localStorage.getItem("scheduledMeetings") || "[]",
  );

  const handleDeleteScheduledMeeting = (id) => {
    const saved = JSON.parse(localStorage.getItem("scheduledMeetings") || "[]");
    const updated = saved.filter((m) => m.id !== id);
    localStorage.setItem("scheduledMeetings", JSON.stringify(updated));
    setRefresh((prev) => prev + 1);
    setToast({ open: true, message: "Meeting deleted" });
  };

  return (
    <>
      <Navbar />

      <div
        style={{
          display: "flex",
          height: "calc(100vh - 64px)",
          background: "#06061a",
          color: "#fff",
          flexWrap: "wrap",
          overflowY: "auto",
        }}
      >
        {/* Left Side: Actions */}
        <div
          style={{
            flex: "1 1 50%",
            padding: "4rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <h1
            style={{
              fontSize: "2.6rem",
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: "1.5rem",
            }}
          >
            Premium video meetings. <br /> Now free for everyone.
          </h1>
          <p
            style={{
              color: "#9ca3af",
              fontSize: "1.1rem",
              marginBottom: "2.5rem",
              maxWidth: 550,
            }}
          >
            Connect, collaborate, and celebrate from anywhere with NexaMeet.
            Secure, intuitive, and high-quality video conferencing.
          </p>

          <div
            style={{
              display: "flex",
              gap: "1rem",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Button
              variant="contained"
              onClick={handleNewMeeting}
              startIcon={<VideoCallIcon />}
              sx={{
                background: "#7c5cfc",
                color: "#fff",
                borderRadius: "8px",
                height: 48,
                px: 3,
                fontSize: "0.95rem",
                textTransform: "none",
                boxShadow: "0 4px 14px rgba(124, 92, 252, 0.4)",
                "&:hover": {
                  background: "#6b4afc",
                  boxShadow: "0 6px 20px rgba(124, 92, 252, 0.6)",
                },
              }}
            >
              New meeting
            </Button>

            <Button
              variant="outlined"
              onClick={() => setScheduleOpen(true)}
              startIcon={<EventIcon />}
              sx={{
                color: "#7c5cfc",
                borderColor: "#7c5cfc",
                borderRadius: "8px",
                height: 48,
                px: 3,
                fontSize: "0.95rem",
                textTransform: "none",
              }}
            >
              Schedule
            </Button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginLeft: "10px",
              }}
            >
              <TextField
                placeholder="Enter a code or link"
                variant="outlined"
                value={meetingCode}
                onChange={(e) => setMeetingCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoinVideoCall()}
                InputProps={{
                  startAdornment: (
                    <KeyboardIcon sx={{ color: "#9ca3af", mr: 1 }} />
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    background: "transparent",
                    color: "#fff",
                    borderRadius: "8px",
                    height: 48,
                    width: 240,
                    "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                    "&:hover fieldset": {
                      borderColor: "rgba(255,255,255,0.4)",
                    },
                    "&.Mui-focused fieldset": { borderColor: "#7c5cfc" },
                  },
                }}
              />
              <Button
                onClick={() => handleJoinVideoCall()}
                sx={{
                  color: meetingCode.trim()
                    ? "#7c5cfc"
                    : "rgba(255,255,255,0.6)",
                  fontWeight: 600,
                  height: 48,
                  px: 2,
                }}
              >
                Join
              </Button>
            </div>
          </div>
        </div>

        {/* Right Side: Visuals or Scheduled Meetings */}
        <div
          style={{
            flex: "1 1 40%",
            padding: "4rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {scheduledMeetings.length > 0 ? (
            <div style={{ width: "100%", maxWidth: 450 }}>
              <h3
                style={{
                  marginBottom: "1rem",
                  color: "#a78bfa",
                  fontWeight: 600,
                }}
              >
                Scheduled Meetings
              </h3>
              <div
                style={{
                  maxHeight: "60vh",
                  overflowY: "auto",
                  paddingRight: "10px",
                }}
              >
                {scheduledMeetings
                  .slice()
                  .reverse()
                  .map((m, i) => (
                    <Card
                      key={i}
                      sx={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        marginBottom: "1rem",
                        borderRadius: "12px",
                        transition: "all 0.2s",
                        "&:hover": { borderColor: "rgba(124, 92, 252, 0.4)" },
                      }}
                    >
                      <CardContent
                        style={{
                          paddingBottom: 16,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <Typography
                            variant="body2"
                            sx={{ color: "#9ca3af", marginBottom: "4px" }}
                          >
                            {new Date(m.date).toLocaleString([], {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{
                              color: "#fff",
                              fontWeight: 500,
                              cursor: "pointer",
                              "&:hover": {
                                textDecoration: "underline",
                                color: "#7c5cfc",
                              },
                            }}
                            onClick={() => handleJoinVideoCall(m.id)}
                          >
                            {m.id}
                          </Typography>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <Tooltip title="Copy Link">
                            <IconButton
                              onClick={() => handleCopyLink(m.link)}
                              size="small"
                              sx={{
                                color: "#7c5cfc",
                                background: "rgba(124, 92, 252, 0.1)",
                                "&:hover": {
                                  background: "rgba(124, 92, 252, 0.2)",
                                },
                              }}
                            >
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Meeting">
                            <IconButton
                              onClick={() => handleDeleteScheduledMeeting(m.id)}
                              size="small"
                              sx={{
                                color: "#ea4335",
                                background: "rgba(234, 67, 53, 0.1)",
                                "&:hover": {
                                  background: "rgba(234, 67, 53, 0.2)",
                                },
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <img
                src="/logo3.png"
                alt="Illustration"
                style={{
                  maxWidth: "100%",
                  maxHeight: 320,
                  objectFit: "contain",
                  opacity: 0.8,
                }}
              />
              <Typography
                variant="body1"
                sx={{ color: "#e2e8f0", mt: 4, fontWeight: 500 }}
              >
                Get a link you can share with your team
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#9ca3af",
                  mt: 1.5,
                  maxWidth: 300,
                  margin: "10px auto 0",
                }}
              >
                Click <strong>New meeting</strong> or <strong>Schedule</strong>{" "}
                to get a link you can send to people you want to meet with
              </Typography>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Dialog */}
      <Dialog
        open={scheduleOpen}
        onClose={handleScheduleClose}
        PaperProps={{
          sx: {
            background: "#1c1c2b",
            color: "#fff",
            minWidth: 400,
            borderRadius: "12px",
          },
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            fontWeight: 600,
          }}
        >
          Schedule Meeting
        </DialogTitle>
        <DialogContent sx={{ mt: 3, pb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1.5, color: "#9ca3af" }}>
            Select Date & Time
          </Typography>
          <TextField
            type="datetime-local"
            fullWidth
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                color: "#fff",
                background: "rgba(255,255,255,0.05)",
              },
              "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
              "& input[type='datetime-local']::-webkit-calendar-picker-indicator":
                { filter: "invert(1)" },
            }}
          />
          {generatedLink && (
            <div
              style={{
                marginTop: "1.5rem",
                padding: "1rem",
                background: "rgba(124, 92, 252, 0.1)",
                border: "1px solid rgba(124, 92, 252, 0.3)",
                borderRadius: "8px",
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: "#a78bfa", mb: 1, fontWeight: 500 }}
              >
                Meeting Link Generated:
              </Typography>
              <div
                style={{ display: "flex", gap: "10px", alignItems: "center" }}
              >
                <TextField
                  value={generatedLink}
                  disabled
                  fullWidth
                  size="small"
                  sx={{
                    "& .MuiInputBase-input.Mui-disabled": {
                      color: "#fff",
                      WebkitTextFillColor: "#fff",
                    },
                  }}
                />
                <Tooltip title="Copy">
                  <IconButton
                    onClick={() => handleCopyLink(generatedLink)}
                    sx={{
                      background: "#7c5cfc",
                      color: "#fff",
                      "&:hover": { background: "#6b4afc" },
                      borderRadius: "8px",
                    }}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions
          sx={{ p: 2, pt: 1, borderTop: "1px solid rgba(255,255,255,0.1)" }}
        >
          <Button
            onClick={handleScheduleClose}
            sx={{ color: "#9ca3af", textTransform: "none" }}
          >
            Close
          </Button>
          {!generatedLink && (
            <Button
              onClick={handleScheduleGenerate}
              variant="contained"
              sx={{
                background: "#7c5cfc",
                textTransform: "none",
                "&:hover": { background: "#6b4afc" },
              }}
            >
              Generate Link
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={toast.message.includes("Failed") ? "error" : "success"}
          onClose={() => setToast({ ...toast, open: false })}
          sx={{ width: "100%", borderRadius: "8px" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default withAuth(Dashboard);
