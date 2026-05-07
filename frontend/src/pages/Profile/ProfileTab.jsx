import React, { useState, useEffect } from "react";
import { Box, Typography, TextField, Button, Avatar, IconButton, Skeleton, Alert, Snackbar } from "@mui/material";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import { useAuth } from "../../contexts/AuthContext";

export default function ProfileTab() {
  const { user, getProfile, updateProfile } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile();
        setProfileData({ ...data, name: data.name || "" });
      } catch (err) {
        console.error(err);
        setToast({ open: true, message: "Failed to load profile", severity: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNameChange = (e) => {
    setProfileData({ ...profileData, name: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setToast({ open: true, message: "Image must be less than 2MB", severity: "error" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({ ...profileData, profilePic: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await updateProfile({
        name: profileData.name,
        profilePic: profileData.profilePic,
      });
      setToast({ open: true, message: "Profile updated successfully!", severity: "success" });
    } catch (err) {
      console.error(err);
      setToast({ open: true, message: "Failed to update profile", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Skeleton variant="circular" width={100} height={100} sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />
        <Skeleton variant="rounded" height={56} sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />
        <Skeleton variant="rounded" height={56} sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />
      </Box>
    );
  }

  // Extract initials
  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 4 }}>
        Basic Information
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
          <Box sx={{ position: "relative" }}>
            <Avatar
              src={profileData?.profilePic || ""}
              sx={{
                width: 100,
                height: 100,
                bgcolor: profileData?.profilePic ? "transparent" : "#7c5cfc",
                fontSize: "2.5rem",
                fontWeight: 600,
              }}
            >
              {!profileData?.profilePic && getInitials(profileData?.name || user?.name)}
            </Avatar>
            <input
              accept="image/*"
              style={{ display: "none" }}
              id="icon-button-file"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="icon-button-file">
              <IconButton
                color="primary"
                aria-label="upload picture"
                component="span"
                sx={{
                  position: "absolute",
                  bottom: -5,
                  right: -5,
                  background: "#7c5cfc",
                  color: "#fff",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
                  "&:hover": { background: "#6b4afc" },
                }}
              >
                <PhotoCameraIcon fontSize="small" />
              </IconButton>
            </label>
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>Profile Picture</Typography>
            <Typography variant="body2" sx={{ color: "#9ca3af" }}>JPG, GIF or PNG. Max size 2MB</Typography>
          </Box>
        </Box>

        <Box sx={{ width: "100%", maxWidth: 500, display: "flex", flexDirection: "column", gap: 3 }}>
          <TextField
            label="Name"
            variant="outlined"
            fullWidth
            value={profileData?.name || ""}
            onChange={handleNameChange}
            sx={{
              "& .MuiOutlinedInput-root": {
                color: "#fff",
                background: "rgba(255,255,255,0.02)",
                "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                "&:hover fieldset": { borderColor: "rgba(255,255,255,0.4)" },
                "&.Mui-focused fieldset": { borderColor: "#7c5cfc" },
              },
              "& .MuiInputLabel-root": { color: "#9ca3af" },
              "& .MuiInputLabel-root.Mui-focused": { color: "#7c5cfc" },
            }}
          />

          <TextField
            label="Email Address"
            variant="outlined"
            fullWidth
            disabled
            value={profileData?.email || ""}
            sx={{
              "& .MuiOutlinedInput-root": {
                color: "rgba(255,255,255,0.6)",
                background: "rgba(255,255,255,0.05)",
                "& fieldset": { borderColor: "transparent" },
              },
              "& .MuiInputLabel-root": { color: "#9ca3af" },
            }}
          />

          <TextField
            label="User ID"
            variant="outlined"
            fullWidth
            disabled
            value={profileData?.id || ""}
            sx={{
              "& .MuiOutlinedInput-root": {
                color: "rgba(255,255,255,0.6)",
                background: "rgba(255,255,255,0.05)",
                "& fieldset": { borderColor: "transparent" },
              },
              "& .MuiInputLabel-root": { color: "#9ca3af" },
            }}
          />

          <Button
            variant="contained"
            onClick={handleUpdate}
            disabled={saving}
            sx={{
              alignSelf: "flex-start",
              background: "#7c5cfc",
              color: "#fff",
              px: 4,
              py: 1.5,
              mt: 2,
              borderRadius: "8px",
              fontWeight: 600,
              textTransform: "none",
              boxShadow: "0 4px 14px rgba(124, 92, 252, 0.4)",
              "&:hover": {
                background: "#6b4afc",
                boxShadow: "0 6px 20px rgba(124, 92, 252, 0.6)",
              },
              "&.Mui-disabled": {
                background: "rgba(124, 92, 252, 0.3)",
                color: "rgba(255,255,255,0.5)",
              }
            }}
          >
            {saving ? "Updating..." : "Update Profile"}
          </Button>
        </Box>
      </Box>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast({ ...toast, open: false })}
          sx={{ width: "100%", borderRadius: "8px" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
