// pages/Payment.jsx (Temporary Page for Testing)
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./styles/payment.css";

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get data from location state
    if (location.state?.selectedAddress) {
      setSelectedAddress(location.state.selectedAddress);
    } else {
      // Try to get from localStorage
      const savedAddress = localStorage.getItem("selectedDeliveryAddress");
      if (savedAddress) {
        try {
          setSelectedAddress(JSON.parse(savedAddress));
        } catch (err) {
          console.error("Error parsing saved address:", err);
        }
      }
    }
    
    // Simulate order data
    setTimeout(() => {
      setOrderData({
        orderId: `ORD${Date.now().toString().slice(-6)}`,
        items: [
          { name: "Product 1", quantity: 2, price: 299 },
          { name: "Product 2", quantity: 1, price: 499 },
          { name: "Product 3", quantity: 3, price: 199 }
        ],
        subtotal: 1499,
        delivery: 49,
        discount: 100,
        total: 1448,
        paymentMethods: ["Wallet", "Credit/Debit Card", "UPI", "Net Banking", "Cash on Delivery"]
      });
      setLoading(false);
    }, 1000);
  }, [location.state]);

  const handlePayment = (method) => {
    alert(`Processing payment with ${method}...`);
    // In real app, redirect to payment gateway
  };

  const handleBack = () => {
    navigate("/address");
  };

  if (loading) {
    return (
      <div className="payment-container">
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Loading payment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-container">
      {/* Header */}
      <div className="payment-header">
        <button className="back-btn" onClick={handleBack}>
          <i className="bi bi-arrow-left"></i>
        </button>
        <h1>Payment</h1>
        <div className="order-id">Order #{orderData.orderId}</div>
      </div>

      {/* Data Display Section */}
      <div className="data-display-section">
        <h2>
          <i className="bi bi-check-circle"></i>
          Data Received Successfully
        </h2>
        
        {/* Address Data */}
        <div className="data-card">
          <h3>
            <i className="bi bi-geo-alt"></i>
            Delivery Address (From Address Page)
          </h3>
          {selectedAddress ? (
            <div className="address-details">
              <p><strong>Address:</strong> {selectedAddress.localAddress}</p>
              <p><strong>City:</strong> {selectedAddress.city}</p>
              <p><strong>District:</strong> {selectedAddress.district}</p>
              <p><strong>State:</strong> {selectedAddress.state}</p>
              <p><strong>Pincode:</strong> {selectedAddress.pincode}</p>
              <p><strong>Country:</strong> {selectedAddress.country}</p>
              <p><strong>Default:</strong> {selectedAddress.isDefault ? "Yes" : "No"}</p>
            </div>
          ) : (
            <p className="no-data">No address data received</p>
          )}
        </div>

        {/* Order Summary */}
        <div className="data-card">
          <h3>
            <i className="bi bi-receipt"></i>
            Order Summary
          </h3>
          <div className="order-items">
            {orderData.items.map((item, index) => (
              <div key={index} className="order-item">
                <span>{item.name} × {item.quantity}</span>
                <span>₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="order-totals">
            <div className="total-row">
              <span>Subtotal</span>
              <span>₹{orderData.subtotal}</span>
            </div>
            <div className="total-row">
              <span>Delivery</span>
              <span>₹{orderData.delivery}</span>
            </div>
            <div className="total-row">
              <span>Discount</span>
              <span>- ₹{orderData.discount}</span>
            </div>
            <div className="total-row grand-total">
              <span>Total Amount</span>
              <span>₹{orderData.total}</span>
            </div>
          </div>
        </div>

        {/* Location State Data */}
        <div className="data-card">
          <h3>
            <i className="bi bi-info-circle"></i>
            Location State Data
          </h3>
          <pre className="data-raw">
            {JSON.stringify(location.state, null, 2)}
          </pre>
        </div>

        {/* Payment Methods */}
        <div className="data-card">
          <h3>
            <i className="bi bi-credit-card"></i>
            Select Payment Method
          </h3>
          <div className="payment-methods">
            {orderData.paymentMethods.map((method, index) => (
              <button
                key={index}
                className="payment-method-btn"
                onClick={() => handlePayment(method)}
              >
                <i className="bi bi-wallet"></i>
                <span>{method}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Test Navigation */}
        <div className="test-navigation">
          <h3>
            <i className="bi bi-arrow-left-right"></i>
            Test Navigation
          </h3>
          <div className="nav-buttons">
            <button onClick={() => navigate("/address")} className="nav-btn">
              <i className="bi bi-arrow-left"></i>
              Back to Address Page
            </button>
            <button onClick={() => navigate("/")} className="nav-btn">
              <i className="bi bi-house"></i>
              Go to Home
            </button>
            <button onClick={() => navigate("/checkout")} className="nav-btn">
              <i className="bi bi-cart"></i>
              Go to Checkout
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="payment-footer">
        <div className="footer-content">
          <div className="total-display">
            <span>Total Payable:</span>
            <span className="amount">₹{orderData.total}</span>
          </div>
          <button 
            className="pay-now-btn"
            onClick={() => handlePayment("Selected Method")}
          >
            <i className="bi bi-lock-fill"></i>
            Pay Now
          </button>
        </div>
      </div>
    </div>
  );
}