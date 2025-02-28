import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./returnsPanel.css";

const ReturnsPanel = () => {
  const [users, setUsers] = useState([]);
  const [showSecondReceiver, setShowSecondReceiver] = useState(false);
  const navigate = useNavigate();
  const [returns, setReturns] = useState([]);
  const [form, setForm] = useState({
    rrspNo: "",
    date: "",
    description: "",
    quantity: "",
    icsNo: "",
    dateAcquired: "",
    amount: "",
    endUser: "",
    remarks: "",
    returnedBy: { name: "", position: "", returnDate: "" },
    receivedBy: { name: "", position: "", receiveDate: "" },
    secondReceivedBy: { name: "", position: "", receiveDate: "" },
  });

  useEffect(() => {
    fetch("http://localhost:5000/get-users")
      .then((res) => res.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching users:", err));
  }, []);

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
    try {
      const response = await fetch("http://localhost:5000/add-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        alert("✅ Receipt added successfully!");
        setReturns([...returns, form]);
        setForm({
          rrspNo: "",
          date: "",
          description: "",
          quantity: "",
          icsNo: "",
          dateAcquired: "",
          amount: "",
          endUser: "",
          remarks: "",
          returnedBy: { name: "", position: "", returnDate: "" },
          receivedBy: { name: "", position: "", receiveDate: "" },
          secondReceivedBy: { name: "", position: "", receiveDate: "" },
        });
      } else {
        throw new Error("Failed to add receipt");
      }
    } catch (err) {
      console.error("❌ Error adding receipt:", err);
      alert("❌ Error adding receipt");
    }
  };

  return (
    <div className="returns-panel">
      <h2>RECEIPT OF RETURNED SEMI-EXPENDABLE PROPERTY</h2>
      <button className="back-btn" onClick={() => navigate("/")}>
        ← Back to Adding Article
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
          <label>Item Description</label>
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
          <label>End User</label>
          <select name="endUser" value={form.endUser} onChange={handleChange} required>
            <option value="">Select End-User</option>
            {users.map((user) => (
              <option key={user.id} value={user.name}>
                {user.name}
              </option>
            ))}
          </select>
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

        {/* Returned By */}
        <div className="form-group">
          <h3>Returned By</h3>
          <input type="text" name="name" placeholder="Name" value={form.returnedBy.name} onChange={(e) => handleNestedChange(e, "returnedBy")} required />
          <input type="text" name="position" placeholder="Position" value={form.returnedBy.position} onChange={(e) => handleNestedChange(e, "returnedBy")} required />
          <input type="date" name="returnDate" value={form.returnedBy.returnDate} onChange={(e) => handleNestedChange(e, "returnedBy")} required />
        </div>

        {/* Received By */}
        <div className="form-group">
          <h3>Received By</h3>
          <input type="text" name="name" placeholder="Name" value={form.receivedBy.name} onChange={(e) => handleNestedChange(e, "receivedBy")} required />
          <input type="text" name="position" placeholder="Position" value={form.receivedBy.position} onChange={(e) => handleNestedChange(e, "receivedBy")} required />
          <input type="date" name="receiveDate" value={form.receivedBy.receiveDate} onChange={(e) => handleNestedChange(e, "receivedBy")} required />
        </div>

        {/* Toggle Second Receiver */}
        <button type="button" onClick={() => setShowSecondReceiver(!showSecondReceiver)}>
          {showSecondReceiver ? "Remove Second Receiver" : "Add Second Receiver"}
        </button>

        {/* Second Receiver (Optional) */}
        {showSecondReceiver && (
          <div className="form-group">
            <h3>Second Receiver (Optional)</h3>
            <input type="text" name="name" placeholder="Name" value={form.secondReceivedBy.name} onChange={(e) => handleNestedChange(e, "secondReceivedBy")} />
            <input type="text" name="position" placeholder="Position" value={form.secondReceivedBy.position} onChange={(e) => handleNestedChange(e, "secondReceivedBy")} />
            <input type="date" name="receiveDate" value={form.secondReceivedBy.receiveDate} onChange={(e) => handleNestedChange(e, "secondReceivedBy")} />
          </div>
        )}

        <button type="submit">Add Entry</button>
      </form>
    </div>
  );
};

export default ReturnsPanel;
