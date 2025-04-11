import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./EmployeeAddReturn.css";

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
    returnedBy: { name: userName, position: "Employee", returnDate: "" },
    receivedBy: { name: "", position: "", receiveDate: "" },
    secondReceivedBy: { name: "", position: "", receiveDate: "" },
  });

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
      !payload.receivedBy.name ||
      !payload.receivedBy.position ||
      !payload.receivedBy.receiveDate
    ) {
      alert("Please fill out all required fields.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/add-receipt", {
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
          returnedBy: { name: userName, position: "Employee", returnDate: "" },
          receivedBy: { name: "", position: "", receiveDate: "" },
          secondReceivedBy: { name: "", position: "", receiveDate: "" },
        });
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
      <h2>Return Form</h2>
      <button className="back-btn" onClick={() => navigate("/employee")}>
        ← Back to Employee Panel
      </button>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>RRSP No.</label>
          <input type="text" name="rrspNo" value={form.rrspNo} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Date</label>
          <input type="date" name="date" value={form.date} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Description</label>
          <input type="text" name="description" value={form.description} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Quantity</label>
          <input type="number" name="quantity" value={form.quantity} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>ICS No.</label>
          <input type="text" name="icsNo" value={form.icsNo} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Date Acquired</label>
          <input type="date" name="dateAcquired" value={form.dateAcquired} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Amount</label>
          <input type="number" name="amount" value={form.amount} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Remarks</label>
          <select name="remarks" value={form.remarks} onChange={handleChange}>
            <option value="">Select Remark</option>
            <option value="Functional">Functional</option>
            <option value="Destroyed">Destroyed</option>
            <option value="For Disposal">For Disposal</option>
          </select>
        </div>

        <div className="form-group">
          <h3>Returned By</h3>
          <input type="text" value={form.returnedBy.name} readOnly />
          <input type="text" value={form.returnedBy.position} readOnly />
          <input
            type="date"
            name="returnDate"
            value={form.returnedBy.returnDate}
            onChange={(e) => handleNestedChange(e, "returnedBy")}
            required
          />
        </div>

        <div className="form-group">
          <h3>Received By</h3>
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={form.receivedBy.name}
            onChange={(e) => handleNestedChange(e, "receivedBy")}
            required
          />
          <input
            type="text"
            name="position"
            placeholder="Position"
            value={form.receivedBy.position}
            onChange={(e) => handleNestedChange(e, "receivedBy")}
            required
          />
          <input
            type="date"
            name="receiveDate"
            value={form.receivedBy.receiveDate}
            onChange={(e) => handleNestedChange(e, "receivedBy")}
            required
          />
        </div>

        <button type="button" onClick={() => setShowSecondReceiver(!showSecondReceiver)}>
          {showSecondReceiver ? "Remove Second Receiver" : "Add Second Receiver"}
        </button>

        {showSecondReceiver && (
          <div className="form-group">
            <h3>Second Receiver</h3>
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={form.secondReceivedBy.name}
              onChange={(e) => handleNestedChange(e, "secondReceivedBy")}
            />
            <input
              type="text"
              name="position"
              placeholder="Position"
              value={form.secondReceivedBy.position}
              onChange={(e) => handleNestedChange(e, "secondReceivedBy")}
            />
            <input
              type="date"
              name="receiveDate"
              value={form.secondReceivedBy.receiveDate}
              onChange={(e) => handleNestedChange(e, "secondReceivedBy")}
            />
          </div>
        )}

        <button type="submit">Submit Return</button>
      </form>
    </div>
  );
};

export default EmployeeAddReturn;
