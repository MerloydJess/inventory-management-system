import React, { useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import "./EmployeeAddArticle.css"; // ✅ Make sure to style accordingly

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const EmployeeAddArticle = ({ userName }) => {
  console.log('API_BASE_URL:', API_BASE_URL); // Debug log
  console.log('Employee username:', userName); // Add user debugging
  const [form, setForm] = useState({
    article: "",
    description: "",
    date_acquired: "",
    property_number: "",
    unit: "",
    unit_value: "",
    balance_per_card: "",
    on_hand_per_count: "",
    total_amount: "",
    remarks: "",
  });

  const firstInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Update the form state
    setForm((prevForm) => {
      const newForm = { ...prevForm, [name]: value };

      // If Unit Value or Balance Per Card changes, calculate the Total Amount
      if (name === "unit_value" || name === "balance_per_card") {
        const unitValue = parseFloat(newForm.unit_value) || 0;
        const balancePerCard = parseFloat(newForm.balance_per_card) || 0;
        newForm.total_amount = unitValue * balancePerCard; // Calculate Total Amount
      }

      return newForm;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Automatically assign the article to the logged-in employee
    const dataToSend = {
      ...form,
      userName,
      actual_user: userName, // Explicitly set the actual_user
      name: userName, // Add this to ensure consistency
      total_amount: parseFloat(form.unit_value || 0) * parseFloat(form.balance_per_card || 0)
    };

    try {
      console.log('Sending data to:', `${API_BASE_URL}/add-product`);
      console.log('Data being sent:', dataToSend);
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };
      
      const response = await axios.post(`${API_BASE_URL}/add-product`, dataToSend, config);
      console.log('Response:', response.data);
      
      if (response.data) {
        alert("✅ Article added successfully!");
        // Reset form
        setForm({
          article: "",
          description: "",
          date_acquired: "",
          property_number: "",
          unit: "",
          unit_value: "",
          balance_per_card: "",
          on_hand_per_count: "",
          total_amount: "",
          remarks: "",
        });
        if (firstInputRef.current) firstInputRef.current.focus();
        
        // Don't navigate automatically, let user decide
        // navigate("/employee");
      } else {
        throw new Error(response.data.message || 'Failed to add article');
      }
    } catch (error) {
      console.error("❌ Error adding article:", error);
      console.error("Response data:", error.response?.data);
      console.error("Response status:", error.response?.status);
      console.error("Response headers:", error.response?.headers);
      
      let errorMessage = "Failed to add article: ";
      if (error.response) {
        // The server responded with a status code outside of 2xx
        errorMessage += error.response.data?.message || error.response.data || error.response.statusText;
      } else if (error.request) {
        // The request was made but no response received
        errorMessage += "No response from server. Please check your connection.";
      } else {
        // Something happened in setting up the request
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    }
  };

  const navigate = useNavigate(); // Make sure useNavigate is correctly imported

  return (
    <div className="employee-add-article">
      <div className="form-container">
        <h2>
          <i className="fas fa-plus-circle"></i>
          Add New Article
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>
                <i className="fas fa-tag"></i>
                Article *
              </label>
              <input 
                ref={firstInputRef} 
                type="text" 
                name="article" 
                value={form.article} 
                onChange={handleChange} 
                required 
                placeholder="Enter article name"
              />
            </div>
            <div className="form-group">
              <label>
                <i className="fas fa-file-alt"></i>
                Description
              </label>
              <input 
                type="text" 
                name="description" 
                value={form.description} 
                onChange={handleChange} 
                placeholder="Enter description"
              />
            </div>
            <div className="form-group">
              <label>
                <i className="fas fa-calendar"></i>
                Date Acquired *
              </label>
              <input 
                type="date" 
                name="date_acquired" 
                value={form.date_acquired} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label>
                <i className="fas fa-barcode"></i>
                Property Number
              </label>
              <input 
                type="text" 
                name="property_number" 
                value={form.property_number} 
                onChange={handleChange} 
                placeholder="Enter property number"
              />
            </div>
            <div className="form-group">
              <label>
                <i className="fas fa-cube"></i>
                Unit *
              </label>
              <input 
                type="text" 
                name="unit" 
                value={form.unit} 
                onChange={handleChange} 
                required 
                placeholder="e.g., pcs, kg, meters"
              />
            </div>
            <div className="form-group">
              <label>
                <i className="fas fa-peso-sign"></i>
                Unit Value *
              </label>
              <input 
                type="number" 
                name="unit_value" 
                value={form.unit_value} 
                onChange={handleChange} 
                required 
                step="0.01"
                placeholder="0.00"
              />
            </div>
            <div className="form-group">
              <label>
                <i className="fas fa-clipboard-list"></i>
                Balance Per Card
              </label>
              <input 
                type="number" 
                name="balance_per_card" 
                value={form.balance_per_card} 
                onChange={handleChange} 
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label>
                <i className="fas fa-hand-paper"></i>
                On Hand Per Count
              </label>
              <input 
                type="number" 
                name="on_hand_per_count" 
                value={form.on_hand_per_count} 
                onChange={handleChange} 
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label>
                <i className="fas fa-calculator"></i>
                Total Amount
              </label>
              <input 
                type="number" 
                name="total_amount" 
                value={form.total_amount} 
                readOnly 
                placeholder="Auto-calculated"
              />
            </div>
            <div className="form-group">
              <label>
                <i className="fas fa-comment"></i>
                Remarks
              </label>
              <input 
                type="text" 
                name="remarks" 
                value={form.remarks} 
                onChange={handleChange} 
                placeholder="Enter remarks (optional)"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit">
              <i className="fas fa-save"></i>
              Add Article
            </button>
            <button 
              type="button"
              onClick={() => {
                console.log('Navigating back to employee panel...');
                navigate("/employee");
              }} 
              className="back-btn"
            >
              <i className="fas fa-arrow-left"></i>
              Go Back
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeAddArticle;
