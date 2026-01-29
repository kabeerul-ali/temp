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

  /* ---------------- EFFECTS ---------------- */

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
  }, [offerHeight, user]);

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

  /* ---------------- API CALLS ---------------- */

  const fetchOffers = async () => {
    try {
      setLoading(prev => ({ ...prev, offers: true }));
      const res = await axios.get(`${BACKEND_URL}/api/offers/allactive`);
      setOffers(res.data.data || []);
    } catch {
      showAlert("error", "Failed to load offers");
    } finally {
      setLoading(prev => ({ ...prev, offers: false }));
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(prev => ({ ...prev, products: true }));
      const res = await axios.get(`${BACKEND_URL}/api/products`);
      setAllProducts(res.data.data || []);
      setProducts(res.data.data || []);
    } catch {
      showAlert("error", "Failed to load products");
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  };

  const loadCartCount = async () => {
    try {
      if (user) {
        const res = await axios.get(`${BACKEND_URL}/api/users/profile`);
        const count =
          res.data.data?.cart?.reduce((sum, i) => sum + i.quantity, 0) || 0;
        setCartCount(count);
      } else {
        const localCart = JSON.parse(localStorage.getItem("cart")) || [];
        setCartCount(localCart.reduce((sum, i) => sum + i.quantity, 0));
      }
    } catch {
      const localCart = JSON.parse(localStorage.getItem("cart")) || [];
      setCartCount(localCart.reduce((sum, i) => sum + i.quantity, 0));
    }
  };

  /* ---------------- CART LOGIC ---------------- */

  const addToLocalCart = useCallback((item, type = "product") => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const index = cart.findIndex(
      (c) => c.type === type && c.itemId === item._id
    );

    if (index > -1) {
      cart[index].quantity += 1;
    } else {
      cart.push({
        type,
        itemId: item._id,
        quantity: 1,
        addedAt: new Date().toISOString()
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    loadCartCount();
  }, []);

  const handleAddToCart = async (item, type = "product") => {
    if (!item || !item._id) return;

    // ✅ AUTH NOT READY → LOCAL CART ONLY
    if (authLoading) {
      addToLocalCart(item, type);
      showAlert("success", "Added to cart!");
      return;
    }

    try {
      if (user) {
        await axios.post(`${BACKEND_URL}/api/cart/add`, {
          type,
          itemId: item._id,
          quantity: 1
        });
      } else {
        addToLocalCart(item, type);
      }

      loadCartCount();
      showAlert("success", "Added to cart!");
    } catch {
      // ✅ FALLBACK (NO 500 ERROR)
      addToLocalCart(item, type);
      loadCartCount();
      showAlert("success", "Added to cart!");
    }
  };

  /* ---------------- HELPERS ---------------- */

  const applyCategoryFilter = useCallback((cat) => {
    setActiveCategory(cat);
    setSearch("");
    setProducts(
      cat === "all" ? allProducts : allProducts.filter(p => p.category === cat)
    );
  }, [allProducts]);

  const showAlert = useCallback((type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: "", message: "" }), 1500);
  }, []);

  const handleClearSearch = () => {
    setSearch("");
    applyCategoryFilter(activeCategory);
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="home-container">
      {alert.show && (
        <div className={`alert-toast ${alert.type}`}>{alert.message}</div>
      )}

     
    </div>
  );
}
