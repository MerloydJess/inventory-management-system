import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./AdminPanel.css";
import { useNavigate } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";

const API_BASE_URL = process.env.REACT_APP_API_URL;

const AdminPanel = ({ userName }) => {
  const [currentView, setCurrentView] = useState("dashboard");
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
    password: "",
    confirmPassword: "",
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [adminNote, setAdminNote] = useState("");
  const [showAdminEdit, setShowAdminEdit] = useState(false);
  const [adminEditFeedback, setAdminEditFeedback] = useState(null);

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
    
    // Validate passwords match
    if (newEmployee.password !== newEmployee.confirmPassword) {
      alert("❌ Passwords do not match!");
      return;
    }

    // Remove confirmPassword before sending to server
    const { confirmPassword, ...employeeData } = newEmployee;

    fetch(`${API_BASE_URL}/add-employee`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(employeeData),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          throw new Error(data.error);
        }
        alert("✅ Employee added successfully!");
        setShowEmployeeForm(false);
        setNewEmployee({ 
          name: "", 
          position: "", 
          department: "", 
          email: "", 
          contact_number: "", 
          address: "",
          password: "",
          confirmPassword: "",
        });
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
    const endpoint = showAdminEdit ? 'admin/edit-product' : 'edit-product';
    const productData = {
      ...editingProduct,
      ...(showAdminEdit && { adminNote })
    };

    axios
      .put(`${API_BASE_URL}/${endpoint}/${editingProduct.id}`, productData)
      .then((response) => {
        setAdminEditFeedback({
          type: 'success',
          message: showAdminEdit ? 'Article updated by admin!' : 'Article updated!'
        });
        setEditingProduct(null);
        setShowAdminEdit(false);
        setAdminNote("");
        fetchProducts();
      })
      .catch((err) => {
        console.error("❌ Error updating product:", err.response?.data || err.message);
        setAdminEditFeedback({
          type: 'error',
          message: `Error: ${err.response?.data?.error || err.message}`
        });
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

  if (currentView === 'dashboard') {
    return <AdminDashboard onViewChange={setCurrentView} />;
  }

  if (currentView === 'articles') {
    return (
      <div className="admin-panel">
        <div className="admin-header-buttons">
          <button className="dashboard-btn" onClick={() => setCurrentView('dashboard')}>
            ← Back to Dashboard
          </button>
          <button className="manage-articles-btn" onClick={() => navigate("/manage-articles")}>
            Manage Articles
          </button>
          <button className="add-return-btn" onClick={() => navigate("/returns-panel")}>
            Add Return
          </button>
        </div>

        <h2>Add New Article</h2>
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
      </div>
    );
  }

  if (currentView === 'users') {
    return (
      <div className="admin-panel">
        <div className="admin-header-buttons">
          <button className="dashboard-btn" onClick={() => setCurrentView('dashboard')}>
            ← Back to Dashboard
          </button>
        </div>

        <h2>User Management</h2>
        
        {/* Add User Section */}
        <div className="add-user-section">
          <button onClick={() => setShowUserForm(!showUserForm)} className="toggle-form-btn">
            {showUserForm ? "Cancel" : "Add Supervisor/Admin"}
          </button>

          {showUserForm && (
            <form onSubmit={handleAddUser} className="user-form">
              <h3>Add New User</h3>
              <input type="text" name="name" placeholder="Name" value={newUser.name} onChange={handleUserChange} required />
              <input type="password" name="password" placeholder="Password" value={newUser.password} onChange={handleUserChange} required />
              <input type="password" name="confirmPassword" placeholder="Confirm Password" value={newUser.confirmPassword} onChange={handleUserChange} required />
              <select name="role" value={newUser.role} onChange={handleUserChange} required>
                <option value="supervisor">Supervisor</option>
                <option value="admin">Admin</option>
              </select>
              <button type="submit">Add User</button>
            </form>
          )}
        </div>

        {/* Add Employee Section */}
        <div className="add-employee-section">
          <button onClick={() => setShowEmployeeForm(!showEmployeeForm)} className="toggle-form-btn">
            {showEmployeeForm ? "Cancel" : "Add Employee"}
          </button>

          {showEmployeeForm && (
            <form onSubmit={handleAddEmployee} className="employee-form">
              <h3>Add New Employee</h3>
              <input type="text" name="name" placeholder="Name" value={newEmployee.name} onChange={handleEmployeeChange} required />
              <input type="text" name="position" placeholder="Position" value={newEmployee.position} onChange={handleEmployeeChange} />
              <input type="text" name="department" placeholder="Department" value={newEmployee.department} onChange={handleEmployeeChange} />
              <input type="email" name="email" placeholder="Email" value={newEmployee.email} onChange={handleEmployeeChange} />
              <input type="text" name="contact_number" placeholder="Contact Number" value={newEmployee.contact_number} onChange={handleEmployeeChange} />
              <input type="text" name="address" placeholder="Address" value={newEmployee.address} onChange={handleEmployeeChange} />
              <input type="password" name="password" placeholder="Password" value={newEmployee.password} onChange={handleEmployeeChange} required />
              <input type="password" name="confirmPassword" placeholder="Confirm Password" value={newEmployee.confirmPassword} onChange={handleEmployeeChange} required />
              <button type="submit">Add Employee</button>
            </form>
          )}
        </div>

        {/* Users Table */}
        <div className="users-table-section">
          <h3>System Users</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.role}</td>
                  <td>
                    <button onClick={() => handleEditUser(user)}>Edit</button>
                    <button onClick={() => handleDeleteUser(user.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Employees Table */}
        <div className="employees-table-section">
          <h3>Employees</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Position</th>
                <th>Department</th>
                <th>Contact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td>{employee.name}</td>
                  <td>{employee.position}</td>
                  <td>{employee.department}</td>
                  <td>{employee.contact_number}</td>
                  <td>
                    <button onClick={() => handleEditEmployee(employee)}>Edit</button>
                    <button onClick={() => handleDeleteEmployee(employee.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Edit User Modal */}
        {editingUser && (
          <div className="edit-modal">
            <div className="modal-content">
              <h3>Edit User</h3>
              <form onSubmit={handleEditUserSubmit}>
                <input type="text" name="name" value={editingUser.name} onChange={handleEditUserChange} required />
                <select name="role" value={editingUser.role} onChange={handleEditUserChange} required>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Admin</option>
                </select>
                <div className="modal-actions">
                  <button type="submit">Save</button>
                  <button type="button" onClick={() => setEditingUser(null)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Employee Modal */}
        {editingEmployee && (
          <div className="edit-modal">
            <div className="modal-content">
              <h3>Edit Employee</h3>
              <form onSubmit={handleEditEmployeeSubmit}>
                <input type="text" name="name" value={editingEmployee.name} onChange={handleEditEmployeeChange} required />
                <input type="text" name="position" value={editingEmployee.position} onChange={handleEditEmployeeChange} />
                <input type="text" name="department" value={editingEmployee.department} onChange={handleEditEmployeeChange} />
                <input type="email" name="email" value={editingEmployee.email} onChange={handleEditEmployeeChange} />
                <input type="text" name="contact_number" value={editingEmployee.contact_number} onChange={handleEditEmployeeChange} />
                <input type="text" name="address" value={editingEmployee.address} onChange={handleEditEmployeeChange} />
                <div className="modal-actions">
                  <button type="submit">Save</button>
                  <button type="button" onClick={() => setEditingEmployee(null)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (currentView === 'reports') {
    return (
      <div className="admin-panel">
        <div className="admin-header-buttons">
          <button className="dashboard-btn" onClick={() => setCurrentView('dashboard')}>
            ← Back to Dashboard
          </button>
        </div>

        <h2>Export Reports</h2>
        
        <div className="reports-section">
          <div className="date-filter">
            <h3>Date Range Filter</h3>
            <div className="date-inputs">
              <label>Start Date:</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              
              <label>End Date:</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="export-options">
            <h3>Export Options</h3>
            <div className="export-buttons">
              <button 
                onClick={() => window.open(`${API_BASE_URL}/export-products/pdf?startDate=${startDate}&endDate=${endDate}`, '_blank')}
                className="export-btn pdf-btn"
              >
                <i className="fas fa-file-pdf"></i>
                Export as PDF
              </button>
              
              <button 
                onClick={() => window.open(`${API_BASE_URL}/export-products/excel?startDate=${startDate}&endDate=${endDate}`, '_blank')}
                className="export-btn excel-btn"
              >
                <i className="fas fa-file-excel"></i>
                Export as Excel
              </button>
              
              <button 
                onClick={() => window.open(`${API_BASE_URL}/export-products/csv?startDate=${startDate}&endDate=${endDate}`, '_blank')}
                className="export-btn csv-btn"
              >
                <i className="fas fa-file-csv"></i>
                Export as CSV
              </button>
            </div>
          </div>

          <div className="report-preview">
            <h3>Products Preview</h3>
            <div className="products-count">
              <p>Total Products: {products.length}</p>
              {startDate && endDate && (
                <p>Date Range: {startDate} to {endDate}</p>
              )}
            </div>
            
            <div className="products-table">
              <table>
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>Description</th>
                    <th>Date Acquired</th>
                    <th>Unit Value</th>
                    <th>Actual User</th>
                  </tr>
                </thead>
                <tbody>
                  {products.slice(0, 10).map((product) => (
                    <tr key={product.id}>
                      <td>{product.article}</td>
                      <td>{product.description}</td>
                      <td>{new Date(product.date_acquired).toLocaleDateString()}</td>
                      <td>₱{product.unit_value}</td>
                      <td>{product.actual_user}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {products.length > 10 && (
                <p className="table-note">Showing first 10 items. Export to see all data.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'returns') {
    return (
      <div className="admin-panel">
        <div className="admin-header-buttons">
          <button className="dashboard-btn" onClick={() => setCurrentView('dashboard')}>
            ← Back to Dashboard
          </button>
          <button className="add-return-btn" onClick={() => navigate("/returns-panel")}>
            Add New Return
          </button>
        </div>

        <h2>Returns Management</h2>
        
        <div className="returns-navigation">
          <button 
            onClick={() => navigate("/manage-returns")}
            className="manage-returns-btn"
          >
            <i className="fas fa-list"></i>
            View All Returns
          </button>
          
          <button 
            onClick={() => navigate("/returns-panel")}
            className="add-return-btn"
          >
            <i className="fas fa-plus"></i>
            Add New Return
          </button>
        </div>

        <div className="returns-info">
          <div className="info-card">
            <h3>Returns Overview</h3>
            <p>Manage all product returns and receipts from this section.</p>
            <ul>
              <li>View all submitted returns</li>
              <li>Add new return entries</li>
              <li>Track return status</li>
              <li>Generate return reports</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Fallback to dashboard if no specific view is selected
  return <AdminDashboard onViewChange={setCurrentView} />;
};

export default AdminPanel;
