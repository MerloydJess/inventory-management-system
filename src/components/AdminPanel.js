import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPanel.css';

const AdminPanel = () => {
  const [product, setProduct] = useState({
    article: '',
    description: '',
    date_acquired: '',
    property_number: '',
    unit: '',
    unit_value: '',
    balance_per_card: '',
    on_hand_per_count: '',
    total_amount: '',
    actual_user: '',
    remarks: ''
  });
  
  const [users, setUsers] = useState([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    role: 'employee',  // Default to employee
    password: ''
  });
  const [userFormKey, setUserFormKey] = useState(Date.now());
  const [articleFormKey, setArticleFormKey] = useState(Date.now());



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

  // Separate Product Submission Handler
  const handleProductSubmit = (e) => {
    e.preventDefault();
  
    const productData = { ...product };
    if (!productData.date_acquired) {
      productData.date_acquired = null;
    }
  
    axios.post('http://localhost:5000/add-product', productData)
      .then(res => {
        alert('Article Added!');
        setProduct({ // Reset product state without using key
          article: '', 
          description: '', 
          date_acquired: '', 
          property_number: '', 
          unit: '',
          unit_value: '', 
          balance_per_card: '', 
          on_hand_per_count: '', 
          total_amount: '', 
          actual_user: '', 
          remarks: '' 
        });
      })
      .catch(err => console.error(err));
  };
  

  // Separate User Submission Handler
  const handleAddUser = (e) => {
    e.preventDefault();
    axios.post('http://localhost:5000/add-user', newUser)
      .then(res => {
        alert('User Added!');
        setNewUser({ name: '', role: 'employee', password: '' });
        setShowUserForm(false);
        setUserFormKey(Date.now());
        fetchUsers(); // Refresh user list
      })
      .catch(err => console.error(err));
  };

  return (
    
    <div className="admin-panel">
      <button 
  className="logout-btn" 
  onClick={() => window.location.reload()}  // Simple page reload for logout
>
  Logout
</button>

      <h2>Add New Article</h2>
      <form key={articleFormKey} onSubmit={handleProductSubmit}>
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
          placeholder="Unit (PC/SET/UNIT)" 
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
          placeholder="Balance per Card (Quantity)" 
          value={product.balance_per_card} 
          onChange={handleChange} 
        />
        <input 
          type="number" 
          name="on_hand_per_count" 
          placeholder="On Hand per Count (Quantity)" 
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
          <select 
            name="actual_user" 
            value={product.actual_user} 
            onChange={handleChange} 
            required
          >
            <option value="">Select Actual User</option>
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
        <textarea 
          name="remarks" 
          placeholder="Remarks" 
          value={product.remarks} 
          onChange={handleChange} 
        />
        <button type="submit">Add Article</button>
      </form>
      
      {showUserForm && (
        <div className="popup-form">
          <h3>Add New User</h3>
          <form key={userFormKey} onSubmit={handleAddUser}>
            <input 
              type="text" 
              name="name" 
              placeholder="User Name" 
              value={newUser.name} 
              onChange={handleUserChange} 
              required 
            />
            <input 
              type="text" 
              name="password" 
              placeholder="Password" 
              value={newUser.password} 
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
            <button type="submit">Save User</button>
            <button type="button" onClick={() => setShowUserForm(false)}>Cancel</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
