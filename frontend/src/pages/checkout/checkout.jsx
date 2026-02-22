// pages/checkout/checkout.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import "./styles/checkout.css";

axios.defaults.withCredentials = true;
const BACKEND_URL = "http://localhost:5000";

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Get data from payment page
  const orderData = location.state || {};
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [addressIndex, setAddressIndex] = useState(-1);
  
  // Alert state
  const [alert, setAlert] = useState({
    show: false,
    title: "",
    message: "",
    type: "info"
  });

  // On mount: find address index
  useEffect(() => {
    if (!orderData.selectedAddress) {
      // No address data - redirect back
      showAlert(
        "❌ Error",
        "No address selected. Please go back and select an address.",
        "error"
      );
      setTimeout(() => navigate("/address"), 2000);
      return;
    }

    fetchAddresses();
  }, []);

  // Fetch addresses to find index
  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND_URL}/api/users/address`);
      
      if (res.data.success) {
        setAddresses(res.data.data || []);
        
        // Find index of selected address
        const selectedAddr = orderData.selectedAddress;
        const index = res.data.data.findIndex(addr => 
          addr._id === selectedAddr._id
        );
        
        if (index !== -1) {
          setAddressIndex(index);
          // Auto-create order after finding index
          setTimeout(() => createOrder(index), 500);
        } else {
          showAlert(
            "❌ Error",
            "Selected address not found. Please select again.",
            "error"
          );
          setTimeout(() => navigate("/address"), 2000);
        }
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      showAlert(
        "❌ Error",
        "Failed to load addresses. Please try again.",
        "error"
      );
      setTimeout(() => navigate("/address"), 2000);
    } finally {
      setLoading(false);
    }
  };

  // Show custom alert
  const showAlert = (title, message, type = "info") => {
    setAlert({ show: true, title, message, type });
    
    // Auto close after 3 seconds for non-error
    if (type !== "error") {
      setTimeout(() => closeAlert(), 3000);
    }
  };

  const closeAlert = () => {
    setAlert({ show: false, title: "", message: "", type: "info" });
  };

  // Create order
const createOrder = async (addrIndex) => {
  try {
    setProcessing(true);
    
    console.log("Order Data received:", orderData); // Debug log
    
    let response;
    
    // Determine which API to call
    if (orderData.fromCart) {
      console.log("Creating cart order...");
      response = await axios.post(`${BACKEND_URL}/api/orders/cart`, {
        addressIndex: addrIndex,
        paymentMethod: orderData.paymentMethod
      });
    } else if (orderData.fromBuyNow) {
      console.log("Creating single item order...");
      response = await axios.post(`${BACKEND_URL}/api/orders/single`, {
        type: orderData.type,
        itemId: orderData.itemId,
        quantity: orderData.quantity,
        addressIndex: addrIndex,
        paymentMethod: orderData.paymentMethod
      });
    } else {
      console.error("Missing flags in orderData:", orderData);
      showAlert(
        "❌ Error",
        "Invalid order type. Please go back and try again.",
        "error"
      );
      setProcessing(false);
      return;
    }
    
    if (response.data.success) {
      showAlert("✅ Success!", "Your order has been placed successfully.", "success");
      
      setTimeout(() => {
        navigate("/confirm", {
          state: {
            order: response.data.data,
            fromCheckout: true
          }
        });
      }, 1500);
    }
    
  } catch (error) {
    console.error("Error creating order:", error);
    
    let errorMessage = "Failed to create order. Please try again.";
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }
    
    showAlert("❌ Error", errorMessage, "error");
    setProcessing(false);
  }
};

  // Handle retry
  const handleRetry = () => {
    if (addressIndex !== -1) {
      createOrder(addressIndex);
    }
  };

  // Handle go back
  const handleGoBack = () => {
    navigate("/payment", { state: orderData });
  };

  // Loading state
  if (loading) {
    return (
      <div className="checkout-page">
        <div className="checkout-loading">
          <div className="loading-spinner"></div>
          <h2>Preparing Your Order</h2>
          <p>Please wait while we set up your checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      {/* Custom Alert Modal */}
      {alert.show && (
        <div className="alert-overlay" onClick={closeAlert}>
          <div className={`alert-modal ${alert.type}`} onClick={e => e.stopPropagation()}>
            <div className="alert-icon">
              <i className={`bi ${
                alert.type === "success" ? "bi-check-circle" :
                alert.type === "error" ? "bi-exclamation-circle" :
                "bi-info-circle"
              }`}></i>
            </div>
            <h3 className="alert-title">{alert.title}</h3>
            <p className="alert-message">{alert.message}</p>
            <button className="alert-btn" onClick={closeAlert}>
              OK
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="checkout-container">
        {/* Header */}
        <header className="checkout-header">
          <button className="back-btn" onClick={handleGoBack}>
            <i className="bi bi-arrow-left"></i>
          </button>
          <h1>Checkout</h1>
          <div className="header-placeholder"></div>
        </header>

        {/* Processing State */}
        {processing ? (
          <div className="processing-state">
            <div className="processing-animation">
              <div className="spinner-large"></div>
              <div className="pulse-circle"></div>
            </div>
            <h2 className="processing-title">Creating Your Order</h2>
            <p className="processing-text">
              Please wait while we process your order...
            </p>
            
            {/* Order Summary while processing */}
            <div className="processing-summary">
              <div className="summary-item">
                <i className="bi bi-box"></i>
                <span>Items: {orderData.cartItemsCount || 1}</span>
              </div>
              <div className="summary-item">
                <i className="bi bi-currency-rupee"></i>
                <span>Total: ₹{(orderData.finalTotal || orderData.cartTotal || 0).toFixed(2)}</span>
              </div>
              <div className="summary-item">
                <i className={`bi ${
                  orderData.paymentMethod === "COD" ? "bi-cash" :
                  orderData.paymentMethod === "Wallet" ? "bi-wallet2" : "bi-credit-card"
                }`}></i>
                <span>Payment: {orderData.paymentMethod}</span>
              </div>
            </div>
          </div>
        ) : (
          /* Error State (if processing failed) */
          <div className="error-state">
            <div className="error-icon">
              <i className="bi bi-exclamation-triangle"></i>
            </div>
            <h2 className="error-title">Something Went Wrong</h2>
            <p className="error-text">
              We couldn't create your order. Please try again.
            </p>
            
            {/* Error Details */}
            {alert.show && alert.type === "error" && (
              <div className="error-details">
                {alert.message}
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="error-actions">
              <button className="retry-btn" onClick={handleRetry}>
                <i className="bi bi-arrow-counterclockwise"></i>
                Try Again
              </button>
              <button className="back-payment-btn" onClick={handleGoBack}>
                <i className="bi bi-arrow-left"></i>
                Back to Payment
              </button>
            </div>
          </div>
        )}

        {/* Hidden order details (for reference) */}
        <div className="order-reference" style={{ display: 'none' }}>
          {/* This data is passed to confirm page */}
        </div>
      </div>
    </div>
  );
}