// pages/ForgotPassword.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./styles/login.css";
import "./styles/forgot.css";

axios.defaults.withCredentials = true;
const BACKEND_URL = "http://localhost:5000";

export default function ForgotPassword() {
  const navigate = useNavigate();
  
  // Step states: 1 = Email, 2 = OTP & New Password
  const [step, setStep] = useState(1);
  
  // Form data
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(600); // 10 minutes
  const [otpResendCount, setOtpResendCount] = useState(0);
  const [verifiedEmail, setVerifiedEmail] = useState("");
  
  const emailInputRef = useRef(null);
  const otpInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  
  const [isFocused, setIsFocused] = useState({
    email: false,
    otp: false,
    newPassword: false,
    confirmPassword: false
  });

  // Auto focus
  useEffect(() => {
    if (step === 1) emailInputRef.current?.focus();
    if (step === 2) otpInputRef.current?.focus();
  }, [step]);

  // OTP Timer
  useEffect(() => {
    if (otpSent && otpTimer > 0) {
      const timer = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [otpSent, otpTimer]);

  // Format timer MM:SS
  const formatTimer = () => {
    const mins = Math.floor(otpTimer / 60);
    const secs = otpTimer % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // OTP: allow only digits
    if (name === "otp") {
      if (!/^\d*$/.test(value)) return;
      if (value.length > 6) return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (error) setError("");
  };

  // Focus handlers
  const handleFocus = (field) => {
    setIsFocused(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field) => {
    if (!formData[field]) {
      setIsFocused(prev => ({ ...prev, [field]: false }));
    }
  };

  // Step 1: Send OTP
  const handleSendOTP = async () => {
    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email");
      return;
    }

    if (otpResendCount >= 2) {
      setError("OTP limit reached. Try after some time.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/forgot/send-otp`, {
        email: formData.email.toLowerCase()
      });

      if (response.data.success) {
        setOtpSent(true);
        setOtpTimer(600);
        setOtpResendCount(prev => prev + 1);
        setSuccess("OTP sent to your email!");
        setStep(2);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send OTP";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP & Reset Password
  const handleResetPassword = async () => {
    // Validation
    if (!formData.otp || formData.otp.length !== 6) {
      setError("Please enter 6-digit OTP");
      return;
    }
    
    if (!formData.newPassword) {
      setError("New password is required");
      return;
    }
    
    if (formData.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/forgot/verify`, {
        email: formData.email.toLowerCase(),
        otp: formData.otp,
        newPassword: formData.newPassword
      });

      if (response.data.success) {
        setSuccess("Password reset successfully! Redirecting to login...");
        
        // Auto redirect to login
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to reset password";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (otpResendCount >= 2) {
      setError("OTP limit reached. Try after some time.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/forgot/send-otp`, {
        email: formData.email.toLowerCase()
      });

      if (response.data.success) {
        setOtpTimer(600);
        setOtpResendCount(prev => prev + 1);
        setSuccess("New OTP sent to your email!");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to resend OTP";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Go back
  const handleBack = () => {
    if (step === 1) {
      navigate(-1);
    } else {
      setStep(1);
      setError("");
      setSuccess("");
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    if (field === "new") {
      setShowNewPassword(!showNewPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  // Step titles
  const stepTitles = ["Enter Email", "Reset Password"];
  const stepDescriptions = [
    "We'll send a verification code to your email",
    "Enter OTP and set new password"
  ];

  return (
    <div className="login-container">
      <div className="bg-effects">
        <div className="bg-blob blob-1"></div>
        <div className="bg-blob blob-2"></div>
        <div className="bg-blob blob-3"></div>
      </div>

      <header className="login-header">
        <button 
          className="back-btn"
          onClick={handleBack}
          aria-label="Go back"
        >
          <i className="bi bi-arrow-left"></i>
        </button>
        <h1 className="app-title">Grocery Store</h1>
        <div className="header-placeholder"></div>
      </header>

      <main className="login-main">
        <div className="welcome-section">
          <div className="logo-container">
            <div className="logo-circle reset">
              <i className="bi bi-key-fill logo-icon"></i>
            </div>
            <div className="logo-pulse"></div>
          </div>
          <h2 className="welcome-title">Forgot Password</h2>
          <p className="welcome-subtitle">{stepDescriptions[step - 1]}</p>
        </div>

        {/* Progress Indicator */}
        <div className="signup-progress">
          {[1, 2].map((num) => (
            <div key={num} className="progress-step">
              <div className={`step-circle ${step >= num ? "active" : ""}`}>
                {step > num ? <i className="bi bi-check"></i> : num}
              </div>
              <span className="step-label">{stepTitles[num - 1]}</span>
              {num < 2 && <div className={`step-line ${step > num ? "active" : ""}`}></div>}
            </div>
          ))}
        </div>

        <form className="login-form" onSubmit={(e) => e.preventDefault()} noValidate>
          {/* STEP 1: Email */}
          {step === 1 && (
            <div className="input-group">
              <div className={`input-wrapper ${isFocused.email ? "focused" : ""} ${formData.email ? "has-value" : ""}`}>
                <i className="bi bi-envelope input-icon"></i>
                <input
                  ref={emailInputRef}
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onFocus={() => handleFocus("email")}
                  onBlur={() => handleBlur("email")}
                  className="form-input"
                  autoComplete="email"
                  disabled={loading}
                  aria-label="Email address"
                  aria-required="true"
                />
                <label className="floating-label">
                  Email Address
                </label>
                {formData.email && (
                  <button
                    type="button"
                    className="clear-input"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, email: "" }));
                      emailInputRef.current?.focus();
                    }}
                    aria-label="Clear email"
                  >
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>
              <div className="input-hint">
                <i className="bi bi-info-circle hint-icon"></i>
                <span>Enter your registered email address</span>
              </div>
            </div>
          )}

          {/* STEP 2: OTP & New Password */}
          {step === 2 && (
            <>
              <div className="input-group">
                <div className="otp-header">
                  <span className="otp-email">{formData.email}</span>
                  {otpTimer > 0 ? (
                    <span className="otp-timer">
                      <i className="bi bi-clock"></i> {formatTimer()}
                    </span>
                  ) : (
                    <span className="otp-expired">OTP Expired</span>
                  )}
                </div>
                
                <div className={`input-wrapper ${isFocused.otp ? "focused" : ""} ${formData.otp ? "has-value" : ""}`}>
                  <i className="bi bi-shield-lock input-icon"></i>
                  <input
                    ref={otpInputRef}
                    type="text"
                    name="otp"
                    value={formData.otp}
                    onChange={handleInputChange}
                    onFocus={() => handleFocus("otp")}
                    onBlur={() => handleBlur("otp")}
                    className="form-input"
                    inputMode="numeric"
                    maxLength="6"
                    autoComplete="one-time-code"
                    disabled={loading}
                    aria-label="6-digit OTP"
                    aria-required="true"
                  />
                  <label className="floating-label">
                    6-digit Verification Code
                  </label>
                </div>

                <div className="otp-actions">
                  <button
                    type="button"
                    className="resend-otp-btn"
                    onClick={handleResendOTP}
                    disabled={loading || otpResendCount >= 2}
                  >
                    <i className="bi bi-arrow-clockwise"></i>
                    {otpResendCount >= 2 ? "Limit Reached" : "Resend OTP"}
                  </button>
                  <div className="otp-hint">
                    <i className="bi bi-key-fill hint-icon"></i>
                    <span>Enter the 6-digit code from your email</span>
                  </div>
                </div>
              </div>

              <div className="input-group">
                <div className={`input-wrapper ${isFocused.newPassword ? "focused" : ""} ${formData.newPassword ? "has-value" : ""}`}>
                  <i className="bi bi-lock input-icon"></i>
                  <input
                    ref={passwordInputRef}
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    onFocus={() => handleFocus("newPassword")}
                    onBlur={() => handleBlur("newPassword")}
                    className="form-input"
                    autoComplete="new-password"
                    disabled={loading}
                    aria-label="New password"
                    aria-required="true"
                  />
                  <label className="floating-label">
                    New Password
                  </label>
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => togglePasswordVisibility("new")}
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                    disabled={loading}
                  >
                    <i className={`bi ${showNewPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                  </button>
                </div>
                
                {formData.newPassword && (
                  <div className="password-strength">
                    <div className="strength-bars">
                      {[1, 2, 3, 4].map((bar) => (
                        <div
                          key={bar}
                          className={`strength-bar ${
                            formData.newPassword.length >= bar * 2 ? "active" : ""
                          } ${
                            formData.newPassword.length >= 8 ? "strong" :
                            formData.newPassword.length >= 6 ? "medium" : "weak"
                          }`}
                        ></div>
                      ))}
                    </div>
                    <span className="strength-text">
                      {formData.newPassword.length >= 8 ? "Strong" :
                       formData.newPassword.length >= 6 ? "Medium" : "Weak"}
                    </span>
                  </div>
                )}
              </div>

              <div className="input-group">
                <div className={`input-wrapper ${isFocused.confirmPassword ? "focused" : ""} ${formData.confirmPassword ? "has-value" : ""}`}>
                  <i className="bi bi-lock-fill input-icon"></i>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    onFocus={() => handleFocus("confirmPassword")}
                    onBlur={() => handleBlur("confirmPassword")}
                    className="form-input"
                    autoComplete="new-password"
                    disabled={loading}
                    aria-label="Confirm new password"
                    aria-required="true"
                  />
                  <label className="floating-label">
                    Confirm New Password
                  </label>
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => togglePasswordVisibility("confirm")}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    disabled={loading}
                  >
                    <i className={`bi ${showConfirmPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                  </button>
                </div>
              </div>

              <div className="password-requirements">
                <i className="bi bi-info-circle requirements-icon"></i>
                <div className="requirements-list">
                  <p>Password must:</p>
                  <ul>
                    <li className={formData.newPassword.length >= 6 ? "met" : ""}>
                      <i className={`bi ${formData.newPassword.length >= 6 ? "bi-check-circle-fill" : "bi-circle"}`}></i>
                      Be at least 6 characters
                    </li>
                    <li className={formData.newPassword === formData.confirmPassword && formData.confirmPassword ? "met" : ""}>
                      <i className={`bi ${formData.newPassword === formData.confirmPassword && formData.confirmPassword ? "bi-check-circle-fill" : "bi-circle"}`}></i>
                      Match confirm password
                    </li>
                  </ul>
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="alert alert-error" role="alert">
              <i className="bi bi-exclamation-triangle alert-icon"></i>
              <span className="alert-text">{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success" role="alert">
              <i className="bi bi-check-circle alert-icon"></i>
              <span className="alert-text">{success}</span>
            </div>
          )}

          <button
            type="button"
            className="login-btn"
            onClick={step === 1 ? handleSendOTP : handleResetPassword}
            disabled={loading}
            aria-label={
              loading ? "Processing..." :
              step === 1 ? "Send OTP" :
              "Reset Password"
            }
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <i className={`bi ${
                  step === 1 ? "bi-send" : "bi-key-fill"
                } btn-icon`}></i>
                <span>
                  {step === 1 ? "Send Verification Code" : "Reset Password"}
                </span>
              </>
            )}
          </button>
        </form>

        <div className="signup-section">
          <p className="signup-text">
            Remember your password?
          </p>
          <Link 
            to="/login" 
            className="signup-link"
            aria-label="Login to account"
          >
            <i className="bi bi-box-arrow-in-right signup-icon"></i>
            <span>Back to Login</span>
          </Link>
        </div>

        <div className="security-note">
          <i className="bi bi-shield-check security-icon"></i>
          <div className="security-text">
            <strong>Security:</strong> OTP is valid for 10 minutes only.
          </div>
        </div>
      </main>
    </div>
  );
}