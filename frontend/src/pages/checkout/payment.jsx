// pages/checkout/payment.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import "./styles/payment.css";

axios.defaults.withCredentials = true;
const BACKEND_URL = "http://localhost:5000";
const COD_EXTRA_CHARGE = 10;

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Get data from address page
  const orderData = location.state || {};
  
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Alert state
  const [alert, setAlert] = useState({
    show: false,
    title: "",
    message: "",
    type: "info",
    showCancel: false,
    onConfirm: null
  });

  // Calculate totals
  const calculateTotal = () => {
    let total = orderData.finalTotal || orderData.cartTotal || 0;
    
    if (paymentMethod === "COD") {
      total += COD_EXTRA_CHARGE;
    }
    
    return total;
  };

  // Fetch wallet balance on mount
  useEffect(() => {
    if (user) {
      fetchWalletBalance();
    }
  }, [user]);

  const fetchWalletBalance = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/users/wallet`);
      if (res.data.success) {
        setWalletBalance(res.data.data.balance || 0);
      }
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
    }
  };

  // Show custom alert
  const showAlert = (title, message, type = "info", showCancel = false, onConfirm = null) => {
    setAlert({
      show: true,
      title,
      message,
      type,
      showCancel,
      onConfirm: onConfirm ? () => {
        onConfirm();
        closeAlert();
      } : null
    });
  };

  const closeAlert = () => {
    setAlert({
      show: false,
      title: "",
      message: "",
      type: "info",
      showCancel: false,
      onConfirm: null
    });
  };

  // Handle payment method selection
  const handleMethodSelect = (method) => {
    setPaymentMethod(method);
    
    // COD: Show confirmation alert
    if (method === "COD") {
      showAlert(
        "💰 COD Extra Charge",
        `An extra ₹${COD_EXTRA_CHARGE} will be added for Cash on Delivery. Do you want to continue?`,
        "info",
        true,
        () => {
          // Just enable button, no extra action needed
          console.log("COD confirmed");
        }
      );
    }
    
    // Wallet: Check balance
    if (method === "Wallet") {
      const total = orderData.finalTotal || orderData.cartTotal || 0;
      
      if (walletBalance >= total) {
        // Sufficient balance - button will enable
        console.log("Wallet sufficient");
      } else {
        // Insufficient balance - show alert
        showAlert(
          "❌ Insufficient Balance",
          `Your wallet balance: ₹${walletBalance.toFixed(2)}\nRequired amount: ₹${total.toFixed(2)}\n\nPlease add money to your wallet and try again.`,
          "error",
          false,
          () => {
            setPaymentMethod(null); // Reset selection
          }
        );
      }
    }
    
    // Online: Show coming soon
    if (method === "Online") {
      showAlert(
        "🚧 Coming Soon",
        "Online payment feature will be available soon!\n\nPlease choose COD or Wallet payment method.",
        "info",
        false,
        () => {
          setPaymentMethod(null); // Reset selection
        }
      );
    }
  };

  // Check if proceed button should be enabled
  const isProceedEnabled = () => {
    if (!paymentMethod) return false;
    
    if (paymentMethod === "COD") return true; // Enabled after OK click
    
    if (paymentMethod === "Wallet") {
      const total = orderData.finalTotal || orderData.cartTotal || 0;
      return walletBalance >= total;
    }
    
    if (paymentMethod === "Online") return false; // Never enable
    
    return false;
  };

  // Handle proceed to checkout
 
const handleProceed = async () => {
  if (!isProceedEnabled()) return;
  
  try {
    setProcessing(true);
    
    const finalTotal = calculateTotal();
    
    // Prepare payment data for checkout page - KEEP ALL ORIGINAL DATA
    const paymentData = {
      ...orderData,           // ← THIS IS CRITICAL! Keeps fromCart/fromBuyNow
      paymentMethod: paymentMethod,
      paymentStatus: paymentMethod === "Wallet" ? "Done" : "Pending",
      finalTotal: finalTotal,
      codExtraCharge: paymentMethod === "COD" ? COD_EXTRA_CHARGE : 0,
      selectedAddress: orderData.selectedAddress,  // Keep address
      selectedAddressId: orderData.selectedAddressId
    };
    
    // If wallet payment, deduct amount immediately
    if (paymentMethod === "Wallet") {
      try {
        await axios.post(`${BACKEND_URL}/api/users/wallet/update`, {
          amount: -finalTotal
        });
      } catch (error) {
        showAlert("❌ Payment Failed", error.response?.data?.message || "Failed to process wallet payment", "error");
        setProcessing(false);
        return;
      }
    }
    
    // Navigate to checkout page with ALL data
    navigate("/checkout", { state: paymentData });
    
  } catch (error) {
    console.error("Error in payment:", error);
    showAlert("❌ Error", "Something went wrong. Please try again.", "error");
  } finally {
    setProcessing(false);
  }
};
  // Get payment method icon
  const getMethodIcon = (method) => {
    switch(method) {
      case "COD": return "bi-cash";
      case "Wallet": return "bi-wallet2";
      case "Online": return "bi-credit-card";
      default: return "bi-question-circle";
    }
  };

  // Get method description
  const getMethodDescription = (method) => {
    switch(method) {
      case "COD": return "Pay when you receive";
      case "Wallet": return `Balance: ₹${walletBalance.toFixed(2)}`;
      case "Online": return "Credit/Debit Card, UPI";
      default: return "";
    }
  };

  return (
    <div className="payment-page">
      {/* Custom Alert Modal */}
      {alert.show && (
        <div className="alert-overlay" onClick={closeAlert}>
          <div className={`alert-modal ${alert.type}`} onClick={e => e.stopPropagation()}>
            <div className="alert-icon">
              <i className={`bi ${
                alert.type === "success" ? "bi-check-circle" :
                alert.type === "error" ? "bi-exclamation-circle" :
                alert.type === "warning" ? "bi-exclamation-triangle" :
                "bi-info-circle"
              }`}></i>
            </div>
            <h3 className="alert-title">{alert.title}</h3>
            <p className="alert-message">{alert.message}</p>
            <div className="alert-actions">
              {alert.showCancel && (
                <button className="alert-btn cancel" onClick={closeAlert}>
                  Cancel
                </button>
              )}
              <button 
                className={`alert-btn confirm ${alert.type}`}
                onClick={alert.onConfirm || closeAlert}
              >
                {alert.showCancel ? "OK" : "Got it"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="payment-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left"></i>
        </button>
        <h1>Payment Options</h1>
        <div className="header-placeholder"></div>
      </header>

      {/* Main Content */}
      <main className="payment-content">
        {/* Order Summary */}
        <div className="order-summary-card">
          <h2 className="summary-title">Order Summary</h2>
          
          <div className="summary-row">
            <span>Items Total</span>
            <span>₹{(orderData.cartSubtotal || orderData.totalPrice || 0).toFixed(2)}</span>
          </div>
          
          {orderData.discount > 0 && (
            <div className="summary-row discount">
              <span>Discount</span>
              <span>-₹{orderData.discount.toFixed(2)}</span>
            </div>
          )}
          
          <div className="summary-row">
            <span>Delivery Charge</span>
            <span>{orderData.deliveryCharge === 0 ? "FREE" : `₹${orderData.deliveryCharge}`}</span>
          </div>
          
          {paymentMethod === "COD" && (
            <div className="summary-row cod-charge">
              <span>COD Extra Charge</span>
              <span>+₹{COD_EXTRA_CHARGE}</span>
            </div>
          )}
          
          <div className="summary-total">
            <span>Total Amount</span>
            <span className="total-amount">₹{calculateTotal().toFixed(2)}</span>
          </div>
          
          <div className="delivery-address">
            <i className="bi bi-geo-alt"></i>
            <div className="address-text">
              <span className="address-label">Delivering to:</span>
              <p>{orderData.selectedAddress?.localAddress}, {orderData.selectedAddress?.city}</p>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="payment-methods">
          <h2 className="methods-title">Select Payment Method</h2>
          
          {/* COD Option */}
          <div 
            className={`method-card ${paymentMethod === "COD" ? "selected" : ""}`}
            onClick={() => handleMethodSelect("COD")}
          >
            <div className="method-radio">
              <div className={`radio-circle ${paymentMethod === "COD" ? "selected" : ""}`}>
                {paymentMethod === "COD" && <div className="radio-dot"></div>}
              </div>
            </div>
            
            <div className="method-info">
              <div className="method-header">
                <i className={`bi ${getMethodIcon("COD")} method-icon`}></i>
                <span className="method-name">Cash on Delivery</span>
              </div>
              <p className="method-description">{getMethodDescription("COD")}</p>
              {paymentMethod === "COD" && (
                <div className="method-note">
                  <i className="bi bi-info-circle"></i>
                  Extra ₹{COD_EXTRA_CHARGE} will be added
                </div>
              )}
            </div>
          </div>

          {/* Wallet Option */}
          <div 
            className={`method-card ${paymentMethod === "Wallet" ? "selected" : ""}`}
            onClick={() => handleMethodSelect("Wallet")}
          >
            <div className="method-radio">
              <div className={`radio-circle ${paymentMethod === "Wallet" ? "selected" : ""}`}>
                {paymentMethod === "Wallet" && <div className="radio-dot"></div>}
              </div>
            </div>
            
            <div className="method-info">
              <div className="method-header">
                <i className={`bi ${getMethodIcon("Wallet")} method-icon`}></i>
                <span className="method-name">Wallet</span>
              </div>
              <p className="method-description">{getMethodDescription("Wallet")}</p>
              {paymentMethod === "Wallet" && (
                <div className={`method-note ${walletBalance >= calculateTotal() ? "success" : "error"}`}>
                  <i className={`bi ${walletBalance >= calculateTotal() ? "bi-check-circle" : "bi-exclamation-circle"}`}></i>
                  {walletBalance >= calculateTotal() 
                    ? "Sufficient balance" 
                    : `Insufficient balance - Need ₹${(calculateTotal() - walletBalance).toFixed(2)} more`}
                </div>
              )}
            </div>
          </div>

          {/* Online Option */}
          <div 
            className={`method-card ${paymentMethod === "Online" ? "selected" : ""}`}
            onClick={() => handleMethodSelect("Online")}
          >
            <div className="method-radio">
              <div className={`radio-circle ${paymentMethod === "Online" ? "selected" : ""}`}>
                {paymentMethod === "Online" && <div className="radio-dot"></div>}
              </div>
            </div>
            
            <div className="method-info">
              <div className="method-header">
                <i className={`bi ${getMethodIcon("Online")} method-icon`}></i>
                <span className="method-name">Online Payment</span>
              </div>
              <p className="method-description">{getMethodDescription("Online")}</p>
              {paymentMethod === "Online" && (
                <div className="method-note warning">
                  <i className="bi bi-clock-history"></i>
                  Coming soon
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="payment-footer">
        <div className="footer-summary">
          <span className="total-label">Total Payable</span>
          <span className="footer-total">₹{calculateTotal().toFixed(2)}</span>
        </div>
        
        <button 
          className={`proceed-btn ${!isProceedEnabled() ? "disabled" : ""}`}
          onClick={handleProceed}
          disabled={!isProceedEnabled() || processing}
        >
          {processing ? (
            <>
              <span className="spinner"></span>
              Processing...
            </>
          ) : (
            <>
              Proceed to Checkout
              <i className="bi bi-arrow-right"></i>
            </>
          )}
        </button>
      </footer>
    </div>
  );
}