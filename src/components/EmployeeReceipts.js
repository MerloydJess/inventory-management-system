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
      <h2>Your Receipts</h2>
      <input
        type="text"
        placeholder="Search receipts..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
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

export default EmployeeReceipts;
