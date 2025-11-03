import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./EmployeeAddReturn.css";

const API_BASE_URL = process.env.REACT_APP_API_URL;

const EmployeeAddReturn = ({ userName }) => {
  const [showSecondReceiver, setShowSecondReceiver] = useState(false);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    rrspNo: "",
    date: "",
    description: "",
    quantity: "",
    icsNo: "",
    dateAcquired: "",
    amount: "",
    remarks: "",
    returnedBy: { name: userName, position: "Employee", returnDate: "", location: "", },
    receivedBy: { name: "", position: "", receiveDate: "", location: "" },
    secondReceivedBy: { name: "", position: "", receiveDate: "", location: "" },
  });

  const firstInputRef = useRef(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleNestedChange = (e, category) => {
    setForm((prev) => ({
      ...prev,
      [category]: { ...prev[category], [e.target.name]: e.target.value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...form,
      endUser: userName, // Automatically assign logged-in user as end user
    };

    if (
      !payload.rrspNo ||
      !payload.date ||
      !payload.description ||
      !payload.quantity ||
      !payload.icsNo ||
      !payload.dateAcquired ||
      !payload.amount ||
      !payload.endUser ||
      !payload.returnedBy.name ||
      !payload.returnedBy.position ||
      !payload.returnedBy.returnDate ||
      !payload.returnedBy.location ||
      !payload.receivedBy.name ||
      !payload.receivedBy.position ||
      !payload.receivedBy.receiveDate ||
      !payload.receivedBy.location  ||
      (showSecondReceiver && 
        (!payload.secondReceivedBy.name ||
        !payload.secondReceivedBy.position ||
        !payload.secondReceivedBy.receiveDate ||
        !payload.secondReceivedBy.location))
    ) {
      alert("❌ Missing required fields. Please fill out all fields.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/add-receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Return successfully recorded!");
        setForm({
          rrspNo: "",
          date: "",
          description: "",
          quantity: "",
          icsNo: "",
          dateAcquired: "",
          amount: "",
          remarks: "",
          returnedBy: { name: userName, position: "Employee", returnDate: "", location: "" },
          receivedBy: { name: "", position: "", receiveDate: "", location: "" },
          secondReceivedBy: { name: "", position: "", receiveDate: "", location: "" },
        });
        if (firstInputRef.current) firstInputRef.current.focus();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error("Error submitting return:", err);
      alert("Network error.");
    }
  };

  return (
    <div className="employee-add-return">
      <div className="form-container">
        <div className="header-actions">
          <h2>
            <i className="fas fa-undo"></i>
            Return Form
          </h2>
          <button className="back-btn" onClick={() => navigate("/employee")}>
            <i className="fas fa-arrow-left"></i>
            Back to Employee Panel
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* Basic Information Section */}
          <div className="form-section">
            <h3 className="section-title">
              <i className="fas fa-info-circle"></i>
              Basic Information
            </h3>
            <div className="form-grid">
              <div className="form-group">
                <label>
                  <i className="fas fa-hashtag"></i>
                  RRSP No. *
                </label>
                <input 
                  ref={firstInputRef} 
                  type="text" 
                  name="rrspNo" 
                  value={form.rrspNo} 
                  onChange={handleChange} 
                  required 
                  placeholder="Enter RRSP number"
                />
              </div>
              <div className="form-group">
                <label>
                  <i className="fas fa-calendar"></i>
                  Date *
                </label>
                <input 
                  type="date" 
                  name="date" 
                  value={form.date} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>
                  <i className="fas fa-file-alt"></i>
                  Description *
                </label>
                <input 
                  type="text" 
                  name="description" 
                  value={form.description} 
                  onChange={handleChange} 
                  required 
                  placeholder="Enter item description"
                />
              </div>
              <div className="form-group">
                <label>
                  <i className="fas fa-sort-numeric-up"></i>
                  Quantity *
                </label>
                <input 
                  type="number" 
                  name="quantity" 
                  value={form.quantity} 
                  onChange={handleChange} 
                  required 
                  placeholder="Enter quantity"
                />
              </div>
              <div className="form-group">
                <label>
                  <i className="fas fa-barcode"></i>
                  ICS No. *
                </label>
                <input 
                  type="text" 
                  name="icsNo" 
                  value={form.icsNo} 
                  onChange={handleChange} 
                  required 
                  placeholder="Enter ICS number"
                />
              </div>
              <div className="form-group">
                <label>
                  <i className="fas fa-calendar-check"></i>
                  Date Acquired *
                </label>
                <input 
                  type="date" 
                  name="dateAcquired" 
                  value={form.dateAcquired} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>
                  <i className="fas fa-peso-sign"></i>
                  Amount *
                </label>
                <input 
                  type="number" 
                  name="amount" 
                  value={form.amount} 
                  onChange={handleChange} 
                  required 
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>
                  <i className="fas fa-comment"></i>
                  Remarks
                </label>
                <select name="remarks" value={form.remarks} onChange={handleChange}>
                  <option value="">Select Remark</option>
                  <option value="Damaged">Damaged</option>
                  <option value="Destroyed">Destroyed</option>
                  <option value="For Disposal">For Disposal</option>
                </select>
              </div>
            </div>
          </div>

          {/* Returned By Section */}
          <div className="form-section">
            <h3 className="section-title">
              <i className="fas fa-user-minus"></i>
              Returned By
            </h3>
            <div className="form-grid">
              <div className="form-group">
                <label>
                  <i className="fas fa-user"></i>
                  Name
                </label>
                <input type="text" value={form.returnedBy.name} readOnly />
              </div>
              <div className="form-group">
                <label>
                  <i className="fas fa-briefcase"></i>
                  Position
                </label>
                <input type="text" value={form.returnedBy.position} readOnly />
              </div>
              <div className="form-group">
                <label>
                  <i className="fas fa-calendar"></i>
                  Return Date *
                </label>
                <input
                  type="date"
                  name="returnDate"
                  value={form.returnedBy.returnDate}
                  onChange={(e) => handleNestedChange(e, "returnedBy")}
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  <i className="fas fa-map-marker-alt"></i>
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  placeholder="e.g., Provincial Capitol, Office A"
                  value={form.returnedBy.location}
                  onChange={(e) => handleNestedChange(e, "returnedBy")}
                  required
                />
              </div>
            </div>
          </div>

          {/* Received By Section */}
          <div className="form-section">
            <h3 className="section-title">
              <i className="fas fa-user-check"></i>
              Received By
            </h3>
            <div className="form-grid">
              <div className="form-group">
                <label>
                  <i className="fas fa-user"></i>
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter receiver name"
                  value={form.receivedBy.name}
                  onChange={(e) => handleNestedChange(e, "receivedBy")}
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  <i className="fas fa-briefcase"></i>
                  Position *
                </label>
                <input
                  type="text"
                  name="position"
                  placeholder="Enter position"
                  value={form.receivedBy.position}
                  onChange={(e) => handleNestedChange(e, "receivedBy")}
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  <i className="fas fa-calendar"></i>
                  Receive Date *
                </label>
                <input
                  type="date"
                  name="receiveDate"
                  value={form.receivedBy.receiveDate}
                  onChange={(e) => handleNestedChange(e, "receivedBy")}
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  <i className="fas fa-map-marker-alt"></i>
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  placeholder="e.g., Provincial Capitol, Office A"
                  value={form.receivedBy.location}
                  onChange={(e) => handleNestedChange(e, "receivedBy")}
                  required
                />
              </div>
            </div>
          </div>

          <button 
            type="button" 
            className="toggle-receiver-btn"
            onClick={() => setShowSecondReceiver(!showSecondReceiver)}
          >
            <i className={`fas ${showSecondReceiver ? 'fa-minus' : 'fa-plus'}`}></i>
            {showSecondReceiver ? "Remove Second Receiver" : "Add Second Receiver"}
          </button>

          {/* Second Receiver Section */}
          {showSecondReceiver && (
            <div className="form-section">
              <h3 className="section-title">
                <i className="fas fa-user-plus"></i>
                Second Receiver
              </h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>
                    <i className="fas fa-user"></i>
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter second receiver name"
                    value={form.secondReceivedBy.name}
                    onChange={(e) => handleNestedChange(e, "secondReceivedBy")}
                  />
                </div>
                <div className="form-group">
                  <label>
                    <i className="fas fa-briefcase"></i>
                    Position
                  </label>
                  <input
                    type="text"
                    name="position"
                    placeholder="Enter position"
                    value={form.secondReceivedBy.position}
                    onChange={(e) => handleNestedChange(e, "secondReceivedBy")}
                  />
                </div>
                <div className="form-group">
                  <label>
                    <i className="fas fa-calendar"></i>
                    Receive Date
                  </label>
                  <input
                    type="date"
                    name="receiveDate"
                    value={form.secondReceivedBy.receiveDate}
                    onChange={(e) => handleNestedChange(e, "secondReceivedBy")}
                  />
                </div>
                <div className="form-group">
                  <label>
                    <i className="fas fa-map-marker-alt"></i>
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    placeholder="e.g., Provincial Capitol, Office A"
                    value={form.secondReceivedBy.location}
                    onChange={(e) => handleNestedChange(e, "secondReceivedBy")}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="submit-section">
            <button type="submit">
              <i className="fas fa-paper-plane"></i>
              Submit Return
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeAddReturn;
