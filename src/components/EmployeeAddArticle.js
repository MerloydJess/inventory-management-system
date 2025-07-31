import React, { useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import "./EmployeeAddArticle.css"; // ✅ Make sure to style accordingly

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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
        
        // Navigate back to employee panel to see the updated list
        navigate("/employee");
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
      <h2>Add New Article</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Article</label>
          <input ref={firstInputRef} type="text" name="article" value={form.article} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Description</label>
          <input type="text" name="description" value={form.description} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Date Acquired</label>
          <input type="date" name="date_acquired" value={form.date_acquired} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Property Number</label>
          <input type="text" name="property_number" value={form.property_number} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Unit</label>
          <input type="text" name="unit" value={form.unit} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Unit Value</label>
          <input type="number" name="unit_value" value={form.unit_value} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Balance Per Card</label>
          <input type="number" name="balance_per_card" value={form.balance_per_card} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>On Hand Per Count</label>
          <input type="number" name="on_hand_per_count" placeholder="On Hand Per Count" value={form.on_hand_per_count} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Total Amount</label>
          <input type="number" name="total_amount" value={form.total_amount} readOnly />
        </div>
        <div className="form-group">
          <label>Remarks</label>
          <input type="text" name="remarks" value={form.remarks} onChange={handleChange} />
        </div>

        <button type="submit">Add Article</button>
      </form>
      <button 
        onClick={() => {
          console.log('Navigating back to employee panel...');
          navigate("/employee");  // Explicitly navigate to employee panel
        }} 
        className="back-btn"
      >
        Go Back
      </button>
    </div>
  );
};

export default EmployeeAddArticle;
