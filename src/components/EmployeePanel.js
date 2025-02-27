import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EmployeePanel.css';

const EmployeePanel = ({ userName }) => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('article');  // Sort by article

  // Fetch products assigned to the logged-in user
  const fetchProducts = () => {
    axios.get(`http://localhost:5000/get-products/${userName}`)
      .then(res => {
        console.log('Fetched Products:', res.data);
        setProducts(res.data);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    if (userName) {
      fetchProducts();
    }
  }, [userName]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
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
      <h2>My Assigned Products</h2>
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
    </div>
  );
};

export default EmployeePanel;
