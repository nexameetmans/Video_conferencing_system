import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Container, Box, Paper, Typography, TextField, Button,
  IconButton, InputAdornment, CircularProgress, Snackbar, Alert,
  LinearProgress, Tabs, Tab, Stepper, Step, StepLabel, Fade,
  CssBaseline
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import { ThemeProvider, createTheme } from '@mui/material/styles';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#06061a',
      paper: '#0d0d2b',
    },
    primary: {
      main: '#7c5cfc',
    },
    secondary: {
      main: '#00d4ff',
    },
    text: {
      primary: '#ffffff',
      secondary: '#9ca3af',
    },
    error: {
      main: '#ef4444',
    },
    success: {
      main: '#22c55e',
    }
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.02em',
    }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(124, 92, 252, 0.2)',
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 12,
            transition: 'all 0.2s ease-in-out',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.1)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#7c5cfc',
            },
            '&.Mui-focused': {
              backgroundColor: 'rgba(124, 92, 252, 0.05)',
            }
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '12px 24px',
        },
        contained: {
          background: 'linear-gradient(135deg, #7c5cfc 0%, #00d4ff 100%)',
          color: '#ffffff',
          '&:hover': {
            background: 'linear-gradient(135deg, #6b4de3 0%, #00b9e6 100%)',
            boxShadow: '0 4px 20px rgba(124, 92, 252, 0.4)',
          }
        }
      }
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          textTransform: 'none',
          fontSize: '1rem',
          minHeight: 48,
        }
      }
    }
  }
});

/* ─── Password strength calculator ───────────────────── */
const getPasswordStrength = (pwd) => {
  if (!pwd) return { score: 0, label: "", color: "inherit" };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (pwd.length >= 12) score++;

  const map = [
    { label: "Very Weak", color: "error" },
    { label: "Weak", color: "error" },
    { label: "Fair", color: "warning" },
    { label: "Good", color: "success" },
    { label: "Strong", color: "success" },
    { label: "Very Strong", color: "success" },
  ];
  return { score, label: map[score].label, color: map[score].color, value: Math.max(10, score * 20) };
};

/* ─── OTP Countdown hook ──────────────────────────────── */
const OTP_TTL = 5 * 60; // 5 minutes in seconds
const RESEND_COOLDOWN = 60; // seconds before "Resend Code" becomes clickable

const useCountdown = (active) => {
  const [seconds, setSeconds] = useState(OTP_TTL);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);
  const intervalRef = useRef(null);

  const reset = useCallback(() => {
    setSeconds(OTP_TTL);
    setResendCooldown(RESEND_COOLDOWN);
  }, []);

  useEffect(() => {
    if (!active) return;
    setSeconds(OTP_TTL);
    setResendCooldown(RESEND_COOLDOWN);
    intervalRef.current = setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0));
      setResendCooldown((r) => (r > 0 ? r - 1 : 0));
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [active]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const canResend = resendCooldown === 0;
  return { display: `${mm}:${ss}`, expired: seconds === 0, canResend, resendCooldown, reset };
};


