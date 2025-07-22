const express = require("express");
  const sqlite3 = require("sqlite3").verbose(); // ✅ Using SQLite3
  const cors = require("cors");
  const bcrypt = require("bcryptjs");
  const path = require("path");
  const fs = require("fs");
  const server = express();
  const PDFDocument = require("pdfkit");
  const ExcelJS = require("exceljs");
  const isPackaged = require("electron-is-packaged").isPackaged || process.mainModule?.filename.indexOf('app.asar') !== -1;
  const PORT = process.env.PORT || 5000;
  const isDev = !isPackaged;
  process.env.NODE_ENV = isDev ? "development" : "production";

  // ✅ Enable CORS in development mode
  if (isDev) {
    server.use(cors({ origin: "http://localhost:3000" }));
  }

  server.use(express.json());
  
  // 🚀 Connect to SQLite Database (Creates file if not exists)

 function getDatabasePath() {
  if (isPackaged) {
    // For packaged app, use userData directory
    const { app } = require('electron');
    const userDataPath = app.getPath('userData');
    const dbDir = path.join(userDataPath, 'data');
    
    // Ensure directory exists
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    return path.join(dbDir, 'database.sqlite');
  } else {
    // For development, use local directory
    const dbDir = path.join(__dirname, "resources");
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    return path.join(dbDir, "database.sqlite");
  }
}

const dbPath = getDatabasePath();

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Error opening database:", err.message);
  } else {
    console.log(`✅ Connected to SQLite database at ${dbPath}`);
    
    createTables(() => {
      insertSampleData();
    });

  }
});

// FIND YOUR EXISTING createTables FUNCTION (around line 35-90) AND REPLACE IT WITH THIS:

const createTables = (callback) => {
  db.serialize(() => {
    console.log("ℹ️ Checking/Creating tables...");

    // First, drop existing tables if they exist
    db.run("DROP TABLE IF EXISTS returns");
    db.run("DROP TABLE IF EXISTS products");
    db.run("DROP TABLE IF EXISTS users");
    db.run("DROP TABLE IF EXISTS employee");

    // Track how many async table creations are complete
    let completed = 0;
    const total = 4; // Updated to 4 tables

    const checkDone = () => {
      completed += 1;
      if (completed === total) {
        console.log("✅ All tables checked/created.");
        // Add missing columns after all tables are created
        addMissingColumns(() => {
          if (callback) callback();
        });
      }
    };

    // Employee table
    db.run(
      `CREATE TABLE IF NOT EXISTS employee (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        position TEXT,
        department TEXT,
        email TEXT,
        contact_number TEXT,
        address TEXT,
        employee_id TEXT UNIQUE
      )`,
      (err) => {
        if (err) console.error("❌ Error creating 'employee' table:", err.message);
        else console.log("✅ 'employee' table ready!");
        checkDone();
      }
    );

    // Users table
    db.run(
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        FK_employee INTEGER,
        role TEXT CHECK(role IN ('admin', 'employee', 'supervisor')) NOT NULL,
        password TEXT NOT NULL,
        FOREIGN KEY (FK_employee) REFERENCES employee(id) ON DELETE SET NULL
      )`,
      (err) => {
        if (err) console.error("❌ Error creating 'users' table:", err.message);
        else console.log("✅ 'users' table ready!");
        checkDone();
      }
    );

    // Products table
    db.run(
      `CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        article TEXT NOT NULL,
        description TEXT,
        date_acquired TEXT,
        property_number TEXT,
        unit TEXT,
        unit_value REAL NOT NULL,
        balance_per_card INTEGER,
        on_hand_per_count INTEGER,
        total_amount REAL,
        FK_employee INTEGER,
        remarks TEXT,
        FOREIGN KEY (FK_employee) REFERENCES employee(id) ON DELETE SET NULL
      )`,
      (err) => {
        if (err) console.error("❌ Error creating 'products' table:", err.message);
        else console.log("✅ 'products' table ready!");
        checkDone();
      }
    );

    // Returns table with all columns
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
        end_user TEXT,
        remarks TEXT,
        returned_by TEXT NOT NULL,
        returned_by_position TEXT NOT NULL,
        returned_by_date TEXT NOT NULL,
        returned_by_location TEXT,
        received_by TEXT NOT NULL,
        received_by_position TEXT NOT NULL,
        received_by_date TEXT NOT NULL,
        received_by_location TEXT,
        second_received_by TEXT,
        second_received_by_position TEXT,
        second_received_by_date TEXT,
        second_received_by_location TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )`,
      (err) => {
        if (err) console.error("❌ Error creating 'returns' table:", err.message);
        else console.log("✅ 'returns' table ready!");
        checkDone();
      }
    );
  });
};

