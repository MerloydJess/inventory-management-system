import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EmployeePanel.css';

const EmployeePanel = ({ userName }) => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('name');  // Default sorting by name

  // Fetch products assigned to the logged-in user
  const fetchProducts = () => {
    axios.get(`http://localhost:5000/get-products/${userName}`)
      .then(res => setProducts(res.data))
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

  // Enhanced Filtering and Sorting
  const filteredProducts = products
    .filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOption === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortOption === 'price') {
        return a.unit_price - b.unit_price;
      }
      if (sortOption === 'date') {
        return new Date(b.date_acquired) - new Date(a.date_acquired);
      }
      return 0;
    });

  return (
    <div className="employee-panel">
      <h2>My Assigned Products</h2>
      <input 
        type="text" 
        placeholder="Search by name" 
        value={searchTerm} 
        onChange={handleSearchChange} 
      />

      <div className="sorting">
        <label>Sort by: </label>
        <select value={sortOption} onChange={handleSortChange}>
          <option value="name">Name (A-Z)</option>
          <option value="price">Unit Price (Low to High)</option>
          <option value="date">Date Acquired (Newest to Oldest)</option>
        </select>
      </div>

      <table className="product-list">
        <thead>
          <tr>
            <th>Name</th>
            <th>Unit Price</th>
            <th>Date Acquired</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map(product => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>₱{product.unit_price}</td>
              <td>{product.date_acquired}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeePanel;
