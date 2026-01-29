// pages/Login.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import "./styles/login.css";

// Set axios defaults
axios.defaults.withCredentials = true;
const BACKEND_URL = "http://localhost:5000";

export default function Login() {
  const navigate = useNavigate();
  const { checkUser } = useAuth();

  const [formData, setFormData] = useState({
    emailOrMobile: "",
    password: "",
    rememberMe: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const [isFocused, setIsFocused] = useState({
    email: false,
    password: false
  });

  // Auto focus + remember me
  useEffect(() => {
    emailInputRef.current?.focus();
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setFormData(prev => ({
        ...prev,
        emailOrMobile: rememberedEmail,
        rememberMe: true
      }));
    }
  }, []);

  // Sync local cart to backend
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

  // Validate email/mobile format
  const validateEmailOrMobile = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^\d{10}$/;
    
    if (emailRegex.test(value)) return "email";
    if (mobileRegex.test(value)) return "mobile";
    return false;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
    if (error) setError("");
  };

  const handleFocus = (field) => {
    setIsFocused(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field) => {
    if (!formData[field === "email" ? "emailOrMobile" : "password"]) {
      setIsFocused(prev => ({ ...prev, [field]: false }));
    }
  };

  const validateForm = () => {
    const { emailOrMobile, password } = formData;
    
    if (!emailOrMobile.trim()) {
      setError("Email or mobile number is required");
      emailInputRef.current?.focus();
      return false;
    }
    
    const isValidFormat = validateEmailOrMobile(emailOrMobile.trim());
    if (!isValidFormat) {
      setError("Please enter valid email or 10-digit mobile number");
      emailInputRef.current?.focus();
      return false;
    }
    
    if (!password) {
      setError("Password is required");
      passwordInputRef.current?.focus();
      return false;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/auth/login`,
        {
          emailOrMobile: formData.emailOrMobile.trim(),
          password: formData.password
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        setSuccess("Login successful! Redirecting...");

        if (formData.rememberMe) {
          localStorage.setItem("rememberedEmail", formData.emailOrMobile.trim());
        } else {
          localStorage.removeItem("rememberedEmail");
        }

        // 1. First update auth context
        await checkUser();
        
        // 2. Then sync cart (needs auth)
        await syncCartToCloud();
        
        // 3. Redirect to previous page or home
        navigate(-1 || "/");

      }
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSubmit(e);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

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
          onClick={() => navigate(-1)}
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
              <i className="bi bi-cart-check logo-icon"></i>
            </div>
            <div className="logo-pulse"></div>
          </div>
          <h2 className="welcome-title">Welcome Back</h2>
          <p className="welcome-subtitle">Sign in to continue shopping</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="input-group">
            <div className={`input-wrapper ${isFocused.email ? "focused" : ""} ${formData.emailOrMobile ? "has-value" : ""}`}>
              <i className="bi bi-envelope input-icon"></i>
              <input
                ref={emailInputRef}
                type="text"
                name="emailOrMobile"
                value={formData.emailOrMobile}
                onChange={handleInputChange}
                onFocus={() => handleFocus("email")}
                onBlur={() => handleBlur("email")}
                onKeyPress={handleKeyPress}
                className="form-input"
                autoComplete="email"
                disabled={loading}
                aria-label="Email or mobile number"
                aria-required="true"
              />
              <label className="floating-label">
                Email or Mobile Number
              </label>
              {formData.emailOrMobile && (
                <button
                  type="button"
                  className="clear-input"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, emailOrMobile: "" }));
                    emailInputRef.current?.focus();
                  }}
                  aria-label="Clear input"
                >
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>
            <div className="input-hint">
              <i className="bi bi-info-circle hint-icon"></i>
              <span>Enter registered email or 10-digit mobile number</span>
            </div>
          </div>

          <div className="input-group">
            <div className={`input-wrapper ${isFocused.password ? "focused" : ""} ${formData.password ? "has-value" : ""}`}>
              <i className="bi bi-lock input-icon"></i>
              <input
                ref={passwordInputRef}
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                onFocus={() => handleFocus("password")}
                onBlur={() => handleBlur("password")}
                onKeyPress={handleKeyPress}
                className="form-input"
                autoComplete="current-password"
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
                onClick={togglePasswordVisibility}
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

          <div className="form-options">
            <label className="checkbox-container">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleInputChange}
                disabled={loading}
                className="checkbox-input"
              />
              <span className="checkbox-custom">
                <i className="bi bi-check checkbox-icon"></i>
              </span>
              <span className="checkbox-label">Remember me</span>
            </label>
            
            <Link 
              to="/forgot" 
              className="forgot-link"
              aria-label="Forgot password"
            >
              Forgot Password?
            </Link>
          </div>

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
            type="submit"
            className="login-btn"
            disabled={loading}
            aria-label={loading ? "Logging in..." : "Login"}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                <span>Logging in...</span>
              </>
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right btn-icon"></i>
                <span>Login to Account</span>
              </>
            )}
          </button>
        </form>

        <div className="divider">
          <span className="divider-line"></span>
          <span className="divider-text">or continue with</span>
          <span className="divider-line"></span>
        </div>

        <div className="social-login">
          <button 
            className="social-btn google-btn"
            type="button"
            disabled={loading}
            aria-label="Login with Google"
          >
            <i className="bi bi-google social-icon"></i>
            <span>Google</span>
          </button>
          
          <button 
            className="social-btn facebook-btn"
            type="button"
            disabled={loading}
            aria-label="Login with Facebook"
          >
            <i className="bi bi-facebook social-icon"></i>
            <span>Facebook</span>
          </button>
        </div>

        <div className="signup-section">
          <p className="signup-text">
            Don't have an account?
          </p>
          <Link 
            to="/signup" 
            className="signup-link"
            aria-label="Create new account"
          >
            <i className="bi bi-person-plus signup-icon"></i>
            <span>Create New Account</span>
          </Link>
        </div>

        <div className="legal-notice">
          <p className="legal-text">
            By continuing, you agree to our 
            <Link to="/terms" className="legal-link"> Terms</Link> and 
            <Link to="/privacy" className="legal-link"> Privacy Policy</Link>
          </p>
        </div>
      </main>
    </div>
  );
}