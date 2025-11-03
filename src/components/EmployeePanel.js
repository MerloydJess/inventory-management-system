import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './EmployeePanel.css';
import { useNavigate } from 'react-router-dom';
import EmployeeReceipts from "./EmployeeReceipts";
import EmployeeDashboard from "./EmployeeDashboard";
import Modal from 'react-modal';
import wsManager from '../utils/websocket';

const API_BASE_URL = process.env.REACT_APP_API_URL;

const EmployeePanel = ({ userName }) => {
  const navigate = useNavigate();

  const [view, setView] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('article');  // Sort by article
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false); // Loading state

  // Handle view changes and navigation
  const handleViewChange = (newView) => {
    switch (newView) {
      case 'articles':
      case 'my-products':
        setView('articles');
        break;
      case 'receipts':
      case 'my-receipts':
        setView('receipts');
        break;
      case 'add-article':
        navigate('/add-article');
        break;
      case 'add-return':
        navigate('/add-return');
        break;
      case 'profile':
        setShowProfileModal(true);
        break;
      case 'dashboard':
      default:
        setView('dashboard');
        break;
    }
  };

  // Fetch products assigned to the logged-in user
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching products for user:', userName);
      
      const response = await axios.get(`${API_BASE_URL}/get-products/${encodeURIComponent(userName)}`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
        console.error('Received HTML instead of JSON:', response.data);
        throw new Error('Invalid response format');
      }
      
      console.log('🟢 Fetched Products:', response.data);
      
      const productsData = Array.isArray(response.data) ? response.data : [];
      console.log('📊 Setting products:', productsData.length, 'items');
      setProducts(productsData);
    } catch (error) {
      console.error('❌ Error fetching products:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [userName]);

  useEffect(() => {
    if (userName) {
      fetchProducts();
      
      // Set up periodic refresh
      const refreshInterval = setInterval(fetchProducts, 5000); // Refresh every 5 seconds
      
      // Fetch employee profile
      axios.get(`${API_BASE_URL}/get-employee-profile/${encodeURIComponent(userName)}`)
        .then(res => setProfile(res.data))
        .catch(err => console.error('❌ Error fetching profile:', err));
      
      // Set up WebSocket listeners for real-time updates
      const handleProductAdded = (data) => {
        console.log('🔄 Product added by another user:', data);
        if (data.actual_user === userName) {
          fetchProducts(); // Refresh if it's for this user
        }
      };
      
      const handleReceiptAdded = (data) => {
        console.log('🔄 Receipt added by another user:', data);
        if (data.endUser === userName) {
          fetchProducts(); // Refresh if it affects this user
        }
      };
      
      // Add WebSocket event listeners
      wsManager.on('product_added', handleProductAdded);
      wsManager.on('receipt_added', handleReceiptAdded);
      
      // Cleanup interval and WebSocket listeners on unmount
      return () => {
        clearInterval(refreshInterval);
        wsManager.off('product_added', handleProductAdded);
        wsManager.off('receipt_added', handleReceiptAdded);
      };
    }
  }, [userName, fetchProducts]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!profile.name?.trim()) {
      alert('❌ Name is required');
      return;
    }
    
    console.log('🔄 Updating profile for ID:', profile.id, 'with data:', profile);
    
    axios.put(`${API_BASE_URL}/edit-employee-profile/${profile.id}`, profile)
      .then((response) => {
        console.log('✅ Profile update response:', response.data);
        alert('✅ Profile updated successfully!');
        setShowProfileModal(false);
        
        // Refresh profile data
        axios.get(`${API_BASE_URL}/get-employee-profile/${encodeURIComponent(userName)}`)
          .then(res => {
            console.log('🔄 Refreshed profile:', res.data);
            setProfile(res.data);
          })
          .catch(err => console.error('❌ Error refreshing profile:', err));
      })
      .catch(err => {
        console.error('❌ Error updating profile:', err);
        const errorMessage = err.response?.data?.error || 'Failed to update profile';
        alert(`❌ ${errorMessage}`);
      });
  };

  // Filtering and Sorting
  const filteredProducts = products
    .filter(product =>
      product.article.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.property_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.actual_user.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOption === 'article') {
        return a.article.localeCompare(b.article);
      }
      if (sortOption === 'unit_value') {
        return a.unit_value - b.unit_value;
      }
      if (sortOption === 'date_acquired') {
        return new Date(b.date_acquired) - new Date(a.date_acquired);
      }
      return 0;
    });

  return (
    <div className="employee-panel">
      {/* Enhanced Navigation Header */}
      <div className="panel-header">
        <div className="header-content">
          <h1>Employee Panel</h1>
          <p>Welcome, {userName}!</p>
        </div>
        <div className="header-actions">
          <button 
            onClick={() => handleViewChange('profile')} 
            className="profile-btn"
            title="Edit Profile"
          >
            <i className="fas fa-user"></i>
            Profile
          </button>
        </div>
      </div>

      {/* Enhanced Navigation Tabs */}
      <div className="navigation-tabs">
        <button 
          className={`nav-tab ${view === "dashboard" ? "active" : ""}`}
          onClick={() => handleViewChange("dashboard")}
        >
          <i className="fas fa-tachometer-alt"></i>
          Dashboard
        </button>
        <button 
          className={`nav-tab ${view === "articles" ? "active" : ""}`}
          onClick={() => handleViewChange("articles")}
        >
          <i className="fas fa-boxes"></i>
          My Articles
        </button>
        <button 
          className={`nav-tab ${view === "receipts" ? "active" : ""}`}
          onClick={() => handleViewChange("receipts")}
        >
          <i className="fas fa-receipt"></i>
          My Returns
        </button>
      </div>

      {/* Quick Action Buttons */}
      <div className="quick-actions-bar">
        <button 
          onClick={() => handleViewChange('add-article')} 
          className="quick-action-btn add-article"
        >
          <i className="fas fa-plus-circle"></i>
          Add Article
        </button>
        <button 
          onClick={() => handleViewChange('add-return')} 
          className="quick-action-btn add-return"
        >
          <i className="fas fa-reply"></i>
          Submit Return
        </button>
      </div>

      {/* Content Area */}
      <div className="panel-content">
        {view === "dashboard" ? (
          <EmployeeDashboard userName={userName} onViewChange={handleViewChange} />
        ) : view === "articles" ? (
          <div className="articles-section">
            <div className="section-header">
              <h2><i className="fas fa-boxes"></i> My Assigned Articles</h2>
              <div className="section-actions">
                <button 
                  onClick={() => handleViewChange('add-article')} 
                  className="add-btn"
                >
                  <i className="fas fa-plus"></i>
                  Add New Article
                </button>
              </div>
            </div>
            
            <div className="filters-section">
              <div className="search-filter">
                <i className="fas fa-search"></i>
                <input 
                  type="text" 
                  placeholder="Search by Article, Property Number, or Actual User" 
                  value={searchTerm} 
                  onChange={handleSearchChange} 
                />
              </div>

              <div className="sort-filter">
                <label><i className="fas fa-sort"></i> Sort by: </label>
                <select value={sortOption} onChange={handleSortChange}>
                  <option value="article">Article (A-Z)</option>
                  <option value="unit_value">Unit Value (Low to High)</option>
                  <option value="date_acquired">Date Acquired (Newest to Oldest)</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="loading-section">
                <div className="loading-spinner"></div>
                <p>Loading products...</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="product-list">
                  <thead>
                    <tr>
                      <th>Article</th>
                      <th>Description</th>
                      <th>Property Number</th>
                      <th>Unit</th>
                      <th>Unit Value</th>
                      <th>Balance Per Card</th>
                      <th>On Hand Per Count</th>
                      <th>Total Amount</th>
                      <th>Actual User</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map(product => (
                        <tr key={product.id}>
                          <td>{product.article}</td>
                          <td>{product.description}</td>
                          <td>{product.property_number}</td>
                          <td>{product.unit}</td>
                          <td>₱{product.unit_value}</td>
                          <td>{product.balance_per_card}</td>
                          <td>{product.on_hand_per_count}</td>
                          <td>₱{product.total_amount}</td>
                          <td>{product.actual_user}</td>
                          <td>{product.remarks}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="10" className="no-data">
                          <i className="fas fa-inbox"></i>
                          <p>No products found.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="receipts-section">
            <EmployeeReceipts userName={userName} />
          </div>
        )}
      </div>

      <Modal
        isOpen={showProfileModal}
        onRequestClose={() => setShowProfileModal(false)}
        contentLabel="Edit Profile"
        ariaHideApp={false}
        className="profile-modal"
        overlayClassName="profile-modal-overlay"
      >
        <h2>Edit Profile</h2>
        {profile ? (
          <form onSubmit={handleProfileSubmit} className="profile-form">
            <input 
              name="name" 
              value={profile.name || ''} 
              onChange={handleProfileChange} 
              placeholder="Full Name" 
              required 
            />
            <input 
              name="position" 
              value={profile.position || ''} 
              onChange={handleProfileChange} 
              placeholder="Position/Job Title" 
            />
            <input 
              name="department" 
              value={profile.department || ''} 
              onChange={handleProfileChange} 
              placeholder="Department" 
            />
            <input 
              name="email" 
              type="email"
              value={profile.email || ''} 
              onChange={handleProfileChange} 
              placeholder="Email Address" 
            />
            <input 
              name="contact_number" 
              value={profile.contact_number || ''} 
              onChange={handleProfileChange} 
              placeholder="Contact Number" 
            />
            <input 
              name="address" 
              value={profile.address || ''} 
              onChange={handleProfileChange} 
              placeholder="Address" 
            />
            <div className="profile-form-buttons">
              <button type="submit">Save Changes</button>
              <button type="button" onClick={() => setShowProfileModal(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <div className="profile-loading">
            <div className="loading-spinner"></div>
            <p>Loading profile...</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default EmployeePanel;
