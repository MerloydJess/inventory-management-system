import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './EmployeePanel.css';
import { useNavigate } from 'react-router-dom';  // ✅ Import useNavigate
import EmployeeReceipts from "./EmployeeReceipts"; // ✅ Correct import
import Modal from 'react-modal';

const API_BASE_URL = process.env.REACT_APP_API_URL;

const EmployeePanel = ({ userName }) => {
  const navigate = useNavigate();  // ✅ Define navigate using useNavigate()

  const [view, setView] = useState("articles");
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('article');  // Sort by article
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profile, setProfile] = useState(null);

  // Fetch products assigned to the logged-in user
  const fetchProducts = useCallback(() => {
    if (!userName) {
      console.log('No username provided');
      return;
    }

    console.log('🔍 Fetching products for user:', userName);
    axios.get(`${API_BASE_URL}/get-products-by-employee/${encodeURIComponent(userName)}`)
      .then(res => {
        console.log('🟢 Fetched Products:', res.data);
        let productsData = [];
        
        // Handle different response formats
        if (Array.isArray(res.data)) {
          productsData = res.data;
        } else if (res.data.products) {
          productsData = res.data.products;
        } else if (typeof res.data === 'object') {
          productsData = [res.data];
        }
        
        console.log('📊 Setting products:', productsData.length, 'items');
        setProducts(productsData);
      })
      .catch(err => {
        console.error("❌ Error fetching products:", err.response?.data || err.message);
        setProducts([]);
        alert('Failed to load products. Please try refreshing the page.');
      });
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
        
      // Cleanup interval on unmount
      return () => clearInterval(refreshInterval);
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
    axios.put(`${API_BASE_URL}/edit-employee-profile/${profile.id}`, profile)
      .then(() => {
        alert('✅ Profile updated!');
        setShowProfileModal(false);
      })
      .catch(err => {
        alert('❌ Failed to update profile.');
        console.error(err);
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
      <button onClick={() => setShowProfileModal(true)} style={{ float: 'right', margin: '8px' }}>Edit Profile</button>
      <button onClick={() => setView(view === "articles" ? "receipts" : "articles")}>
        {view === "articles" ? "View Receipts" : "View Articles"}
      </button>

      {/* ✅ Button to Navigate to Add Article Page */}
      <button onClick={() => navigate("/add-article")} className="add-article-btn">
        ➕ Add Article
      </button>
      <button onClick={() => navigate("/add-return")}>Submit Return</button>


      {view === "articles" ? (
        <>
          <h2>My Assigned Articles</h2>
          <input 
            type="text" 
            placeholder="Search by Article, Property Number, or Actual User" 
            value={searchTerm} 
            onChange={handleSearchChange} 
          />

          <div className="sorting">
            <label>Sort by: </label>
            <select value={sortOption} onChange={handleSortChange}>
              <option value="article">Article (A-Z)</option>
              <option value="unit_value">Unit Value (Low to High)</option>
              <option value="date_acquired">Date Acquired (Newest to Oldest)</option>
            </select>
          </div>

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
              {filteredProducts.map(product => (
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
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <EmployeeReceipts userName={userName} /> // ✅ Show Receipts Here
      )}

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
            <input name="name" value={profile.name} onChange={handleProfileChange} placeholder="Name" required />
            <input name="position" value={profile.position} onChange={handleProfileChange} placeholder="Position" />
            <input name="department" value={profile.department} onChange={handleProfileChange} placeholder="Department" />
            <input name="email" value={profile.email} onChange={handleProfileChange} placeholder="Email" />
            <input name="contact_number" value={profile.contact_number} onChange={handleProfileChange} placeholder="Contact Number" />
            <input name="address" value={profile.address} onChange={handleProfileChange} placeholder="Address" />
            <button type="submit">Save</button>
            <button type="button" onClick={() => setShowProfileModal(false)}>Cancel</button>
          </form>
        ) : (
          <p>Loading...</p>
        )}
      </Modal>
    </div>
  );
}

export default EmployeePanel;
