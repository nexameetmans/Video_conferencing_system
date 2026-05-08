import React, { useEffect, useState, useRef, useCallback, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { TextField, Button, Tooltip } from '@mui/material';
import styles from '../styles/videoComponent.module.css';

import useMediaStream from '../hooks/useMediaStream';
import useWebRTC from '../hooks/useWebRTC';
import useCaptions from '../hooks/useCaptions';
import VideoGrid from '../components/VideoGrid';
import ChatPanel from '../components/ChatPanel';
import MeetingControls from '../components/MeetingControls';
import CaptionsOverlay from '../components/CaptionsOverlay';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import VideocamOffOutlinedIcon from '@mui/icons-material/VideocamOffOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import MoreVertIcon from '@mui/icons-material/MoreVert';

export default function VideoMeetComponent() {
    const navigate = useNavigate();

    const [askForUsername, setAskForUsername] = useState(true);
    const [username, setUsername] = useState("");
    const isEndingMeetingRef = useRef(false); // prevents host from being navigated away by their own meeting-ended event

    const [meetingTimer, setMeetingTimer] = useState('00:00');
    const timerStartRef = useRef(null);

    useEffect(() => {
        if (!askForUsername) {
            timerStartRef.current = Date.now();
            const tick = () => {
                const elapsed = Math.floor((Date.now() - timerStartRef.current) / 1000);
                const h = Math.floor(elapsed / 3600);
                const m = Math.floor((elapsed % 3600) / 60);
                const s = elapsed % 60;
                setMeetingTimer(
                    h > 0
                        ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
                        : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
                );
            };
            tick();
            const id = setInterval(tick, 1000);
            return () => clearInterval(id);
        }
    }, [askForUsername]);

    // ── Lobby device toggle states ──
    const [cameraOn, setCameraOn] = useState(true);
    const [micOn, setMicOn] = useState(true);
    const [lobbyStream, setLobbyStream] = useState(null);
    const [permissionError, setPermissionError] = useState('');
    const lobbyVideoRef = useRef(null);

    const {
        localVideoRef,
        video, audio, screen, screenAvailable,
        startMedia, getUserMedia, getDisplayMedia,
        stopAllTracks, toggleVideo, toggleAudio,
        toggleScreen, createBlackSilence,
        forceDisableVideo, forceDisableAudio
    } = useMediaStream();

    const handleMeetingEnded = useCallback(() => {
        // If we (the host) initiated the end, skip — handleEndMeeting handles navigation
        if (isEndingMeetingRef.current) return;
        alert("The host has ended the meeting for everyone.");
        stopAllTracks();
        navigate("/home");
    }, [stopAllTracks, navigate]);

    const {
        videos, messages, newMessages,
        participants, socketId,
        isSpeaking, mediaStatus, emitMediaStatus,
        sendMessage, resetNewMessages,
        connectToSocket, renegotiateAll,
        kickUser, muteAll, stopVideoAll, endMeetingAll, getSocket
    } = useWebRTC(createBlackSilence, forceDisableAudio, forceDisableVideo, handleMeetingEnded);

    const { captionsOn, toggleCaptions, captions, transcript } = useCaptions(getSocket(), username);
    const { endMeeting, addToUserHistory, joinMeeting: joinMeetingCtx } = useContext(AuthContext);
    const { url: meetingCode } = useParams();

    // ── Emit media status whenever audio/video toggles ──
    useEffect(() => {
        if (socketId && !askForUsername) {
            emitMediaStatus(!!audio, !!video);
        }
    }, [audio, video, socketId, askForUsername, emitMediaStatus]);

    // ── Lobby: start preview stream on mount ──
    useEffect(() => {
        if (!askForUsername) return;
        let cancelled = false;

        const startPreview = async () => {
            // Stop any existing lobby stream
            if (lobbyStream) {
                lobbyStream.getTracks().forEach(t => t.stop());
            }
            setPermissionError('');

            if (!cameraOn && !micOn) {
                if (lobbyVideoRef.current) lobbyVideoRef.current.srcObject = null;
                setLobbyStream(null);
                return;
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: cameraOn ? { facingMode: 'user' } : false,
                    audio: micOn,
                });
                if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

                stream.getAudioTracks().forEach(t => { t.enabled = micOn; });
                setLobbyStream(stream);

                if (cameraOn && lobbyVideoRef.current) {
                    lobbyVideoRef.current.srcObject = stream;
                } else if (lobbyVideoRef.current) {
                    lobbyVideoRef.current.srcObject = null;
                }
            } catch (err) {
                if (cancelled) return;
                console.error('Lobby media error:', err);
                if (err.name === 'NotAllowedError') {
                    setPermissionError('Camera/microphone access was denied. Please allow in browser settings.');
                } else if (err.name === 'NotFoundError') {
                    setPermissionError('No camera or microphone found. Please connect a device.');
                } else {
                    setPermissionError('Could not access media devices. Check browser permissions.');
                }
                setLobbyStream(null);
            }
        };

        startPreview();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cameraOn, micOn, askForUsername]);

    // Cleanup lobby stream on unmount
    useEffect(() => {
        return () => {
            if (lobbyStream) {
                lobbyStream.getTracks().forEach(t => t.stop());
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── In-meeting: react to video/audio state changes ──
    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia((stream) => renegotiateAll(stream));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [video, audio]);

    useEffect(() => {
        if (screen !== undefined) {
            getDisplayMedia((stream) => renegotiateAll(stream));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [screen]);

    const connect = useCallback(() => {
        // Stop lobby stream before joining meeting
        if (lobbyStream) {
            lobbyStream.getTracks().forEach(t => t.stop());
            setLobbyStream(null);
        }
        setAskForUsername(false);
        startMedia(cameraOn, micOn);
        connectToSocket(username);

        // Record this user as a participant in MongoDB
        joinMeetingCtx(meetingCode, username);
    }, [startMedia, connectToSocket, username, lobbyStream, cameraOn, micOn, joinMeetingCtx, meetingCode]);

    const handleLeaveCall = useCallback(async () => {
        stopAllTracks();

        // Save this meeting to the user's history (transcript/summary fetched from DB by backend)
        try {
            await addToUserHistory(meetingCode);
        } catch (err) {
            console.error("[handleLeaveCall] Could not save to history:", err);
        }

        navigate("/home");
    }, [stopAllTracks, addToUserHistory, meetingCode, navigate]);

    const handleEndMeeting = useCallback(async () => {
        // Mark that the host is ending — prevents handleMeetingEnded from navigating away
        isEndingMeetingRef.current = true;

        // Stop media immediately so UI feels responsive
        stopAllTracks();

        // Backend fetches transcript from DB, calls Gemini, saves to meetings collection
        try {
            const result = await endMeeting(meetingCode);
            // Pass transcript & summary directly — avoids DB lookup race condition
            await addToUserHistory(meetingCode, result.transcript || "", result.summary || "");
        } catch (err) {
            console.error("[handleEndMeeting]", err);
        }

        navigate("/history");
    }, [endMeeting, addToUserHistory, meetingCode, stopAllTracks, navigate]);

    const handleSendMessage = useCallback((messageText) => {
        sendMessage(messageText, username);
    }, [sendMessage, username]);



    // ── MEETING ROOM ──
    const [activeTab, setActiveTab] = useState(null); // 'chat' | 'people' | null

    const handleToggleChat = useCallback(() => {
        setActiveTab(prev => {
            if (prev !== 'chat') resetNewMessages();
            return prev === 'chat' ? null : 'chat';
        });
    }, [resetNewMessages]);

    const handleTogglePeople = useCallback(() => {
        setActiveTab(prev => (prev === 'people' ? null : 'people'));
    }, []);

    // ── LOBBY ──
    if (askForUsername) {
        return (
            <div className={styles.lobbyScreen}>
                <h2>Enter the Lobby</h2>
                <p style={{ color: "#9ca3af", fontSize: "0.95rem" }}>
                    Preview your camera and microphone before joining.
                </p>

                {/* Camera Preview */}
                <div className={styles.lobbyPreview}>
                    {!cameraOn && (
                        <div className={styles.cameraOffPlaceholder}>
                            <VideocamOffOutlinedIcon sx={{ fontSize: '3rem', color: '#475569', mb: 1 }} />
                            <span className={styles.cameraOffText}>Camera is off</span>
                        </div>
                    )}
                    <video
                        ref={lobbyVideoRef}
                        autoPlay
                        muted
                        style={{ display: cameraOn ? 'block' : 'none' }}
                    />
                </div>

                {/* Permission error banner */}
                {permissionError && (
                    <div className={styles.permissionError} style={{ marginBottom: '16px' }}>
                        <WarningAmberIcon sx={{ fontSize: '1.1rem', flexShrink: 0 }} />
                        <span>{permissionError}</span>
                    </div>
                )}



                {/* Name input + Toggles + Join button */}
                <div className={styles.lobbyForm}>
                    <TextField
                        id="lobby-username"
                        label="Your display name"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && username.trim() && connect()}
                        variant="outlined"
                        size="medium"
                        sx={{ minWidth: 220 }}
                    />

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={connect}
                        disabled={!username.trim()}
                        sx={{ height: 56, px: 3 }}
                    >
                        Join Meeting
                    </Button>

                    <Tooltip title={cameraOn ? "Turn off camera" : "Turn on camera"} placement="top">
                        <button
                            id="lobby-camera-toggle"
                            className={`${styles.lobbyToggleBtn} ${!cameraOn ? styles.lobbyToggleBtnOff : ''}`}
                            onClick={() => setCameraOn(prev => !prev)}
                            aria-label={cameraOn ? "Turn off camera" : "Turn on camera"}
                        >
                            {cameraOn
                                ? <VideocamIcon sx={{ fontSize: '1.5rem' }} />
                                : <VideocamOffIcon sx={{ fontSize: '1.5rem' }} />
                            }
                        </button>
                    </Tooltip>

                    <Tooltip title={micOn ? "Mute microphone" : "Unmute microphone"} placement="top">
                        <button
                            id="lobby-mic-toggle"
                            className={`${styles.lobbyToggleBtn} ${!micOn ? styles.lobbyToggleBtnOff : ''}`}
                            onClick={() => setMicOn(prev => !prev)}
                            aria-label={micOn ? "Mute microphone" : "Unmute microphone"}
                        >
                            {micOn
                                ? <MicIcon sx={{ fontSize: '1.5rem' }} />
                                : <MicOffIcon sx={{ fontSize: '1.5rem' }} />
                            }
                        </button>
                    </Tooltip>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.meetLayout}>
            <div className={`${styles.mainVideoArea} ${activeTab ? styles.withSidebar : ''} relative`}>



                <div className={styles.videoGridWrapper}>
                    <VideoGrid
                        videos={videos}
                        localVideoRef={localVideoRef}
                        localAudio={audio}
                        localVideo={video}
                        localUsername={username}
                        participants={participants}
                        socketId={socketId}
                        mediaStatus={mediaStatus}
                    />
                </div>

                <CaptionsOverlay captions={captions} />

                <MeetingControls
                    video={video}
                    audio={audio}
                    screen={screen}
                    screenAvailable={screenAvailable}
                    captionsOn={captionsOn}
                    newMessages={newMessages}
                    participantsCount={participants.length}
                    meetingCode={meetingCode}
                    meetingTimer={meetingTimer}
                    onToggleVideo={toggleVideo}
                    onToggleAudio={toggleAudio}
                    onToggleScreen={toggleScreen}
                    onToggleCaptions={toggleCaptions}
                    onToggleChat={handleToggleChat}
                    onTogglePeople={handleTogglePeople}
                    onLeaveCall={handleLeaveCall}
                    onEndMeetingAll={() => { endMeetingAll(); handleEndMeeting(); }}
                    isHost={participants.find(u => u.socketId === socketId)?.role === "host"}
                    activeTab={activeTab}
                />
            </div>

            {activeTab === 'chat' && (
                <div className={styles.sidebarPanel}>
                    <ChatPanel
                        messages={messages}
                        onSendMessage={handleSendMessage}
                        onClose={() => setActiveTab(null)}
                    />
                </div>
            )}

            {activeTab === 'people' && (
                <div className={styles.sidebarPanel}>
                    {/* Simplified Participants Panel inline since we can't create complex new files unless necessary */}
                    <div className={styles.chatRoom}>
                        <div className={styles.chatContainer}>
                            <div className={styles.sidebarHeader}>
                                <h1>People</h1>
                                <button className={styles.closeBtn} onClick={() => setActiveTab(null)}>✕</button>
                            </div>
                            <div className={styles.participantsList}>
                                {participants.map(p => {
                                    const pStatus = mediaStatus?.[p.socketId] || {};
                                    const pMicOn = p.socketId === socketId ? !!audio : (pStatus.micOn !== undefined ? pStatus.micOn : true);
                                    const pVideoOn = p.socketId === socketId ? !!video : (pStatus.videoOn !== undefined ? pStatus.videoOn : true);
                                    const pSpeaking = pStatus.isSpeaking || false;

                                    return (
                                        <div
                                            key={p.socketId}
                                            className={styles.participantItem}
                                            style={pSpeaking ? { background: 'rgba(52,211,153,0.08)', borderLeft: '3px solid #34d399' } : {}}
                                        >
                                            {/* Speaking indicator dot */}
                                            {pSpeaking && <div className={styles.speakingDot} />}

                                            <div className={styles.participantAvatar}>
                                                {p.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div className={styles.participantInfo}>
                                                <span className={styles.participantName}>
                                                    {p.username} {p.socketId === socketId ? '(You)' : ''}
                                                    {p.role === 'host' && (
                                                        <span className={styles.hostBadge}>Host</span>
                                                    )}
                                                </span>
                                            </div>
                                            <div className={styles.participantAction}>
                                                {/* Kick button — host only */}
                                                {participants.find(u => u.socketId === socketId)?.role === 'host' && p.socketId !== socketId && (
                                                    <Button
                                                        size="small"
                                                        color="error"
                                                        onClick={() => kickUser(p.socketId)}
                                                        sx={{ mr: 1, textTransform: 'none', fontSize: '0.75rem' }}
                                                    >
                                                        Kick
                                                    </Button>
                                                )}

                                                {/* Video status */}
                                                <Tooltip title={pVideoOn ? 'Camera On' : 'Camera Off'}>
                                                    <span style={{ display: 'inline-flex', marginRight: 4 }}>
                                                        {pVideoOn
                                                            ? <VideocamIcon sx={{ fontSize: '1.2rem', color: '#fff' }} />
                                                            : <VideocamOffIcon sx={{ fontSize: '1.2rem', color: '#ea4335' }} />
                                                        }
                                                    </span>
                                                </Tooltip>

                                                {/* Mic status */}
                                                <Tooltip title={pMicOn ? 'Mic On' : 'Mic Off'}>
                                                    <span style={{ display: 'inline-flex' }}>
                                                        {pMicOn
                                                            ? <MicIcon sx={{ fontSize: '1.2rem', color: pSpeaking ? '#34d399' : '#fff' }} />
                                                            : <MicOffIcon sx={{ fontSize: '1.2rem', color: '#ea4335' }} />
                                                        }
                                                    </span>
                                                </Tooltip>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
