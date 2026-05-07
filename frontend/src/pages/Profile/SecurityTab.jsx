import React, { useState, useEffect } from "react";
import { Box, Typography, TextField, Button, Card, CardContent, IconButton, Alert, Snackbar, Tooltip } from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import LaptopMacIcon from "@mui/icons-material/LaptopMac";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import LogoutIcon from "@mui/icons-material/Logout";

export default function SecurityTab() {
  const { getProfile, changePassword, logoutDevice, logoutAll } = useAuth();
  
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  
  const [passwords, setPasswords] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [savingPass, setSavingPass] = useState(false);
  
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const data = await getProfile();
      if (data.sessions) setSessions(data.sessions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handlePassChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleChangePassword = async () => {
    if (!passwords.oldPassword || !passwords.newPassword || !passwords.confirmPassword) {
      setToast({ open: true, message: "Please fill all password fields", severity: "error" });
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setToast({ open: true, message: "New passwords do not match", severity: "error" });
      return;
    }

    setSavingPass(true);
    try {
      await changePassword(passwords.oldPassword, passwords.newPassword);
      setToast({ open: true, message: "Password updated successfully!", severity: "success" });
      setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update password";
      setToast({ open: true, message: msg, severity: "error" });
    } finally {
      setSavingPass(false);
    }
  };

  const handleLogoutDevice = async (sessionId) => {
    try {
      await logoutDevice(sessionId);
      setToast({ open: true, message: "Device logged out", severity: "success" });
      fetchSessions();
    } catch (err) {
      setToast({ open: true, message: "Failed to logout device", severity: "error" });
    }
  };

  const handleLogoutAll = async () => {
    try {
      await logoutAll();
      // the context will route to /auth
    } catch (err) {
      setToast({ open: true, message: "Failed to logout all devices", severity: "error" });
    }
  };

  const currentToken = localStorage.getItem("token");

  const getDeviceIcon = (deviceInfo) => {
    const info = (deviceInfo || "").toLowerCase();
    if (info.includes("mobile") || info.includes("android") || info.includes("iphone") || info.includes("ipad")) {
      return <PhoneIphoneIcon sx={{ fontSize: 40, color: "#9ca3af" }} />;
    }
    return <LaptopMacIcon sx={{ fontSize: 40, color: "#9ca3af" }} />;
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 4 }}>
        Security & Login
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 6 }}>
        
        {/* Change Password */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 500, mb: 2 }}>Change Password</Typography>
          <Box sx={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 3 }}>
            <TextField
              label="Current Password"
              type="password"
              name="oldPassword"
              value={passwords.oldPassword}
              onChange={handlePassChange}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  color: "#fff", background: "rgba(255,255,255,0.02)",
                  "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                  "&:hover fieldset": { borderColor: "rgba(255,255,255,0.4)" },
                  "&.Mui-focused fieldset": { borderColor: "#7c5cfc" },
                },
                "& .MuiInputLabel-root": { color: "#9ca3af" },
                "& .MuiInputLabel-root.Mui-focused": { color: "#7c5cfc" },
              }}
            />
            <TextField
              label="New Password"
              type="password"
              name="newPassword"
              value={passwords.newPassword}
              onChange={handlePassChange}
              fullWidth
              sx={{
                 "& .MuiOutlinedInput-root": {
                  color: "#fff", background: "rgba(255,255,255,0.02)",
                  "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                  "&:hover fieldset": { borderColor: "rgba(255,255,255,0.4)" },
                  "&.Mui-focused fieldset": { borderColor: "#7c5cfc" },
                },
                "& .MuiInputLabel-root": { color: "#9ca3af" },
                "& .MuiInputLabel-root.Mui-focused": { color: "#7c5cfc" },
              }}
            />
            <TextField
              label="Confirm New Password"
              type="password"
              name="confirmPassword"
              value={passwords.confirmPassword}
              onChange={handlePassChange}
              fullWidth
              sx={{
                 "& .MuiOutlinedInput-root": {
                  color: "#fff", background: "rgba(255,255,255,0.02)",
                  "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                  "&:hover fieldset": { borderColor: "rgba(255,255,255,0.4)" },
                  "&.Mui-focused fieldset": { borderColor: "#7c5cfc" },
                },
                "& .MuiInputLabel-root": { color: "#9ca3af" },
                "& .MuiInputLabel-root.Mui-focused": { color: "#7c5cfc" },
              }}
            />
            <Button
              variant="contained"
              onClick={handleChangePassword}
              disabled={savingPass}
              sx={{
                alignSelf: "flex-start",
                background: "#7c5cfc", color: "#fff",
                px: 4, py: 1.5,
                borderRadius: "8px", fontWeight: 600, textTransform: "none",
                "&:hover": { background: "#6b4afc" },
                "&.Mui-disabled": { background: "rgba(124, 92, 252, 0.3)", color: "rgba(255,255,255,0.5)" }
              }}
            >
              {savingPass ? "Updating..." : "Update Password"}
            </Button>
          </Box>
        </Box>

        {/* Active Sessions */}
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: 2, flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 500 }}>Where You're Logged In</Typography>
              <Typography variant="body2" sx={{ color: "#9ca3af", mt: 0.5 }}>Manage your active sessions and devices.</Typography>
            </Box>
            <Button
              variant="outlined"
              color="error"
              onClick={handleLogoutAll}
              startIcon={<LogoutIcon />}
              sx={{ textTransform: "none", borderRadius: "8px" }}
            >
              Log out all devices
            </Button>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {loadingSessions ? (
              <Typography variant="body2" sx={{ color: "#9ca3af" }}>Loading sessions...</Typography>
            ) : sessions.length === 0 ? (
               <Typography variant="body2" sx={{ color: "#9ca3af" }}>No active sessions.</Typography>
            ) : (
              sessions.map(s => {
                const isCurrent = s.token === currentToken;
                return (
                  <Card key={s._id || s.token} sx={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 3 }}>
                    <CardContent sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: "16px !important" }}>
                      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                        {getDeviceIcon(s.deviceInfo)}
                        <Box>
                          <Typography variant="subtitle1" sx={{ color: "#fff", fontWeight: 500, display: "flex", alignItems: "center", gap: 1 }}>
                            {s.deviceInfo || "Unknown Device"} 
                            {isCurrent && <Typography variant="caption" sx={{ color: "#4ade80", background: "rgba(74, 222, 128, 0.1)", px: 1, py: 0.2, borderRadius: 1 }}>Current session</Typography>}
                          </Typography>
                          <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                            Last active: {new Date(s.lastActive).toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                      {!isCurrent && (
                        <Tooltip title="Log out this device">
                           <IconButton onClick={() => handleLogoutDevice(s.token)} sx={{ color: "rgba(255,255,255,0.5)", "&:hover": { color: "#ff6b6b", background: "rgba(255,107,107,0.1)" } }}>
                             <LogoutIcon />
                           </IconButton>
                        </Tooltip>
                      )}
                    </CardContent>
                  </Card>
                )
              })
            )}
          </Box>
        </Box>

      </Box>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast({ ...toast, open: false })} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={toast.severity} onClose={() => setToast({ ...toast, open: false })} sx={{ width: "100%", borderRadius: "8px" }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
