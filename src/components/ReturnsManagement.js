import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ReturnsManagement.css';

const API_BASE_URL = process.env.REACT_APP_API_URL;

const ReturnsManagement = () => {
  const navigate = useNavigate();
  const [returns, setReturns] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingReturn, setEditingReturn] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOption, setFilterOption] = useState('all');

  const fetchReturns = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch all returns with complete details
      const response = await axios.get(`${API_BASE_URL}/api/returns/all`);
      let returnsData = Array.isArray(response.data) ? response.data : response.data.returns || [];
      
      // Format and validate data
      returnsData = returnsData.map(ret => ({
        ...ret,
        // Ensure properties match the server response
        end_user: ret.end_user || ret.endUser || '',
        ics_no: ret.ics_no || ret.icsNo || '',
        date_acquired: ret.date_acquired || ret.dateAcquired || '',
        amount: parseFloat(ret.amount) || 0,
        // Include all location data
        returned_by_location: ret.returned_by_location || '',
        received_by_location: ret.received_by_location || '',
        second_received_by_location: ret.second_received_by_location || ''
      }));
      
      // Sort returns by date, most recent first
      returnsData = returnsData.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      console.log('Fetched returns:', returnsData); // For debugging
      setReturns(returnsData);
    } catch (error) {
      console.error('Error fetching returns:', error);
      alert('Failed to fetch returns. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      // Fetch all employees
      const response = await axios.get(`${API_BASE_URL}/get-employees`);
      
      // Sort employees by department and name
      const sortedEmployees = response.data.sort((a, b) => {
        if (a.department !== b.department) {
          return (a.department || '').localeCompare(b.department || '');
        }
        return a.name.localeCompare(b.name);
      });

      setEmployees(sortedEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    const initialFetch = async () => {
      await Promise.all([fetchReturns(), fetchEmployees()]);
    };
    initialFetch();
    
    // Set up polling for real-time updates
    const refreshInterval = setInterval(async () => {
      await fetchReturns();
    }, 3000); // Poll every 3 seconds for more responsive updates
    
    return () => clearInterval(refreshInterval);
  }, [fetchReturns, fetchEmployees]);

  const handleEditReturn = (returnItem) => {
    setEditingReturn({
      ...returnItem,
      amount: parseFloat(returnItem.amount) || 0,
      quantity: parseInt(returnItem.quantity) || 0
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!editingReturn.endUser) {
        alert('Please select a user for this return');
        return;
      }

      const updatedReturn = {
        rrspNo: editingReturn.rrspNo,
        date: editingReturn.date,
        description: editingReturn.description || '',
        quantity: parseInt(editingReturn.quantity) || 0,
        icsNo: editingReturn.icsNo || '',
        dateAcquired: editingReturn.dateAcquired,
        amount: parseFloat(editingReturn.amount) || 0,
        endUser: editingReturn.endUser,
        remarks: editingReturn.remarks || '',
        id: editingReturn.id
      };

      const response = await axios.put(
        `${API_BASE_URL}/edit-return/${editingReturn.id}`,
        updatedReturn,
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (response.data) {
        alert('Return updated successfully!');
        setEditingReturn(null);
        fetchReturns();
      }
    } catch (error) {
      console.error('Error updating return:', error);
      if (error.response) {
        alert(`Update failed: ${error.response.data.message || 'Server error'}`);
      } else if (error.request) {
        alert('No response from server. Please check your connection.');
      } else {
        alert('Error updating return. Please try again.');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditingReturn(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredReturns = returns.filter(returnItem => {
    const matchesSearch = 
      returnItem.rrspNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnItem.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnItem.end_user?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterOption === 'all') return matchesSearch;
    // Case-insensitive comparison for end_user
    return matchesSearch && returnItem.end_user?.toLowerCase() === filterOption.toLowerCase();
  });

  return (
    <div className="returns-management">
      <div className="returns-header">
        <h2>Returns Management</h2>
        <button onClick={() => navigate('/admin')} className="back-btn">
          ← Back to Admin Panel
        </button>
      </div>

      <div className="search-filter-container">
        <input
          type="text"
          placeholder="Search returns by RRSP No, description, or user..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select 
          value={filterOption} 
          onChange={(e) => setFilterOption(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Users</option>
          {employees
            .sort((a, b) => {
              if (a.department !== b.department) {
                return a.department?.localeCompare(b.department || '');
              }
              return a.name.localeCompare(b.name);
            })
            .map(emp => (
              <option key={emp.id} value={emp.name}>
                {emp.name} - {emp.department || 'No Department'}
              </option>
            ))
          }
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading returns...</div>
      ) : (
        <div className="returns-list">
          {filteredReturns.length === 0 ? (
            <div className="no-returns">No returns found</div>
          ) : (
            <div className="returns-grid">
              {filteredReturns.map(returnItem => (
                <div key={returnItem.id} className="return-card">
                  <div className="return-header">
                    <div className="return-title">RRSP No: {returnItem.rrspNo}</div>
                    <button onClick={() => handleEditReturn(returnItem)} className="edit-btn">✏️ Edit</button>
                  </div>
                  <div className="return-details">
                    <div><strong>Date:</strong> {returnItem.date}</div>
                    <div><strong>Description:</strong> {returnItem.description}</div>
                    <div><strong>Quantity:</strong> {returnItem.quantity}</div>
                    <div><strong>ICS No:</strong> {returnItem.ics_no}</div>
                    <div><strong>Date Acquired:</strong> {returnItem.date_acquired}</div>
                    <div><strong>Amount:</strong> ₱{parseFloat(returnItem.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div><strong>End User:</strong> {returnItem.end_user}</div>
                    <div><strong>Remarks:</strong> {returnItem.remarks}</div>
                    
                    <div className="return-signatures">
                      <div className="signature-section">
                        <h4>Returned By</h4>
                        <div><strong>Name:</strong> {returnItem.returned_by}</div>
                        <div><strong>Position:</strong> {returnItem.returned_by_position}</div>
                        <div><strong>Date:</strong> {returnItem.returned_by_date}</div>
                        <div><strong>Location:</strong> {returnItem.returned_by_location}</div>
                      </div>
                      
                      <div className="signature-section">
                        <h4>Received By</h4>
                        <div><strong>Name:</strong> {returnItem.received_by}</div>
                        <div><strong>Position:</strong> {returnItem.received_by_position}</div>
                        <div><strong>Date:</strong> {returnItem.received_by_date}</div>
                        <div><strong>Location:</strong> {returnItem.received_by_location}</div>
                      </div>

                      {returnItem.second_received_by && (
                        <div className="signature-section">
                          <h4>Second Receiver</h4>
                          <div><strong>Name:</strong> {returnItem.second_received_by}</div>
                          <div><strong>Position:</strong> {returnItem.second_received_by_position}</div>
                          <div><strong>Date:</strong> {returnItem.second_received_by_date}</div>
                          <div><strong>Location:</strong> {returnItem.second_received_by_location}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {editingReturn && (
        <div className="edit-modal" onClick={(e) => {
          if (e.target.className === 'edit-modal') {
            setEditingReturn(null);
          }
        }}>
          <div className="edit-modal-content">
            <h3>Edit Return</h3>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>RRSP No:</label>
                <input
                  type="text"
                  name="rrspNo"
                  value={editingReturn.rrspNo || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Date:</label>
                <input
                  type="date"
                  name="date"
                  value={editingReturn.date || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <input
                  type="text"
                  name="description"
                  value={editingReturn.description || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Quantity:</label>
                <input
                  type="number"
                  name="quantity"
                  value={editingReturn.quantity || ''}
                  onChange={handleInputChange}
                  min="1"
                  required
                />
              </div>
              <div className="form-group">
                <label>ICS No:</label>
                <input
                  type="text"
                  name="icsNo"
                  value={editingReturn.icsNo || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Date Acquired:</label>
                <input
                  type="date"
                  name="dateAcquired"
                  value={editingReturn.dateAcquired || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Amount:</label>
                <input
                  type="number"
                  name="amount"
                  value={editingReturn.amount || ''}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label>End User:</label>
                <select
                  name="endUser"
                  value={editingReturn.endUser || ''}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select User</option>
                  {employees
                    .sort((a, b) => {
                      if (a.department !== b.department) {
                        return a.department?.localeCompare(b.department || '');
                      }
                      return a.name.localeCompare(b.name);
                    })
                    .map(emp => (
                      <option key={emp.id} value={emp.name}>
                        {emp.name} - {emp.department || 'No Department'} ({emp.position || 'No Position'})
                      </option>
                    ))
                  }
                </select>
              </div>
              <div className="form-group">
                <label>Remarks:</label>
                <select
                  name="remarks"
                  value={editingReturn.remarks || ''}
                  onChange={handleInputChange}
                >
                  <option value="">Select Remark</option>
                  <option value="Functional">Functional</option>
                  <option value="Destroyed">Destroyed</option>
                  <option value="For Disposal">For Disposal</option>
                </select>
              </div>
              <div className="modal-buttons">
                <button type="submit">Save Changes</button>
                <button type="button" onClick={() => setEditingReturn(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnsManagement;
