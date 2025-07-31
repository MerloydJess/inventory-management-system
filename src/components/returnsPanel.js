import React, { useState, useEffect, useRef } from "react";
  import { useNavigate } from "react-router-dom";
  import "./returnsPanel.css";

  const API_BASE_URL = process.env.REACT_APP_API_URL;

  const ReturnsPanel = () => {
    const [users, setUsers] = useState([]);
    const [showSecondReceiver, setShowSecondReceiver] = useState(false);
    const navigate = useNavigate();

    const goToReturnsManagement = () => {
      navigate('/manage-returns');
    };

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
      returnedBy: { name: "", position: "", returnDate: "", location: "", },
      receivedBy: { name: "", position: "", receiveDate: "", location: "", },
      secondReceivedBy: { name: "", position: "", receiveDate: "", location: "",},
    });
    const [editingReturn, setEditingReturn] = useState(null);
    const firstInputRef = useRef(null);

    // ✅ Fetch employees list
    useEffect(() => {
      const fetchEmployees = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/get-employees`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          setUsers(Array.isArray(data) ? data : []); // Store employees in users state
        } catch (err) {
          console.error("❌ Error fetching employees:", err);
          alert("Failed to load employees. Please refresh the page.");
        }
      };

      fetchEmployees();
    }, []);
    

    // ✅ Handle simple form input changes
    const handleChange = (e) => {
      setForm({ ...form, [e.target.name]: e.target.value });
    };

    // ✅ Handle nested form inputs (returnedBy, receivedBy, etc.)
    const handleNestedChange = (e, category) => {
      setForm((prev) => ({
        ...prev,
        [category]: { ...prev[category], [e.target.name]: e.target.value },
      }));
    };

    // ✅ Submit the form data to backend
    const handleSubmit = async (e) => {
      e.preventDefault();

      // ✅ Check for missing fields
      if (
        !form.rrspNo || !form.date || !form.description || !form.quantity || 
        !form.icsNo || !form.dateAcquired || !form.amount || !form.endUser ||
        !form.returnedBy.name || !form.returnedBy.position || !form.returnedBy.returnDate ||
        !form.receivedBy.name || !form.receivedBy.position || !form.receivedBy.receiveDate
      ) {
        alert("❌ Missing required fields. Please fill out all fields.");
        console.error("❌ Missing Fields:", form);
        return;
      }

      console.log("🔍 Form Data Before Sending:", JSON.stringify(form)); // ✅ Debug log

      try {
        const response = await fetch(`${API_BASE_URL}/add-receipt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        const data = await response.json();

        if (response.ok) {
          alert("✅ Receipt added successfully!");
          // ✅ Reset form
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
            returnedBy: { name: "", position: "", returnDate: "", location: "" },
            receivedBy: { name: "", position: "", receiveDate: "", location: "" },
            secondReceivedBy: { name: "", position: "", receiveDate: "", location: "" },
          });
          if (firstInputRef.current) firstInputRef.current.focus();
        } else {
          console.error("❌ Server Error:", data);
          alert(`❌ Error: ${data.error} \nDetails: ${JSON.stringify(data.details)}`);
        }
      } catch (err) {
        console.error("❌ Network Error:", err);
        alert("❌ Network error. Unable to reach the server.");
      }
    };



    return (
      <div className="returns-panel">
        <div className="header-buttons">
          <h2>RECEIPT OF RETURNED SEMI-EXPENDABLE PROPERTY</h2>
          <div className="button-group">
            <button className="manage-returns-btn" onClick={goToReturnsManagement}>
              Manage Returns
            </button>
            <button className="back-btn" onClick={() => navigate("/")}>
              ← Back to Adding Article
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>RRSP No.</label>
            <input ref={firstInputRef} type="text" name="rrspNo" value={form.rrspNo} onChange={handleChange} required />
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
            <label>Select Employee</label>
            <div className="user-select">
              <select name="endUser" value={form.endUser} onChange={handleChange} required>
                <option value="">Select Employee</option>
                {users.map((emp) => (
                  <option key={emp.id} value={emp.name}>
                    {emp.name} ({emp.position || 'No Position'})
                  </option>
                ))}
              </select>
            </div>
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
            <input type="text" name="location" placeholder="Where was the item sent?" value={form.returnedBy.location} onChange={(e) => handleNestedChange(e, "returnedBy")}/>
          </div>

          {/* Received By */}
          <div className="form-group">
            <h3>Received By</h3>
            <input type="text" name="name" placeholder="Name" value={form.receivedBy.name} onChange={(e) => handleNestedChange(e, "receivedBy")} required />
            <input type="text" name="position" placeholder="Position" value={form.receivedBy.position} onChange={(e) => handleNestedChange(e, "receivedBy")} required />
            <input type="date" name="receiveDate" value={form.receivedBy.receiveDate} onChange={(e) => handleNestedChange(e, "receivedBy")} required />
            <input type="text" name="location" placeholder="Where was the item received?" value={form.receivedBy.location} onChange={(e) => handleNestedChange(e, "receivedBy")}/>
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
              <input type="text" name="location" placeholder="Where was the item received?" value={form.receivedBy.location} onChange={(e) => handleNestedChange(e, "receivedBy")}/>
            </div>
          )}
          

          <button type="submit">Add Entry</button>
        </form>

        {/* Edit popup form */}
        {editingReturn && (
          <div className="popup-form">
            <h3>Edit Return</h3>
            <form onSubmit={handleEditReturnSubmit}>
              <input type="text" name="rrspNo" value={editingReturn.rrspNo} onChange={handleEditReturnChange} required />
              <input type="text" name="description" value={editingReturn.description} onChange={handleEditReturnChange} />
              <input type="number" name="quantity" value={editingReturn.quantity} onChange={handleEditReturnChange} />
              <input type="text" name="endUser" value={editingReturn.endUser} onChange={handleEditReturnChange} />
              <input type="text" name="remarks" value={editingReturn.remarks} onChange={handleEditReturnChange} />
              <button type="submit">Save</button>
              <button type="button" onClick={() => setEditingReturn(null)}>Cancel</button>
            </form>
          </div>
        )}
      </div>
    );
  };

  export default ReturnsPanel;
