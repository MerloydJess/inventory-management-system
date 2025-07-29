import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./AdminPanel.css";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = process.env.REACT_APP_API_URL;

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
  const [employees, setEmployees] = useState([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    password: "",
    confirmPassword: "",
    role: "supervisor"  // Always supervisor
  });
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    position: "",
    department: "",
    email: "",
    contact_number: "",
    address: "",
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const navigate = useNavigate();

  const fetchEmployees = () => {
    axios
      .get(`${API_BASE_URL}/get-employees`)
      .then((res) => {
        // Ensure we always set an array, even if empty
        setEmployees(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error("❌ Error fetching employees:", err);
        setEmployees([]); // Set empty array on error
      });
  };

  const fetchUsers = () => {
    axios
      .get(`${API_BASE_URL}/get-users`)
      .then((res) => {
        if (Array.isArray(res.data)) {
          const filteredUsers = res.data.filter((user) => user.role !== "admin");
          setUsers(filteredUsers);
        } else {
          setUsers([]);
        }
      })
      .catch((err) => {
        console.error("❌ Error fetching users:", err);
        setUsers([]); // Set empty array on error
      });
  };

  const fetchProducts = useCallback(() => {
    axios
      .get(`${API_BASE_URL}/get-products/all`)
      .then((res) => {
        setProducts(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error("❌ Error fetching products:", err);
        setProducts([]); // Set empty array on error
      });
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/logs`);
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error("❌ Error fetching logs:", err.message || err);
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        await Promise.all([
          fetchEmployees(),
          fetchUsers(),
          fetchProducts()
        ]);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchAllData();
    
    // Set up periodic refresh
    const refreshInterval = setInterval(fetchAllData, 5000); // Refresh every 5 seconds
    
    return () => clearInterval(refreshInterval);
  }, [fetchProducts]);

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

  const handleEmployeeChange = (e) => {
    setNewEmployee({ ...newEmployee, [e.target.name]: e.target.value });
  };

  const handleProductSubmit = (e) => {
    e.preventDefault();
    const cleanTotalAmount = parseFloat(product.total_amount.replace(/[₱,]/g, "")) || 0;
    const productData = {
      ...product,
      userName: "Administrator", // Assuming admin user is adding the product
      date_acquired: product.date_acquired || null,
      total_amount: cleanTotalAmount,
    };

    axios
      .post(`${API_BASE_URL}/add-product`, productData)
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
        .delete(`${API_BASE_URL}/delete-user/${userId}`)
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

  const handleAddUser = async (e) => {
    e.preventDefault();

    if (newUser.password !== newUser.confirmPassword) {
      alert("❌ Passwords do not match!");
      return;
    }

    // Remove confirmPassword before sending to server
    const { confirmPassword, ...userData } = newUser;

    await axios.post(`${API_BASE_URL}/add-user`, userData)
      .then(() => {
        alert("✅ User Added!");
        setShowUserForm(false);
        fetchUsers();
        setNewUser({ name: "", password: "", confirmPassword: "", role: "employee", FK_employee: "" });
      })
      .catch((err) => {
        console.error("❌ Error adding user:", err.response?.data || err.message);
        alert("❌ Failed to add user. Check console for errors.");
      });
  };

  const handleAddEmployee = (e) => {
    e.preventDefault();
    fetch(`${API_BASE_URL}/add-employee`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEmployee),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          throw new Error(data.error);
        }
        alert("✅ Employee added successfully!");
        setShowEmployeeForm(false);
        setNewEmployee({ name: "", position: "", department: "", email: "", contact_number: "", address: "" });
        fetchEmployees();
      })
      .catch((err) => {
        console.error("❌ Error adding employee:", err);
        alert("Failed to add employee: " + err.message);
      });
  };

  // Handle edit button click
  const handleEditProduct = (product) => {
    setEditingProduct(product);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
  };

  // Handle edit form change
  const handleEditProductChange = (e) => {
    setEditingProduct({ ...editingProduct, [e.target.name]: e.target.value });
  };

  const handleEditUserChange = (e) => {
    setEditingUser({ ...editingUser, [e.target.name]: e.target.value });
  };

  const handleEditEmployeeChange = (e) => {
    setEditingEmployee({ ...editingEmployee, [e.target.name]: e.target.value });
  };

  // Handle edit form submit
  const handleEditProductSubmit = (e) => {
    e.preventDefault();
    axios
      .put(`${API_BASE_URL}/edit-product/${editingProduct.id}`, editingProduct)
      .then(() => {
        alert("✅ Article updated!");
        setEditingProduct(null);
        fetchProducts();
      })
      .catch((err) => {
        console.error("❌ Error updating product:", err.response?.data || err.message);
        alert("❌ Error updating product! Check console.");
      });
  };

  const handleEditUserSubmit = (e) => {
    e.preventDefault();
    fetch(`${API_BASE_URL}/edit-user/${editingUser.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingUser),
    })
      .then((res) => res.json())
      .then(() => {
        setEditingUser(null);
        fetchUsers();
      });
  };

  const handleEditEmployeeSubmit = (e) => {
    e.preventDefault();
    fetch(`${API_BASE_URL}/edit-employee/${editingEmployee.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingEmployee),
    })
      .then((res) => res.json())
      .then(() => {
        setEditingEmployee(null);
        fetchEmployees();
      });
  };

  const handleDeleteEmployee = (id) => {
    if (!window.confirm("Delete this employee?")) return;
    fetch(`${API_BASE_URL}/delete-employee/${id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then(fetchEmployees);
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
            <option value="">Select Employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.name}>
                {emp.name} ({emp.position || 'No Position'})
              </option>
            ))}
          </select>
        </div>

        <textarea name="remarks" placeholder="Remarks" value={product.remarks} onChange={handleChange} />
        <button type="submit">Add Article</button>
      </form>

      <div className="add-supervisor-section">
        <h3>Add Supervisor/Admin</h3>
        <button type="button" className="add-supervisor-btn" onClick={() => setShowUserForm(true)}>
          + Add Supervisor/Admin
        </button>
      </div>

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
            <input type="hidden" name="role" value="supervisor" />
            <button type="submit">Save User</button>
            <button type="button" onClick={() => setShowUserForm(false)}>
              Cancel
            </button>
          </form>
        </div>
      )}

      {showEmployeeForm && (
        <div className="popup-form">
          <h3>Add Employee</h3>
          <form onSubmit={handleAddEmployee}>
            <input name="name" placeholder="Name" value={newEmployee.name} onChange={handleEmployeeChange} required />
            <input name="position" placeholder="Position" value={newEmployee.position} onChange={handleEmployeeChange} />
            <input name="department" placeholder="Department" value={newEmployee.department} onChange={handleEmployeeChange} />
            <input name="email" placeholder="Email" value={newEmployee.email} onChange={handleEmployeeChange} />
            <input name="contact_number" placeholder="Contact Number" value={newEmployee.contact_number} onChange={handleEmployeeChange} />
            <input name="address" placeholder="Address" value={newEmployee.address} onChange={handleEmployeeChange} />
            <button type="submit">Save Employee</button>
            <button type="button" onClick={() => setShowEmployeeForm(false)}>
              Cancel
            </button>
          </form>
          {/* Show generated Employee ID after adding (if available) */}
          {newEmployee.employee_id && (
            <div className="employee-id-display">
              <strong>Employee ID:</strong> {newEmployee.employee_id}
              <button
                style={{ marginLeft: 4, fontSize: 12 }}
                onClick={() => {
                  navigator.clipboard.writeText(newEmployee.employee_id);
                  alert("Copied: " + newEmployee.employee_id);
                }}
              >
                Copy
              </button>
            </div>
          )}
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
                <button className="edit-btn" onClick={() => setEditingUser(user)}>✏️ Edit</button>
                <button className="delete-btn" onClick={() => handleDeleteUser(user.id)}>🗑 Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Employees</h3>
      <button onClick={() => setShowEmployeeForm(true)} style={{ marginBottom: "12px" }}>+ Add Employee</button>
      <table>
        <thead>
          <tr>
            <th>Employee ID</th>
            <th>Name</th>
            <th>Position</th>
            <th>Department</th>
            <th>Email</th>
            <th>Contact</th>
            <th>Address</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(employees) && employees.length > 0 ? (
            employees.map(emp => (
              <tr key={emp.id}>
                <td>
                  {emp.employee_id || "-"}
                  {emp.employee_id && (
                  <button
                    style={{ marginLeft: 4, fontSize: 12 }}
                    onClick={() => {
                      navigator.clipboard.writeText(emp.employee_id);
                      alert("Copied: " + emp.employee_id);
                    }}
                  >
                    Copy
                  </button>
                )}
              </td>
              <td>{emp.name}</td>
              <td>{emp.position}</td>
              <td>{emp.department}</td>
              <td>{emp.email}</td>
              <td>{emp.contact_number}</td>
              <td>{emp.address}</td>
              <td>
                <button onClick={() => handleEditEmployee(emp)}>✏️ Edit</button>
                <button onClick={() => handleDeleteEmployee(emp.id)}>🗑 Delete</button>
              </td>
            </tr>
          ))
          ) : null}
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
              `${API_BASE_URL}/export-products/pdf?startDate=${startDate}&endDate=${endDate}`,
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
              `${API_BASE_URL}/export-products/excel?startDate=${startDate}&endDate=${endDate}`,
              "_blank"
            )
          }
        >
          📊 Export as Excel
        </button>
      </div>

      <h3>Articles</h3>
      <table>
        <thead>
          <tr>
            <th>Article</th>
            <th>Description</th>
            <th>Unit</th>
            <th>Unit Value</th>
            <th>Balance</th>
            <th>On Hand</th>
            <th>Total Amount</th>
            <th>User</th>
            <th>Remarks</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {products.map((prod) => (
            <tr key={prod.id}>
              <td>{prod.article}</td>
              <td>{prod.description}</td>
              <td>{prod.unit}</td>
              <td>{prod.unit_value}</td>
              <td>{prod.balance_per_card}</td>
              <td>{prod.on_hand_per_count}</td>
              <td>{prod.total_amount}</td>
              <td>{prod.actual_user || prod.userName}</td>
              <td>{prod.remarks}</td>
              <td>
                <button onClick={() => handleEditProduct(prod)}>✏️ Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit popup form */}
      {editingProduct && (
        <div className="popup-form">
          <h3>Edit Article</h3>
          <form onSubmit={handleEditProductSubmit}>
            <input
              type="text"
              name="article"
              value={editingProduct.article}
              onChange={handleEditProductChange}
              required
            />
            <textarea
              name="description"
              value={editingProduct.description}
              onChange={handleEditProductChange}
            />
            <input
              type="text"
              name="unit"
              value={editingProduct.unit}
              onChange={handleEditProductChange}
            />
            <input
              type="number"
              name="unit_value"
              value={editingProduct.unit_value}
              onChange={handleEditProductChange}
            />
            <input
              type="number"
              name="balance_per_card"
              value={editingProduct.balance_per_card}
              onChange={handleEditProductChange}
            />
            <input
              type="number"
              name="on_hand_per_count"
              value={editingProduct.on_hand_per_count}
              onChange={handleEditProductChange}
            />
            <input
              type="number"
              name="total_amount"
              value={editingProduct.total_amount}
              onChange={handleEditProductChange}
            />
            <textarea
              name="remarks"
              value={editingProduct.remarks}
              onChange={handleEditProductChange}
            />
            <button type="submit">Save</button>
            <button type="button" onClick={() => setEditingProduct(null)}>
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Edit user popup form */}
      {editingUser && (
        <div className="popup-form">
          <h3>Edit User</h3>
          <form onSubmit={handleEditUserSubmit}>
            <input
              type="text"
              name="name"
              value={editingUser.name}
              onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
              required
            />
            <select
              name="role"
              value={editingUser.role}
              onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
              required
            >
              <option value="admin">Administrator</option>
              <option value="employee">Instructor</option>
              <option value="supervisor">Admin</option>
            </select>
            <button type="submit">Save</button>
            <button type="button" onClick={() => setEditingUser(null)}>Cancel</button>
          </form>
        </div>
      )}

      {/* Edit employee popup form */}
      {editingEmployee && (
        <div className="popup-form">
          <h3>Edit Employee</h3>
          <form onSubmit={handleEditEmployeeSubmit}>
            <input
              name="name"
              value={editingEmployee.name}
              onChange={handleEditEmployeeChange}
              required
            />
            <input
              name="position"
              value={editingEmployee.position}
              onChange={handleEditEmployeeChange}
            />
            <input
              name="department"
              value={editingEmployee.department}
              onChange={handleEditEmployeeChange}
            />
            <input
              name="email"
              value={editingEmployee.email}
              onChange={handleEditEmployeeChange}
            />
            <input
              name="contact_number"
              value={editingEmployee.contact_number}
              onChange={handleEditEmployeeChange}
            />
            <input
              name="address"
              value={editingEmployee.address}
              onChange={handleEditEmployeeChange}
            />
            <button type="submit">Save</button>
            <button type="button" onClick={() => setEditingEmployee(null)}>Cancel</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
