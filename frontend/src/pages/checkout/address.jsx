// pages/AddressSelectionPage.jsx (Updated Version)
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import "./styles/address.css";

axios.defaults.withCredentials = true;
const BACKEND_URL = "http://localhost:5000";

export default function AddressSelectionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Modal states (SAME AS AddressSelector)
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // "add", "edit", "delete"
  const [editingAddress, setEditingAddress] = useState(null);
  
  // Form state (SAME AS AddressSelector)
  const [formData, setFormData] = useState({
    localAddress: "",
    city: "",
    district: "",
    state: "",
    pincode: "",
    country: "India",
    isDefault: false
  });

  const [alert, setAlert] = useState({ show: false, type: "", message: "" });

  // Show alert
  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: "", message: "" }), 3000);
  };

  // Fetch addresses
  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND_URL}/api/users/address`);
      const fetchedAddresses = res.data.data || [];
      setAddresses(fetchedAddresses);
      
      // Auto-select default address
      const defaultIndex = fetchedAddresses.findIndex(addr => addr.isDefault);
      if (defaultIndex > -1) {
        setSelectedAddressIndex(defaultIndex);
      } else if (fetchedAddresses.length > 0) {
        setSelectedAddressIndex(0);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      showAlert("error", "Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  // Handle select address
  const handleSelectAddress = (index) => {
    setSelectedAddressIndex(index);
  };

  // Open modal (SAME AS AddressSelector)
  const openModal = (type, address = null, index = null) => {
    setModalType(type);
    setEditingAddress(address ? { ...address, originalIndex: index } : null);
    
    if (type === "edit" && address) {
      setFormData({
        localAddress: address.localAddress || "",
        city: address.city || "",
        district: address.district || "",
        state: address.state || "",
        pincode: address.pincode || "",
        country: address.country || "India",
        isDefault: address.isDefault || false
      });
    } else if (type === "add") {
      setFormData({
        localAddress: "",
        city: "",
        district: "",
        state: "",
        pincode: "",
        country: "India",
        isDefault: addresses.length === 0 // First address auto default
      });
    }
    
    setShowModal(true);
    setAlert({ show: false, type: "", message: "" });
  };

  // Close modal (SAME AS AddressSelector)
  const closeModal = () => {
    setShowModal(false);
    setModalType("");
    setEditingAddress(null);
    resetForm();
  };

  // Handle form input change (SAME AS AddressSelector)
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  // Validate form (SAME AS AddressSelector)
  const validateForm = () => {
    const { localAddress, city, district, state, pincode } = formData;
    
    if (!localAddress.trim()) {
      showAlert("error", "Local address is required");
      return false;
    }
    if (!city.trim()) {
      showAlert("error", "City is required");
      return false;
    }
    if (!district.trim()) {
      showAlert("error", "District is required");
      return false;
    }
    if (!state.trim()) {
      showAlert("error", "State is required");
      return false;
    }
    if (!pincode.trim()) {
      showAlert("error", "Pincode is required");
      return false;
    }
    if (!/^\d{6}$/.test(pincode.trim())) {
      showAlert("error", "Pincode must be 6 digits");
      return false;
    }
    
    return true;
  };

  // Add new address (SAME AS AddressSelector)
  const handleAddAddress = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const trimmedFormData = {
        localAddress: formData.localAddress.trim(),
        city: formData.city.trim(),
        district: formData.district.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        country: formData.country.trim(),
        isDefault: formData.isDefault
      };
      
      const res = await axios.post(`${BACKEND_URL}/api/users/address`, trimmedFormData);
      showAlert("success", "Address added successfully");
      closeModal();
      fetchAddresses();
    } catch (error) {
      console.error("Error adding address:", error);
      showAlert("error", error.response?.data?.message || "Failed to add address");
    }
  };

  // Edit address (SAME AS AddressSelector)
  const handleEditAddress = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const trimmedFormData = {
        localAddress: formData.localAddress.trim(),
        city: formData.city.trim(),
        district: formData.district.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        country: formData.country.trim(),
        isDefault: formData.isDefault
      };
      
      await axios.put(`${BACKEND_URL}/api/users/address/${editingAddress._id}`, trimmedFormData);
      showAlert("success", "Address updated successfully");
      closeModal();
      fetchAddresses();
    } catch (error) {
      console.error("Error editing address:", error);
      showAlert("error", error.response?.data?.message || "Failed to update address");
    }
  };

  // Delete address (SAME AS AddressSelector)
  const handleDeleteAddress = async () => {
    if (!editingAddress) return;
    
    try {
      await axios.delete(`${BACKEND_URL}/api/users/address/${editingAddress._id}`);
      
      // Close modal immediately
      closeModal();
      
      // Update addresses list
      await fetchAddresses();
      
      // If deleted address was selected, select another
      if (selectedAddressIndex === editingAddress.originalIndex) {
        const newAddresses = addresses.filter(addr => addr._id !== editingAddress._id);
        if (newAddresses.length > 0) {
          const newDefaultIndex = newAddresses.findIndex(addr => addr.isDefault) || 0;
          setSelectedAddressIndex(newDefaultIndex);
        } else {
          setSelectedAddressIndex(null);
        }
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      showAlert("error", error.response?.data?.message || "Failed to delete address");
    }
  };

  // Set default address (SAME AS AddressSelector)
  const handleSetDefault = async (id, index) => {
    try {
      await axios.patch(`${BACKEND_URL}/api/users/address/${id}/default`);
      showAlert("success", "Default address updated");
      fetchAddresses();
    } catch (error) {
      console.error("Error setting default:", error);
      showAlert("error", "Failed to set default address");
    }
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
  };

  // Continue to payment
  const handleContinue = () => {
    if (selectedAddressIndex === null) {
      showAlert("warning", "Please select an address");
      return;
    }
    
    const selectedAddress = addresses[selectedAddressIndex];
    if (selectedAddress) {
      // Save to localStorage
      localStorage.setItem("selectedDeliveryAddress", JSON.stringify(selectedAddress));
      
      navigate("/payment", {
        state: {
          addressIndex: selectedAddressIndex,
          fromCheckout: location.state?.fromCheckout,
          selectedAddress: selectedAddress
        }
      });
    }
  };

  // Load addresses on mount
  useEffect(() => {
    fetchAddresses();
  }, []);

  if (loading && addresses.length === 0) {
    return (
      <div className="address-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading addresses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="address-page">
      {/* Header (SAME AS AddressSelector) */}
      <div className="address-header">
        <h2>Select Delivery Address</h2>
        <button className="close-btn" onClick={() => navigate(-1)}>
          <i className="bi bi-x-lg"></i>
        </button>
      </div>

      {/* Alert */}
      {alert.show && (
        <div className={`alert alert-${alert.type}`}>
          <i className={`bi ${alert.type === "success" ? "bi-check-circle" : "bi-exclamation-triangle"}`}></i>
          <span>{alert.message}</span>
        </div>
      )}

      {/* Address List (SAME UI AS AddressSelector) */}
      <div className="address-list">
        {addresses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <i className="bi bi-geo-alt"></i>
            </div>
            <h3>No Address Found</h3>
            <p>Add your first delivery address to continue</p>
            <button 
              className="btn-primary"
              onClick={() => openModal("add")}
            >
              <i className="bi bi-plus"></i> Add Your First Address
            </button>
          </div>
        ) : (
          <>
            {addresses.map((address, index) => (
              <div 
                key={address._id || index}
                className={`address-card ${selectedAddressIndex === index ? "selected" : ""} ${address.isDefault ? "default" : ""}`}
                onClick={() => handleSelectAddress(index)}
              >
                {/* Default Badge (SAME AS AddressSelector) */}
                {address.isDefault && (
                  <div className="default-badge">
                    <i className="bi bi-check-circle"></i> Default
                  </div>
                )}
                
                {/* Address Content (SAME AS AddressSelector) */}
                <div className="address-content">
                  <div className="address-line">
                    <strong>{address.localAddress}</strong>
                  </div>
                  <div className="address-line">
                    {address.city}, {address.district}
                  </div>
                  <div className="address-line">
                    {address.state} - {address.pincode}
                  </div>
                  <div className="address-line">
                    {address.country}
                  </div>
                </div>
                
                {/* Action Buttons (SAME AS AddressSelector) */}
                <div className="address-actions" onClick={(e) => e.stopPropagation()}>
                  {!address.isDefault && (
                    <button 
                      className="btn-set-default"
                      onClick={() => handleSetDefault(address._id, index)}
                      title="Set as default"
                    >
                      <i className="bi bi-star"></i> Set Default
                    </button>
                  )}
                  
                  <button 
                    className="btn-edit"
                    onClick={() => openModal("edit", address, index)}
                    title="Edit address"
                  >
                    <i className="bi bi-pencil"></i>
                  </button>
                  
                  <button 
                    className="btn-delete"
                    onClick={() => openModal("delete", address, index)}
                    title="Delete address"
                    disabled={addresses.length === 1}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            ))}
            
            {/* Add New Address Button (SAME AS AddressSelector) */}
            <div className="add-address-btn-container">
              <button 
                className="btn-add-address"
                onClick={() => openModal("add")}
              >
                <i className="bi bi-plus-lg"></i> Add New Address
              </button>
            </div>
          </>
        )}
      </div>

      {/* Next Button Footer */}
      {selectedAddressIndex !== null && addresses.length > 0 && (
        <div className="selection-footer">
          <button 
            className="btn-select-address"
            onClick={handleContinue}
          >
            <i className="bi bi-check-lg"></i>
            <span>Continue to Payment</span>
          </button>
        </div>
      )}

      {/* Modal for Add/Edit/Delete (SAME AS AddressSelector) */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-header">
              <h3>
                {modalType === "add" && "Add New Address"}
                {modalType === "edit" && "Edit Address"}
                {modalType === "delete" && "Delete Address"}
              </h3>
              <button className="modal-close" onClick={closeModal}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body">
              {modalType === "delete" ? (
                // Delete Confirmation
                <div className="delete-confirmation">
                  <div className="delete-icon">
                    <i className="bi bi-trash"></i>
                  </div>
                  <h4>Are you sure?</h4>
                  <p>You want to delete this address?</p>
                  {editingAddress && (
                    <div className="address-preview">
                      <p>{editingAddress.localAddress}</p>
                      <p>{editingAddress.city}, {editingAddress.state} - {editingAddress.pincode}</p>
                    </div>
                  )}
                  {addresses.length === 1 && (
                    <div className="warning-message">
                      <i className="bi bi-exclamation-triangle"></i>
                      <span>This is your only address. You cannot delete it.</span>
                    </div>
                  )}
                </div>
              ) : (
                // Add/Edit Form
                <form onSubmit={modalType === "add" ? handleAddAddress : handleEditAddress}>
                  <div className="form-group">
                    <label htmlFor="localAddress">Local Address *</label>
                    <input
                      type="text"
                      id="localAddress"
                      name="localAddress"
                      value={formData.localAddress}
                      onChange={handleInputChange}
                      placeholder="House no, Building, Street"
                      required
                      autoComplete="off"
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="city">City *</label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="City"
                        required
                        autoComplete="off"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="district">District *</label>
                      <input
                        type="text"
                        id="district"
                        name="district"
                        value={formData.district}
                        onChange={handleInputChange}
                        placeholder="District"
                        required
                        autoComplete="off"
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="state">State *</label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        placeholder="State"
                        required
                        autoComplete="off"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="pincode">Pincode *</label>
                      <input
                        type="text"
                        id="pincode"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleInputChange}
                        placeholder="6 digits"
                        maxLength="6"
                        pattern="\d{6}"
                        required
                        autoComplete="off"
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="country">Country</label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      placeholder="Country"
                      autoComplete="off"
                    />
                  </div>
                  
                  <div className="form-checkbox">
                    <input
                      type="checkbox"
                      id="isDefault"
                      name="isDefault"
                      checked={formData.isDefault}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="isDefault">
                      Set as default delivery address
                    </label>
                  </div>
                  
                  {/* Modal Footer */}
                  <div className="modal-footer">
                    <button 
                      type="button"
                      className="btn-secondary" 
                      onClick={closeModal}
                    >
                      Cancel
                    </button>
                    
                    <button 
                      type="submit"
                      className="btn-primary"
                    >
                      <i className="bi bi-check"></i>
                      <span>{modalType === "add" ? "Add Address" : "Save Changes"}</span>
                    </button>
                  </div>
                </form>
              )}
              
              {modalType === "delete" && (
                <div className="modal-footer">
                  <button 
                    className="btn-secondary" 
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  
                  <button 
                    className="btn-danger"
                    onClick={handleDeleteAddress}
                    disabled={addresses.length === 1}
                  >
                    <i className="bi bi-trash"></i>
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}