export default function Authentication() {
  const location = useLocation();
  const [mode, setMode] = useState(0); // 0 = login, 1 = signup

  useEffect(() => {
    if (location.state?.mode === "register") {
      setMode(1);
    } else if (location.state?.mode === "login") {
      setMode(0);
    }
  }, [location.state]);
  const [step, setStep] = useState(0); // 0 = email, 1 = otp, 2 = details

  const [forgotPassword, setForgotPassword] = useState(false); // Forgot password mode
  const [forgotStep, setForgotStep] = useState(0); // 0 = email, 1 = otp, 2 = new password

  /* shared */
  const [email, setEmail] = useState("");

  /* login */
  const [loginPwd, setLoginPwd] = useState("");
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  /* otp */
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const otpRefs = Array.from({ length: 6 }, () => useRef(null));

  /* forgot password */
  const [forgotOtpDigits, setForgotOtpDigits] = useState(["", "", "", "", "", ""]);
  const forgotOtpRefs = Array.from({ length: 6 }, () => useRef(null));
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewPasswordConfirm, setShowNewPasswordConfirm] = useState(false);

  /* registration */
  const [regName, setRegName] = useState("");
  const [regPwd, setRegPwd] = useState("");
  const [regPwdConfirm, setRegPwdConfirm] = useState("");
  const [showRegPwd, setShowRegPwd] = useState(false);
  const [showRegPwdConfirm, setShowRegPwdConfirm] = useState(false);

  /* ui state */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", severity: "success" });

  const { sendOTP, verifyOTP, handleRegister, handleLogin, forgotPasswordSendOTP, forgotPasswordVerifyOTP, resetPassword } = useAuth();

  const strength = getPasswordStrength(regPwd);
  const otpActive = mode === 1 && step === 1;
  const countdown = useCountdown(otpActive);

  const forgotOtpActive = forgotPassword && forgotStep === 1;
  const forgotCountdown = useCountdown(forgotOtpActive);

  const showToast = (message, severity = "success") => {
    setToast({ show: true, message, severity });
  };

  const handleCloseToast = () => {
    setToast(prev => ({ ...prev, show: false }));
  };

  const clearError = () => setError("");

  const handleTabChange = (event, newValue) => {
    setMode(newValue);
    setStep(0);
    setError("");
    setEmail("");
    setLoginPwd("");
    setOtpDigits(["", "", "", "", "", ""]);
    setRegName("");
    setRegPwd("");
    setRegPwdConfirm("");
  };

  /* ───── OTP ────────────────────────── */
  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/, "").slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    clearError();
    if (digit && index < 5) otpRefs[index + 1].current?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) otpRefs[index - 1].current?.focus();
    if (e.key === "ArrowRight" && index < 5) otpRefs[index + 1].current?.focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtpDigits(pasted.split(""));
      otpRefs[5].current?.focus();
    }
  };

  /* ───── Actions ───────────────────────────────────── */
  const handleLoginSubmit = async (e) => {
    e?.preventDefault();
    if (!email.trim() || !loginPwd) { setError("Email and password are required"); return; }
    setLoading(true); clearError();
    try {
      await handleLogin(email.trim(), loginPwd);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e) => {
    e?.preventDefault();
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }
    setLoading(true); clearError();
    try {
      await sendOTP(email.trim());
      showToast("OTP sent! Check your inbox.");
      setStep(1);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!countdown.canResend) return;
    setLoading(true); clearError(); setOtpDigits(["", "", "", "", "", ""]);
    try {
      await sendOTP(email.trim());
      countdown.reset();
      showToast("New OTP sent successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e?.preventDefault();
    const otp = otpDigits.join("");
    if (otp.length !== 6) { setError("Please enter all 6 digits"); return; }
    setLoading(true); clearError();
    try {
      await verifyOTP(email.trim(), otp);
      showToast("Email verified! Complete your profile.");
      setStep(2);
    } catch (err) {
      // Show the exact server error so the user gets a meaningful message
      setError(err.response?.data?.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e?.preventDefault();
    if (!regName.trim()) { setError("Full name is required"); return; }
    if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[a-z]).{8,}$/.test(regPwd)) {
      setError("Password must be at least 8 characters long and include uppercase, lowercase, and a number");
      return;
    }
    if (regPwd !== regPwdConfirm) { setError("Passwords do not match"); return; }
    setLoading(true); clearError();
    try {
      await handleRegister(email.trim(), regName.trim(), regPwd);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ───── Forgot Password Handlers ────────────────────── */
  const handleForgotPasswordClick = () => {
    setForgotPassword(true);
    setForgotStep(0);
    setEmail("");
    setError("");
    setForgotOtpDigits(["", "", "", "", "", ""]);
    setNewPassword("");
    setNewPasswordConfirm("");
  };

  const handleBackFromForgotPassword = () => {
    setForgotPassword(false);
    setForgotStep(0);
    setEmail("");
    setError("");
    setForgotOtpDigits(["", "", "", "", "", ""]);
    setNewPassword("");
    setNewPasswordConfirm("");
  };

  const handleForgotPasswordSendOTP = async (e) => {
    e?.preventDefault();
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }
    setLoading(true); clearError();
    try {
      await forgotPasswordSendOTP(email.trim());
      showToast("OTP sent to your email address!");
      setForgotStep(1);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordOtpChange = (index, value) => {
    const digit = value.replace(/\D/, "").slice(-1);
    const next = [...forgotOtpDigits];
    next[index] = digit;
    setForgotOtpDigits(next);
    clearError();
    if (digit && index < 5) forgotOtpRefs[index + 1].current?.focus();
  };

  const handleForgotPasswordOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !forgotOtpDigits[index] && index > 0) {
      forgotOtpRefs[index - 1].current?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) forgotOtpRefs[index - 1].current?.focus();
    if (e.key === "ArrowRight" && index < 5) forgotOtpRefs[index + 1].current?.focus();
  };

  const handleForgotPasswordOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setForgotOtpDigits(pasted.split(""));
      forgotOtpRefs[5].current?.focus();
    }
  };

  const handleForgotPasswordVerifyOTP = async (e) => {
    e?.preventDefault();
    const otp = forgotOtpDigits.join("");
    if (otp.length !== 6) { setError("Please enter all 6 digits"); return; }
    setLoading(true); clearError();
    try {
      await forgotPasswordVerifyOTP(email.trim(), otp);
      showToast("Email verified! Please set your new password.");
      setForgotStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordResendOTP = async () => {
    if (!forgotCountdown.canResend) return;
    setLoading(true); clearError(); setForgotOtpDigits(["", "", "", "", "", ""]);
    try {
      await forgotPasswordSendOTP(email.trim());
      forgotCountdown.reset();
      showToast("New OTP sent successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e?.preventDefault();
    if (!newPassword) { setError("New password is required"); return; }
    if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[a-z]).{8,}$/.test(newPassword)) {
      setError("Password must be at least 8 characters long and include uppercase, lowercase, and a number");
      return;
    }
    if (newPassword !== newPasswordConfirm) { setError("Passwords do not match"); return; }
    setLoading(true); clearError();
    try {
      await resetPassword(email.trim(), newPassword);
      showToast("Password reset successfully! Please sign in.");
      handleBackFromForgotPassword();
    } catch (err) {
      setError(err.response?.data?.message || "Password reset failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        py: 4,
        px: 2
      }}>
        {/* Decorative Blobs */}
        <Box sx={{
          position: 'absolute', top: '-10%', left: '-5%', width: 500, height: 500,
          borderRadius: '50%', background: 'radial-gradient(circle, #7c5cfc, transparent 70%)',
          filter: 'blur(80px)', opacity: 0.15, pointerEvents: 'none'
        }} />
        <Box sx={{
          position: 'absolute', bottom: '-10%', right: '-5%', width: 400, height: 400,
          borderRadius: '50%', background: 'radial-gradient(circle, #00d4ff, transparent 70%)',
          filter: 'blur(80px)', opacity: 0.1, pointerEvents: 'none'
        }} />

        <Snackbar
          open={toast.show}
          autoHideDuration={4000}
          onClose={handleCloseToast}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseToast} severity={toast.severity} variant="filled" sx={{ width: '100%' }}>
            {toast.message}
          </Alert>
        </Snackbar>

        <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box 
              component={Link} 
              to="/" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '10px', 
                mb: 1,
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'opacity 0.2s ease',
                '&:hover': { opacity: 0.8 }
              }}
            >
              <VideoCallIcon sx={{ color: "#7c5cfc", fontSize: "2.2rem" }} />
              <h2 style={{ 
                margin: 0, 
                fontWeight: 800, 
                fontSize: "1.7rem", 
                letterSpacing: "-0.02em",
                background: "linear-gradient(135deg, #a78bfa, #00d4ff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent" 
              }}>NexaMeet</h2>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {forgotPassword ? "Reset your password securely" :
                mode === 0 ? "Sign in to your account" :
                step === 0 ? "Create your account to get started" :
                  step === 1 ? "Verify your email address" : "Complete your profile details"}
            </Typography>
          </Box>

          <Fade in={true} timeout={600}>
            <Paper elevation={24} sx={{ p: { xs: 3, sm: 4 }, backdropFilter: 'blur(20px)', backgroundColor: 'rgba(13, 13, 43, 0.8)' }}>

              {!forgotPassword && (
                <Tabs
                  value={mode}
                  onChange={handleTabChange}
                  variant="fullWidth"
                  sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
                >
                  <Tab label="Sign In" />
                  <Tab label="Register" />
                </Tabs>
              )}

              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

              {/* ── LOGIN ── */}
              {mode === 0 && !forgotPassword && (
                <Box component="form" onSubmit={handleLoginSubmit} noValidate>
                  <TextField
                    fullWidth
                    label="Email Address"
                    variant="outlined"
                    margin="normal"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); clearError(); }}
                    autoComplete="email"
                    autoFocus
                  />
                  <TextField
                    fullWidth
                    label="Password"
                    variant="outlined"
                    margin="normal"
                    type={showLoginPwd ? 'text' : 'password'}
                    value={loginPwd}
                    onChange={(e) => { setLoginPwd(e.target.value); clearError(); }}
                    autoComplete="current-password"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowLoginPwd(!showLoginPwd)} edge="end" sx={{ color: 'text.secondary' }}>
                            {showLoginPwd ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Button 
                      type="button" 
                      variant="text" 
                      size="small" 
                      onClick={handleForgotPasswordClick}
                      sx={{ textTransform: 'none', color: 'secondary.main', p: 0 }}
                    >
                      Forgot password?
                    </Button>
                  </Box>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{ mt: 1, mb: 1 }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : "Sign In"}
                  </Button>
                </Box>
              )}

              {/* ── FORGOT PASSWORD ── */}
              {forgotPassword && (
                <Box>
                  <Stepper activeStep={forgotStep} alternativeLabel sx={{ mb: 4 }}>
                    {['Email', 'Verify', 'New Password'].map((label) => (
                      <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>

                  {/* Step 0: Email */}
                  {forgotStep === 0 && (
                    <Box component="form" onSubmit={handleForgotPasswordSendOTP} noValidate>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Enter your email address and we'll send you a code to reset your password.
                      </Typography>
                      <TextField
                        fullWidth
                        label="Email Address"
                        variant="outlined"
                        margin="normal"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); clearError(); }}
                        autoComplete="email"
                        autoFocus
                      />
                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={loading || !email}
                        sx={{ mt: 3 }}
                      >
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Send Verification Code"}
                      </Button>
                      <Button fullWidth variant="text" size="small" onClick={handleBackFromForgotPassword} sx={{ mt: 2, color: 'text.secondary' }}>
                        Back to Sign In
                      </Button>
                    </Box>
                  )}

                  {/* Step 1: OTP */}
                  {forgotStep === 1 && (
                    <Box component="form" onSubmit={handleForgotPasswordVerifyOTP} noValidate>
                      <Typography variant="body2" align="center" color="text.secondary" gutterBottom>
                        Sent to <Box component="span" fontWeight="bold" color="secondary.main">{email}</Box>
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', my: 3 }} onPaste={handleForgotPasswordOtpPaste}>
                        {forgotOtpDigits.map((digit, i) => (
                          <TextField
                            key={i}
                            inputRef={forgotOtpRefs[i]}
                            value={digit}
                            onChange={(e) => handleForgotPasswordOtpChange(i, e.target.value)}
                            onKeyDown={(e) => handleForgotPasswordOtpKeyDown(i, e)}
                            inputProps={{
                              maxLength: 1,
                              style: { textAlign: 'center', fontSize: '1.25rem', fontWeight: 'bold', padding: '14px 0' }
                            }}
                            sx={{ width: 50 }}
                          />
                        ))}
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, px: 1 }}>
                        <Typography variant="caption" color={forgotCountdown.expired ? 'error' : 'text.secondary'} fontFamily="monospace">
                          {forgotCountdown.expired ? "Code expired" : `Expires in ${forgotCountdown.display}`}
                        </Typography>
                        <Button
                          variant="text"
                          size="small"
                          onClick={handleForgotPasswordResendOTP}
                          disabled={!forgotCountdown.canResend || loading}
                          sx={{ textTransform: 'none' }}
                        >
                          {forgotCountdown.canResend ? "Resend Code" : `Resend in ${forgotCountdown.resendCooldown}s`}
                        </Button>
                      </Box>

                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={loading || forgotOtpDigits.join("").length !== 6}
                      >
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Verify Code"}
                      </Button>

                      <Button fullWidth variant="text" size="small" onClick={() => setForgotStep(0)} sx={{ mt: 2, color: 'text.secondary' }}>
                        Change email address
                      </Button>
                    </Box>
                  )}

                  {/* Step 2: New Password */}
                  {forgotStep === 2 && (
                    <Box component="form" onSubmit={handleResetPassword} noValidate>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Set a new strong password for your account.
                      </Typography>

                      <TextField
                        fullWidth
                        label="New Password"
                        variant="outlined"
                        margin="normal"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); clearError(); }}
                        autoComplete="new-password"
                        autoFocus
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end" sx={{ color: 'text.secondary' }}>
                                {showNewPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />

                      {newPassword && (
                        <Box sx={{ mt: 1, mb: 2, px: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={getPasswordStrength(newPassword).value}
                            color={getPasswordStrength(newPassword).color}
                            sx={{ height: 6, borderRadius: 3, mb: 0.5, backgroundColor: 'rgba(255,255,255,0.1)' }}
                          />
                          <Typography variant="caption" color={`${getPasswordStrength(newPassword).color}.main`}>
                            {getPasswordStrength(newPassword).label}
                          </Typography>
                        </Box>
                      )}

                      <TextField
                        fullWidth
                        label="Confirm Password"
                        variant="outlined"
                        margin="normal"
                        type={showNewPasswordConfirm ? 'text' : 'password'}
                        value={newPasswordConfirm}
                        error={Boolean(newPasswordConfirm && newPassword !== newPasswordConfirm)}
                        helperText={newPasswordConfirm && newPassword !== newPasswordConfirm ? "Passwords do not match" : ""}
                        onChange={(e) => { setNewPasswordConfirm(e.target.value); clearError(); }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowNewPasswordConfirm(!showNewPasswordConfirm)} edge="end" sx={{ color: 'text.secondary' }}>
                                {showNewPasswordConfirm ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />

                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={loading}
                        sx={{ mt: 3 }}
                      >
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Reset Password"}
                      </Button>

                      <Button fullWidth variant="text" size="small" onClick={handleBackFromForgotPassword} sx={{ mt: 2, color: 'text.secondary' }}>
                        Back to Sign In
                      </Button>
                    </Box>
                  )}
                </Box>
              )}

              {/* ── SIGNUP ── */}
              {mode === 1 && (
                <Box>
                  <Stepper activeStep={step} alternativeLabel sx={{ mb: 4 }}>
                    {['Email', 'Verify', 'Profile'].map((label) => (
                      <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>

                  {/* Step 0: Email */}
                  {step === 0 && (
                    <Box component="form" onSubmit={handleSendOTP} noValidate>
                      <TextField
                        fullWidth
                        label="Email Address"
                        variant="outlined"
                        margin="normal"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); clearError(); }}
                        autoComplete="email"
                        autoFocus
                        helperText="We'll send a verification code to this email."
                      />
                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={loading || !email}
                        sx={{ mt: 3 }}
                      >
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Send Verification Code"}
                      </Button>
                    </Box>
                  )}

                  {/* Step 1: OTP */}
                  {step === 1 && (
                    <Box component="form" onSubmit={handleVerifyOTP} noValidate>
                      <Typography variant="body2" align="center" color="text.secondary" gutterBottom>
                        Sent to <Box component="span" fontWeight="bold" color="secondary.main">{email}</Box>
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', my: 3 }} onPaste={handleOtpPaste}>
                        {otpDigits.map((digit, i) => (
                          <TextField
                            key={i}
                            inputRef={otpRefs[i]}
                            value={digit}
                            onChange={(e) => handleOtpChange(i, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                            inputProps={{
                              maxLength: 1,
                              style: { textAlign: 'center', fontSize: '1.25rem', fontWeight: 'bold', padding: '14px 0' }
                            }}
                            sx={{ width: 50 }}
                          />
                        ))}
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, px: 1 }}>
                        <Typography variant="caption" color={countdown.expired ? 'error' : 'text.secondary'} fontFamily="monospace">
                          {countdown.expired ? "Code expired" : `Expires in ${countdown.display}`}
                        </Typography>
                        <Button
                          variant="text"
                          size="small"
                          onClick={handleResendOTP}
                          disabled={!countdown.canResend || loading}
                          sx={{ textTransform: 'none' }}
                        >
                          {countdown.canResend ? "Resend Code" : `Resend in ${countdown.resendCooldown}s`}
                        </Button>
                      </Box>

                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={loading || otpDigits.join("").length !== 6}
                      >
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Verify Code"}
                      </Button>

                      <Button fullWidth variant="text" size="small" onClick={() => setStep(0)} sx={{ mt: 2, color: 'text.secondary' }}>
                        Change email address
                      </Button>
                    </Box>
                  )}

                  {/* Step 2: Details */}
                  {step === 2 && (
                    <Box component="form" onSubmit={handleRegisterSubmit} noValidate>
                      <TextField
                        fullWidth
                        label="Full Name"
                        variant="outlined"
                        margin="normal"
                        value={regName}
                        onChange={(e) => { setRegName(e.target.value); clearError(); }}
                        autoComplete="name"
                        autoFocus
                      />

                      <TextField
                        fullWidth
                        label="Password"
                        variant="outlined"
                        margin="normal"
                        type={showRegPwd ? 'text' : 'password'}
                        value={regPwd}
                        onChange={(e) => { setRegPwd(e.target.value); clearError(); }}
                        autoComplete="new-password"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowRegPwd(!showRegPwd)} edge="end" sx={{ color: 'text.secondary' }}>
                                {showRegPwd ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />

                      {regPwd && (
                        <Box sx={{ mt: 1, mb: 2, px: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={strength.value}
                            color={strength.color}
                            sx={{ height: 6, borderRadius: 3, mb: 0.5, backgroundColor: 'rgba(255,255,255,0.1)' }}
                          />
                          <Typography variant="caption" color={`${strength.color}.main`}>
                            {strength.label}
                          </Typography>
                        </Box>
                      )}

                      <TextField
                        fullWidth
                        label="Confirm Password"
                        variant="outlined"
                        margin="normal"
                        type={showRegPwdConfirm ? 'text' : 'password'}
                        value={regPwdConfirm}
                        error={Boolean(regPwdConfirm && regPwd !== regPwdConfirm)}
                        helperText={regPwdConfirm && regPwd !== regPwdConfirm ? "Passwords do not match" : ""}
                        onChange={(e) => { setRegPwdConfirm(e.target.value); clearError(); }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowRegPwdConfirm(!showRegPwdConfirm)} edge="end" sx={{ color: 'text.secondary' }}>
                                {showRegPwdConfirm ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />

                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={loading}
                        sx={{ mt: 3 }}
                      >
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Complete Registration"}
                      </Button>
                    </Box>
                  )}
                </Box>
              )}
            </Paper>
          </Fade>

          <Typography variant="caption" display="block" align="center" color="text.secondary" sx={{ mt: 4 }}>
            Secure • Private • Built with ❤️ for NexaMeet
          </Typography>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
