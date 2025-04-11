  const express = require("express");
  const sqlite3 = require("sqlite3").verbose(); // ✅ Using SQLite3
  const bodyParser = require("body-parser");
  const cors = require("cors");
  const bcrypt = require("bcryptjs");
  const path = require("path");
  const server = express();
  const PDFDocument = require("pdfkit");
  const ExcelJS = require("exceljs");
  const isPackaged = process.env.NODE_ENV === "production";

  server.use(bodyParser.json());
  server.use(cors({ origin: "http://localhost:3000" })); // Allow frontend requests
  
  // 🚀 Connect to SQLite Database (Creates file if not exists)

  const dbPath = isPackaged
  ? path.join(process.cwd(), "database.sqlite") // Use process.cwd() for packaged mode
  : path.join(__dirname, "database.sqlite"); // Use local database in development

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Error opening database:", err.message);
  } else {
    console.log(`✅ Connected to SQLite database at ${dbPath}`);
    createTables(); // ✅ Ensure tables exist
    insertSampleData(); // ✅ Add default admin if missing
  }
});
const createTables = () => {
  db.serialize(() => {
    console.log("ℹ️ Checking/Creating tables...");

    // ✅ Users Table
    db.run(
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        role TEXT CHECK(role IN ('admin', 'employee', 'supervisor')) NOT NULL,
        password TEXT NOT NULL
      )`,
      (err) => {
        if (err) console.error("❌ Error creating 'users' table:", err.message);
        else console.log("✅ 'users' table ready!");
      }
    );

    // ✅ Products Table (Now Includes `created_by`)
    db.run(
      `CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        article TEXT NOT NULL,
        description TEXT,
        date_acquired TEXT NULL,
        property_number TEXT,
        unit TEXT,
        unit_value REAL NOT NULL,
        balance_per_card INTEGER,
        on_hand_per_count INTEGER,
        total_amount REAL,
        actual_user TEXT,
        remarks TEXT,
        created_by INTEGER,  -- Stores the user who added the product
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )`,
      (err) => {
        if (err) console.error("❌ Error creating 'products' table:", err.message);
        else console.log("✅ 'products' table ready!");
      }
    );

    // ✅ Returns Table (Now Includes `created_by`)
    db.run(
      `CREATE TABLE IF NOT EXISTS returns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rrsp_no TEXT NOT NULL,
        date TEXT NOT NULL,
        description TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        ics_no TEXT NOT NULL,
        date_acquired TEXT NOT NULL,
        amount REAL NOT NULL,
        end_user TEXT NULL, -- End user removed for employees, kept for admin
        remarks TEXT,
        returned_by TEXT NOT NULL,
        returned_by_position TEXT NOT NULL,
        returned_by_date TEXT NOT NULL,
        received_by TEXT NOT NULL,
        received_by_position TEXT NOT NULL,
        received_by_date TEXT NOT NULL,
        second_received_by TEXT NULL,
        second_received_by_position TEXT NULL,
        second_received_by_date TEXT NULL,
        created_by INTEGER,  -- Stores the user who added the return
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )`,
      (err) => {
        if (err) console.error("❌ Error creating 'returns' table:", err.message);
        else console.log("✅ 'returns' table ready!");
      }
    );


      // ✅ Activity Logs Table
      db.run(`CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user TEXT,
        action TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) console.error("❌ Error creating 'activity_logs' table:", err.message);
        else console.log("✅ 'activity_logs' table ready!");
      });

      console.log("✅ All tables checked/created.");
    });
  };




  // 🚀 Insert Sample Users (If None Exist)
  const insertSampleData = async () => {
    db.get("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'", async (err, row) => {
      if (err) {
        console.error("❌ Error checking users table:", err);
        return;
      }

      if (row.count === 0) {
        console.log("ℹ️ No admin found, creating default admin...");

        // Hash the default password ("password123")
        const adminPassword = await bcrypt.hash("password123", 10);

        // Insert the default Administrator account
        db.run(
          `INSERT INTO users (name, role, password) VALUES (?, ?, ?)`,
          ["Administrator", "admin", adminPassword],
          (err) => {
            if (err) {
              console.error("❌ Error adding default admin:", err);
            } else {
              console.log("✅ Default admin account created (Username: Administrator, Password: password123)");
            }
          }
        );
      } else {
        console.log("✅ Admin account already exists.");
      }
    });
  };




  // 🚀 Register User
  server.post("/add-user", async (req, res) => {
    const { name, role, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      `INSERT INTO users (name, role, password) VALUES (?, ?, ?)`,
      [name, role, hashedPassword],
      (err) => {
        if (err) {
          console.error("❌ Error adding user:", err.message);
          return res.status(500).json({ error: "Database error", details: err.message });
        }
        res.status(200).json({ message: "✅ User added successfully" });
      }
    );
  });

  // 🚀 User Login
  server.post("/login", (req, res) => {
    const { name, password } = req.body;

    db.get(`SELECT role, password FROM users WHERE LOWER(name) = LOWER(?)`, [name], (err, user) => {
      if (err) return res.status(500).json({ error: "Database error", details: err.message });
      if (!user) return res.status(401).json({ role: null });

      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) return res.status(500).json({ error: "Error checking password" });
        res.status(200).json({ role: isMatch ? user.role : null });
      });
    });
  });

  // 🚀 Add Product
  server.post("/add-product", (req, res) => {
    const { userName, article, description, date_acquired, property_number, unit, unit_value, 
            balance_per_card, on_hand_per_count, total_amount, remarks } = req.body;

    // Automatically assign the product to the logged-in employee
    const actual_user = userName; 

    db.run(
      `INSERT INTO products (article, description, date_acquired, property_number, unit, unit_value, 
                            balance_per_card, on_hand_per_count, total_amount, actual_user, remarks) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,

      [article, description, date_acquired, property_number, unit, unit_value, 
      balance_per_card, on_hand_per_count, total_amount, actual_user, remarks],

      (err) => {
        if (err) {
          console.error("❌ Database Error:", err.message);
          return res.status(500).json({ error: "Database error", details: err.message });
        }
        res.status(200).json({ message: "✅ Product added successfully!", assignedTo: actual_user });
      }
    );
});


  //Adding of receipt
  server.post("/add-receipt", (req, res) => {
    console.log("🔍 Incoming Return Data:", req.body); // ✅ Debugging

    const {
      rrspNo, date, description, quantity, icsNo, dateAcquired, amount, endUser, remarks,
      returnedBy, returnedByPosition, returnedByDate,
      receivedBy, receivedByPosition, receivedByDate,
      secondReceivedBy = null, secondReceivedByPosition = null, secondReceivedByDate = null
    } = req.body;

    // ✅ Ensure all required fields exist
    if (!rrspNo || !date || !description || !quantity || !icsNo || !dateAcquired || !amount || !endUser ||
      !returnedBy.name || !returnedBy.position || !returnedBy.returnDate ||
      !receivedBy.name || !receivedBy.position || !receivedBy.receiveDate) {
    console.error("❌ Missing Fields:", req.body);
    return res.status(400).json({ error: "Missing required fields", details: req.body });
    }

    const sql = `INSERT INTO returns (
        rrsp_no, date, description, quantity, ics_no, date_acquired, amount, end_user, remarks, 
        returned_by, returned_by_position, returned_by_date, 
        received_by, received_by_position, received_by_date,
        second_received_by, second_received_by_position, second_received_by_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
      rrspNo, date, description, quantity, icsNo, dateAcquired, amount, endUser, remarks || null,
    returnedBy.name, returnedBy.position?.trim() || null, returnedBy.returnDate,
    receivedBy.name, receivedBy.position?.trim() || null, receivedBy.receiveDate,
    secondReceivedBy?.name?.trim() || null, secondReceivedBy?.position?.trim() || null, secondReceivedBy?.receiveDate?.trim() || null
    ];

    db.run(sql, values, function (err) {
      if (err) {
        console.error("❌ Database Error:", err.message);
        return res.status(500).json({ error: "Database error", details: err.message });
      }
      console.log("✅ Receipt Added:", { id: this.lastID });
      res.status(200).json({ message: "✅ Receipt added successfully", receiptId: this.lastID });
    });
  });

  // 🚀 Get Products for Employee
  server.get("/get-products/:user", (req, res) => {
    db.all(`SELECT * FROM products WHERE actual_user = ? ORDER BY date_acquired DESC`, [req.params.user], (err, results) => {
      if (err) {
        console.error("❌ Error fetching products:", err.message);
        return res.status(500).json({ error: "Database error", details: err.message });
      }
      res.status(200).json(results);
    });
  });

  // 🚀 Get Receipts for Employee
  server.get("/get-receipts/:endUser", (req, res) => {
    db.all(`SELECT * FROM returns WHERE end_user = ?`, [req.params.endUser], (err, results) => {
      if (err) return res.status(500).json({ error: "Database error", details: err.message });
      res.status(200).json(results);
    });
  });

  server.get("/get-users", (req, res) => {
    db.all("SELECT id, name FROM users WHERE role = 'employee'", (err, results) => {
      if (err) {
        console.error("❌ Error fetching users:", err);
        return res.status(500).json({ error: "Database error", details: err.message });
      }
      res.status(200).json(results); // ✅ Only employees are returned
    });
  });

  // 🚀 Export Products as PDF
  server.get("/export-products/pdf", (req, res) => {
    const { startDate, endDate } = req.query;
    const doc = new PDFDocument();

    res.setHeader("Content-Disposition", 'attachment; filename="products_report.pdf"');
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);
    doc.fontSize(18).text("Inventory Report", { align: "center" });
    doc.moveDown();

    let sql = "SELECT * FROM products WHERE date_acquired BETWEEN ? AND ?";
    db.all(sql, [startDate, endDate], (err, rows) => {
      if (err) {
        console.error("❌ PDF Export Error:", err);
        return res.status(500).send("Error exporting PDF");
      }

      rows.forEach((product, index) => {
        doc.fontSize(12).text(
          `${index + 1}. ${product.article} - ${product.description} (${product.unit}) - ₱${product.unit_value}`
        );
      });

      doc.end();
    });
  });

  server.delete("/delete-user/:id", (req, res) => {
    const { id } = req.params;
  
    db.run(`DELETE FROM users WHERE id = ?`, [id], function (err) {
      if (err) {
        console.error("❌ Error deleting user:", err.message);
        return res.status(500).json({ error: "Failed to delete user", details: err.message });
      }
  
      if (this.changes === 0) {
        return res.status(404).json({ error: "User not found" });
      }
  
      res.status(200).json({ message: "✅ User deleted successfully" });
    });
  });
  
  
  server.get("/export-products/excel", (req, res) => {
    const { startDate, endDate } = req.query;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Products Report");

    worksheet.columns = [
      { header: "ID", key: "id", width: 5 },
      { header: "Article", key: "article", width: 20 },
      { header: "Description", key: "description", width: 30 },
      { header: "Unit", key: "unit", width: 10 },
      { header: "Unit Value", key: "unit_value", width: 15 },
      { header: "Balance Per Card", key: "balance_per_card", width: 20 },
      { header: "On Hand", key: "on_hand_per_count", width: 15 },
      { header: "Total Amount", key: "total_amount", width: 15 },
      { header: "Actual User", key: "actual_user", width: 20 },
    ];

    let sql = "SELECT * FROM products WHERE date_acquired BETWEEN ? AND ?";
    db.all(sql, [startDate, endDate], async (err, rows) => {
      if (err) {
        console.error("❌ Excel Export Error:", err);
        return res.status(500).send("Error exporting Excel");
      }

      rows.forEach((row) => {
        worksheet.addRow(row);
      });

      res.setHeader("Content-Disposition", 'attachment; filename="products_report.xlsx"');
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

      await workbook.xlsx.write(res);
      res.end();
    });
  });

  // employee add returns
  server.post('/api/returns', (req, res) => {
    const { employee, itemName, quantity, reason, date } = req.body;
  
    if (!employee || !itemName || !quantity || !reason || !date) {
      return res.status(400).json({ error: "Missing return data." });
    }
  
    const query = `
      INSERT INTO returns (employee, itemName, quantity, reason, date)
      VALUES (?, ?, ?, ?, ?)
    `;
  
    db.run(query, [employee, itemName, quantity, reason, date], function (err) {
      if (err) {
        console.error("Error inserting return:", err);
        return res.status(500).json({ error: "Failed to submit return." });
      }
      res.status(201).json({ message: "Return submitted successfully", id: this.lastID });
    });
  });
  

  // 🚀 Get ALL articles (For Supervisor View)
  server.get("/api/products/all", (req, res) => {
    db.all("SELECT * FROM products", [], (err, rows) => {
      if (err) {
        console.error("❌ Error fetching articles:", err.message);
        return res.status(500).json({ error: "Database error", details: err.message });
      }
      console.log("✅ Supervisor Viewing Articles:", rows.length, "articles found.");
      res.status(200).json(rows);
    });
  });



  // 🚀 Get ALL receipts (For Supervisor View)
  server.get("/api/returns/all", (req, res) => {
    db.all("SELECT * FROM returns", [], (err, rows) => {
      if (err) {
        console.error("❌ Error fetching receipts:", err.message);
        return res.status(500).json({ error: "Database error", details: err.message });
      }
      console.log("✅ Supervisor Viewing Receipts:", rows.length, "receipts found.");
      res.status(200).json(rows);
    });
  });

  server.get("/api/logs", (req, res) => {
    db.all("SELECT * FROM activity_logs", [], (err, rows) => {
      if (err) {
        console.error("❌ Error fetching logs:", err.message);
        return res.status(500).json({ error: "Database error", details: err.message });
      }
      res.status(200).json(rows);
    });
  });

    
  // 🚀 Start Express Server
  server.listen(5000, () => {
    console.log("🚀 Express server running on port 5000");
  });
