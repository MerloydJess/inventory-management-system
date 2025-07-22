import axios from "axios";
import React, { useState, useEffect } from "react";
import "./SupervisorReceipts.css";

const API_BASE_URL = process.env.REACT_APP_API_URL;

const SupervisorReceipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState({}); // Track which receipts are expanded

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/returns/all`)
      .then((res) => {
        setReceipts(res.data);
      })
      .catch((err) => console.error("❌ Error fetching receipts:", err));
  }, []);

  const filteredReceipts = receipts.filter((receipt) =>
    Object.values(receipt)
      .some(value => value?.toString().toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleExpand = (id) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="supervisor-receipts">
      <h2>Supervisor - All Receipts</h2>
      <input
        type="text"
        placeholder="Search by Username, Date, Property No., Article, Remarks..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <div className="receipt-list">
        {filteredReceipts.map((receipt) => (
          <div className="receipt-bubble" key={receipt.id || receipt.rrsp_no}>
            <div className="receipt-main">
              <div><strong>RRSP No.:</strong> {receipt.rrsp_no}</div>
              <div><strong>Date:</strong> {receipt.date}</div>
              <div><strong>Receipt Name:</strong> {receipt.end_user}</div>
              <div><strong>Description:</strong> {receipt.description}</div>
              <button
                className="view-details-btn"
                onClick={() => toggleExpand(receipt.id || receipt.rrsp_no)}
              >
                {expanded[receipt.id || receipt.rrsp_no] ? "Hide Details" : "View Details"}
              </button>
            </div>
            {expanded[receipt.id || receipt.rrsp_no] && (
              <div className="receipt-details">
                <div><strong>Quantity:</strong> {receipt.quantity}</div>
                <div><strong>ICS No.:</strong> {receipt.ics_no}</div>
                <div><strong>Date Acquired:</strong> {receipt.date_acquired}</div>
                <div><strong>Amount:</strong> ₱{parseFloat(receipt.amount).toFixed(2)}</div>
                <div><strong>Remarks:</strong> {receipt.remarks}</div>
                <div><strong>Returned By:</strong> {receipt.returned_by}</div>
                <div><strong>Returned By Position:</strong> {receipt.returned_by_position}</div>
                <div><strong>Returned By Date:</strong> {receipt.returned_by_date}</div>
                <div><strong>Returned By Location:</strong> {receipt.location}</div>
                <div><strong>Received By:</strong> {receipt.received_by}</div>
                <div><strong>Received By Position:</strong> {receipt.received_by_position}</div>
                <div><strong>Received By Date:</strong> {receipt.received_by_date}</div>
                <div><strong>Received By Location:</strong> {receipt.location}</div>
                <div><strong>Second Received By:</strong> {receipt.second_received_by || "—"}</div>
                <div><strong>Second Received By Position:</strong> {receipt.second_received_by_position || "—"}</div>
                <div><strong>Second Received By Date:</strong> {receipt.second_received_by_date || "—"}</div>
                <div><strong>Second Received By Location:</strong> {receipt.location}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SupervisorReceipts;
