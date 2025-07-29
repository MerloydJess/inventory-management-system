const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'resources', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Add test employee
db.get("SELECT * FROM employee WHERE employee_id = 'EMP001'", [], (err, row) => {
  if (err) {
    console.error("❌ Error checking for test employee:", err.message);
    process.exit(1);
  }

  if (!row) {
    db.run(
      `INSERT INTO employee (name, position, department, email, contact_number, address, employee_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['John Doe', 'Staff', 'IT', 'john@example.com', '123456789', 'Manila', 'EMP001'],
      (err) => {
        if (err) {
          console.error("❌ Error creating test employee:", err.message);
        } else {
          console.log("✅ Test employee created (ID: EMP001)");
        }
        process.exit(0);
      }
    );
  } else {
    console.log("✅ Test employee already exists (ID: EMP001)");
    process.exit(0);
  }
});
