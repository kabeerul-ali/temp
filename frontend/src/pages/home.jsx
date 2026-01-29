// pages/Home.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./styles/home.css";

// Import Bootstrap icons
import "bootstrap-icons/font/bootstrap-icons.css";

axios.defaults.withCredentials = true;
const BACKEND_URL = "http://localhost:5000";
const categories = ["all", "fruit", "vegetable", "dairy", "beverage"];

const getCategoryIcon = (cat) => {
  switch (cat) {
    case "fruit": return "bi-apple";
    case "vegetable": return "bi-flower1";
    case "dairy": return "bi-cup-straw";
    case "beverage": return "bi-cup-fill";
    default: return "bi-shop";
  }
};

const getUnitDisplay = (unit) => {
  const unitMap = {
    kg: "kg", gm: "g", ltr: "L", ml: "ml",
    piece: "pc", dozen: "dz", packet: "pkt"
  };
  return unitMap[unit] || unit;
};

export default function Home() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [offers, setOffers] = useState([]);
  const [offerIndex, setOfferIndex] = useState(0);
  const [allProducts, setAllProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });
  const [cartCount, setCartCount] = useState(0);
  const [headerFixed, setHeaderFixed] = useState(false);
  const [categorySticky, setCategorySticky] = useState(false);
  const [offerHeight, setOfferHeight] = useState(0);
  const [loading, setLoading] = useState({ offers: true, products: true });

  useEffect(() => {
    fetchOffers();
    fetchProducts();
    loadCartCount();

    const handleScroll = () => {
      const scrollY = window.scrollY;
      setHeaderFixed(scrollY > 10);
      setCategorySticky(scrollY > offerHeight);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [offerHeight]);

  useEffect(() => {
    const updateOfferHeight = () => {
      const offerBanner = document.querySelector(".offer-banner");
      if (offerBanner) setOfferHeight(offerBanner.offsetHeight);
    };
    updateOfferHeight();
    window.addEventListener("resize", updateOfferHeight);
    return () => window.removeEventListener("resize", updateOfferHeight);
  }, [offers]);

  useEffect(() => {
    if (offers.length <= 1) return;
    // Slower auto-slide (5 seconds)
    const interval = setInterval(() => {
      setOfferIndex((prev) => (prev + 1) % offers.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [offers]);

  useEffect(() => {
    if (!search.trim()) {
      applyCategoryFilter(activeCategory);
    } else {
      const filtered = allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.description.toLowerCase().includes(search.toLowerCase())
      );
      setProducts(filtered);
    }
  }, [search, allProducts, activeCategory]);

  const fetchOffers = async () => {
    try {
      setLoading(prev => ({ ...prev, offers: true }));
      const res = await axios.get(`${BACKEND_URL}/api/offers/allactive`);
      setOffers(res.data.data || []);
    } catch (error) {
      console.error("Error fetching offers:", error);
      showAlert("error", "Failed to load offers");
    } finally {
      setLoading(prev => ({ ...prev, offers: false }));
    }
  };

  const loadCartCount = async () => {
    try {
      if (user) {
        const res = await axios.get(`${BACKEND_URL}/api/auth/profile`, {
          withCredentials: true
        });
        const count = res.data.data?.cart?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        setCartCount(count);
      } else {
        const localCart = JSON.parse(localStorage.getItem("cart")) || [];
        const count = localCart.reduce((sum, item) => sum + (item.quantity || 0), 0);
        setCartCount(count);
      }
    } catch {
      const localCart = JSON.parse(localStorage.getItem("cart")) || [];
      const count = localCart.reduce((sum, item) => sum + (item.quantity || 0), 0);
      setCartCount(count);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(prev => ({ ...prev, products: true }));
      const res = await axios.get(`${BACKEND_URL}/api/products`);
      setAllProducts(res.data.data || []);
      setProducts(res.data.data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      showAlert("error", "Failed to load products");
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  };

  const applyCategoryFilter = useCallback((cat) => {
    setActiveCategory(cat);
    setSearch("");
    const filtered = cat === "all"
      ? allProducts
      : allProducts.filter((p) => p.category === cat);
    setProducts(filtered);
  }, [allProducts]);

  const addToLocalCart = useCallback((item, type = 'product') => {
    const existingCart = JSON.parse(localStorage.getItem("cart")) || [];
    const itemIndex = existingCart.findIndex(
      (cartItem) => cartItem.type === type && cartItem.itemId === item._id
    );

    if (itemIndex > -1) {
      existingCart[itemIndex].quantity += 1;
    } else {
      const cartItem = {
        type,
        itemId: item._id,
        quantity: 1,
        addedAt: new Date().toISOString()
      };
      
      if (type === 'product') {
        cartItem.product = {
          name: item.name,
          price: item.discountPrice || item.price,
          image: item.images?.[0],
          unit: item.unit,
          category: item.category
        };
      } else if (type === 'offer') {
        cartItem.offer = {
          name: item.name,
          price: item.price - (item.price * item.discount / 100),
          originalPrice: item.price,
          discount: item.discount,
          image: item.image,
          description: item.description
        };
      }
      existingCart.push(cartItem);
    }

    localStorage.setItem("cart", JSON.stringify(existingCart));
    loadCartCount();
    showAlert("success", `${type === 'offer' ? 'Offer' : 'Product'} added to cart!`);
  }, []);

  const handleAddToCart = async (item, type = 'product') => {
    if (!item || !item._id) {
      showAlert("error", "Invalid item");
      return;
    }

    if (type === 'offer') {
      const now = new Date();
      const endTime = new Date(item.endTime);
      if (now > endTime) {
        showAlert("error", "Offer has expired");
        return;
      }
    } else {
      if (!item.isAvailable || item.stock <= 0) {
        showAlert("error", "Product is out of stock");
        return;
      }
    }

    try {
      if (user) {
        await axios.post(`${BACKEND_URL}/api/cart/add`, {
          type,
          itemId: item._id,
          quantity: 1,
        }, { withCredentials: true });
      } else {
        addToLocalCart(item, type);
      }
      loadCartCount();
      showAlert("success", `${type === 'offer' ? 'Offer' : 'Product'} added to cart!`);
    } catch (error) {
      console.error("Add to cart error:", error);
      if (error.response?.status === 400) {
        showAlert("error", error.response.data?.message || "Failed to add to cart");
      } else {
        addToLocalCart(item, type);
      }
    }
  };

  const handleAddOfferToCart = (e, offer) => {
    e.stopPropagation();
    e.preventDefault();
    if (offer) handleAddToCart(offer, 'offer');
  };

  const showAlert = useCallback((type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: "", message: "" }), 1500);
  }, []);

  const calculateTimeRemaining = (endTime) => {
    if (!endTime) return "Active";
    const end = new Date(endTime);
    const now = new Date();
    const diffMs = end - now;
    if (diffMs <= 0) return "Expired";
    const totalHours = diffMs / (1000 * 60 * 60);
    if (totalHours > 10) return "Active";
    const hours = Math.floor(totalHours);
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Remove handleOfferWheel function completely

  const handleClearSearch = () => {
    setSearch("");
    applyCategoryFilter(activeCategory);
  };

  const renderOfferSkeleton = () => (
    <div className="offer-banner skeleton">
      <div className="banner-image skeleton-bg">
        <div className="offer-overlay"></div>
        <div className="offer-content">
          <div className="skeleton-line title"></div>
          <div className="skeleton-line price"></div>
          <div className="skeleton-line desc"></div>
          <div className="skeleton-line status"></div>
          <div className="skeleton-line button"></div>
        </div>
      </div>
    </div>
  );

  const renderProductSkeleton = () =>
    Array.from({ length: 8 }).map((_, index) => (
      <div className="product-card skeleton" key={index}>
        <div className="product-image skeleton-bg"></div>
        <div className="product-info">
          <div className="skeleton-line name"></div>
          <div className="skeleton-line category"></div>
          <div className="price-section">
            <div className="skeleton-line price"></div>
          </div>
          <div className="product-actions">
            <div className="skeleton-line stock"></div>
            <div className="skeleton-line button"></div>
          </div>
        </div>
      </div>
    ));

  return (
    <div className="home-container">
      {alert.show && (
        <div className={`alert-toast ${alert.type}`}>{alert.message}</div>
      )}

      <header className={`home-header ${headerFixed ? "fixed" : ""}`}>
        <div className="header-content">
          <div className="search-section">
            <div className="search-wrapper">
              <i className="bi bi-search search-icon"></i>
              <input
                type="text"
                className="search-input"
                placeholder="Search for fruits, vegetables..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search products"
              />
              {search && (
                <button
                  className="clear-search"
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              )}
            </div>
            <button
              className="cart-button"
              onClick={() => navigate("/cart")}
              aria-label="View cart"
            >
              <i className="bi bi-cart3"></i>
              <span className="cart-badge">{cartCount}</span>
            </button>
          </div>
        </div>
      </header>

      {!search && (loading.offers ? renderOfferSkeleton() : offers[offerIndex] && (
        <div
          className="offer-banner"
          onClick={() => navigate(`/offer/${offers[offerIndex]._id}`)}
          role="button"
          tabIndex={0}
        >
          <div
            className="banner-image"
            style={{ backgroundImage: `url(${offers[offerIndex].image})` }}
          >
            <div className="offer-overlay"></div>
            <div className="offer-content">
              <h3 className="offer-title">{offers[offerIndex].name}</h3>
              <p className="offer-desc">{offers[offerIndex].description}</p>
              <div className="offer-pricing">
                <span className="current-price">
                  ₹{offers[offerIndex].price - (offers[offerIndex].price * offers[offerIndex].discount / 100)}
                </span>
                <span className="original-price">
                  ₹{offers[offerIndex].price}
                </span>
                <span className="discount-badge">
                  <i className="bi bi-tag-fill"></i> {offers[offerIndex].discount}% OFF
                </span>
              </div>
              <div className="offer-status">
                <i className="bi bi-clock-fill status-icon"></i>
                <span className="status-text">
                  {calculateTimeRemaining(offers[offerIndex].endTime)}
                </span>
              </div>
              <button
                className="add-offer-button"
                onClick={(e) => handleAddOfferToCart(e, offers[offerIndex])}
              >
                <i className="bi bi-cart-plus"></i> Add Offer to Cart
              </button>
            </div>
            <div className="offer-dots">
              {offers.map((_, index) => (
                <button
                  key={index}
                  className={`dot ${index === offerIndex ? "active" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOfferIndex(index);
                  }}
                  aria-label={`Go to offer ${index + 1}`}
                >
                  <i className={`bi ${index === offerIndex ? "bi-circle-fill" : "bi-circle"}`}></i>
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}

      {!search && (
        <div className={`category-tabs ${categorySticky ? "sticky" : ""}`}>
          <div className="tabs-container">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`category-tab ${activeCategory === cat ? "active" : ""}`}
                onClick={() => applyCategoryFilter(cat)}
              >
                <i className={`bi ${getCategoryIcon(cat)} tab-icon`}></i>
                <span className="tab-name">
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={`products-grid ${search ? "search-mode" : ""}`}>
        {loading.products ? (
          renderProductSkeleton()
        ) : products.length === 0 ? (
          <div className="empty-state">
            <i className="bi bi-search empty-icon"></i>
            <h3>No products found</h3>
            <p>Try searching for something else</p>
          </div>
        ) : (
          products.map((product) => {
            const discountPercentage = product.discountPrice
              ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
              : 0;
            const isAvailable = product.isAvailable && product.stock > 0;
            const finalPrice = product.discountPrice || product.price;

            return (
              <div className="product-card" key={product._id}>
                <div
                  className="product-image"
                  onClick={() => navigate(`/product/${product._id}`)}
                >
                  <img
                    src={product.images?.[0] || "/placeholder.jpg"}
                    alt={product.name}
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = "/placeholder.jpg";
                    }}
                  />
                  {discountPercentage > 0 && (
                    <div className="discount-tag">
                      <i className="bi bi-percent"></i> {discountPercentage}% OFF
                    </div>
                  )}
                  {!isAvailable && (
                    <div className="sold-out">
                      <i className="bi bi-x-circle"></i> Out of Stock
                    </div>
                  )}
                </div>

                <div className="product-info">
                  <h4
                    className="product-name"
                    onClick={() => navigate(`/product/${product._id}`)}
                  >
                    {product.name}
                  </h4>

                  <div className="product-category">
                    <span className="category">
                      <i className="bi bi-tag-fill"></i> {product.category}
                    </span>
                  </div>

                  <div className="price-section">
                    <div className="prices">
                      <span className="current">
                        ₹{finalPrice}
                        {product.unit && (
                          <span className="unit-price"> / {getUnitDisplay(product.unit)}</span>
                        )}
                      </span>
                      {product.discountPrice && (
                        <span className="original">₹{product.price}</span>
                      )}
                    </div>
                    {product.stock > 0 && product.stock <= 10 && (
                      <div className="low-stock">
                        <i className="bi bi-exclamation-triangle"></i> Only {product.stock} left!
                      </div>
                    )}
                  </div>

                  <div className="product-actions">
                    <div className={`stock-status ${isAvailable ? "in-stock" : "out-stock"}`}>
                      <i className={`bi ${isAvailable ? "bi-check-circle-fill" : "bi-x-circle-fill"}`}></i>
                      {isAvailable ? "In Stock" : "Out of Stock"}
                    </div>
                    <button
                      className={`add-button ${!isAvailable ? "disabled" : ""}`}
                      onClick={() => handleAddToCart(product, 'product')}
                      disabled={!isAvailable}
                    >
                      <i className="bi bi-cart-plus"></i> Add
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}