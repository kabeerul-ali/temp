// pages/ProductDetail.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import "./styles/product.css";

axios.defaults.withCredentials = true;
const BACKEND_URL = "http://localhost:5000";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("details");
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [deliveryDate, setDeliveryDate] = useState("");
  
  const shareMenuRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    calculateDeliveryDate();
    fetchProductDetails();
  }, [id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target)) {
        setShowShareMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const calculateDeliveryDate = () => {
    const today = new Date();
    const delivery = new Date(today);
    delivery.setDate(today.getDate() + 2);
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    setDeliveryDate(delivery.toLocaleDateString('en-US', options));
  };

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND_URL}/api/products/${id}`);
      if (res.data.success) {
        setProduct(res.data.data);
      }
    } catch (err) {
      setError("Failed to load product details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product || !product._id) {
      showToast("Product not available", "error");
      return;
    }

    try {
      if (user) {
        await axios.post(`${BACKEND_URL}/api/cart/add`, {
          type: "product",
          itemId: product._id,
          quantity: quantity
        }, { withCredentials: true });
      } else {
        const localCart = JSON.parse(localStorage.getItem("cart")) || [];
        const existingIndex = localCart.findIndex(item => 
          item.type === "product" && item.itemId === product._id
        );

        if (existingIndex > -1) {
          localCart[existingIndex].quantity += quantity;
        } else {
          localCart.push({
            type: "product",
            itemId: product._id,
            quantity: quantity,
            addedAt: new Date().toISOString(),
            product: {
              name: product.name,
              price: product.discountPrice || product.price,
              originalPrice: product.price,
              discountPercentage: product.discountPercentage,
              image: product.images?.[0],
              description: product.description,
              unit: product.unit,
              category: product.category,
              stock: product.stock
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
    toast.className = `product-toast ${type}`;
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
          title: product.name,
          text: product.description,
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

  const increaseQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(prev => prev + 1);
    }
  };

  const decreaseQuantity = () => {
    setQuantity(prev => prev > 1 ? prev - 1 : 1);
  };

  const nextImage = () => {
    if (product?.images?.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product?.images?.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  const getUnitDisplay = (unit) => {
    const unitMap = {
      kg: "kg",
      gm: "g",
      ltr: "L",
      ml: "ml",
      piece: "pc",
      dozen: "dz",
      packet: "pkt"
    };
    return unitMap[unit] || unit;
  };

  if (loading) {
    return (
      <div className="product-detail-loading">
        <div className="loading-skeleton header"></div>
        <div className="loading-skeleton image"></div>
        <div className="loading-skeleton title"></div>
        <div className="loading-skeleton price"></div>
        <div className="loading-skeleton buttons"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-error">
        <div className="error-icon">
          <i className="bi bi-exclamation-circle"></i>
        </div>
        <h2>Product Not Found</h2>
        <p>{error || "The product you're looking for doesn't exist."}</p>
        <button className="back-button" onClick={() => navigate("/")}>
          <i className="bi bi-arrow-left"></i>
          Back to Home
        </button>
      </div>
    );
  }

  const price = Number(product?.price ?? 0);
  const discountPrice = Number(product?.discountPrice ?? 0);
  const finalPrice = discountPrice || price;
  const discountPercentage = product?.discountPercentage || 0;
  const images = product.images || [];
  const isAvailable = product.isAvailable && product.stock > 0;

  const shareOptions = [
    { name: "Copy Link", icon: "bi-link-45deg", action: handleShare },
    { name: "WhatsApp", icon: "bi-whatsapp", action: () => window.open(`https://wa.me/?text=${encodeURIComponent(`Check this: ${window.location.href}`)}`, '_blank') },
    { name: "Facebook", icon: "bi-facebook", action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank') },
    { name: "Twitter", icon: "bi-twitter", action: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(product.name)}&url=${encodeURIComponent(window.location.href)}`, '_blank') }
  ];

  return (
    <div className="product-detail-container">
      {/* Fixed Header */}
      <header className="app-header">
        <button 
          className="back-btn"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <i className="bi bi-arrow-left"></i>
        </button>
        <span className="header-title">Product Details</span>
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
              aria-label="Share product"
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
        {/* Product Image Section */}
        <div className="image-section-wrapper">
          <section className="hero-section">
            <div className="image-display-wrapper">
              <div className="main-image-container">
                <div className="image-frame">
                  <img
                    ref={imageRef}
                    src={images[currentImageIndex] || "https://images.unsplash.com/photo-1610832958506-aa56368176cf"}
                    alt={product.name}
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
                
                {images.length > 1 && (
                  <div className="image-counter-badge">
                    <i className="bi bi-images"></i>
                    <span>{currentImageIndex + 1}/{images.length}</span>
                  </div>
                )}
                
                {/* Stock Status Badge */}
                <div className={`stock-badge ${isAvailable ? "in-stock" : "out-of-stock"}`}>
                  <i className={`bi ${isAvailable ? "bi-check-circle" : "bi-x-circle"}`}></i>
                  <span>{isAvailable ? "In Stock" : "Out of Stock"}</span>
                </div>
                
                {/* Discount Badge */}
                {discountPercentage > 0 && (
                  <div className="discount-image-badge">
                    <i className="bi bi-percent"></i>
                    <span>{discountPercentage}% OFF</span>
                  </div>
                )}
              </div>
            </div>
            
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
                <h1 className="product-title">{product.name}</h1>
                <span className="category-tag">
                  <i className={`bi ${
                    product.category === 'fruit' ? 'bi-apple' :
                    product.category === 'vegetable' ? 'bi-carrot' :
                    product.category === 'dairy' ? 'bi-cup-straw' :
                    product.category === 'beverage' ? 'bi-cup' : 'bi-tag'
                  }`}></i>
                  {product.category}
                </span>
              </div>
              <p className="product-description">{product.description}</p>
            </div>

            {/* Price Section */}
            <div className="price-section-wrapper">
              <div className="price-container">
                <div className="price-info">
                  <div className="price-row">
                    <span className="price-label">Price</span>
                    {discountPercentage > 0 && (
                      <span className="discount-badge">
                        <i className="bi bi-percent"></i>
                        {discountPercentage}% OFF
                      </span>
                    )}
                  </div>
                  <div className="price-display">
                    {discountPrice > 0 && (
                      <span className="original-price">₹{price.toLocaleString('en-IN')}</span>
                    )}
                    <div className="current-price">
                      <span className="currency">₹</span>
                      <span className="amount">{finalPrice.toLocaleString('en-IN')}</span>
                      <span className="unit">/ {getUnitDisplay(product.unit)}</span>
                    </div>
                    {discountPrice > 0 && (
                      <div className="save-info">
                        <i className="bi bi-currency-rupee"></i>
                        You save ₹{(price - discountPrice).toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stock Info */}
            <div className="stock-section-wrapper">
              <div className="stock-container">
                <div className="stock-info">
                  <i className="bi bi-box stock-icon"></i>
                  <div className="stock-details">
                    <span className="stock-label">Available Stock</span>
                    <span className={`stock-value ${product.stock <= 10 ? "low-stock" : ""}`}>
                      {product.stock} {getUnitDisplay(product.unit)} left
                    </span>
                    {product.stock <= 10 && (
                      <span className="stock-warning">
                        <i className="bi bi-exclamation-triangle"></i>
                        Low stock! Order soon
                      </span>
                    )}
                  </div>
                </div>
                <div className="sold-info">
                  <i className="bi bi-graph-up-arrow sold-icon"></i>
                  <div className="sold-details">
                    <span className="sold-label">Already Sold</span>
                    <span className="sold-value">{product.sold} {getUnitDisplay(product.unit)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quantity & Delivery */}
            <div className="delivery-section-wrapper">
              <div className="quantity-delivery-section">
                <div className="quantity-selector">
                  <span className="quantity-label">
                    <i className="bi bi-box"></i>
                    Quantity ({getUnitDisplay(product.unit)})
                  </span>
                  <div className="quantity-control">
                    <button 
                      className="qty-btn minus" 
                      onClick={decreaseQuantity} 
                      disabled={quantity <= 1 || !isAvailable}
                    >
                      <i className="bi bi-dash"></i>
                    </button>
                    <span className="quantity-value">{quantity}</span>
                    <button 
                      className="qty-btn plus" 
                      onClick={increaseQuantity}
                      disabled={quantity >= product.stock || !isAvailable}
                    >
                      <i className="bi bi-plus"></i>
                    </button>
                  </div>
                </div>
                
                <div className="delivery-info">
                  <div className="delivery-item">
                    <i className="bi bi-truck delivery-icon"></i>
                    <div className="delivery-details">
                      <span className="delivery-label">Delivery by {deliveryDate}</span>
                      <span className="delivery-note">Order within 2 hours for today</span>
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
                    className={`tab ${activeTab === "storage" ? "active" : ""}`}
                    onClick={() => setActiveTab("storage")}
                  >
                    <i className="bi bi-thermometer"></i>
                    Storage Tips
                  </button>
                  <button 
                    className={`tab ${activeTab === "usage" ? "active" : ""}`}
                    onClick={() => setActiveTab("usage")}
                  >
                    <i className="bi bi-lightbulb"></i>
                    Usage Ideas
                  </button>
                </div>
                
                <div className="tabs-content">
                  {activeTab === "details" && (
                    <div className="tab-panel">
                      <div className="product-specs">
                        <div className="spec-item">
                          <i className="bi bi-box spec-icon"></i>
                          <div className="spec-details">
                            <span className="spec-label">Unit</span>
                            <span className="spec-value">{getUnitDisplay(product.unit)}</span>
                          </div>
                        </div>
                        <div className="spec-item">
                          <i className="bi bi-tag spec-icon"></i>
                          <div className="spec-details">
                            <span className="spec-label">Category</span>
                            <span className="spec-value">{product.category}</span>
                          </div>
                        </div>
                        <div className="spec-item">
                          <i className="bi bi-calendar-check spec-icon"></i>
                          <div className="spec-details">
                            <span className="spec-label">Freshness</span>
                            <span className="spec-value">Daily Fresh</span>
                          </div>
                        </div>
                        <div className="spec-item">
                          <i className="bi bi-shield-check spec-icon"></i>
                          <div className="spec-details">
                            <span className="spec-label">Quality</span>
                            <span className="spec-value">100% Guaranteed</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === "storage" && (
                    <div className="tab-panel">
                      <div className="storage-tips">
                        <div className="tip-item">
                          <i className="bi bi-snow tip-icon"></i>
                          <div className="tip-content">
                            <h4>Refrigeration</h4>
                            <p>Store in refrigerator at 4°C for maximum freshness</p>
                          </div>
                        </div>
                        <div className="tip-item">
                          <i className="bi bi-droplet tip-icon"></i>
                          <div className="tip-content">
                            <h4>Moisture Control</h4>
                            <p>Keep in airtight container to prevent moisture loss</p>
                          </div>
                        </div>
                        <div className="tip-item">
                          <i className="bi bi-clock tip-icon"></i>
                          <div className="tip-content">
                            <h4>Shelf Life</h4>
                            <p>Best consumed within 2-3 days of purchase</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === "usage" && (
                    <div className="tab-panel">
                      <div className="usage-ideas">
                        <div className="idea-item">
                          <i className="bi bi-cup-straw idea-icon"></i>
                          <div className="idea-content">
                            <h4>Fresh Juice</h4>
                            <p>Perfect for making fresh healthy juices</p>
                          </div>
                        </div>
                        <div className="idea-item">
                          <i className="bi bi-egg-fried idea-icon"></i>
                          <div className="idea-content">
                            <h4>Cooking</h4>
                            <p>Ideal for curries, soups, and stir-fries</p>
                          </div>
                        </div>
                        <div className="idea-item">
                          <i className="bi bi-salad idea-icon"></i>
                          <div className="idea-content">
                            <h4>Salads</h4>
                            <p>Add to salads for extra nutrition</p>
                          </div>
                        </div>
                      </div>
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
              disabled={!isAvailable}
            >
              <i className="bi bi-cart-plus btn-icon"></i>
              {isAvailable ? "Add to Cart" : "Out of Stock"}
            </button>
            <button 
              className="btn btn-buy"
              onClick={handleBuyNow}
              disabled={!isAvailable}
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