// ADD THIS NEW FUNCTION RIGHT AFTER createTables:
function addMissingColumns(callback) {
  const columnsToAdd = [
    { table: "returns", column: "returned_by_location", type: "TEXT" },
    { table: "returns", column: "received_by_location", type: "TEXT" },
    { table: "returns", column: "second_received_by_location", type: "TEXT" },
    { table: "returns", column: "created_by", type: "INTEGER REFERENCES users(id)" },
    { table: "employee", column: "employee_id", type: "TEXT UNIQUE" }
  ];

  let completed = 0;
  const total = columnsToAdd.length;

  const checkDone = () => {
    completed += 1;
    if (completed === total) {
      console.log("✅ All missing columns checked/added.");
      if (callback) callback();
    }
  };

  columnsToAdd.forEach(({ table, column, type }) => {
    db.all(`PRAGMA table_info(${table})`, (err, columns) => {
      if (err) {
        console.error(`❌ Error fetching columns for ${table}:`, err.message);
        checkDone();
        return;
      }

      const exists = columns.some(col => col.name === column);
      if (!exists) {
        db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`, (err) => {
          if (err) {
            console.error(`❌ Error adding column ${column} to ${table}:`, err.message);
          } else {
            console.log(`✅ Added column ${column} to ${table}`);
          }
          checkDone();
        });
      } else {
        console.log(`✅ Column ${column} already exists in ${table}`);
        checkDone();
      }
    });
  });
}

// 🚀 User Login
server.post("/login", (req, res) => {
  const { name, password, employeeId } = req.body;

  // Employee login with employee ID only
  if (employeeId) {
    db.get(
      `SELECT e.*, u.role
       FROM employee e
       LEFT JOIN users u ON u.FK_employee = e.id
       WHERE e.employee_id = ?`,
      [employeeId],
      (err, employee) => {
        if (err) return res.status(500).json({ error: "Database error", details: err.message });
        if (!employee) return res.status(401).json({ error: "Invalid Employee ID" });
        
        res.status(200).json({
          role: "employee",
          employeeId: employeeId,
          name: employee.name,
          position: employee.position
        });
      }
    );
    return;
  }

  // Administrator/Supervisor login with username
  db.get(
    `SELECT role, password FROM users WHERE LOWER(name) = LOWER(?)`,
    [name],
    (err, user) => {
      if (err) return res.status(500).json({ error: "Database error", details: err.message });
      if (!user) return res.status(401).json({ error: "Invalid username" });

      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) return res.status(500).json({ error: "Error checking password" });
        if (!isMatch) return res.status(401).json({ error: "Invalid password" });
        res.status(200).json({ role: user.role, name: name });
      });
    }
  );
});
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
    const { name, role, password, FK_employee, employeeData } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    function insertUser(empId) {
      db.run(
        `INSERT INTO users (name, role, password, FK_employee) VALUES (?, ?, ?, ?)`,
        [name, role, hashedPassword, empId],
        function (err) {
          if (err) {
            console.error("❌ Error adding user:", err.message);
            return res.status(500).json({ error: "Database error", details: err.message });
          }
          res.status(200).json({ message: "✅ User added successfully" });
        }
      );
    }

    if (FK_employee) {
      // Employee selected from dropdown
      insertUser(FK_employee);
    } else if (employeeData && employeeData.name) {
      // Auto-create employee if not found
      db.run(
        `INSERT INTO employee (name, position, department, email, contact_number, address) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          employeeData.name,
          employeeData.position || "",
          employeeData.department || "",
          employeeData.email || "",
          employeeData.contact_number || "",
          employeeData.address || ""
        ],
        function (err) {
          if (err) {
            console.error("❌ Error creating employee:", err.message);
            return res.status(500).json({ error: "Database error", details: err.message });
          }
          insertUser(this.lastID);
        }
      );
    } else {
      return res.status(400).json({ error: "No employee selected or provided." });
    }
  });

  // 🚀 Add Product
server.post("/add-product", (req, res) => {
  const {
    article,
    description,
    date_acquired,
    property_number,
    unit,
    unit_value,
    balance_per_card,
    on_hand_per_count,
    total_amount,
    remarks,
    FK_employee
  } = req.body;

  if (!article || !unit_value || !FK_employee) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  db.run(
    `INSERT INTO products (
      article, description, date_acquired, property_number, unit, unit_value, 
      balance_per_card, on_hand_per_count, total_amount, FK_employee, remarks
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      article,
      description,
      date_acquired,
      property_number,
      unit,
      unit_value,
      balance_per_card,
      on_hand_per_count,
      total_amount,
      FK_employee,
      remarks,
    ],
    function (err) {
      if (err) {
        console.error("❌ Database Error:", err.message);
        return res.status(500).json({ error: "Database error", details: err.message });
      }
      res.status(200).json({ message: "✅ Product added successfully!", productId: this.lastID });
    }
  );
});

// 🚀 Add Receipt (Return)
server.post("/add-receipt", (req, res) => {
  const {
    rrspNo, date, description, quantity, icsNo, dateAcquired, amount, endUser, remarks,
    returnedBy,
    receivedBy,
    secondReceivedBy = {},
    created_by // <-- user id of the submitter (employee/admin)
  } = req.body;

  // ✅ Validate required fields
  if (
    !rrspNo || !date || !description || !quantity || !icsNo || !dateAcquired || !amount || !endUser ||
    !returnedBy.name || !returnedBy.position || !returnedBy.returnDate || !returnedBy.location ||
    !receivedBy.name || !receivedBy.position || !receivedBy.receiveDate || !receivedBy.location
  ) {
    console.error("❌ Missing Fields:", req.body);
    return res.status(400).json({ error: "Missing required fields", details: req.body });
  }

  const sql = `
    INSERT INTO returns (
      rrsp_no, date, description, quantity, ics_no, date_acquired, amount, end_user, remarks,
      returned_by, returned_by_position, returned_by_date, returned_by_location,
      received_by, received_by_position, received_by_date, received_by_location,
      second_received_by, second_received_by_position, second_received_by_date, second_received_by_location,
      created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    rrspNo, date, description, quantity, icsNo, dateAcquired, amount, endUser, remarks || null,
    returnedBy.name, returnedBy.position?.trim() || null, returnedBy.returnDate, returnedBy.location,
    receivedBy.name, receivedBy.position?.trim() || null, receivedBy.receiveDate, receivedBy.location,
    secondReceivedBy?.name?.trim() || null, secondReceivedBy?.position?.trim() || null,
    secondReceivedBy?.receiveDate?.trim() || null, secondReceivedBy?.location || null,
    created_by // <-- user id
  ];

  db.run(sql, values, function (err) {
    if (err) {
      console.error("❌ Database Error:", err.message);
      return res.status(500).json({ error: "Database error", details: err.message });
    }
    res.status(200).json({ message: "✅ Receipt added successfully", receiptId: this.lastID });
  });
});


  // 🚀 Get Products for Employee
  server.get("/get-products/:user", (req, res) => {
    const userName = req.params.user;
    db.get("SELECT id FROM employee WHERE name = ?", [userName], (err, emp) => {
      if (err || !emp) {
        return res.status(404).json({ error: "Employee not found" });
      }
      db.all(
        "SELECT * FROM products WHERE FK_employee = ? ORDER BY date_acquired DESC",
        [emp.id],
        (err, results) => {
          if (err) {
            console.error("❌ Error fetching products:", err.message);
            return res.status(500).json({ error: "Database error", details: err.message });
          }
          res.status(200).json(results);
        }
      );
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
    { header: "Actual User", key: "employee_name", width: 20 }, // changed key
  ];

  // Join with employee table
  let sql = `
    SELECT products.*, employee.name AS employee_name
    FROM products
    LEFT JOIN employee ON products.FK_employee = employee.id
    WHERE date_acquired BETWEEN ? AND ?
  `;
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

  
  // Serve React build for all other requests
  const buildPath = isPackaged
  ? path.join(process.resourcesPath, "build")  // ✅ correct in packaged
  : path.join(__dirname, "build");

  server.get("/ping", (_, res) => res.send("pong"))
  server.use(express.static(buildPath));
  server.get("*", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
  });

    
  // 🚀 Start Express Server
  server.listen(PORT, () => {
    console.log(`🚀 Express server running on port ${PORT}`);
  });

// 🚀 Add Employee
server.post("/add-employee", (req, res) => {
  const { name, position, department, email, contact_number, address } = req.body;
  db.serialize(() => {
    db.run(
      `INSERT INTO employee (name, position, department, email, contact_number, address) VALUES (?, ?, ?, ?, ?, ?)`,
      [name, position, department, email, contact_number, address],
      function (err) {
        if (err) {
          console.error("❌ Error adding employee:", err.message);
          return res.status(500).json({ error: "Database error", details: err.message });
        }
        const employeeId = this.lastID;
        
        // Generate an employee ID (e.g., EMP001)
        const paddedId = String(employeeId).padStart(3, '0');
        const generatedEmployeeId = `EMP${paddedId}`;
        
        // Update the employee record with the generated ID
        db.run(
          `UPDATE employee SET employee_id = ? WHERE id = ?`,
          [generatedEmployeeId, employeeId],
          (updateErr) => {
            if (updateErr) {
              console.error("❌ Error updating employee ID:", updateErr.message);
              return res.status(500).json({ error: "Database error", details: updateErr.message });
            }
            res.status(200).json({
              message: "✅ Employee added successfully",
              id: employeeId,
              employee_id: generatedEmployeeId
            });
          }
        );
      }
    );
  });
});

// Get all employees
server.get("/get-employees", (req, res) => {
  db.all("SELECT * FROM employee", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Edit employee
server.put("/edit-employee/:id", (req, res) => {
  const { name, position, department, email, contact_number, address } = req.body;
  db.run(
    `UPDATE employee SET name=?, position=?, department=?, email=?, contact_number=?, address=? WHERE id=?`,
    [name, position, department, email, contact_number, address, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Employee updated" });
    }
  );
});

// Delete employee
server.delete("/delete-employee/:id", (req, res) => {
  db.run(`DELETE FROM employee WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Employee deleted" });
  });
});

// 🚀 Get Products by Employee
server.get("/get-products-by-employee/:employeeId", (req, res) => {
  db.all(
    `SELECT * FROM products WHERE FK_employee = ? ORDER BY date_acquired DESC`,
    [req.params.employeeId],
    (err, results) => {
      if (err) {
        console.error("❌ Error fetching products:", err.message);
        return res.status(500).json({ error: "Database error", details: err.message });
      }
      res.status(200).json(results);
    }
  );
});

// 🚀 Get Returns by Employee
server.get("/get-returns-by-employee/:employeeId", (req, res) => {
  db.all(
    `SELECT * FROM returns WHERE created_by = ? ORDER BY date DESC`,
    [req.params.employeeId],
    (err, results) => {
      if (err) {
        console.error("❌ Error fetching returns:", err.message);
        return res.status(500).json({ error: "Database error", details: err.message });
      }
      res.status(200).json(results);
    }
  );
});

// 🚀 Edit Product (Article)
server.put("/edit-product/:id", (req, res) => {
  const {
    article,
    description,
    date_acquired,
    property_number,
    unit,
    unit_value,
    balance_per_card,
    on_hand_per_count,
    total_amount,
    remarks,
    FK_employee // optional: allow changing assigned employee
  } = req.body;

  db.run(
    `UPDATE products SET
      article = ?,
      description = ?,
      date_acquired = ?,
      property_number = ?,
      unit = ?,
      unit_value = ?,
      balance_per_card = ?,
      on_hand_per_count = ?,
      total_amount = ?,
      remarks = ?,
      FK_employee = ?
    WHERE id = ?`,
    [
      article,
      description,
      date_acquired,
      property_number,
      unit,
      unit_value,
      balance_per_card,
      on_hand_per_count,
      total_amount,
      remarks,
      FK_employee,
      req.params.id
    ],
    function (err) {
      if (err) {
        console.error("❌ Error updating product:", err.message);
        return res.status(500).json({ error: "Database error", details: err.message });
      }
      res.status(200).json({ message: "✅ Product updated successfully" });
    }
  );
});

// 🚀 Edit Return
server.put("/edit-return/:id", (req, res) => {
  const {
    rrsp_no, date, description, quantity, ics_no, date_acquired, amount, end_user, remarks,
    returned_by, returned_by_position, returned_by_date, returned_by_location,
    received_by, received_by_position, received_by_date, received_by_location,
    second_received_by, second_received_by_position, second_received_by_date, second_received_by_location,
    created_by
  } = req.body;

  db.run(
    `UPDATE returns SET
      rrsp_no = ?, date = ?, description = ?, quantity = ?, ics_no = ?, date_acquired = ?, amount = ?, end_user = ?, remarks = ?,
      returned_by = ?, returned_by_position = ?, returned_by_date = ?, returned_by_location = ?,
      received_by = ?, received_by_position = ?, received_by_date = ?, received_by_location = ?,
      second_received_by = ?, second_received_by_position = ?, second_received_by_date = ?, second_received_by_location = ?,
      created_by = ?
    WHERE id = ?`,
    [
      rrsp_no, date, description, quantity, ics_no, date_acquired, amount, end_user, remarks,
      returned_by, returned_by_position, returned_by_date, returned_by_location,
      received_by, received_by_position, received_by_date, received_by_location,
      second_received_by, second_received_by_position, second_received_by_date, second_received_by_location,
      created_by,
      req.params.id
    ],
    function (err) {
      if (err) {
        console.error("❌ Error updating return:", err.message);
        return res.status(500).json({ error: "Database error", details: err.message });
      }
      res.status(200).json({ message: "✅ Return updated successfully" });
    }
  );
});

// 🚀 Edit User
server.put("/edit-user/:id", (req, res) => {
  const { name, role } = req.body;
  db.run(
    `UPDATE users SET name = ?, role = ? WHERE id = ?`,
    [name, role, req.params.id],
    function (err) {
      if (err) {
        console.error("❌ Error updating user:", err.message);
        return res.status(500).json({ error: "Database error", details: err.message });
      }
      res.status(200).json({ message: "✅ User updated successfully" });
    }
  );
});




