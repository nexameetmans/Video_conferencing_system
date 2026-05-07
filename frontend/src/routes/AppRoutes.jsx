import { Route, Routes } from "react-router-dom";
import React, { Suspense, lazy } from "react";
import LandingPage from "../pages/landing";
import Authentication from "../pages/authentication";

const VideoMeetComponent = lazy(() => import("../pages/VideoMeet"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const History = lazy(() => import("../pages/history"));
const MeetingTranscript = lazy(() => import("../pages/MeetingTranscript"));
const Profile = lazy(() => import("../pages/Profile"));

export default function AppRoutes() {
    return (
        <Suspense fallback={<div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#fff'}}>Loading...</div>}>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<Authentication />} />
                <Route path="/home" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/history" element={<History />} />
                <Route path="/meeting/:meetingCode" element={<MeetingTranscript />} />
                <Route path="/:url" element={<VideoMeetComponent />} />
            </Routes>
        </Suspense>
    );
}
