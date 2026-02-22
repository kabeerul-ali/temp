// pages/checkout/address.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import "./styles/address.css";

axios.defaults.withCredentials = true;
const BACKEND_URL = "http://localhost:5000";

export default function Address() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const formRef = useRef(null);
  
  // State from previous page (cart or buy now)
  const orderData = location.state || {};
  
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    localAddress: "",
    city: "",
    district: "",
    state: "",
    pincode: "",
    country: "India",
    isDefault: false
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});

  // Show alert message
  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: "", message: "" }), 3000);
  };

  // Fetch addresses on load
  useEffect(() => {
    fetchAddresses();
  }, []);

  // Auto-select default address
  useEffect(() => {
    if (addresses.length > 0) {
      const defaultAddr = addresses.find(addr => addr.isDefault);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr._id);
      } else {
        setSelectedAddressId(addresses[0]._id);
      }
    }
  }, [addresses]);

  // Scroll to form when opened
  useEffect(() => {
    if (showForm && formRef.current) {
      setTimeout(() => {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showForm]);

  // Fetch all addresses
  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND_URL}/api/users/address`);
      if (res.data.success) {
        setAddresses(res.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      showAlert("error", "Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
    
    // Mark field as touched
    setTouchedFields(prev => ({ ...prev, [name]: true }));
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  // Handle field blur for validation
  const handleFieldBlur = (fieldName) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
    validateField(fieldName);
  };

  // Validate single field
  const validateField = (fieldName) => {
    const errors = { ...formErrors };
    
    switch(fieldName) {
      case 'localAddress':
        if (!formData.localAddress.trim()) {
          errors.localAddress = "Address is required";
        } else {
          delete errors.localAddress;
        }
        break;
      case 'city':
        if (!formData.city.trim()) {
          errors.city = "City is required";
        } else {
          delete errors.city;
        }
        break;
      case 'district':
        if (!formData.district.trim()) {
          errors.district = "District is required";
        } else {
          delete errors.district;
        }
        break;
      case 'state':
        if (!formData.state.trim()) {
          errors.state = "State is required";
        } else {
          delete errors.state;
        }
        break;
      case 'pincode':
        if (!formData.pincode.trim()) {
          errors.pincode = "Pincode is required";
        } else if (!/^\d{6}$/.test(formData.pincode)) {
          errors.pincode = "Pincode must be 6 digits";
        } else {
          delete errors.pincode;
        }
        break;
      default:
        break;
    }
    
    setFormErrors(errors);
    return !errors[fieldName];
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.localAddress.trim()) {
      errors.localAddress = "Address is required";
    }
    if (!formData.city.trim()) {
      errors.city = "City is required";
    }
    if (!formData.district.trim()) {
      errors.district = "District is required";
    }
    if (!formData.state.trim()) {
      errors.state = "State is required";
    }
    if (!formData.pincode.trim()) {
      errors.pincode = "Pincode is required";
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      errors.pincode = "Pincode must be 6 digits";
    }
    
    setFormErrors(errors);
    
    // Mark all fields as touched
    const allTouched = {};
    Object.keys(formData).forEach(key => {
      if (key !== 'country' && key !== 'isDefault') {
        allTouched[key] = true;
      }
    });
    setTouchedFields(allTouched);
    
    return Object.keys(errors).length === 0;
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      localAddress: "",
      city: "",
      district: "",
      state: "",
      pincode: "",
      country: "India",
      isDefault: false
    });
    setFormErrors({});
    setTouchedFields({});
    setEditingAddress(null);
    setShowForm(false);
  };

  // Handle edit click
  const handleEdit = (address) => {
    setEditingAddress(address);
    setFormData({
      localAddress: address.localAddress || "",
      city: address.city || "",
      district: address.district || "",
      state: address.state || "",
      pincode: address.pincode || "",
      country: address.country || "India",
      isDefault: address.isDefault || false
    });
    setShowForm(true);
  };

  // Handle form submit (add or edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Show error toast for first invalid field
      const firstError = Object.keys(formErrors)[0];
      if (firstError) {
        let errorMessage = "";
        switch(firstError) {
          case 'localAddress': errorMessage = "Please enter your address"; break;
          case 'city': errorMessage = "Please enter your city"; break;
          case 'district': errorMessage = "Please enter your district"; break;
          case 'state': errorMessage = "Please enter your state"; break;
          case 'pincode': errorMessage = "Please enter a valid 6-digit pincode"; break;
          default: errorMessage = formErrors[firstError];
        }
        showAlert("error", errorMessage);
      }
      return;
    }
    
    try {
      setSaving(true);
      
      if (editingAddress) {
        // Edit existing address
        const res = await axios.put(
          `${BACKEND_URL}/api/users/address/${editingAddress._id}`,
          formData
        );
        
        if (res.data.success) {
          showAlert("success", "Address updated successfully");
          await fetchAddresses();
          resetForm();
        }
      } else {
        // Add new address
        const res = await axios.post(`${BACKEND_URL}/api/users/address`, formData);
        
        if (res.data.success) {
          showAlert("success", "Address added successfully");
          await fetchAddresses();
          resetForm();
        }
      }
    } catch (error) {
      console.error("Error saving address:", error);
      showAlert("error", error.response?.data?.message || "Failed to save address");
    } finally {
      setSaving(false);
    }
  };

  // Handle set default
  const handleSetDefault = async (addressId) => {
    try {
      const res = await axios.patch(`${BACKEND_URL}/api/users/address/${addressId}/default`);
      
      if (res.data.success) {
        showAlert("success", "Default address updated");
        await fetchAddresses();
        setSelectedAddressId(addressId);
      }
    } catch (error) {
      console.error("Error setting default:", error);
      showAlert("error", "Failed to set default address");
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    
    try {
      const res = await axios.delete(`${BACKEND_URL}/api/users/address/${deleteConfirm}`);
      
      if (res.data.success) {
        showAlert("success", "Address deleted successfully");
        await fetchAddresses();
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      showAlert("error", error.response?.data?.message || "Failed to delete address");
    }
  };

  // Handle proceed to payment
const handleProceed = () => {
  if (!selectedAddressId) {
    showAlert("error", "Please select an address");
    return;
  }
  
  const selectedAddress = addresses.find(addr => addr._id === selectedAddressId);
  
  // Navigate to payment page with ALL data including flags
  navigate("/payment", {
    state: {
      ...orderData,           // This contains fromCart/fromBuyNow from previous page
      selectedAddress: selectedAddress,
      selectedAddressId: selectedAddressId
    }
  });
};

  // Format address for display
  const formatAddress = (addr) => {
    return `${addr.localAddress}, ${addr.city}, ${addr.district}, ${addr.state} - ${addr.pincode}, ${addr.country}`;
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e, action) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="address-page">
        <header className="address-header">
          <button 
            className="back-btn" 
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <i className="bi bi-arrow-left"></i>
          </button>
          <h1>Select Delivery Address</h1>
          <div className="header-placeholder"></div>
        </header>
        <div className="address-loading">
          <div className="loading-spinner" role="status" aria-label="Loading"></div>
          <p>Loading your addresses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="address-page">
      {/* Alert Toast */}
      {alert.show && (
        <div 
          className={`address-alert ${alert.type}`}
          role="alert"
          aria-live="assertive"
        >
          <i className={`bi bi-${alert.type === "success" ? "check-circle-fill" : "exclamation-circle-fill"}`}></i>
          <span>{alert.message}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div 
          className="modal-overlay" 
          onClick={() => setDeleteConfirm(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-icon" aria-hidden="true">🗑️</div>
            <h3 id="modal-title" className="modal-title">Delete Address?</h3>
            <p className="modal-text">
              Are you sure you want to delete this address? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button 
                className="modal-btn cancel"
                onClick={() => setDeleteConfirm(null)}
                autoFocus
              >
                Cancel
              </button>
              <button 
                className="modal-btn confirm"
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="address-header">
        <button 
          className="back-btn" 
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <i className="bi bi-arrow-left"></i>
        </button>
        <h1>Select Delivery Address</h1>
        <button 
          className="add-btn"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          aria-label="Add new address"
        >
          <i className="bi bi-plus-lg"></i>
        </button>
      </header>

      {/* Main Content */}
      <main className="address-content">
        {/* Address Form */}
        {showForm && (
          <div className="address-form-section" ref={formRef}>
            <h2 className="form-title">
              {editingAddress ? "✏️ Edit Address" : "📍 Add New Address"}
            </h2>
            <form onSubmit={handleSubmit} className="address-form" noValidate>
              <div className="form-group">
                <label htmlFor="localAddress">
                  Street Address / House No. <span className="required">*</span>
                </label>
                <textarea
                  id="localAddress"
                  name="localAddress"
                  value={formData.localAddress}
                  onChange={handleInputChange}
                  onBlur={() => handleFieldBlur('localAddress')}
                  placeholder="Enter your complete address"
                  className={touchedFields.localAddress && formErrors.localAddress ? "error" : ""}
                  rows="2"
                  disabled={saving}
                  aria-invalid={!!formErrors.localAddress}
                  aria-describedby={formErrors.localAddress ? "localAddress-error" : undefined}
                />
                {touchedFields.localAddress && formErrors.localAddress && (
                  <span id="localAddress-error" className="error-text">
                    <i className="bi bi-exclamation-circle"></i>
                    {formErrors.localAddress}
                  </span>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">
                    City <span className="required">*</span>
                  </label>
                  <input
                    id="city"
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('city')}
                    placeholder="Enter city"
                    className={touchedFields.city && formErrors.city ? "error" : ""}
                    disabled={saving}
                    aria-invalid={!!formErrors.city}
                    aria-describedby={formErrors.city ? "city-error" : undefined}
                  />
                  {touchedFields.city && formErrors.city && (
                    <span id="city-error" className="error-text">
                      <i className="bi bi-exclamation-circle"></i>
                      {formErrors.city}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="district">
                    District <span className="required">*</span>
                  </label>
                  <input
                    id="district"
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('district')}
                    placeholder="Enter district"
                    className={touchedFields.district && formErrors.district ? "error" : ""}
                    disabled={saving}
                    aria-invalid={!!formErrors.district}
                    aria-describedby={formErrors.district ? "district-error" : undefined}
                  />
                  {touchedFields.district && formErrors.district && (
                    <span id="district-error" className="error-text">
                      <i className="bi bi-exclamation-circle"></i>
                      {formErrors.district}
                    </span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="state">
                    State <span className="required">*</span>
                  </label>
                  <input
                    id="state"
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('state')}
                    placeholder="Enter state"
                    className={touchedFields.state && formErrors.state ? "error" : ""}
                    disabled={saving}
                    aria-invalid={!!formErrors.state}
                    aria-describedby={formErrors.state ? "state-error" : undefined}
                  />
                  {touchedFields.state && formErrors.state && (
                    <span id="state-error" className="error-text">
                      <i className="bi bi-exclamation-circle"></i>
                      {formErrors.state}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="pincode">
                    Pincode <span className="required">*</span>
                  </label>
                  <input
                    id="pincode"
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('pincode')}
                    placeholder="6 digit pincode"
                    maxLength="6"
                    inputMode="numeric"
                    pattern="\d*"
                    className={touchedFields.pincode && formErrors.pincode ? "error" : ""}
                    disabled={saving}
                    aria-invalid={!!formErrors.pincode}
                    aria-describedby={formErrors.pincode ? "pincode-error" : undefined}
                  />
                  {touchedFields.pincode && formErrors.pincode && (
                    <span id="pincode-error" className="error-text">
                      <i className="bi bi-exclamation-circle"></i>
                      {formErrors.pincode}
                    </span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="country">Country</label>
                <input
                  id="country"
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="Enter country"
                  disabled={saving}
                />
              </div>

              <div className="form-checkbox">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={formData.isDefault}
                    onChange={handleInputChange}
                    disabled={saving}
                  />
                  <span className="checkbox-text">
                    <i className="bi bi-check-circle"></i>
                    Set as default address
                  </span>
                </label>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="save-btn"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <i className="bi bi-hourglass-split"></i>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg"></i>
                      {editingAddress ? "Update Address" : "Save Address"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Address List */}
        {addresses.length === 0 ? (
          <div className="no-address">
            <div className="no-address-icon" aria-hidden="true">📍</div>
            <h3>No Saved Addresses</h3>
            <p>Add your first delivery address to continue</p>
            {!showForm && (
              <button 
                className="add-first-btn"
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
              >
                <i className="bi bi-plus-lg"></i>
                Add New Address
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="address-list" role="list">
              {addresses.map((address, index) => (
                <div 
                  key={address._id}
                  className={`address-card ${selectedAddressId === address._id ? "selected" : ""}`}
                  onClick={() => setSelectedAddressId(address._id)}
                  onKeyDown={(e) => handleKeyDown(e, () => setSelectedAddressId(address._id))}
                  role="listitem"
                  tabIndex={0}
                  aria-label={`Address ${index + 1}: ${formatAddress(address)}`}
                  aria-selected={selectedAddressId === address._id}
                >
                  <div className="address-radio" aria-hidden="true">
                    <div className={`radio-circle ${selectedAddressId === address._id ? "selected" : ""}`}>
                      {selectedAddressId === address._id && <div className="radio-dot"></div>}
                    </div>
                  </div>
                  
                  <div className="address-details">
                    {address.isDefault && (
                      <span className="default-badge">
                        <i className="bi bi-star-fill"></i>
                        DEFAULT
                      </span>
                    )}
                    <p className="address-text">{formatAddress(address)}</p>
                    
                    <div className="address-actions">
                      <button 
                        className="address-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(address);
                        }}
                        aria-label={`Edit address ${index + 1}`}
                      >
                        <i className="bi bi-pencil"></i>
                        Edit
                      </button>
                      
                      {!address.isDefault && (
                        <>
                          <button 
                            className="address-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetDefault(address._id);
                            }}
                            aria-label={`Set address ${index + 1} as default`}
                          >
                            <i className="bi bi-check-circle"></i>
                            Set Default
                          </button>
                          
                          <button 
                            className="address-action-btn delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm(address._id);
                            }}
                            aria-label={`Delete address ${index + 1}`}
                          >
                            <i className="bi bi-trash"></i>
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Address Button (when form is hidden) */}
            {!showForm && (
              <button 
                className="add-address-btn"
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
              >
                <i className="bi bi-plus-lg"></i>
                Add New Address
              </button>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="address-footer">
        <div className="order-summary">
          <span className="items-count">
            <i className="bi bi-box"></i>
            Total Items: {orderData.cartItemsCount || 1}
          </span>
          <div className="total-section">
            <span className="total-label">Total:</span>
            <span className="total-amount">
              ₹{(orderData.finalTotal || orderData.cartTotal || 0).toFixed(2)}
            </span>
          </div>
        </div>
        
        <button 
          className={`proceed-btn ${!selectedAddressId ? 'disabled' : ''}`}
          onClick={handleProceed}
          disabled={!selectedAddressId}
          aria-label="Proceed to payment"
        >
          <span>Proceed to Payment</span>
          <i className="bi bi-arrow-right"></i>
        </button>
      </footer>
    </div>
  );
}