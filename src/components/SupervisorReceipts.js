import axios from "axios";
import React, { useState, useEffect } from "react";
import "./SupervisorReceipts.css";

const SupervisorReceipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    axios.get("http://localhost:5000/api/returns/all") // ✅ FIXED to use axios
      .then((res) => {
        console.log("✅ Fetched Receipts:", res.data);
        setReceipts(res.data);
      })
      .catch((err) => console.error("❌ Error fetching receipts:", err));
  }, []);

  const filteredReceipts = receipts.filter((receipt) =>
    Object.values(receipt)
      .some(value => value?.toString().toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="supervisor-receipts">
      <h2>Supervisor - All Receipts</h2>
      <input
        type="text"
        placeholder="Search by Username, Date, Property No., Article, Remarks..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <table>
        <thead>
          <tr>
            <th>RRSP No.</th>
            <th>Date</th>
            <th>Description</th>
            <th>Quantity</th>
            <th>ICS No.</th>
            <th>Date Acquired</th>
            <th>Amount</th>
            <th>End User</th>
            <th>Remarks</th>
            <th>Returned By</th>
            <th>Returned By Position</th>
            <th>Returned By Date</th>
            <th>Received By</th>
            <th>Received By Position</th>
            <th>Received By Date</th>
            <th>Second Received By</th>
            <th>Second Received By Position</th>
            <th>Second Received By Date</th>
          </tr>
        </thead>
        <tbody>
          {filteredReceipts.map((receipt, index) => (
            <tr key={index}>
              <td>{receipt.rrsp_no}</td>
              <td>{receipt.date}</td>
              <td>{receipt.description}</td>
              <td>{receipt.quantity}</td>
              <td>{receipt.ics_no}</td>
              <td>{receipt.date_acquired}</td>
              <td>₱{parseFloat(receipt.amount).toFixed(2)}</td>
              <td>{receipt.end_user}</td>
              <td>{receipt.remarks}</td>
              <td>{receipt.returned_by}</td>
              <td>{receipt.returned_by_position}</td>
              <td>{receipt.returned_by_date}</td>
              <td>{receipt.received_by}</td>
              <td>{receipt.received_by_position}</td>
              <td>{receipt.received_by_date}</td>
              <td>{receipt.second_received_by || "—"}</td>
              <td>{receipt.second_received_by_position || "—"}</td>
              <td>{receipt.second_received_by_date || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SupervisorReceipts;
