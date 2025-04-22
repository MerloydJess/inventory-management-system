import React, { useState, useEffect } from "react";
import "./EmployeeReceipts.css";

const EmployeeReceipts = ({ userName }) => {
  const [receipts, setReceipts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Fetch receipts assigned to the logged-in user
  useEffect(() => {
    fetch(`http://localhost:5000/get-receipts/${encodeURIComponent(userName)}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ Fetched Receipts:", data); // ✅ Debugging log
        setReceipts(data);
      })
      .catch((err) => console.error("❌ Error fetching receipts:", err));
  }, [userName]);

  // ✅ Filter receipts based on search term
  const filteredReceipts = receipts.filter((receipt) =>
    receipt.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="employee-receipts">
      <h2>My Assigned Receipts</h2>
      <input
        type="text"
        placeholder="Search receipts..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
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
            <th>Location</th>
            <th>Received By</th>
            <th>Received By Position</th>
            <th>Received By Date</th>
            <th>Location</th>
            <th>Second Received By</th>
            <th>Second Received By Position</th>
            <th>Second Received By Date</th>
            <th>Location</th>
          </tr>
        </thead>
        <tbody>
          {filteredReceipts.map((receipt) => (
            <tr key={receipt.rrsp_no}>
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
              <td>{receipt.location}</td> 
              <td>{receipt.received_by}</td>
              <td>{receipt.received_by_position}</td>
              <td>{receipt.received_by_date}</td>
              <td>{receipt.location}</td> 
              <td>{receipt.second_received_by || "—"}</td>
              <td>{receipt.second_received_by_position || "—"}</td>
              <td>{receipt.second_received_by_date || "—"}</td>
              <td>{receipt.location}</td>

              {/* ✅ Show Sender (Returned By) */}
              <td>
                <strong>{receipt.returned_by}</strong> <br />
                {receipt.returned_by_position} <br />
                {receipt.returned_by_date}
              </td>

              {/* ✅ Show Receiver */}
              <td>
                <strong>{receipt.received_by}</strong> <br />
                {receipt.received_by_position} <br />
                {receipt.received_by_date}
              </td>

              {/* ✅ Show Second Receiver (If Available) */}
              <td>
                {receipt.second_received_by ? (
                  <>
                    <strong>{receipt.second_received_by}</strong> <br />
                    {receipt.second_received_by_position} <br />
                    {receipt.second_received_by_date}
                  </>
                ) : (
                  "N/A"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeReceipts;
