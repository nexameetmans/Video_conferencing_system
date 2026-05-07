import React, { useState } from "react";
import { Container, Grid, Paper, List, ListItem, ListItemIcon, ListItemText, Typography, Box } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import SecurityIcon from "@mui/icons-material/Security";
import VideocamIcon from "@mui/icons-material/Videocam";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { IconButton, Tooltip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import withAuth from "../../utils/withAuth";

import ProfileTab from "./ProfileTab";
import SecurityTab from "./SecurityTab";
import MeetingsTab from "./MeetingsTab";

function Profile() {
  const [activeTab, setActiveTab] = useState("profile");
  const navigate = useNavigate();

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileTab />;
      case "security":
        return <SecurityTab />;
      case "meetings":
        return <MeetingsTab />;
      default:
        return <ProfileTab />;
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "#06061a",
        color: "#fff",
        py: 4,
        px: { xs: 2, md: 6 },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", mb: 4, gap: 2 }}>
        <Tooltip title="Back to Dashboard">
          <IconButton onClick={() => navigate("/home")} sx={{ color: "#a78bfa" }}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Account Settings
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Sidebar */}
        <Grid item xs={12} md={3}>
          <Paper
            elevation={0}
            sx={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <List component="nav" sx={{ p: 0 }}>
              <ListItem
                button
                selected={activeTab === "profile"}
                onClick={() => setActiveTab("profile")}
                sx={{
                  py: 2,
                  "&.Mui-selected": {
                    background: "rgba(124, 92, 252, 0.15)",
                    borderLeft: "4px solid #7c5cfc",
                  },
                  "&:hover": { background: "rgba(255,255,255,0.08)" },
                }}
              >
                <ListItemIcon sx={{ color: activeTab === "profile" ? "#7c5cfc" : "#9ca3af", minWidth: 40 }}>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Profile"
                  primaryTypographyProps={{
                    fontWeight: activeTab === "profile" ? 600 : 400,
                    color: activeTab === "profile" ? "#fff" : "#9ca3af",
                  }}
                />
              </ListItem>

              <ListItem
                button
                selected={activeTab === "security"}
                onClick={() => setActiveTab("security")}
                sx={{
                  py: 2,
                  "&.Mui-selected": {
                    background: "rgba(124, 92, 252, 0.15)",
                    borderLeft: "4px solid #7c5cfc",
                  },
                  "&:hover": { background: "rgba(255,255,255,0.08)" },
                }}
              >
                <ListItemIcon sx={{ color: activeTab === "security" ? "#7c5cfc" : "#9ca3af", minWidth: 40 }}>
                  <SecurityIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Security"
                  primaryTypographyProps={{
                    fontWeight: activeTab === "security" ? 600 : 400,
                    color: activeTab === "security" ? "#fff" : "#9ca3af",
                  }}
                />
              </ListItem>

              <ListItem
                button
                selected={activeTab === "meetings"}
                onClick={() => setActiveTab("meetings")}
                sx={{
                  py: 2,
                  "&.Mui-selected": {
                    background: "rgba(124, 92, 252, 0.15)",
                    borderLeft: "4px solid #7c5cfc",
                  },
                  "&:hover": { background: "rgba(255,255,255,0.08)" },
                }}
              >
                <ListItemIcon sx={{ color: activeTab === "meetings" ? "#7c5cfc" : "#9ca3af", minWidth: 40 }}>
                  <VideocamIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Meetings"
                  primaryTypographyProps={{
                    fontWeight: activeTab === "meetings" ? 600 : 400,
                    color: activeTab === "meetings" ? "#fff" : "#9ca3af",
                  }}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Content Area */}
        <Grid item xs={12} md={9}>
          <Paper
            elevation={0}
            sx={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 3,
              p: { xs: 3, md: 5 },
              color: "#fff",
            }}
          >
            {renderContent()}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default withAuth(Profile);
