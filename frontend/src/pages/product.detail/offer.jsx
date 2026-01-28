// pages/OfferDetail.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import "./styles/offer.css";

axios.defaults.withCredentials = true;
const BACKEND_URL = "http://localhost:5000";

export default function OfferDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });
  const [activeTab, setActiveTab] = useState("details");
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [quantity, setQuantity] = useState(1);
  
  const shareMenuRef = useRef(null);
  const imageRef = useRef(null);
  const [deliveryDate, setDeliveryDate] = useState("");

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target)) {
        setShowShareMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    calculateDeliveryDate();
    fetchOfferDetails();
  }, [id]);

  useEffect(() => {
    if (offer && offer.endTime) {
      calculateTimeLeft();
      const timer = setInterval(calculateTimeLeft, 1000);
      return () => clearInterval(timer);
    }
  }, [offer]);

  const calculateDeliveryDate = () => {
    const today = new Date();
    const delivery = new Date(today);
    delivery.setDate(today.getDate() + 2);
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    setDeliveryDate(delivery.toLocaleDateString('en-US', options));
  };

  const fetchOfferDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND_URL}/api/offers/${id}`);
      if (res.data.success) {
        const offerData = res.data.data;
        setOffer(offerData);
      }
    } catch (err) {
      setError("Failed to load offer details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTimeLeft = () => {
    if (!offer?.endTime) return;
    const end = new Date(offer.endTime);
    const now = new Date();
    const difference = end - now;

    if (difference > 0) {
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({
        hours,
        minutes,
        seconds,
        isExpired: false
      });
    } else {
      setTimeLeft({
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true
      });
    }
  };

  const handleAddToCart = async () => {
    try {
      if (user) {
        await axios.post(`${BACKEND_URL}/api/cart/add`, {
          type: "offer",
          itemId: offer._id,
          quantity: quantity
        }, { withCredentials: true });
      } else {
        const localCart = JSON.parse(localStorage.getItem("cart")) || [];
        const existingIndex = localCart.findIndex(item => 
          item.type === "offer" && item.itemId === offer._id
        );

        if (existingIndex > -1) {
          localCart[existingIndex].quantity += quantity;
        } else {
          localCart.push({
            type: "offer",
            itemId: offer._id,
            quantity: quantity,
            addedAt: new Date().toISOString(),
            offer: {
              name: offer.name,
              price: offer.price - (offer.price * offer.discount / 100),
              originalPrice: offer.price,
              discount: offer.discount,
              image: offer.image,
              description: offer.description
            }
          });
        }
        localStorage.setItem("cart", JSON.stringify(localCart));
      }
      showToast("Added to cart!", "success");
    } catch (error) {
      console.error("Error adding to cart:", error);
      showToast("Failed to add to cart", "error");
    }
  };

  const handleBuyNow = () => {
    showToast("Buy Now feature coming soon!", "info");
  };

  const showToast = (message, type) => {
    const toast = document.createElement("div");
    toast.className = `offer-toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: offer.name,
          text: `Check out this amazing offer: ${offer.description}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast("Link copied!", "success");
    }
  };

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    showToast(!isWishlisted ? "Added to wishlist!" : "Removed from wishlist", "success");
  };

  const increaseQuantity = () => setQuantity(prev => prev + 1);
  const decreaseQuantity = () => setQuantity(prev => prev > 1 ? prev - 1 : 1);

  const nextImage = () => {
    if (offer?.images?.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % offer.images.length);
    }
  };

  const prevImage = () => {
    if (offer?.images?.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + offer.images.length) % offer.images.length);
    }
  };

  if (loading) {
    return (
      <div className="offer-detail-loading">
        <div className="loading-skeleton header"></div>
        <div className="loading-skeleton image"></div>
        <div className="loading-skeleton title"></div>
        <div className="loading-skeleton price"></div>
        <div className="loading-skeleton buttons"></div>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="offer-error">
        <div className="error-icon">
          <i className="bi bi-exclamation-circle"></i>
        </div>
        <h2>Offer Not Found</h2>
        <p>{error || "The offer you're looking for doesn't exist."}</p>
        <button className="back-button" onClick={() => navigate("/")}>
          <i className="bi bi-arrow-left"></i>
          Back to Home
        </button>
      </div>
    );
  }

  const price = Number(offer?.price ?? 0);
  const discountPercentage = Number(offer?.discount ?? 0);
  const finalPrice = price - (price * discountPercentage / 100);
  const images = offer.images || [offer.image];

  const shareOptions = [
    { name: "Copy Link", icon: "bi-link-45deg", action: handleShare },
    { name: "WhatsApp", icon: "bi-whatsapp", action: () => window.open(`https://wa.me/?text=${encodeURIComponent(`Check this: ${window.location.href}`)}`, '_blank') },
    { name: "Facebook", icon: "bi-facebook", action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank') },
    { name: "Twitter", icon: "bi-twitter", action: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(offer.name)}&url=${encodeURIComponent(window.location.href)}`, '_blank') },
    { name: "Instagram", icon: "bi-instagram", action: () => window.open(`https://www.instagram.com/`, '_blank') },
    { name: "Telegram", icon: "bi-telegram", action: () => window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}`, '_blank') },
    { name: "Email", icon: "bi-envelope", action: () => window.open(`mailto:?subject=${encodeURIComponent(offer.name)}&body=${encodeURIComponent(window.location.href)}`, '_blank') }
  ];

  return (
    <div className="offer-detail-container">
      {/* Fixed Header */}
      <header className="app-header">
        <button 
          className="back-btn"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <i className="bi bi-arrow-left"></i>
        </button>
        <span className="header-title">Offer Details</span>
        <div className="header-actions">
          <button 
            className={`wishlist-btn ${isWishlisted ? "active" : ""}`}
            onClick={toggleWishlist}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <i className={`bi ${isWishlisted ? "bi-heart-fill" : "bi-heart"}`}></i>
          </button>
          <div className="share-container" ref={shareMenuRef}>
            <button 
              className="share-btn"
              onClick={() => setShowShareMenu(!showShareMenu)}
              aria-label="Share offer"
            >
              <i className="bi bi-share"></i>
            </button>
            {showShareMenu && (
              <div className="share-menu">
                {shareOptions.map((option, index) => (
                  <button key={index} onClick={option.action}>
                    <i className={`bi ${option.icon}`}></i>
                    <span>{option.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* Hero Image Section */}
        <div className="image-section-wrapper">
          <section className="hero-section">
           <div className="image-display-wrapper">
  <div className="main-image-container">
    <div className="image-frame">
      <img
        ref={imageRef}
        src={images[currentImageIndex]}
        alt={offer.name}
        className="main-image"
        loading="lazy"
      />
      
      {images.length > 1 && (
        <>
          <button 
            className="image-nav prev"
            onClick={prevImage}
            aria-label="Previous image"
          >
            <i className="bi bi-chevron-left"></i>
          </button>
          <button 
            className="image-nav next"
            onClick={nextImage}
            aria-label="Next image"
          >
            <i className="bi bi-chevron-right"></i>
          </button>
        </>
      )}
    </div>
    
    {/* Image Counter Badge */}
    {images.length > 1 && (
      <div className="image-counter-badge">
        <i className="bi bi-images"></i>
        <span>{currentImageIndex + 1}/{images.length}</span>
      </div>
    )}
  </div>
</div>
            {/* Image Dots Indicator */}
            {images.length > 1 && (
              <div className="image-dots">
                {images.map((_, index) => (
                  <button
                    key={index}
                    className={`image-dot ${currentImageIndex === index ? "active" : ""}`}
                    onClick={() => setCurrentImageIndex(index)}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Product Details Section */}
        <div className="details-section-wrapper">
          <section className="product-details">
            <div className="product-header">
              <div className="product-title-row">
                <h1 className="product-title">{offer.name}</h1>
                {offer.category && (
                  <span className="category-tag">
                    <i className="bi bi-tag"></i>
                    {offer.category}
                  </span>
                )}
              </div>
              <p className="product-description">{offer.description}</p>
            </div>

            {/* Price Section */}
            <div className="price-section-wrapper">
              <div className="price-container">
                <div className="price-info">
                  <div className="price-row">
                    <span className="price-label">Deal Price</span>
                    <span className="discount-badge">
                      <i className="bi bi-percent"></i>
                      {discountPercentage}% OFF
                    </span>
                  </div>
                  <div className="price-display">
                    <span className="original-price">₹{price.toLocaleString('en-IN')}</span>
                    <div className="current-price">
                      <span className="currency">₹</span>
                      <span className="amount">{finalPrice.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="save-info">
                      <i className="bi bi-currency-rupee"></i>
                      You save ₹{(price * discountPercentage / 100).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timer Section */}
            <div className="timer-section-wrapper">
              {!timeLeft.isExpired ? (
                <div className="timer-container">
                  <div className="timer-header">
                    <i className="bi bi-clock timer-icon"></i>
                    <span className="timer-title">Offer ends in</span>
                  </div>
                  <div className="timer-display">
                    <div className="time-unit">
                      <div className="time-value">{String(timeLeft.hours).padStart(2, '0')}</div>
                      <div className="time-label">HRS</div>
                    </div>
                    <div className="time-separator">:</div>
                    <div className="time-unit">
                      <div className="time-value">{String(timeLeft.minutes).padStart(2, '0')}</div>
                      <div className="time-label">MIN</div>
                    </div>
                    <div className="time-separator">:</div>
                    <div className="time-unit">
                      <div className="time-value">{String(timeLeft.seconds).padStart(2, '0')}</div>
                      <div className="time-label">SEC</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="expired-notice">
                  <i className="bi bi-exclamation-octagon expired-icon"></i>
                  <span className="expired-text">Offer expired</span>
                </div>
              )}
            </div>

            {/* Quantity & Delivery */}
            <div className="delivery-section-wrapper">
              <div className="quantity-delivery-section">
                <div className="quantity-selector">
                  <span className="quantity-label">
                    <i className="bi bi-box"></i>
                    Quantity
                  </span>
                  <div className="quantity-control">
                    <button className="qty-btn minus" onClick={decreaseQuantity} disabled={quantity <= 1}>
                      <i className="bi bi-dash"></i>
                    </button>
                    <span className="quantity-value">{quantity}</span>
                    <button className="qty-btn plus" onClick={increaseQuantity}>
                      <i className="bi bi-plus"></i>
                    </button>
                  </div>
                </div>
                
                <div className="delivery-info">
                  <div className="delivery-item">
                    <i className="bi bi-truck delivery-icon"></i>
                    <div className="delivery-details">
                      <span className="delivery-label">Delivery by {deliveryDate}</span>
                      <span className="delivery-note">Order within 2 hours</span>
                    </div>
                  </div>
                  <div className="delivery-item">
                    <i className="bi bi-coin delivery-icon"></i>
                    <div className="delivery-details">
                      <span className="delivery-label">FREE Delivery</span>
                      <span className="delivery-note">On orders above ₹499</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Tabs */}
            <div className="tabs-section-wrapper">
              <div className="product-tabs">
                <div className="tabs-header">
                  <button 
                    className={`tab ${activeTab === "details" ? "active" : ""}`}
                    onClick={() => setActiveTab("details")}
                  >
                    <i className="bi bi-info-circle"></i>
                    Details
                  </button>
                  <button 
                    className={`tab ${activeTab === "terms" ? "active" : ""}`}
                    onClick={() => setActiveTab("terms")}
                  >
                    <i className="bi bi-file-text"></i>
                    Terms
                  </button>
                </div>
                
                <div className="tabs-content">
                  {activeTab === "details" && (
                    <div className="tab-panel">
                      <div className="product-features">
                        <div className="feature">
                          <i className="bi bi-check-circle feature-icon"></i>
                          <span>Quality Guaranteed</span>
                        </div>
                        <div className="feature">
                          <i className="bi bi-truck feature-icon"></i>
                          <span>Fast Delivery</span>
                        </div>
                        <div className="feature">
                          <i className="bi bi-arrow-return-left feature-icon"></i>
                          <span>Easy Returns</span>
                        </div>
                        <div className="feature">
                          <i className="bi bi-shield-check feature-icon"></i>
                          <span>Secure Payment</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === "terms" && (
                    <div className="tab-panel">
                      <ul className="terms-list">
                        <li>Valid until {new Date(offer.endTime).toLocaleDateString()}</li>
                        <li>One offer per customer</li>
                        <li>Cannot combine with other offers</li>
                        <li>Prices include all taxes</li>
                        <li>Delivery in 2-4 hours</li>
                        <li>Quality guarantee or full refund</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Fixed Action Bar */}
      <div className="action-bar">
        <div className="action-content">
          <div className="price-summary">
            <span className="total-price-label">Total</span>
            <span className="total-price">₹{(finalPrice * quantity).toLocaleString('en-IN')}</span>
          </div>
          <div className="action-buttons">
            <button 
              className="btn btn-cart"
              onClick={handleAddToCart}
              disabled={timeLeft.isExpired}
            >
              <i className="bi bi-cart-plus btn-icon"></i>
              Add to Cart
            </button>
            <button 
              className="btn btn-buy"
              onClick={handleBuyNow}
              disabled={timeLeft.isExpired}
            >
              <i className="bi bi-bag-check btn-icon"></i>
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}