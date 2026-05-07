import React, { useState, useEffect } from "react";
import { Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip, Paper, Chip } from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import ArticleIcon from "@mui/icons-material/Article";
import VideoCallIcon from "@mui/icons-material/VideoCall";

export default function MeetingsTab() {
  const { getHistoryOfUser } = useAuth();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scheduledCount, setScheduledCount] = useState(0);

  useEffect(() => {
    const fetchDa = async () => {
      try {
        const history = await getHistoryOfUser();
        setMeetings(history || []);
      } catch (err) {
        console.error("Failed to load meetings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDa();
    
    // Load local scheduled meetings count
    const scheduled = JSON.parse(localStorage.getItem("scheduledMeetings") || "[]");
    setScheduledCount(scheduled.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalMeetings = meetings.length;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 4 }}>
        Meetings & History
      </Typography>

      {/* Stats row */}
      <Box sx={{ display: "flex", gap: 3, mb: 5, flexWrap: "wrap" }}>
        <Card sx={{ flex: "1 1 200px", background: "rgba(124, 92, 252, 0.1)", border: "1px solid rgba(124, 92, 252, 0.2)", borderRadius: 3 }}>
          <CardContent>
            <Typography variant="body2" sx={{ color: "#a78bfa", fontWeight: 600, mb: 1, textTransform: "uppercase", letterSpacing: 1 }}>Total Meetings</Typography>
            <Typography variant="h3" sx={{ color: "#fff", fontWeight: 700 }}>{loading ? "-" : totalMeetings}</Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: "1 1 200px", background: "rgba(0, 212, 255, 0.1)", border: "1px solid rgba(0, 212, 255, 0.2)", borderRadius: 3 }}>
          <CardContent>
            <Typography variant="body2" sx={{ color: "#00d4ff", fontWeight: 600, mb: 1, textTransform: "uppercase", letterSpacing: 1 }}>Upcoming Scheduled</Typography>
            <Typography variant="h3" sx={{ color: "#fff", fontWeight: 700 }}>{scheduledCount}</Typography>
          </CardContent>
        </Card>
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 500, mb: 2 }}>Recent Meeting History</Typography>
      
      <TableContainer component={Paper} sx={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 3, boxShadow: "none" }}>
        <Table sx={{ minWidth: 650 }} aria-label="meetings table">
          <TableHead>
            <TableRow sx={{ "& th": { borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af", fontWeight: 600 } }}>
              <TableCell>Meeting ID</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>AI Summary</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3, color: "#9ca3af", borderBottom: "none" }}>Loading...</TableCell>
              </TableRow>
            ) : meetings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3, color: "#9ca3af", borderBottom: "none" }}>No meeting history found.</TableCell>
              </TableRow>
            ) : (
              meetings.map((m) => (
                <TableRow key={m._id} sx={{ "& td": { borderBottom: "1px solid rgba(255,255,255,0.05)", color: "#fff" }, "&:last-child td": { borderBottom: 0 } }}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: "monospace", letterSpacing: 1 }}>#{m.meetingCode}</Typography>
                  </TableCell>
                  <TableCell>{formatDate(m.date)}</TableCell>
                  <TableCell>
                    {m.summary ? (
                       <Tooltip title={m.summary}>
                         <Chip label="Available" size="small" sx={{ background: "rgba(167,139,250,0.1)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.3)" }} />
                       </Tooltip>
                    ) : (
                       <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.3)" }}>Not available</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Join Again">
                      <IconButton onClick={() => navigate(`/${m.meetingCode}`)} size="small" sx={{ color: "#00d4ff", mr: 1, "&:hover": { background: "rgba(0,212,255,0.1)" } }}>
                        <VideoCallIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View Details">
                      <IconButton onClick={() => navigate(`/meeting/${m.meetingCode}`)} size="small" sx={{ color: "#a78bfa", "&:hover": { background: "rgba(167,139,250,0.1)" } }}>
                        <ArticleIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
