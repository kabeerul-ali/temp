// pages/ResetPassword.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import "./styles/login.css";
import "./styles/reset.css";

axios.defaults.withCredentials = true;
const BACKEND_URL = "http://localhost:5000";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const currentPasswordRef = useRef(null);
  
  const [isFocused, setIsFocused] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", { state: { from: "/reset-password" } });
    }
  }, [user, authLoading, navigate]);

  // Auto focus
  useEffect(() => {
    if (!authLoading && user) {
      currentPasswordRef.current?.focus();
    }
  }, [authLoading, user]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
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

  // Validate form
  const validateForm = () => {
    const { currentPassword, newPassword, confirmPassword } = formData;
    
    if (!currentPassword) {
      setError("Current password is required");
      currentPasswordRef.current?.focus();
      return false;
    }
    
    if (!newPassword) {
      setError("New password is required");
      return false;
    }
    
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return false;
    }
    
    if (newPassword === currentPassword) {
      setError("New password must be different from current password");
      return false;
    }
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/auth/reset-password`,
        {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setSuccess("Password updated successfully!");
        
        // Clear form
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
        
        // Auto navigate back after delay
        setTimeout(() => {
          navigate(-1);
        }, 2000);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update password";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    if (field === "current") {
      setShowCurrentPassword(!showCurrentPassword);
    } else if (field === "new") {
      setShowNewPassword(!showNewPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="login-container">
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

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
            <div className="logo-circle security">
              <i className="bi bi-shield-lock logo-icon"></i>
            </div>
            <div className="logo-pulse"></div>
          </div>
          <h2 className="welcome-title">Reset Password</h2>
          <p className="welcome-subtitle">Update your account password</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {/* Current Password */}
          <div className="input-group">
            <div className={`input-wrapper ${isFocused.currentPassword ? "focused" : ""} ${formData.currentPassword ? "has-value" : ""}`}>
              <i className="bi bi-lock input-icon"></i>
              <input
                ref={currentPasswordRef}
                type={showCurrentPassword ? "text" : "password"}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                onFocus={() => handleFocus("currentPassword")}
                onBlur={() => handleBlur("currentPassword")}
                className="form-input"
                autoComplete="current-password"
                disabled={loading}
                aria-label="Current password"
                aria-required="true"
              />
              <label className="floating-label">
                Current Password
              </label>
              <button
                type="button"
                className="toggle-password"
                onClick={() => togglePasswordVisibility("current")}
                aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                disabled={loading}
              >
                <i className={`bi ${showCurrentPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="input-group">
            <div className={`input-wrapper ${isFocused.newPassword ? "focused" : ""} ${formData.newPassword ? "has-value" : ""}`}>
              <i className="bi bi-key input-icon"></i>
              <input
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

          {/* Confirm Password */}
          <div className="input-group">
            <div className={`input-wrapper ${isFocused.confirmPassword ? "focused" : ""} ${formData.confirmPassword ? "has-value" : ""}`}>
              <i className="bi bi-key-fill input-icon"></i>
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
                <li className={formData.newPassword !== formData.currentPassword ? "met" : ""}>
                  <i className={`bi ${formData.newPassword !== formData.currentPassword ? "bi-check-circle-fill" : "bi-circle"}`}></i>
                  Be different from current password
                </li>
                <li className={formData.newPassword === formData.confirmPassword && formData.confirmPassword ? "met" : ""}>
                  <i className={`bi ${formData.newPassword === formData.confirmPassword && formData.confirmPassword ? "bi-check-circle-fill" : "bi-circle"}`}></i>
                  Match confirm password
                </li>
              </ul>
            </div>
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
            aria-label={loading ? "Updating password..." : "Update Password"}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                <span>Updating Password...</span>
              </>
            ) : (
              <>
                <i className="bi bi-shield-check btn-icon"></i>
                <span>Update Password</span>
              </>
            )}
          </button>
        </form>

        <div className="security-note">
          <i className="bi bi-shield-check security-icon"></i>
          <div className="security-text">
            <strong>Security Note:</strong> Changing your password will log you out of all other devices.
          </div>
        </div>

        <div className="back-to-profile">
          <button
            className="profile-btn"
            onClick={() => navigate("/profile")}
            aria-label="Go to profile"
          >
            <i className="bi bi-person-circle profile-icon"></i>
            <span>Back to Profile</span>
          </button>
        </div>
      </main>
    </div>
  );
}