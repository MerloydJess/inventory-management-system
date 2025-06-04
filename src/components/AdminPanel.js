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

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    role: "employee",
    password: "",
    confirmPassword: "",
  });

  const navigate = useNavigate();

  const fetchUsers = () => {
    axios
      .get("http://localhost:5000/get-users")
      .then((res) => {
        const filteredUsers = res.data.filter(user => user.role !== "admin");
        setUsers(filteredUsers);
      })
      .catch((err) => console.error("❌ Error fetching users:", err));
  };

  const fetchProducts = useCallback(() => {
    axios
      .get("http://localhost:5000/get-products/all")
      .then((res) => setProducts(res.data))
      .catch((err) => console.error(err));
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/logs");
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error("❌ Error fetching logs:", err.message || err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedProduct = { ...product, [name]: value };

    if (name === "unit_value" || name === "balance_per_card") {
      const unitValue = parseFloat(updatedProduct.unit_value) || 0;
      const balancePerCard = parseFloat(updatedProduct.balance_per_card) || 0;
      const totalAmount = unitValue * balancePerCard;
      updatedProduct.total_amount = totalAmount.toFixed(2);
    }

    setProduct(updatedProduct);
  };

  const handleUserChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const handleProductSubmit = (e) => {
    e.preventDefault();
    const cleanTotalAmount = parseFloat(product.total_amount.replace(/[₱,]/g, "")) || 0;
    const productData = {
      ...product,
      userName: "Administrator", // Assuming admin user is adding the product
      date_acquired: product.date_acquired || null,
      total_amount: cleanTotalAmount
    };

    axios
      .post("http://localhost:5000/add-product", productData)
      .then((res) => {
        alert("✅ Article Added!");
        setProducts((prev) => [...prev, productData]);
        fetchProducts();
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
      })
      .catch((err) => {
        console.error("❌ Error Adding Product:", err.response?.data || err.message);
        alert("❌ Error adding product! Check console.");
      });
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      axios
        .delete(`http://localhost:5000/delete-user/${userId}`)
        .then(() => {
          alert("✅ User deleted successfully!");
          fetchUsers();
        })
        .catch((err) => {
          console.error("❌ Error deleting user:", err.response?.data || err.message);
          alert("❌ Failed to delete user. Check console.");
        });
    }
  };

  const handleAddUser = (e) => {
    e.preventDefault();
  
    if (newUser.password !== newUser.confirmPassword) {
      alert("❌ Passwords do not match!");
      return;
    }
  
    const userData = {
      name: newUser.name,
      password: newUser.password,
      role: newUser.role,
    };
  
    axios
      .post("http://localhost:5000/add-user", userData)
      .then(() => {
        alert("✅ User Added!");
        setShowUserForm(false);
        fetchUsers();
        setNewUser({ name: "", role: "employee", password: "", confirmPassword: "" });
      })
      .catch((err) => {
        console.error("❌ Error adding user:", err.response?.data || err.message);
        alert("❌ Failed to add user. Check console for errors.");
      });
  };

  return (
    <div className="admin-panel">
      <h2>Add New Article</h2>

      <button className="returns-panel-btn" onClick={() => navigate("/returns-panel")}>
        Go to Returns Panel
      </button>

      <form onSubmit={handleProductSubmit}>
        <input type="text" name="article" placeholder="Article" value={product.article} onChange={handleChange} required />
        <textarea name="description" placeholder="Description" value={product.description} onChange={handleChange} />
        <input type="date" name="date_acquired" value={product.date_acquired} onChange={handleChange} />
        <input type="text" name="property_number" placeholder="Property Number" value={product.property_number} onChange={handleChange} />
        <input type="text" name="unit" placeholder="Unit (e.g., PC, SET, UNIT)" value={product.unit} onChange={handleChange} />
        <input type="number" name="unit_value" placeholder="Unit Value" value={product.unit_value} onChange={handleChange} required />
        <input type="number" name="balance_per_card" placeholder="Balance Per Card" value={product.balance_per_card} onChange={handleChange} />
        <input type="number" name="on_hand_per_count" placeholder="On Hand Per Count" value={product.on_hand_per_count} onChange={handleChange} />

        <input
          type="text"
          name="total_amount"
          placeholder="Total Amount"
          value={`₱${Number(product.total_amount).toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          readOnly
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
  <input
    type="password"
    name="confirmPassword"
    placeholder="Confirm Password"
    value={newUser.confirmPassword}
    onChange={handleUserChange}
    required
  />
  <select name="role" value={newUser.role} onChange={handleUserChange} required>
    <option value="admin">Administrator</option>
    <option value="employee">Instructor</option>
    <option value="supervisor">Admin</option>
  </select>
  <button type="submit">Save User</button>
  <button type="button" onClick={() => setShowUserForm(false)}>Cancel</button>
</form>
        </div>
      )}

      <h3>Current Users</h3>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.role}</td>
              <td>
                <button className="delete-btn" onClick={() => handleDeleteUser(user.id)}>🗑 Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="export-buttons">
        <h3>Export Reports</h3>
        <div className="date-filters">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <button
          className="export-btn pdf"
          onClick={() =>
            window.open(
              `http://localhost:5000/export-products/pdf?startDate=${startDate}&endDate=${endDate}`,
              "_blank"
            )
          }
        >
          📄 Export as PDF
        </button>
        <button
          className="export-btn excel"
          onClick={() =>
            window.open(
              `http://localhost:5000/export-products/excel?startDate=${startDate}&endDate=${endDate}`,
              "_blank"
            )
          }
        >
          📊 Export as Excel
        </button>
      </div>
    </div>
  );
};

export default AdminPanel;
