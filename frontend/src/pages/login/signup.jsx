// pages/Signup.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import "./styles/login.css"; // Same styles as login
import "./styles/signup.css"

// Set axios defaults
axios.defaults.withCredentials = true;
const BACKEND_URL = "http://localhost:5000";

export default function Signup() {
  const navigate = useNavigate();
  const { checkUser } = useAuth();

  // Step states: 1 = Email, 2 = OTP, 3 = Complete
  const [step, setStep] = useState(1);
  
  // Form data
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    name: "",
    mobile: "",
    password: "",
    confirmPassword: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(600); // 10 minutes in seconds
  const [otpResendCount, setOtpResendCount] = useState(0);
  const [verifiedEmail, setVerifiedEmail] = useState("");

  const emailInputRef = useRef(null);
  const otpInputRef = useRef(null);
  const nameInputRef = useRef(null);

  const [isFocused, setIsFocused] = useState({
    email: false,
    otp: false,
    name: false,
    mobile: false,
    password: false,
    confirmPassword: false
  });

  // Auto focus
  useEffect(() => {
    if (step === 1) emailInputRef.current?.focus();
    if (step === 2) otpInputRef.current?.focus();
    if (step === 3) nameInputRef.current?.focus();
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

  // Sync local cart to cloud (same as login)
  const syncCartToCloud = async () => {
    try {
      const localCart = JSON.parse(localStorage.getItem("cart")) || [];
      if (localCart.length === 0) return;

      const cartItems = localCart.map(item => ({
        type: item.type,
        itemId: item.itemId,
        quantity: item.quantity || 1
      }));

      await axios.post(
        `${BACKEND_URL}/api/cart/add-multiple`,
        { items: cartItems },
        { withCredentials: true }
      );

      localStorage.removeItem("cart");
      console.log("Cart synced successfully");
    } catch (err) {
      console.error("Cart sync failed:", err);
    }
  };

  // Input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Mobile: allow only digits
    if (name === "mobile") {
      if (!/^\d*$/.test(value)) return;
      if (value.length > 10) return;
    }
    
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
      const response = await axios.post(`${BACKEND_URL}/api/auth/signup/send-otp`, {
        email: formData.email.toLowerCase()
      });

      if (response.data.success) {
        setOtpSent(true);
        setOtpTimer(600); // Reset to 10 minutes
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

  // Step 2: Verify OTP
  const handleVerifyOTP = async () => {
    if (!formData.otp || formData.otp.length !== 6) {
      setError("Please enter 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/signup/verify-otp`, {
        email: formData.email.toLowerCase(),
        otp: formData.otp
      });

      if (response.data.success) {
        setVerifiedEmail(formData.email.toLowerCase());
        setSuccess("Email verified successfully!");
        setStep(3);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid OTP";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Complete Signup
  const handleCompleteSignup = async () => {
    // Validation
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }
    if (!formData.mobile || formData.mobile.length !== 10) {
      setError("Please enter 10-digit mobile number");
      return;
    }
    if (!formData.password) {
      setError("Password is required");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/signup/complete`, {
        name: formData.name.trim(),
        email: verifiedEmail,
        mobile: formData.mobile,
        password: formData.password
      });

      if (response.data.success) {
        setSuccess("Account created successfully! Logging you in...");
        
        // 1. Update auth context
        await checkUser();
        
        // 2. Sync local cart to cloud
        await syncCartToCloud();
        
        // 3. Navigate -2 (back through OTP steps to home)
        setTimeout(() => {
          navigate(-2 || "/");
        }, 500);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Signup failed";
      setError(msg);
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
      const response = await axios.post(`${BACKEND_URL}/api/auth/signup/send-otp`, {
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

  // Go back to previous step
  const handleBack = () => {
    if (step === 1) {
      navigate(-1);
    } else {
      setStep(step - 1);
      setError("");
      setSuccess("");
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    if (field === "password") {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  // Step titles
  const stepTitles = ["Enter Email", "Verify OTP", "Complete Profile"];
  const stepDescriptions = [
    "We'll send a verification code to your email",
    "Enter the 6-digit code sent to your email",
    "Fill in your details to complete signup"
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
            <div className="logo-circle">
              <i className="bi bi-person-plus logo-icon"></i>
            </div>
            <div className="logo-pulse"></div>
          </div>
          <h2 className="welcome-title">Create Account</h2>
          <p className="welcome-subtitle">{stepDescriptions[step - 1]}</p>
        </div>

        {/* Progress Indicator */}
        <div className="signup-progress">
          {[1, 2, 3].map((num) => (
            <div key={num} className="progress-step">
              <div className={`step-circle ${step >= num ? "active" : ""}`}>
                {step > num ? <i className="bi bi-check"></i> : num}
              </div>
              <span className="step-label">{stepTitles[num - 1]}</span>
              {num < 3 && <div className={`step-line ${step > num ? "active" : ""}`}></div>}
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
                <span>We'll send a verification code to this email</span>
              </div>
            </div>
          )}

          {/* STEP 2: OTP */}
          {step === 2 && (
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
          )}

          {/* STEP 3: Complete Profile */}
          {step === 3 && (
            <>
              <div className="input-group">
                <div className={`input-wrapper ${isFocused.name ? "focused" : ""} ${formData.name ? "has-value" : ""}`}>
                  <i className="bi bi-person input-icon"></i>
                  <input
                    ref={nameInputRef}
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    onFocus={() => handleFocus("name")}
                    onBlur={() => handleBlur("name")}
                    className="form-input"
                    autoComplete="name"
                    disabled={loading}
                    aria-label="Full name"
                    aria-required="true"
                  />
                  <label className="floating-label">
                    Full Name
                  </label>
                </div>
              </div>

              <div className="input-group">
                <div className={`input-wrapper ${isFocused.mobile ? "focused" : ""} ${formData.mobile ? "has-value" : ""}`}>
                  <i className="bi bi-phone input-icon"></i>
                  <input
                    type="text"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    onFocus={() => handleFocus("mobile")}
                    onBlur={() => handleBlur("mobile")}
                    className="form-input"
                    inputMode="numeric"
                    maxLength="10"
                    autoComplete="tel"
                    disabled={loading}
                    aria-label="Mobile number"
                    aria-required="true"
                  />
                  <label className="floating-label">
                    Mobile Number
                  </label>
                </div>
                <div className="input-hint">
                  <i className="bi bi-info-circle hint-icon"></i>
                  <span>10-digit mobile number for delivery updates</span>
                </div>
              </div>

              <div className="input-group">
                <div className={`input-wrapper ${isFocused.password ? "focused" : ""} ${formData.password ? "has-value" : ""}`}>
                  <i className="bi bi-lock input-icon"></i>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    onFocus={() => handleFocus("password")}
                    onBlur={() => handleBlur("password")}
                    className="form-input"
                    autoComplete="new-password"
                    disabled={loading}
                    aria-label="Password"
                    aria-required="true"
                  />
                  <label className="floating-label">
                    Password
                  </label>
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => togglePasswordVisibility("password")}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    disabled={loading}
                  >
                    <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                  </button>
                </div>
                
                {formData.password && (
                  <div className="password-strength">
                    <div className="strength-bars">
                      {[1, 2, 3, 4].map((bar) => (
                        <div
                          key={bar}
                          className={`strength-bar ${
                            formData.password.length >= bar * 2 ? "active" : ""
                          } ${
                            formData.password.length >= 8 ? "strong" :
                            formData.password.length >= 6 ? "medium" : "weak"
                          }`}
                        ></div>
                      ))}
                    </div>
                    <span className="strength-text">
                      {formData.password.length >= 8 ? "Strong" :
                      formData.password.length >= 6 ? "Medium" : "Weak"}
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
                    aria-label="Confirm password"
                    aria-required="true"
                  />
                  <label className="floating-label">
                    Confirm Password
                  </label>
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => togglePasswordVisibility("confirmPassword")}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    disabled={loading}
                  >
                    <i className={`bi ${showConfirmPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="security-status">
            <i className="bi bi-shield-check security-icon"></i>
            <span className="security-text">
              Secure connection • Your data is protected
            </span>
          </div>

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
            onClick={step === 1 ? handleSendOTP : step === 2 ? handleVerifyOTP : handleCompleteSignup}
            disabled={loading}
            aria-label={
              loading ? "Processing..." :
              step === 1 ? "Send OTP" :
              step === 2 ? "Verify OTP" :
              "Create Account"
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
                  step === 1 ? "bi-send" :
                  step === 2 ? "bi-shield-check" :
                  "bi-person-plus"
                } btn-icon`}></i>
                <span>
                  {step === 1 ? "Send Verification Code" :
                   step === 2 ? "Verify OTP" :
                   "Create Account"}
                </span>
              </>
            )}
          </button>
        </form>

        <div className="signup-section">
          <p className="signup-text">
            Already have an account?
          </p>
          <Link 
            to="/login" 
            className="signup-link"
            aria-label="Login to existing account"
          >
            <i className="bi bi-box-arrow-in-right signup-icon"></i>
            <span>Login to Existing Account</span>
          </Link>
        </div>

        <div className="legal-notice">
          <p className="legal-text">
            By creating an account, you agree to our 
            <Link to="/terms" className="legal-link"> Terms</Link> and 
            <Link to="/privacy" className="legal-link"> Privacy Policy</Link>
          </p>
        </div>
      </main>
    </div>
  );
}