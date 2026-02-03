// pages/Checkout.jsx or any parent page
import React, { useState, useEffect } from "react";
import AddressSelector from "../address";
import "./styles/checkout.css"; // Create this CSS file

const Checkout = () => {
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [orderSummary, setOrderSummary] = useState({
    items: 3,
    subtotal: 1499,
    delivery: 49,
    total: 1548
  });

  // Load saved address from localStorage on component mount
  useEffect(() => {
    const savedAddress = localStorage.getItem("selectedAddress");
    if (savedAddress) {
      try {
        setSelectedAddress(JSON.parse(savedAddress));
      } catch (err) {
        console.error("Error parsing saved address:", err);
      }
    }
  }, []);

  // Handle address selection
  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    // Save to localStorage for persistence
    localStorage.setItem("selectedAddress", JSON.stringify(address));
    // You can also save address ID to your order context/state
    console.log("Address selected:", address);
  };

  // Handle checkout
  const handleCheckout = () => {
    if (!selectedAddress) {
      alert("Please select a delivery address");
      setShowAddressSelector(true);
      return;
    }
    
    // Proceed with checkout
    console.log("Proceeding to payment with address:", selectedAddress);
    // Your checkout logic here
  };

  return (
    <div className="checkout-container">
      {/* Header */}
      <div className="checkout-header">
        <button 
          className="back-btn"
          onClick={() => window.history.back()}
          aria-label="Go back"
        >
          <i className="bi bi-arrow-left"></i>
        </button>
        <h1>Checkout</h1>
        <div className="header-placeholder"></div>
      </div>

      <div className="checkout-content">
        {/* Delivery Address Section */}
        <div className="section">
          <div className="section-header">
            <h2>
              <i className="bi bi-truck"></i>
              Delivery Address
            </h2>
            <button 
              className="change-btn"
              onClick={() => setShowAddressSelector(true)}
            >
              {selectedAddress ? "Change" : "Select"}
            </button>
          </div>

          {selectedAddress ? (
            <div className="selected-address-card">
              <div className="address-badge">
                {selectedAddress.isDefault && (
                  <span className="default-tag">
                    <i className="bi bi-check-circle"></i> Default
                  </span>
                )}
              </div>
              
              <div className="address-details">
                <h3>Deliver to:</h3>
                <p className="address-line">
                  <strong>{selectedAddress.localAddress}</strong>
                </p>
                <p className="address-line">
                  {selectedAddress.city}, {selectedAddress.district}
                </p>
                <p className="address-line">
                  {selectedAddress.state} - {selectedAddress.pincode}
                </p>
                <p className="address-line">
                  {selectedAddress.country}
                </p>
              </div>

              <div className="address-actions">
                <button 
                  className="btn-edit-address"
                  onClick={() => setShowAddressSelector(true)}
                >
                  <i className="bi bi-pencil"></i> Edit
                </button>
              </div>
            </div>
          ) : (
            <div className="no-address-placeholder">
              <div className="placeholder-icon">
                <i className="bi bi-geo-alt"></i>
              </div>
              <h3>No Address Selected</h3>
              <p>Please select a delivery address to continue</p>
              <button 
                className="btn-select-address"
                onClick={() => setShowAddressSelector(true)}
              >
                <i className="bi bi-plus-lg"></i> Select Address
              </button>
            </div>
          )}
        </div>

        {/* Order Summary Section */}
        <div className="section">
          <div className="section-header">
            <h2>
              <i className="bi bi-receipt"></i>
              Order Summary
            </h2>
          </div>
          
          <div className="order-summary">
            <div className="summary-row">
              <span>Items ({orderSummary.items})</span>
              <span>₹{orderSummary.subtotal}</span>
            </div>
            <div className="summary-row">
              <span>Delivery Fee</span>
              <span>₹{orderSummary.delivery}</span>
            </div>
            <div className="summary-row total">
              <span>Total Amount</span>
              <span>₹{orderSummary.total}</span>
            </div>
          </div>
        </div>

        {/* Payment Method Section */}
        <div className="section">
          <div className="section-header">
            <h2>
              <i className="bi bi-credit-card"></i>
              Payment Method
            </h2>
          </div>
          
          <div className="payment-methods">
            <label className="payment-option">
              <input 
                type="radio" 
                name="payment" 
                defaultChecked 
              />
              <div className="payment-content">
                <i className="bi bi-wallet"></i>
                <div>
                  <h4>Wallet</h4>
                  <p>Pay using your wallet balance</p>
                </div>
              </div>
            </label>
            
            <label className="payment-option">
              <input type="radio" name="payment" />
              <div className="payment-content">
                <i className="bi bi-credit-card"></i>
                <div>
                  <h4>Credit/Debit Card</h4>
                  <p>Pay using your card</p>
                </div>
              </div>
            </label>
            
            <label className="payment-option">
              <input type="radio" name="payment" />
              <div className="payment-content">
                <i className="bi bi-cash"></i>
                <div>
                  <h4>Cash on Delivery</h4>
                  <p>Pay when you receive</p>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Checkout Button */}
        <div className="checkout-footer">
          <div className="total-amount">
            <span>Total:</span>
            <span className="amount">₹{orderSummary.total}</span>
          </div>
          
          <button 
            className="btn-checkout"
            onClick={handleCheckout}
            disabled={!selectedAddress}
          >
            {selectedAddress ? (
              <>
                <i className="bi bi-lock"></i>
                <span>Proceed to Payment</span>
              </>
            ) : (
              <>
                <i className="bi bi-exclamation-triangle"></i>
                <span>Select Address to Continue</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Address Selector Modal */}
      {showAddressSelector && (
        <div className="modal-overlay" onClick={() => setShowAddressSelector(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <AddressSelector
              onAddressSelect={(address) => {
                handleAddressSelect(address);
                setShowAddressSelector(false);
              }}
              onClose={() => setShowAddressSelector(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;