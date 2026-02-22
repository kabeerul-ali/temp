// pages/checkout/confirm.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import "./styles/confirm.css";

axios.defaults.withCredentials = true;
const BACKEND_URL = "http://localhost:5000";

export default function Confirm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Get order data from checkout page
  const { order: newOrder, fromCheckout } = location.state || {};
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  
  // Alert state
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    type: "success"
  });

  // Fetch all orders on mount
  useEffect(() => {
    fetchAllOrders();
  }, []);

  // Show success alert if coming from checkout
  useEffect(() => {
    if (fromCheckout && newOrder) {
      setAlert({
        show: true,
        message: `Order placed successfully! Order ID: ${newOrder._id.slice(-8).toUpperCase()}`,
        type: "success"
      });
      
      // Auto hide after 5 seconds
      setTimeout(() => {
        setAlert(prev => ({ ...prev, show: false }));
      }, 5000);
    }
  }, [fromCheckout, newOrder]);

  // Fetch all user orders
  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND_URL}/api/orders/my-orders`);
      
      if (res.data.success) {
        setOrders(res.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'Processing': return '#f39c12';
      case 'Shipping': return '#3498db';
      case 'Delivered': return '#2ecc71';
      case 'Cancelled': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  // Get payment method icon
  const getPaymentIcon = (method) => {
    switch(method) {
      case 'COD': return 'bi-cash';
      case 'Wallet': return 'bi-wallet2';
      case 'Online': return 'bi-credit-card';
      default: return 'bi-question-circle';
    }
  };

  // Toggle order details
  const toggleOrderDetails = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  // Loading state
  if (loading) {
    return (
      <div className="confirm-page">
        <div className="confirm-loading">
          <div className="loading-spinner"></div>
          <h2>Loading Your Orders</h2>
          <p>Please wait while we fetch your order history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="confirm-page">
      {/* Success Alert */}
      {alert.show && (
        <div className={`success-alert ${alert.type}`}>
          <i className="bi bi-check-circle-fill"></i>
          <span>{alert.message}</span>
          <button className="close-alert" onClick={() => setAlert({ ...alert, show: false })}>
            <i className="bi bi-x"></i>
          </button>
        </div>
      )}

      {/* Header */}
      <header className="confirm-header">
        <h1>Order Confirmed</h1>
        <p className="header-subtitle">Thank you for your purchase!</p>
      </header>

      {/* Main Content */}
      <main className="confirm-content">
        {/* Success Card */}
        {newOrder && (
          <div className="success-card">
            <div className="success-icon">
              <i className="bi bi-check-circle-fill"></i>
            </div>
            <h2 className="success-title">Order Placed Successfully!</h2>
            <p className="success-message">
              Your order has been confirmed and will be delivered soon.
            </p>
            
            {/* Quick Actions */}
            <div className="quick-actions">
              <Link to="/" className="action-btn primary">
                <i className="bi bi-house-door"></i>
                Continue Shopping
              </Link>
              <Link to="/profile" className="action-btn secondary">
                <i className="bi bi-person"></i>
                View Profile
              </Link>
            </div>
          </div>
        )}

        {/* Current Order Details (if from checkout) */}
        {newOrder && (
          <div className="current-order">
            <h2 className="section-title">
              <i className="bi bi-bag-check"></i>
              Your Order #{newOrder._id.slice(-8).toUpperCase()}
            </h2>
            
            <div className="order-status-bar">
              <div className="status-item completed">
                <div className="status-dot"></div>
                <span>Confirmed</span>
              </div>
              <div className="status-line"></div>
              <div className={`status-item ${newOrder.orderStatus === 'Processing' ? 'active' : ''}`}>
                <div className="status-dot"></div>
                <span>Processing</span>
              </div>
              <div className="status-line"></div>
              <div className="status-item">
                <div className="status-dot"></div>
                <span>Shipping</span>
              </div>
              <div className="status-line"></div>
              <div className="status-item">
                <div className="status-dot"></div>
                <span>Delivered</span>
              </div>
            </div>

            <div className="order-summary-card">
              <h3 className="card-title">Order Summary</h3>
              
              <div className="summary-grid">
                <div className="summary-item">
                  <i className="bi bi-box"></i>
                  <div>
                    <span className="label">Items</span>
                    <span className="value">{newOrder.items?.length || 1}</span>
                  </div>
                </div>
                
                <div className="summary-item">
                  <i className="bi bi-currency-rupee"></i>
                  <div>
                    <span className="label">Total</span>
                    <span className="value">₹{newOrder.totalAmount?.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="summary-item">
                  <i className={`bi ${getPaymentIcon(newOrder.paymentMethod)}`}></i>
                  <div>
                    <span className="label">Payment</span>
                    <span className="value">{newOrder.paymentMethod}</span>
                  </div>
                </div>
                
                <div className="summary-item">
                  <i className="bi bi-truck"></i>
                  <div>
                    <span className="label">Delivery</span>
                    <span className="value">2-4 days</span>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="order-items">
                <h4 className="items-title">Items</h4>
                {newOrder.items?.map((item, index) => (
                  <div key={index} className="order-item">
                    <img 
                      src={item.image || "https://images.unsplash.com/photo-1610832958506-aa56368176cf"} 
                      alt={item.name}
                      className="item-image"
                      onError={(e) => e.target.src = "https://images.unsplash.com/photo-1610832958506-aa56368176cf"}
                    />
                    <div className="item-details">
                      <h5 className="item-name">{item.name || `${item.type} Item`}</h5>
                      <p className="item-meta">
                        Qty: {item.quantity} × ₹{item.price?.toFixed(2)}
                      </p>
                    </div>
                    <span className="item-total">₹{(item.price * item.quantity)?.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Delivery Address */}
              {newOrder.address && (
                <div className="delivery-address">
                  <i className="bi bi-geo-alt"></i>
                  <div className="address-details">
                    <span className="address-label">Delivery Address</span>
                    <p className="address-text">
                      {newOrder.address.localAddress}, {newOrder.address.city},<br />
                      {newOrder.address.district}, {newOrder.address.state} - {newOrder.address.pincode}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Order History */}
        <div className="order-history">
          <h2 className="section-title">
            <i className="bi bi-clock-history"></i>
            Your Orders
          </h2>
          
          {orders.length === 0 ? (
            <div className="no-orders">
              <div className="no-orders-icon">📦</div>
              <h3>No orders yet</h3>
              <p>Start shopping to place your first order!</p>
              <Link to="/" className="shop-now-btn">
                Shop Now
              </Link>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => (
                <div key={order._id} className="order-card">
                  <div className="order-card-header">
                    <div className="order-info">
                      <span className="order-id">#{order._id.slice(-8).toUpperCase()}</span>
                      <span className="order-date">{formatDate(order.createdAt)}</span>
                    </div>
                    <div className="order-status">
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(order.orderStatus) }}
                      >
                        {order.orderStatus}
                      </span>
                    </div>
                  </div>
                  
                  <div className="order-card-body">
                    <div className="order-preview">
                      <div className="preview-items">
                        {order.items?.slice(0, 3).map((item, idx) => (
                          <img 
                            key={idx}
                            src={item.image || "https://images.unsplash.com/photo-1610832958506-aa56368176cf"}
                            alt={item.name}
                            className="preview-image"
                          />
                        ))}
                        {order.items?.length > 3 && (
                          <div className="more-items">+{order.items.length - 3}</div>
                        )}
                      </div>
                      <div className="order-total-preview">
                        <span className="total-label">Total:</span>
                        <span className="total-amount">₹{order.totalAmount?.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="order-meta">
                      <span className="payment-method">
                        <i className={`bi ${getPaymentIcon(order.paymentMethod)}`}></i>
                        {order.paymentMethod}
                      </span>
                      <span className="items-count">
                        <i className="bi bi-box"></i>
                        {order.items?.length} items
                      </span>
                    </div>
                    
                    <button 
                      className="view-details-btn"
                      onClick={() => toggleOrderDetails(order._id)}
                    >
                      {expandedOrder === order._id ? 'Hide Details' : 'View Details'}
                      <i className={`bi bi-chevron-${expandedOrder === order._id ? 'up' : 'down'}`}></i>
                    </button>
                  </div>
                  
                  {/* Expanded Order Details */}
                  {expandedOrder === order._id && (
                    <div className="order-expanded">
                      <h4 className="expanded-title">Order Details</h4>
                      
                      {/* Items */}
                      <div className="expanded-items">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="expanded-item">
                            <img 
                              src={item.image || "https://images.unsplash.com/photo-1610832958506-aa56368176cf"} 
                              alt={item.name}
                              className="expanded-item-image"
                            />
                            <div className="expanded-item-details">
                              <h5 className="expanded-item-name">{item.name || `${item.type} Item`}</h5>
                              <p className="expanded-item-meta">
                                Qty: {item.quantity} × ₹{item.price?.toFixed(2)}
                              </p>
                            </div>
                            <span className="expanded-item-total">
                              ₹{(item.price * item.quantity)?.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Address */}
                      {order.address && (
                        <div className="expanded-address">
                          <i className="bi bi-geo-alt"></i>
                          <div>
                            <span className="address-label">Delivery Address</span>
                            <p className="address-text">
                              {order.address.localAddress}, {order.address.city},<br />
                              {order.address.district}, {order.address.state} - {order.address.pincode}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Bottom Actions */}
      <footer className="confirm-footer">
        <Link to="/" className="footer-action primary">
          <i className="bi bi-house-door"></i>
          Home
        </Link>
        <Link to="/cart" className="footer-action">
          <i className="bi bi-cart"></i>
          Cart
        </Link>
        <Link to="/profile" className="footer-action">
          <i className="bi bi-person"></i>
          Profile
        </Link>
      </footer>
    </div>
  );
}