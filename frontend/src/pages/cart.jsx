// pages/Cart.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./styles/cart.css";

// Set axios defaults
axios.defaults.withCredentials = true;
const BACKEND_URL = "http://localhost:5000";
const FREE_DELIVERY_THRESHOLD = 500;

export default function Cart() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });
  const [showClearModal, setShowClearModal] = useState(false);
  const [savingItems, setSavingItems] = useState([]);

  // Show alert
  const showAlertMessage = useCallback((type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => {
      setAlert({ show: false, type: "", message: "" });
    }, 3000);
  }, []);

  // Fetch all products
  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/products`);
      return res.data.data || [];
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  };

  // Fetch all active offers
  const fetchOffers = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/offers/allactive`);
      return res.data.data || [];
    } catch (error) {
      console.error("Error fetching offers:", error);
      return [];
    }
  };

  // Load cart from backend (logged in users)
  const loadBackendCart = async (productsData, offersData) => {
    try {
      if (!user) return [];
      
      const res = await axios.get(`${BACKEND_URL}/api/auth/profile`);
      const userCart = res.data.data?.cart || [];
      
      const items = [];
      for (const cartItem of userCart) {
        if (cartItem.type === "product" && cartItem.productId) {
          const product = productsData.find(p => p._id === cartItem.productId.toString());
          if (product) {
            items.push({
              id: `product-${product._id}`,
              type: "product",
              productId: product._id,
              quantity: cartItem.quantity || 1,
              name: product.name,
              description: product.description,
              image: product.images?.[0] || "/placeholder.jpg",
              price: product.price,
              discountPrice: product.discountPrice,
              finalPrice: product.discountPrice || product.price,
              category: product.category,
              stock: product.stock,
              isAvailable: product.isAvailable && product.stock > 0,
              unit: product.unit || "piece"
            });
          }
        } else if (cartItem.type === "offer" && cartItem.offerId) {
          const offer = offersData.find(o => o._id === cartItem.offerId.toString());
          if (offer) {
            const offerPrice = offer.price - (offer.price * offer.discount / 100);
            items.push({
              id: `offer-${offer._id}`,
              type: "offer",
              offerId: offer._id,
              quantity: cartItem.quantity || 1,
              name: offer.name,
              description: offer.description,
              image: offer.image,
              price: offer.price,
              discountPrice: offerPrice,
              finalPrice: offerPrice,
              category: "offer",
              stock: 999,
              isAvailable: true,
              unit: "item",
              discount: offer.discount,
              endTime: offer.endTime
            });
          }
        }
      }
      
      return items;
    } catch (error) {
      console.error("Error loading backend cart:", error);
      return [];
    }
  };

  // Load cart from localStorage (guest users)
  const loadLocalCart = (productsData, offersData) => {
    try {
      const localCart = JSON.parse(localStorage.getItem("cart")) || [];
      const items = [];
      
      for (const item of localCart) {
        if (item.type === "product" && item.itemId) {
          const product = productsData.find(p => p._id === item.itemId);
          if (product) {
            items.push({
              id: `product-${product._id}`,
              type: "product",
              productId: product._id,
              quantity: item.quantity || 1,
              name: product.name,
              description: product.description,
              image: product.images?.[0] || "/placeholder.jpg",
              price: product.price,
              discountPrice: product.discountPrice,
              finalPrice: product.discountPrice || product.price,
              category: product.category,
              stock: product.stock,
              isAvailable: product.isAvailable && product.stock > 0,
              unit: product.unit || "piece"
            });
          }
        } else if (item.type === "offer" && item.itemId) {
          const offer = offersData.find(o => o._id === item.itemId);
          if (offer) {
            const offerPrice = offer.price - (offer.price * offer.discount / 100);
            items.push({
              id: `offer-${offer._id}`,
              type: "offer",
              offerId: offer._id,
              quantity: item.quantity || 1,
              name: offer.name,
              description: offer.description,
              image: offer.image,
              price: offer.price,
              discountPrice: offerPrice,
              finalPrice: offerPrice,
              category: "offer",
              stock: 999,
              isAvailable: true,
              unit: "item",
              discount: offer.discount,
              endTime: offer.endTime
            });
          }
        }
      }
      
      return items;
    } catch (error) {
      console.error("Error loading local cart:", error);
      return [];
    }
  };

  // Load cart data
  const loadCart = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch products and offers first
      const [productsData, offersData] = await Promise.all([
        fetchProducts(),
        fetchOffers()
      ]);
      
      setProducts(productsData);
      setOffers(offersData);
      
      // Load cart based on login status
      let cartData = [];
      if (user) {
        cartData = await loadBackendCart(productsData, offersData);
      } else {
        cartData = loadLocalCart(productsData, offersData);
      }
      
      setCartItems(cartData);
    } catch (error) {
      console.error("Error loading cart:", error);
      showAlertMessage("error", "Failed to load cart");
    } finally {
      setLoading(false);
    }
  }, [user, showAlertMessage]);

  // Update quantity
  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    const itemToUpdate = cartItems.find(i => i.id === itemId);
    if (!itemToUpdate) return;
    
    // Stock check for products
    if (itemToUpdate.type === "product" && itemToUpdate.stock && newQuantity > itemToUpdate.stock) {
      showAlertMessage("warning", `Only ${itemToUpdate.stock} items available`);
      return;
    }
    
    try {
      if (user) {
        // Update in backend
        await axios.post(`${BACKEND_URL}/api/cart/add`, {
          type: itemToUpdate.type,
          itemId: itemToUpdate.type === "product" ? itemToUpdate.productId : itemToUpdate.offerId,
          quantity: newQuantity - itemToUpdate.quantity
        });
      } else {
        // Update in localStorage
        const localCart = JSON.parse(localStorage.getItem("cart")) || [];
        const updatedCart = localCart.map(cartItem => {
          if (cartItem.type === itemToUpdate.type && 
              cartItem.itemId === (itemToUpdate.type === "product" ? itemToUpdate.productId : itemToUpdate.offerId)) {
            return { ...cartItem, quantity: newQuantity };
          }
          return cartItem;
        });
        localStorage.setItem("cart", JSON.stringify(updatedCart));
      }
      
      // Update local state
      setCartItems(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
      
      showAlertMessage("success", "Quantity updated");
    } catch (error) {
      console.error("Error updating quantity:", error);
      showAlertMessage("error", "Failed to update quantity");
    }
  };

  // Remove item
  const removeItem = async (itemId) => {
    const itemToRemove = cartItems.find(i => i.id === itemId);
    if (!itemToRemove) return;
    
    try {
      if (user) {
        // Remove from backend
        await axios.post(`${BACKEND_URL}/api/cart/remove`, {
          type: itemToRemove.type,
          itemId: itemToRemove.type === "product" ? itemToRemove.productId : itemToRemove.offerId
        });
      } else {
        // Remove from localStorage
        const localCart = JSON.parse(localStorage.getItem("cart")) || [];
        const updatedCart = localCart.filter(cartItem => 
          !(cartItem.type === itemToRemove.type && 
            cartItem.itemId === (itemToRemove.type === "product" ? itemToRemove.productId : itemToRemove.offerId))
        );
        localStorage.setItem("cart", JSON.stringify(updatedCart));
      }
      
      // Animate removal
      const itemElement = document.getElementById(`cart-item-${itemId}`);
      if (itemElement) {
        itemElement.style.transform = "translateX(-100%)";
        itemElement.style.opacity = "0";
        setTimeout(() => {
          setCartItems(prev => prev.filter(item => item.id !== itemId));
        }, 300);
      } else {
        setCartItems(prev => prev.filter(item => item.id !== itemId));
      }
      
      showAlertMessage("success", "Item removed from cart");
    } catch (error) {
      console.error("Error removing item:", error);
      showAlertMessage("error", "Failed to remove item");
    }
  };

  // Save for later
  const saveForLater = (itemId) => {
    const itemToSave = cartItems.find(i => i.id === itemId);
    if (!itemToSave) return;
    
    setCartItems(prev => prev.filter(item => item.id !== itemId));
    setSavingItems(prev => [...prev, itemToSave]);
    showAlertMessage("success", "Item saved for later");
  };

  // Move to cart
  const moveToCart = (itemId) => {
    const itemToMove = savingItems.find(i => i.id === itemId);
    if (!itemToMove) return;
    
    setSavingItems(prev => prev.filter(item => item.id !== itemId));
    setCartItems(prev => [...prev, itemToMove]);
    showAlertMessage("success", "Item moved to cart");
  };

  // Clear all items
  const clearAll = async () => {
    try {
      if (user) {
        await axios.delete(`${BACKEND_URL}/api/cart/clear`);
      } else {
        localStorage.removeItem("cart");
      }
      
      setCartItems([]);
      setSavingItems([]);
      setShowClearModal(false);
      showAlertMessage("success", "Cart cleared successfully");
    } catch (error) {
      console.error("Error clearing cart:", error);
      showAlertMessage("error", "Failed to clear cart");
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    return cartItems.reduce(
      (acc, item) => {
        const price = item.finalPrice || item.discountPrice || item.price;
        const itemTotal = price * item.quantity;
        const discount = item.discountPrice ? (item.price - item.discountPrice) * item.quantity : 0;
        
        return {
          totalItems: acc.totalItems + item.quantity,
          subtotal: acc.subtotal + (item.price * item.quantity),
          discount: acc.discount + discount,
          total: acc.total + itemTotal,
          savings: acc.savings + discount
        };
      },
      { totalItems: 0, subtotal: 0, discount: 0, total: 0, savings: 0 }
    );
  };

  // Proceed to checkout
  const proceedToCheckout = () => {
    if (cartItems.length === 0) {
      showAlertMessage("error", "Your cart is empty");
      return;
    }
    
    const unavailableItems = cartItems.filter(item => !item.isAvailable);
    if (unavailableItems.length > 0) {
      showAlertMessage("warning", "Some items in your cart are unavailable");
      return;
    }
    
    if (!user) {
      navigate("/login", { state: { from: "/cart" } });
      return;
    }
    
    navigate("/checkout");
  };

  // Load cart on mount and when user changes
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!isMounted) return;
      await loadCart();
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [user]); // Only re-run when user changes

  const totals = calculateTotals();
  const deliveryNeeded = Math.max(0, FREE_DELIVERY_THRESHOLD - totals.total);
  const deliveryProgress = Math.min(100, (totals.total / FREE_DELIVERY_THRESHOLD) * 100);
  const hasAvailableItems = cartItems.some(item => item.isAvailable);

  // Render loading
  if (loading || authLoading) {
    return (
      <div className="cart-page">
        <header className="cart-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left"></i>
          </button>
          <h1 className="cart-title">My Cart</h1>
        </header>
        
        <div className="cart-loading">
          <div className="loading-spinner"></div>
          <p>Loading your cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      {/* Alert Toast */}
      {alert.show && (
        <div className={`cart-alert ${alert.type}`}>
          {alert.message}
        </div>
      )}

      {/* Clear All Modal */}
      {showClearModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-icon">🗑️</div>
            <h3 className="modal-title">Clear All Items?</h3>
            <p className="modal-text">
              Are you sure you want to remove all {totals.totalItems} items from your cart?
            </p>
            <div className="modal-actions">
              <button 
                className="modal-btn cancel"
                onClick={() => setShowClearModal(false)}
              >
                Cancel
              </button>
              <button 
                className="modal-btn confirm"
                onClick={clearAll}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="cart-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left"></i>
        </button>
        <h1 className="cart-title">My Cart</h1>
        <div className="cart-count">
          {totals.totalItems} {totals.totalItems === 1 ? "item" : "items"}
        </div>
      </header>

      {/* Progress Bar for Free Delivery */}
      {deliveryNeeded > 0 && (
        <div className="delivery-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${deliveryProgress}%` }}
            ></div>
          </div>
          <p className="progress-text">
            Add <span className="highlight">₹{deliveryNeeded.toFixed(2)}</span> more for <strong>FREE delivery</strong>!
          </p>
          <Link to="/" className="continue-shopping">
            Continue Shopping →
          </Link>
        </div>
      )}

      {/* Main Content */}
      <main className="cart-content">
        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-icon">🛒</div>
            <h2>Your Cart is Empty</h2>
            <p>Looks like you haven't added any items yet</p>
            <button 
              className="shop-btn"
              onClick={() => navigate("/")}
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="cart-items">
              {cartItems.map((item, index) => {
                const finalPrice = item.finalPrice || item.discountPrice || item.price;
                const itemTotal = finalPrice * item.quantity;
                const discountPercentage = item.discountPrice 
                  ? Math.round(((item.price - item.discountPrice) / item.price) * 100)
                  : (item.discount || 0);
                
                // Stock status colors
                let stockClass = "in-stock";
                let stockText = "In Stock";
                
                if (item.type === "product") {
                  if (!item.isAvailable) {
                    stockClass = "out-stock";
                    stockText = "Out of Stock";
                  } else if (item.stock <= 10) {
                    stockClass = "low-stock";
                    stockText = `Only ${item.stock} left`;
                  }
                } else if (item.type === "offer") {
                  stockClass = "offer-stock";
                  stockText = "Limited Offer";
                }

                return (
                  <div 
                    id={`cart-item-${item.id}`}
                    key={item.id} 
                    className={`cart-item ${stockClass === "out-stock" ? "unavailable" : ""}`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Item Image */}
                    <div className="item-image">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        onError={(e) => {
                          e.target.src = "/placeholder.jpg";
                        }}
                      />
                      {discountPercentage > 0 && (
                        <div className="discount-badge">{discountPercentage}% OFF</div>
                      )}
                      {item.type === "offer" && (
                        <div className="offer-badge">OFFER</div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="item-details">
                      <h3 className="item-name">{item.name}</h3>
                      
                      {/* Stock Status with Color Coding */}
                      <div className={`stock-status ${stockClass}`}>
                        <div className="status-dot"></div>
                        <span className="status-text">{stockText}</span>
                      </div>

                      {/* Category & Unit */}
                      <div className="item-meta">
                        <span className="category">{item.category}</span>
                        {item.unit && <span className="unit">• {item.unit}</span>}
                      </div>

                      {/* Pricing */}
                      <div className="item-pricing">
                        <div className="price-row">
                          <span className="current-price">₹{finalPrice.toFixed(2)}</span>
                          {item.discountPrice && (
                            <span className="original-price">₹{item.price.toFixed(2)}</span>
                          )}
                        </div>
                        <div className="item-total">₹{itemTotal.toFixed(2)}</div>
                      </div>

                      {/* Actions */}
                      <div className="item-actions">
                        <div className="quantity-control">
                          <button
                            className="qty-btn minus"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || stockClass === "out-stock"}
                          >
                            −
                          </button>
                          <span className="qty-value">{item.quantity}</span>
                          <button
                            className="qty-btn plus"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={stockClass === "out-stock" || 
                                     (item.type === "product" && item.quantity >= item.stock)}
                          >
                            +
                          </button>
                        </div>
                        
                        <div className="action-buttons">
                          <button
                            className="save-btn"
                            onClick={() => saveForLater(item.id)}
                          >
                            Save
                          </button>
                          <button
                            className="remove-btn"
                            onClick={() => removeItem(item.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Save for Later Section */}
            {savingItems.length > 0 && (
              <div className="save-for-later">
                <h3 className="section-title">Saved for Later ({savingItems.length})</h3>
                <div className="saved-items">
                  {savingItems.map(item => (
                    <div key={item.id} className="saved-item">
                      <img src={item.image} alt={item.name} />
                      <div className="saved-details">
                        <h4>{item.name}</h4>
                        <button 
                          className="move-to-cart-btn"
                          onClick={() => moveToCart(item.id)}
                        >
                          Move to Cart
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer with Totals */}
      {cartItems.length > 0 && (
        <footer className="cart-footer">
          <div className="cart-summary">
            <div className="summary-row">
              <span>Subtotal ({totals.totalItems} items)</span>
              <span>₹{totals.subtotal.toFixed(2)}</span>
            </div>
            
            {totals.discount > 0 && (
              <div className="summary-row discount">
                <span>Discount</span>
                <span className="discount-amount">-₹{totals.discount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="summary-row delivery">
              <span>Delivery</span>
              <span className={deliveryNeeded === 0 ? "free" : ""}>
                {deliveryNeeded === 0 ? "FREE" : "₹50.00"}
              </span>
            </div>
            
            <div className="summary-total">
              <span>Total Amount</span>
              <span className="total-amount">
                ₹{(totals.total + (deliveryNeeded === 0 ? 0 : 50)).toFixed(2)}
              </span>
            </div>
            
            {totals.savings > 0 && (
              <div className="savings-note">
                You saved ₹{totals.savings.toFixed(2)}!
              </div>
            )}
          </div>

          <div className="cart-actions">
            {cartItems.length > 1 && (
              <button 
                className="clear-all-btn"
                onClick={() => setShowClearModal(true)}
              >
                Clear All Items
              </button>
            )}
            
            <button 
              className="checkout-btn"
              onClick={proceedToCheckout}
              disabled={!hasAvailableItems}
            >
              {user ? "Proceed to Checkout" : "Login to Checkout"}
            </button>
          </div>
          
          {!user && (
            <div className="guest-note">
              <i className="bi bi-info-circle"></i>
              <span>Login to save your cart and checkout securely</span>
            </div>
          )}
        </footer>
      )}
    </div>
  );
}