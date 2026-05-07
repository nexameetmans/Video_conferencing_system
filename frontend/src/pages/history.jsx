import { useContext, useEffect, useState, useCallback } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, IconButton, Chip, Tooltip,
  CircularProgress, Button, Snackbar, Alert,
  Checkbox, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions,
} from "@mui/material";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ArticleIcon from "@mui/icons-material/Article";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import Navbar from "../components/Navbar";

export default function History() {
  const { getHistoryOfUser, deleteMeeting, deleteMeetings } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selection state
  const [selected, setSelected] = useState(new Set());

  // Confirmation dialog
  const [confirm, setConfirm] = useState({ open: false, mode: null, target: null });
  // mode: "single" | "bulk"

  // Toasts
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const routeTo = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getHistoryOfUser();
        setMeetings(history);
      } catch (err) {
        showToast("Failed to load history. Please try again.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const mins = date.getMinutes().toString().padStart(2, "0");
    return `${day}/${month}/${year} at ${hours}:${mins}`;
  }, []);

  const getSummaryPreview = (summary) => {
    if (!summary || !summary.trim()) return null;
    return summary.length > 150 ? summary.slice(0, 150) + "…" : summary;
  };

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  // ── Selection helpers ───────────────────────────────────
  const isAllSelected = meetings.length > 0 && selected.size === meetings.length;
  const isIndeterminate = selected.size > 0 && selected.size < meetings.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(meetings.map((m) => m._id)));
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Delete handlers ─────────────────────────────────────
  const openSingleDeleteConfirm = (id) => {
    setConfirm({ open: true, mode: "single", target: id });
  };

  const openBulkDeleteConfirm = () => {
    setConfirm({ open: true, mode: "bulk", target: null });
  };

  const handleConfirmDelete = async () => {
    const { mode, target } = confirm;
    setConfirm({ open: false, mode: null, target: null });

    if (mode === "single") {
      try {
        await deleteMeeting(target);
        setMeetings((prev) => prev.filter((m) => m._id !== target));
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(target);
          return next;
        });
        showToast("Meeting deleted successfully.", "success");
      } catch (e) {
        showToast("Failed to delete meeting. Please try again.", "error");
      }
    } else if (mode === "bulk") {
      const ids = Array.from(selected);
      try {
        await deleteMeetings(ids);
        setMeetings((prev) => prev.filter((m) => !ids.includes(m._id)));
        setSelected(new Set());
        showToast(`${ids.length} meeting(s) deleted successfully.`, "success");
      } catch (e) {
        showToast("Failed to delete selected meetings. Please try again.", "error");
      }
    }
  };

  const handleCancelDelete = () => {
    setConfirm({ open: false, mode: null, target: null });
  };

  return (
    <>
      <Navbar />
      <Box
        sx={{
          minHeight: "calc(100vh - 65px)",
        background: `
          radial-gradient(ellipse 60% 50% at 15% 10%, rgba(124,92,252,0.15) 0%, transparent 65%),
          radial-gradient(ellipse 50% 40% at 85% 80%, rgba(0,212,255,0.08) 0%, transparent 60%),
          #06061a
        `,
        px: { xs: 2, sm: 4 },
        py: 3,
      }}
    >
      {/* ── Header ── */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
        <Tooltip title="Back to Home">
          <IconButton
            onClick={() => routeTo("/home")}
            sx={{
              background: "rgba(124,92,252,0.1)",
              border: "1px solid rgba(124,92,252,0.25)",
              color: "primary.light",
              "&:hover": { background: "rgba(124,92,252,0.2)" },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>

        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <VideoCallIcon sx={{ color: "primary.main", fontSize: "1.6rem" }} />
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
              Meeting History
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.2 }}>
            All your past NexaMeet sessions · AI summaries powered by Gemini
          </Typography>
        </Box>
      </Box>

      {/* ── Bulk-action toolbar (only when there are meetings) ── */}
      {!loading && meetings.length > 0 && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 3,
            p: 1.5,
            background: "rgba(13,13,43,0.7)",
            border: "1px solid rgba(124,92,252,0.2)",
            borderRadius: 3,
            backdropFilter: "blur(10px)",
            maxWidth: 1000,
            flexWrap: "wrap",
          }}
        >
          {/* Select All checkbox */}
          <Tooltip title={isAllSelected ? "Deselect All" : "Select All"}>
            <Checkbox
              checked={isAllSelected}
              indeterminate={isIndeterminate}
              onChange={toggleSelectAll}
              id="select-all-checkbox"
              sx={{
                color: "rgba(167,139,250,0.5)",
                "&.Mui-checked": { color: "#a78bfa" },
                "&.MuiCheckbox-indeterminate": { color: "#a78bfa" },
                p: 0.5,
              }}
            />
          </Tooltip>

          <Typography variant="body2" sx={{ color: "text.secondary", flexGrow: 1 }}>
            {selected.size === 0
              ? `${meetings.length} meeting${meetings.length !== 1 ? "s" : ""}`
              : `${selected.size} of ${meetings.length} selected`}
          </Typography>

          {/* Delete Selected button */}
          <Button
            id="delete-selected-btn"
            variant="contained"
            size="small"
            startIcon={<DeleteSweepIcon />}
            disabled={selected.size === 0}
            onClick={openBulkDeleteConfirm}
            sx={{
              background: selected.size > 0
                ? "linear-gradient(135deg, #ef4444, #dc2626)"
                : "rgba(239,68,68,0.15)",
              color: selected.size > 0 ? "#fff" : "rgba(239,68,68,0.4)",
              fontWeight: 700,
              textTransform: "none",
              borderRadius: 2,
              "&:hover": {
                background: selected.size > 0
                  ? "linear-gradient(135deg, #dc2626, #b91c1c)"
                  : "rgba(239,68,68,0.15)",
              },
              transition: "all 0.2s ease",
            }}
          >
            Delete Selected {selected.size > 0 ? `(${selected.size})` : ""}
          </Button>
        </Box>
      )}

      {/* ── Content ── */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
          <CircularProgress sx={{ color: "primary.main" }} />
        </Box>
      ) : meetings.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            mt: 8,
            p: 4,
            background: "rgba(13,13,43,0.6)",
            border: "1px solid rgba(124,92,252,0.15)",
            borderRadius: 4,
            maxWidth: 400,
            mx: "auto",
          }}
        >
          <MeetingRoomIcon sx={{ fontSize: 48, color: "primary.main", opacity: 0.6, mb: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>No meetings yet</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Your past sessions will appear here once you join a meeting.
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" },
            gap: 2.5,
            maxWidth: 1000,
          }}
        >
          {meetings.map((e, i) => {
            const preview = getSummaryPreview(e.summary);
            const isChecked = selected.has(e._id);
            return (
              <Card
                key={e._id || i}
                variant="outlined"
                sx={{
                  transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
                  borderColor: isChecked
                    ? "rgba(167,139,250,0.6)"
                    : "rgba(124,92,252,0.15)",
                  "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: "0 12px 32px rgba(124,92,252,0.2)",
                  },
                  position: "relative",
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  {/* Top row: checkbox + status chip + AI chip */}
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {/* Checkbox */}
                      <Checkbox
                        id={`checkbox-meeting-${e._id}`}
                        checked={isChecked}
                        onChange={() => toggleSelect(e._id)}
                        size="small"
                        sx={{
                          color: "rgba(167,139,250,0.4)",
                          "&.Mui-checked": { color: "#a78bfa" },
                          p: 0,
                          mr: 0.5,
                        }}
                      />
                      <Chip
                        label="Completed"
                        size="small"
                        sx={{
                          background: "rgba(74,222,128,0.1)",
                          border: "1px solid rgba(74,222,128,0.25)",
                          color: "#4ade80",
                          fontWeight: 600,
                          fontSize: "0.7rem",
                        }}
                      />
                    </Box>

                    {/* AI chip + Delete button */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      {preview && (
                        <Chip
                          icon={<AutoAwesomeIcon sx={{ fontSize: "0.8rem !important" }} />}
                          label="AI Summary"
                          size="small"
                          sx={{
                            background: "rgba(167,139,250,0.1)",
                            border: "1px solid rgba(167,139,250,0.3)",
                            color: "#a78bfa",
                            fontWeight: 600,
                            fontSize: "0.65rem",
                          }}
                        />
                      )}
                      <Tooltip title="Delete meeting">
                        <IconButton
                          id={`delete-meeting-${e._id}`}
                          size="small"
                          onClick={() => openSingleDeleteConfirm(e._id)}
                          sx={{
                            color: "rgba(248,113,113,0.7)",
                            p: 0.4,
                            "&:hover": {
                              color: "#f87171",
                              background: "rgba(248,113,113,0.1)",
                            },
                            transition: "all 0.15s ease",
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: "1rem" }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  {/* Meeting code */}
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: "1rem",
                      color: "text.primary",
                      mb: 1,
                      fontFamily: "monospace",
                      letterSpacing: "0.05em",
                    }}
                  >
                    # {e.meetingCode}
                  </Typography>

                  {/* Date */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.7, mb: 1.5 }}>
                    <AccessTimeIcon sx={{ fontSize: "0.9rem", color: "text.secondary" }} />
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      {formatDate(e.date)}
                    </Typography>
                  </Box>

                  {/* Summary preview */}
                  <Box
                    sx={{
                      background: preview
                        ? "rgba(167,139,250,0.06)"
                        : "rgba(255,255,255,0.03)",
                      border: "1px solid",
                      borderColor: preview
                        ? "rgba(167,139,250,0.2)"
                        : "rgba(255,255,255,0.07)",
                      borderRadius: 2,
                      p: 1.5,
                      minHeight: 64,
                      mb: 2,
                    }}
                  >
                    {preview ? (
                      <>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                          <AutoAwesomeIcon sx={{ fontSize: "0.8rem", color: "#a78bfa" }} />
                          <Typography variant="caption" sx={{ color: "#a78bfa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            AI Summary
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)", fontSize: "0.8rem", lineHeight: 1.5 }}>
                          {preview}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="body2" sx={{ color: "text.disabled", fontSize: "0.8rem", fontStyle: "italic" }}>
                        No summary available. Enable captions during meetings to get AI summaries.
                      </Typography>
                    )}
                  </Box>

                  {/* View Transcript button */}
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ArticleIcon sx={{ fontSize: "1rem" }} />}
                    sx={{
                      width: "100%",
                      textTransform: "none",
                      borderColor: "rgba(124,92,252,0.4)",
                      color: "#a78bfa",
                      fontWeight: 600,
                      "&:hover": {
                        borderColor: "#7c5cfc",
                        background: "rgba(124,92,252,0.1)",
                      },
                    }}
                    onClick={() => routeTo(`/meeting/${e.meetingCode}`)}
                  >
                    View Transcript &amp; Summary
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* ── Confirmation Dialog ── */}
      <Dialog
        open={confirm.open}
        onClose={handleCancelDelete}
        PaperProps={{
          sx: {
            background: "rgba(13,13,43,0.97)",
            border: "1px solid rgba(248,113,113,0.25)",
            borderRadius: 3,
            backdropFilter: "blur(20px)",
            minWidth: 320,
          },
        }}
      >
        <DialogTitle sx={{ color: "#f87171", fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
          <DeleteIcon />
          {confirm.mode === "bulk"
            ? `Delete ${selected.size} Meeting${selected.size !== 1 ? "s" : ""}?`
            : "Delete Meeting?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "rgba(255,255,255,0.65)" }}>
            {confirm.mode === "bulk"
              ? `You are about to permanently delete ${selected.size} selected meeting${selected.size !== 1 ? "s" : ""}. This action cannot be undone.`
              : "This meeting record will be permanently deleted. This action cannot be undone."}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={handleCancelDelete}
            sx={{
              textTransform: "none",
              borderColor: "rgba(255,255,255,0.15)",
              color: "text.secondary",
              "&:hover": { borderColor: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.05)" },
            }}
          >
            Cancel
          </Button>
          <Button
            id="confirm-delete-btn"
            variant="contained"
            onClick={handleConfirmDelete}
            sx={{
              textTransform: "none",
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              fontWeight: 700,
              "&:hover": { background: "linear-gradient(135deg, #dc2626, #b91c1c)" },
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Toast ── */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          sx={{ width: "100%", borderRadius: 2, fontWeight: 600 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
    </>
  );
}
