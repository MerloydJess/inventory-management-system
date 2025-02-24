import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPanel.css';

const AdminPanel = () => {
  const [product, setProduct] = useState({
    name: '',
    unit_price: '',
    date_acquired: '',
    responsible_user: ''
  });

  const [users, setUsers] = useState([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    role: 'employee',  // Default to employee
    password: ''
  });

  // Fetch users for the dropdown
  const fetchUsers = () => {
    axios.get('http://localhost:5000/get-users')
      .then(res => setUsers(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  const handleUserChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('http://localhost:5000/add-product', product)
      .then(res => {
        alert('Product Added!');
        setProduct({ name: '', unit_price: '', date_acquired: '', responsible_user: '' });
      })
      .catch(err => console.error(err));
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    axios.post('http://localhost:5000/add-user', newUser)
      .then(res => {
        alert('User Added!');
        setNewUser({ name: '', role: 'employee', password: '' });
        setShowUserForm(false);
        fetchUsers(); // Refresh user list
      })
      .catch(err => console.error(err));
  };

  return (
    <div className="admin-panel">
      <h2>Add New Product</h2>
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          name="name" 
          placeholder="Product Name" 
          value={product.name} 
          onChange={handleChange} 
          required 
        />
        <input 
          type="number" 
          name="unit_price" 
          placeholder="Unit Price" 
          value={product.unit_price} 
          onChange={handleChange} 
          required 
        />
        <input 
          type="date" 
          name="date_acquired" 
          value={product.date_acquired} 
          onChange={handleChange} 
          required 
        />
        <div className="user-select">
          <select 
            name="responsible_user" 
            value={product.responsible_user} 
            onChange={handleChange} 
            required
          >
            <option value="">Select Responsible User</option>
            {users.map(user => (
              <option key={user.id} value={user.name}>
                {user.name}
              </option>
            ))}
          </select>
          <button type="button" className="add-user-btn" onClick={() => setShowUserForm(true)}>
            + Add User
          </button>
        </div>
        <button type="submit">Add Product</button>
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
            <select 
              name="role" 
              value={newUser.role} 
              onChange={handleUserChange} 
              required
            >
              <option value="admin">Admin</option>
              <option value="employee">Employee</option>
              <option value="supervisor">Supervisor</option>
            </select>
            <input 
              type="password" 
              name="password" 
              placeholder="Password" 
              value={newUser.password} 
              onChange={handleUserChange} 
              required 
            />
            <button type="submit">Save User</button>
            <button type="button" onClick={() => setShowUserForm(false)}>Cancel</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
