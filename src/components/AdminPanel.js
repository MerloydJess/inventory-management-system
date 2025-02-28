import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./AdminPanel.css";
import { useNavigate } from "react-router-dom";

const AdminPanel = () => {
  const [product, setProduct] = useState({
    article: "",
    description: "",
    date_acquired: "",
    property_number: "",
    unit: "",
    unit_value: "",
    balance_per_card: "",
    on_hand_per_count: "",
    total_amount: "",
    actual_user: "",
    remarks: "",
  });

  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    role: "employee",
    password: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
    fetchProducts();
    fetchLogs();
  }, []);

  const fetchUsers = () => {
    axios
      .get("http://localhost:5000/get-users")
      .then((res) => setUsers(res.data))
      .catch((err) => console.error(err));
  };

  const fetchProducts = useCallback(() => {
    axios
      .get("http://localhost:5000/get-products/all")
      .then((res) => setProducts(res.data))
      .catch((err) => console.error(err));
  }, []);

  const fetchLogs = () => {
    axios
      .get("http://localhost:5000/get-logs")
      .then((res) => setLogs(res.data))
      .catch((err) => console.error(err));
  };

  const handleChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  const handleUserChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const handleProductSubmit = (e) => {
    e.preventDefault();
    setProduct({
      article: "",
      description: "",
      date_acquired: "",
      property_number: "",
      unit: "",
      unit_value: "",
      balance_per_card: "",
      on_hand_per_count: "",
      total_amount: "",
      actual_user: "",
      remarks: "",
    });

    const productData = { ...product, date_acquired: product.date_acquired || null };

    axios
      .post("http://localhost:5000/add-product", productData)
      .then((res) => {
        alert("✅ Article Added!");
        setProducts([...products, res.data]);
      })
      .catch((err) => console.error(err));
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    setNewUser({ name: "", role: "employee", password: "" });

    axios
      .post("http://localhost:5000/add-user", newUser)
      .then(() => {
        alert("✅ User Added!");
        setShowUserForm(false);
        fetchUsers();
      })
      .catch((err) => console.error(err));
  };

  return (
    <div className="admin-panel">
      {/* ✅ Keep only this logout button */}
      <button className="logout-btn" onClick={() => window.location.reload()}>
        Logout
      </button>

      <h2>Add New Article</h2>

      <button className="returns-panel-btn" onClick={() => navigate("/returns-panel")}>
        Go to Returns Panel
      </button>

      <form onSubmit={handleProductSubmit}>
        <input
          type="text"
          name="article"
          placeholder="Article"
          value={product.article}
          onChange={handleChange}
          required
        />
        <textarea
          name="description"
          placeholder="Description"
          value={product.description}
          onChange={handleChange}
        />
        <input
          type="date"
          name="date_acquired"
          value={product.date_acquired}
          onChange={handleChange}
        />
        <input
          type="text"
          name="property_number"
          placeholder="Property Number"
          value={product.property_number}
          onChange={handleChange}
        />
        <input
          type="text"
          name="unit"
          placeholder="Unit (e.g., PC, SET, UNIT)"
          value={product.unit}
          onChange={handleChange}
        />
        <input
          type="number"
          name="unit_value"
          placeholder="Unit Value"
          value={product.unit_value}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="balance_per_card"
          placeholder="Balance Per Card"
          value={product.balance_per_card}
          onChange={handleChange}
        />
        <input
          type="number"
          name="on_hand_per_count"
          placeholder="On Hand Per Count"
          value={product.on_hand_per_count}
          onChange={handleChange}
        />
        <input
          type="number"
          name="total_amount"
          placeholder="Total Amount"
          value={product.total_amount}
          onChange={handleChange}
        />

        <div className="user-select">
          <select name="actual_user" value={product.actual_user} onChange={handleChange} required>
            <option value="">Select Actual User</option>
            {users.map((user) => (
              <option key={user.id} value={user.name}>
                {user.name}
              </option>
            ))}
          </select>
          <button type="button" className="add-user-btn" onClick={() => setShowUserForm(true)}>
            + Add User
          </button>
        </div>

        <textarea name="remarks" placeholder="Remarks" value={product.remarks} onChange={handleChange} />

        {/* ✅ REMOVE the extra Logout button that was inside the form */}
        {/* ❌ This was the extra button causing the issue, now removed! */}

        <button type="submit">Add Article</button>
      </form>

      {showUserForm && (
        <div className="popup-form">
          <h3>Add New User</h3>
          <form onSubmit={handleAddUser}>
            <input
              type="text"
              name="name"
              placeholder="User Name"
              value={newUser.name}
              onChange={handleUserChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={newUser.password}
              onChange={handleUserChange}
              required
            />
            <select name="role" value={newUser.role} onChange={handleUserChange} required>
              <option value="admin">Admin</option>
              <option value="employee">Employee</option>
              <option value="supervisor">Supervisor</option>
            </select>
            <button type="submit">Save User</button>
            <button type="button" onClick={() => setShowUserForm(false)}>
              Cancel
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
