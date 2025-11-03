import React, { useState, useEffect } from "react";
import "./EmployeeReceipts.css";

const API_BASE_URL = process.env.REACT_APP_API_URL;

const EmployeeReceipts = ({ userName }) => {
  const [receipts, setReceipts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expanded, setExpanded] = useState({});

  // ✅ Fetch receipts assigned to the logged-in user
  useEffect(() => {
    if (!userName) return;
    
    console.log("🔍 Fetching receipts for:", userName);
    fetch(`${API_BASE_URL}/get-receipts/${encodeURIComponent(userName)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log("✅ Fetched Receipts:", data);
        setReceipts(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("❌ Error fetching receipts:", err);
        setReceipts([]);
      });
  }, [userName]);

  // ✅ Filter receipts based on search term
  const filteredReceipts = receipts.filter((receipt) =>
    Object.values(receipt)
      .some((value) => value?.toString().toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleExpand = (id) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="employee-receipts">
      <h2>
        <i className="fas fa-receipt"></i>
        Your Receipts
      </h2>
      
      <div className="search-section">
        <i className="fas fa-search"></i>
        <input
          type="text"
          placeholder="Search receipts by name, description, RRSP number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="receipt-list">
        {filteredReceipts.length > 0 ? (
          filteredReceipts.map((receipt) => (
            <div className="receipt-bubble" key={receipt.id || receipt.rrsp_no}>
              <div className="receipt-main">
                <div>
                  <strong data-icon="📋">RRSP No.:</strong>
                  <div>{receipt.rrsp_no}</div>
                </div>
                <div>
                  <strong data-icon="📅">Date:</strong>
                  <div>{receipt.date}</div>
                </div>
                <div>
                  <strong data-icon="👤">Receipt Name:</strong>
                  <div>{receipt.end_user}</div>
                </div>
                <div>
                  <strong data-icon="📝">Description:</strong>
                  <div>{receipt.description}</div>
                </div>
              </div>
              
              <button
                className="view-details-btn"
                onClick={() => toggleExpand(receipt.id || receipt.rrsp_no)}
              >
                <i className={`fas fa-${expanded[receipt.id || receipt.rrsp_no] ? 'eye-slash' : 'eye'}`}></i>
                {expanded[receipt.id || receipt.rrsp_no] ? "Hide Details" : "View Details"}
              </button>

              {expanded[receipt.id || receipt.rrsp_no] && (
                <div className="receipt-details">
                  <div><strong>Quantity:</strong><div>{receipt.quantity}</div></div>
                  <div><strong>ICS No.:</strong><div>{receipt.ics_no}</div></div>
                  <div><strong>Date Acquired:</strong><div>{receipt.date_acquired}</div></div>
                  <div><strong>Amount:</strong><div>₱{parseFloat(receipt.amount || 0).toFixed(2)}</div></div>
                  <div><strong>Remarks:</strong><div>{receipt.remarks || "—"}</div></div>
                  <div><strong>Returned By:</strong><div>{receipt.returned_by}</div></div>
                  <div><strong>Returned By Position:</strong><div>{receipt.returned_by_position}</div></div>
                  <div><strong>Returned By Date:</strong><div>{receipt.returned_by_date}</div></div>
                  <div><strong>Returned By Location:</strong><div>{receipt.location}</div></div>
                  <div><strong>Received By:</strong><div>{receipt.received_by}</div></div>
                  <div><strong>Received By Position:</strong><div>{receipt.received_by_position}</div></div>
                  <div><strong>Received By Date:</strong><div>{receipt.received_by_date}</div></div>
                  <div><strong>Received By Location:</strong><div>{receipt.location}</div></div>
                  <div><strong>Second Received By:</strong><div>{receipt.second_received_by || "—"}</div></div>
                  <div><strong>Second Received By Position:</strong><div>{receipt.second_received_by_position || "—"}</div></div>
                  <div><strong>Second Received By Date:</strong><div>{receipt.second_received_by_date || "—"}</div></div>
                  <div><strong>Second Received By Location:</strong><div>{receipt.location}</div></div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="no-receipts">
            <i className="fas fa-receipt"></i>
            <p>No receipts found for your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeReceipts;
