import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  ListItemIcon,
  Typography,
} from "@mui/material";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import RestoreIcon from "@mui/icons-material/Restore";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleAvatarClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNavigateProfile = () => {
    handleClose();
    navigate("/profile");
  };

  const handleLogout = () => {
    handleClose();
    logout();
  };

  // Extract initials if no profile picture
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
    <div
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        background: "#0d0d2b",
        padding: "10px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div 
        style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
        onClick={() => navigate("/home")}
      >
        <VideoCallIcon sx={{ color: "#7c5cfc", fontSize: "2.2rem" }} />
        <h2 style={{ color: "#fff", margin: 0, fontWeight: 700 }}>
          NexaMeet
        </h2>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Tooltip title="History">
          <IconButton onClick={() => navigate("/history")} sx={{ color: "#fff" }}>
            <RestoreIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Account settings">
          <IconButton
            onClick={handleAvatarClick}
            size="small"
            sx={{ ml: 1, padding: 0 }}
            aria-controls={open ? "account-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
          >
            <Avatar
              src={user?.profilePic || ""}
              sx={{
                width: 40,
                height: 40,
                bgcolor: user?.profilePic ? "transparent" : "#7c5cfc",
                color: "#fff",
                fontWeight: 600,
                border: "2px solid rgba(124, 92, 252, 0.3)",
              }}
            >
              {!user?.profilePic && getInitials(user?.name)}
            </Avatar>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          id="account-menu"
          open={open}
          onClose={handleClose}
          onClick={handleClose}
          PaperProps={{
            elevation: 0,
            sx: {
              background: "#1c1c2b",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.1)",
              overflow: "visible",
              filter: "drop-shadow(0px 8px 24px rgba(0,0,0,0.5))",
              mt: 1.5,
              "& .MuiAvatar-root": {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
              "&:before": {
                content: '""',
                display: "block",
                position: "absolute",
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: "#1c1c2b",
                transform: "translateY(-50%) rotate(45deg)",
                zIndex: 0,
                borderTop: "1px solid rgba(255,255,255,0.1)",
                borderLeft: "1px solid rgba(255,255,255,0.1)",
              },
            },
          }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <div style={{ padding: "8px 20px 12px", outline: "none" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {user?.name || "User"}
            </Typography>
            <Typography variant="body2" sx={{ color: "#9ca3af" }}>
              {user?.email || ""}
            </Typography>
          </div>
          
          <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />
          
          <MenuItem onClick={handleNavigateProfile} sx={{ py: 1.5, "&:hover": { background: "rgba(255,255,255,0.05)" } }}>
            <ListItemIcon>
              <PersonIcon sx={{ color: "#a78bfa" }} fontSize="small" />
            </ListItemIcon>
            Profile
          </MenuItem>
          
          <MenuItem onClick={handleLogout} sx={{ py: 1.5, "&:hover": { background: "rgba(255,255,255,0.05)" } }}>
            <ListItemIcon>
              <LogoutIcon sx={{ color: "#ff6b6b" }} fontSize="small" />
            </ListItemIcon>
            <Typography sx={{ color: "#ff6b6b" }}>Logout</Typography>
          </MenuItem>
        </Menu>
      </div>
    </div>
  );
}
