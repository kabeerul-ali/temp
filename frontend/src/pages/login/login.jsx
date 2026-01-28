import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './styles/login.css';

// Set axios defaults
axios.defaults.withCredentials = true;
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      // Step 1: Login user
      const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
        email: formData.email,
        password: formData.password
      });

      if (loginResponse.data.success) {
        setSuccess('Login successful! Syncing cart...');

        // Step 2: Get localStorage cart and sync if exists
        const localCart = JSON.parse(localStorage.getItem('cart')) || [];
        
        if (localCart.length > 0) {
          try {
            // Prepare cart items for sync
            const syncItems = localCart.map(item => ({
              type: item.type || 'product',
              itemId: item.itemId,
              quantity: item.quantity || 1
            }));

            // Sync cart to server
            await axios.post(`${API_URL}/api/cart/sync`, {
              items: syncItems
            });

            // Clear localStorage cart
            localStorage.removeItem('cart');
            
          } catch (syncError) {
            console.warn('Cart sync failed, but login successful:', syncError);
            // Continue even if sync fails
          }
        }

        // Step 3: Redirect to cart page after short delay
        setTimeout(() => {
          navigate('/cart');
        }, 1500);

      } else {
        setError(loginResponse.data.message || 'Login failed');
      }

    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          'Login failed. Please check your credentials.';
      setError(errorMessage);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="auth-page login-page">
      {/* Back Button */}
      <button 
        className="auth-back-btn" 
        onClick={handleBack}
        aria-label="Go back"
      >
        ←
      </button>

      {/* Alert Messages */}
      {error && (
        <div className="auth-alert error">
          {error}
        </div>
      )}
      
      {success && (
        <div className="auth-alert success">
          {success}
        </div>
      )}

      {/* Login Container */}
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your account</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <Link to="/forgot-password" className="forgot-link">
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              minLength="6"
              required
            />
          </div>

          <button
            type="submit"
            className="auth-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Logging in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p className="auth-footer-text">
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;