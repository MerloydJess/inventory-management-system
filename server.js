  require("dotenv").config();
  const express = require("express");
  const sqlite3 = require("sqlite3").verbose(); // ✅ Using SQLite3
  const cors = require("cors");
  const bcrypt = require("bcryptjs");
  const path = require("path");
  const fs = require("fs");
  
  // Simple in-memory cache implementation
  const cache = {
    data: new Map(),
    timeout: new Map(),
    
    set: function(key, value, ttl = 60000) { // Default TTL: 60 seconds
      if (this.timeout.has(key)) {
        clearTimeout(this.timeout.get(key));
      }
      
      this.data.set(key, value);
      this.timeout.set(key, setTimeout(() => {
        this.data.delete(key);
        this.timeout.delete(key);
      }, ttl));
    },
    
    get: function(key) {
      return this.data.get(key);
    },
    
    has: function(key) {
      return this.data.has(key);
    },
    
    invalidate: function(pattern) {
      for (let key of this.data.keys()) {
        if (key.includes(pattern)) {
          this.data.delete(key);
          if (this.timeout.has(key)) {
            clearTimeout(this.timeout.get(key));
            this.timeout.delete(key);
          }
        }
      }
    }
  };
  
  // Cache middleware
  const cacheMiddleware = (ttl) => (req, res, next) => {
    const key = `${req.method}:${req.url}`;
    
    if (req.method === 'GET' && cache.has(key)) {
      return res.json(cache.get(key));
    }
    
    const originalJson = res.json;
    res.json = function(data) {
      if (req.method === 'GET') {
        cache.set(key, data, ttl);
      }
      originalJson.call(this, data);
    };
    
    next();
  };
  const server = express();
  const PDFDocument = require("pdfkit");
  const ExcelJS = require("exceljs");
  const isPackaged = require("electron-is-packaged").isPackaged || process.mainModule?.filename.indexOf('app.asar') !== -1;
  const PORT = process.env.PORT || 5000;
  const isDev = process.env.NODE_ENV !== "production";
  process.env.NODE_ENV = isDev ? "development" : "production";
  

  // Logging middleware
  const logRequest = (req, res, next) => {
    const start = Date.now();
    const requestId = Math.random().toString(36).substring(7);
    
    // Log request
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      requestId,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('user-agent')
    }));

    // Log response
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        requestId,
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`
      }));
    });

    next();
  };

  // Audit logging middleware for sensitive operations
  const auditLog = (action) => (req, res, next) => {
    const originalSend = res.json;
    res.json = function(data) {
      db.run(
        `INSERT INTO activity_logs (action, user_id, details) VALUES (?, ?, ?)`,
        [
          action,
          req.user?.id || null,
          JSON.stringify({
            method: req.method,
            url: req.url,
            body: req.body,
            result: data
          })
        ]
      );
      originalSend.call(this, data);
    };
    next();
  };

  // ✅ Enable CORS and configure limits
  server.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  
  // Add logging middleware
  server.use(logRequest);
  
  // Configure express limits for larger requests
  server.use(express.json({limit: '50mb'}));
  server.use(express.urlencoded({limit: '50mb', extended: true}));
  
  // 🚀 Connect to SQLite Database (Creates file if not exists)

function getDatabasePath() {
  if (isDev) {
    const devDir = path.join(__dirname, "resources");
    if (!fs.existsSync(devDir)) fs.mkdirSync(devDir, { recursive: true });
    return path.join(devDir, "database.sqlite");
  } else {
    const prodDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(prodDir)) fs.mkdirSync(prodDir, { recursive: true });
    return path.join(prodDir, "database.sqlite");
  }
}

const dbPath = getDatabasePath();
// Enable WAL mode for better concurrency
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error("❌ Error opening database:", err.message);
    process.exit(1);
  }
  
  // Enable WAL mode and foreign keys
  db.serialize(() => {
    db.run("PRAGMA journal_mode = WAL");
    db.run("PRAGMA foreign_keys = ON");
    db.run("PRAGMA busy_timeout = 6000");
    console.log(`✅ Connected to database at ${dbPath}`);
    
    // Initialize database and start server after database is ready
    createTables(() => {
      insertSampleData();
      
      // Start Express Server after database is ready
      const serverPort = isDev ? 5000 : PORT;
      server.listen(serverPort, () => {
        console.log(`🚀 Express server running on port ${serverPort}`);
      });
    });
  });
});

// Helper function for running queries in a transaction
const runInTransaction = async (queries) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      
      try {
        queries.forEach(query => {
          if (Array.isArray(query.params)) {
            db.run(query.sql, query.params);
          } else {
            db.run(query.sql);
          }
        });
        
        db.run("COMMIT", (err) => {
          if (err) {
            console.error("❌ Transaction failed:", err);
            db.run("ROLLBACK");
            reject(err);
          } else {
            resolve();
          }
        });
      } catch (err) {
        console.error("❌ Transaction error:", err);
        db.run("ROLLBACK");
        reject(err);
      }
    });
  });
};
  
// API Routes and other middleware configurations follow here...

// API Routes
server.get('/get-products/all', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  const sortBy = req.query.sortBy || 'date_acquired';
  const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';
  const offset = (page - 1) * limit;

  try {
    // Get total count with search
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM products 
      WHERE article LIKE ? OR description LIKE ?
    `;
    const searchParam = `%${search}%`;
    
    db.get(countQuery, [searchParam, searchParam], (countErr, { total }) => {
      if (countErr) {
        console.error("❌ Error counting products:", countErr);
        return res.status(500).json({ error: "Database error", details: countErr.message });
      }

      // Get paginated and filtered results
      const query = `
        SELECT p.*, e.name as employee_name
        FROM products p
        LEFT JOIN employee e ON p.FK_employee = e.id
        WHERE p.article LIKE ? OR p.description LIKE ?
        ORDER BY p.${sortBy} ${sortOrder}
        LIMIT ? OFFSET ?
      `;

      db.all(query, [searchParam, searchParam, limit, offset], (err, products) => {
        if (err) {
          console.error("❌ Error fetching products:", err);
          return res.status(500).json({ error: "Database error", details: err.message });
        }

        // Send paginated response
        res.json({
          total,
          page,
          totalPages: Math.ceil(total / limit),
          products: products || [],
          hasMore: offset + products.length < total
        });
      });
    });
  } catch (err) {
    console.error("❌ Error in get-products:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

server.get('/get-employees', (req, res) => {
  console.log("🔍 Fetching all employees");
  db.all(`
    SELECT e.*, 
           COALESCE(u.role, 'employee') as role
    FROM employee e
    LEFT JOIN users u ON e.id = u.FK_employee
    ORDER BY e.name ASC`, 
    [], 
    (err, rows) => {
      if (err) {
        console.error("❌ Error fetching employees:", err);
        res.status(500).json({ error: err.message });
        return;
      }
      console.log(`✅ Found ${rows.length} employees`);
      res.json(rows || []);
    });
});

server.get('/get-users', (req, res) => {
  db.all('SELECT * FROM users', [], (err, rows) => {
    if (err) {
      console.error("❌ Error fetching users:", err);
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows || []);
  });
});

// Employee Login endpoint
server.post('/employee-login', (req, res) => {
  const { employeeId } = req.body;
  if (!employeeId) {
    return res.status(400).json({ error: "Employee ID is required" });
  }

  db.get(
    `SELECT e.*, u.role 
     FROM employee e 
     LEFT JOIN users u ON e.id = u.FK_employee 
     WHERE e.employee_id = ?`,
    [employeeId],
    (err, employee) => {
      if (err) {
        console.error("❌ Error during employee login:", err);
        return res.status(500).json({ error: "Database error" });
      }
      
      if (!employee) {
        return res.status(401).json({ error: "Invalid Employee ID" });
      }

      // If no user account exists for this employee, create one
      if (!employee.role) {
        const createUserQuery = `
          INSERT INTO users (name, role, password, FK_employee)
          VALUES (?, 'employee', '', ?)
        `;
        
        db.run(createUserQuery, [employee.name, employee.id], function(err) {
          if (err) {
            console.error("❌ Error creating user account for employee:", err);
            return res.status(500).json({ error: "Error creating user account" });
          }
          
          // Successfully created user account
          res.json({
            role: "employee",
            name: employee.name,
            employeeId: employee.employee_id
          });
        });
      } else {
        // User account already exists
        res.json({
          role: "employee",
          name: employee.name,
          employeeId: employee.employee_id
        });
      }
    }
  );
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
    const total = 5; // Updated to 5 tables (including activity_logs)

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

    // Activity Logs table
    db.run(
      `CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        user_id INTEGER,
        details TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )`,
      (err) => {
        if (err) console.error("❌ Error creating 'activity_logs' table:", err.message);
        else console.log("✅ 'activity_logs' table ready!");
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

  function checkDone() {
    completed += 1;
    if (completed === total) {
      console.log("✅ All missing columns checked/added.");
      // Add test employee after columns are added
      addTestEmployee(() => {
        if (callback) callback();
      });
    }
  }

  // Process each column
  columnsToAdd.forEach(({ table, column, type }) => {
    db.get(
      `SELECT COUNT(*) as count FROM pragma_table_info('${table}') WHERE name='${column}'`,
      [],
      (err, result) => {
        if (err) {
          console.error(`❌ Error checking column ${column}:`, err.message);
          checkDone();
          return;
        }

        if (result.count === 0) {
          db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`, (err) => {
            if (err) {
              console.error(`❌ Error adding column ${column}:`, err.message);
            } else {
              console.log(`✅ Added ${column} to ${table}`);
            }
            checkDone();
          });
        } else {
          console.log(`✅ Column ${column} already exists in ${table}`);
          checkDone();
        }
      }
    );
  });
}

// Function to add test employee
function addTestEmployee(callback) {
  db.get("SELECT * FROM employee WHERE employee_id = 'EMP001'", [], (err, row) => {
    if (err) {
      console.error("❌ Error checking for test employee:", err.message);
      if (callback) callback();
      return;
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
          if (callback) callback();
        }
      );
    } else {
      if (callback) callback();
    }
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
    try {
      const { name, role, password, FK_employee, employeeData } = req.body;
      
      if (!name || !role || !password) {
        return res.status(400).json({ error: "Name, role, and password are required" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // For supervisor/admin users, we don't need employee data
      if (role === 'supervisor' || role === 'admin') {
        db.run(
          `INSERT INTO users (name, role, password) VALUES (?, ?, ?)`,
          [name, role, hashedPassword],
          function (err) {
            if (err) {
              console.error("❌ Error adding supervisor/admin:", err.message);
              return res.status(500).json({ error: "Database error", details: err.message });
            }
            res.status(200).json({ 
              message: "✅ User added successfully",
              userId: this.lastID 
            });
          }
        );
        return;
      }

      // For employee users
      if (FK_employee) {
        db.run(
          `INSERT INTO users (name, role, password, FK_employee) VALUES (?, ?, ?, ?)`,
          [name, role, hashedPassword, FK_employee],
          function (err) {
            if (err) {
              console.error("❌ Error adding user:", err.message);
              return res.status(500).json({ error: "Database error", details: err.message });
            }
            res.status(200).json({ 
              message: "✅ User added successfully",
              userId: this.lastID 
            });
          }
        );
      } else if (employeeData && employeeData.name) {
        // Create new employee first
        db.run(
          `INSERT INTO employee (name, position, department, email, contact_number, address) 
           VALUES (?, ?, ?, ?, ?, ?)`,
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
            
            // Then create user account
            const empId = this.lastID;
            db.run(
              `INSERT INTO users (name, role, password, FK_employee) VALUES (?, ?, ?, ?)`,
              [name, role, hashedPassword, empId],
              function (err) {
                if (err) {
                  console.error("❌ Error adding user:", err.message);
                  return res.status(500).json({ error: "Database error", details: err.message });
                }
                res.status(200).json({ 
                  message: "✅ User and employee added successfully",
                  userId: this.lastID,
                  employeeId: empId
                });
              }
            );
          }
        );
      } else {
        return res.status(400).json({ error: "No employee selected or provided" });
      }
    } catch (err) {
      console.error("❌ Error in add-user:", err);
      res.status(500).json({ error: "Server error", details: err.message });
    }
  });

  // 🚀 Add Product
server.post("/add-product", auditLog('add_product'), async (req, res) => {
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
    userName // we'll use userName instead of actual_user
  } = req.body;

  // Use userName as actual_user if actual_user is not provided
  const actual_user = req.body.actual_user || userName;

  // Log the received data for debugging
  console.log("📦 Received product data:", req.body);

  // Validate required fields
  const missingFields = [];
  if (!article) missingFields.push("Article name");
  if (!unit_value) missingFields.push("Unit value");
  if (!actual_user && !userName) missingFields.push("User information");

  if (missingFields.length > 0) {
    const errorMessage = `Missing required fields: ${missingFields.join(", ")}`;
    console.error("❌", errorMessage);
    return res.status(400).json({ error: errorMessage });
  }

  // Log the validated data
  console.log("📦 Validated product data:", {
    ...req.body,
    actual_user: actual_user
  });

  // Validate numeric fields
  if (isNaN(parseFloat(unit_value))) {
    return res.status(400).json({ error: "Unit value must be a valid number" });
  }

  // First get the employee ID for the actual user
  console.log("🔍 Looking up employee by name:", actual_user);
  db.get(
    "SELECT id, name FROM employee WHERE name = ?",
    [actual_user],
    (err, employee) => {
      if (err) {
        console.error("❌ Error finding employee:", err.message);
        return res.status(500).json({ error: "Database error", details: err.message });
      }
      if (!employee) {
        console.error("❌ Employee not found for name:", actual_user);
        return res.status(400).json({ error: "Actual user (employee) not found" });
      }
      console.log("✅ Found employee:", employee);

      // Convert string values to numbers
      const numericUnitValue = parseFloat(unit_value);
      const numericBalancePerCard = parseInt(balance_per_card) || 0;
      const numericOnHandPerCount = parseInt(on_hand_per_count) || 0;
      const numericTotalAmount = parseFloat(total_amount) || (numericUnitValue * numericBalancePerCard);

      // Now insert the product with the found employee ID
      console.log("📝 Inserting product with employee ID:", employee.id);
      db.run(
        `INSERT INTO products (
          article, description, date_acquired, property_number, unit, unit_value, 
          balance_per_card, on_hand_per_count, total_amount, FK_employee, remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          article,
          description || null,
          date_acquired || null,
          property_number || null,
          unit || null,
          numericUnitValue,
          numericBalancePerCard,
          numericOnHandPerCount,
          numericTotalAmount,
          employee.id,
          remarks || null,
        ],
        function (err) {
          if (err) {
            console.error("❌ Database Error:", err.message);
            return res.status(500).json({ error: "Database error", details: err.message });
          }

          // Invalidate relevant caches
          cache.invalidate('get-products');
          cache.invalidate('products/all');
          cache.invalidate('api/products');
          
          // Return success with the new product ID and details
          res.status(200).json({ 
            message: "✅ Product added successfully!",
            product: {
              id: this.lastID,
              article,
              description,
              date_acquired: date_acquired || new Date().toISOString().split('T')[0],
              property_number,
              unit,
              unit_value: numericUnitValue,
              balance_per_card: numericBalancePerCard,
              on_hand_per_count: numericOnHandPerCount,
              total_amount: numericTotalAmount,
              FK_employee: employee.id,
              employee_name: actual_user,  // Changed to match the expected field name
              remarks
            }
          });
        }
      );
    }
  );
});

// 🚀 Add Receipt (Return)
server.post("/add-receipt", (req, res) => {
  const {
    rrspNo, date, description, quantity, icsNo, dateAcquired, amount, endUser, remarks,
    returnedBy,
    receivedBy,
    secondReceivedBy = {}
  } = req.body;

  // Get the employee ID directly
  db.get(
    `SELECT e.id 
     FROM employee e 
     WHERE e.name = ?`,
    [endUser],
    (err, employee) => {
      if (err) {
        console.error("❌ Error finding employee:", err.message);
        return res.status(500).json({ error: "Database error", details: err.message });
      }
      if (!employee) {
        return res.status(400).json({ error: "Employee not found" });
      }

      // Log the received data for debugging
      console.log("📝 Received return data:", {
        rrspNo, date, description, quantity, icsNo, dateAcquired, 
        amount, endUser, returnedBy, receivedBy
      });

      // ✅ Validate required fields
      const missingFields = [];
      if (!rrspNo) missingFields.push("RRSP Number");
      if (!date) missingFields.push("Date");
      if (!description) missingFields.push("Description");
      if (!quantity) missingFields.push("Quantity");
      if (!icsNo) missingFields.push("ICS Number");
      if (!dateAcquired) missingFields.push("Date Acquired");
      if (!amount) missingFields.push("Amount");
      if (!endUser) missingFields.push("End User");
      if (!returnedBy?.name) missingFields.push("Returned By Name");
      if (!returnedBy?.position) missingFields.push("Returned By Position");
      if (!returnedBy?.returnDate) missingFields.push("Return Date");
      if (!returnedBy?.location) missingFields.push("Return Location");
      if (!receivedBy?.name) missingFields.push("Received By Name");
      if (!receivedBy?.position) missingFields.push("Received By Position");
      if (!receivedBy?.receiveDate) missingFields.push("Receive Date");
      if (!receivedBy?.location) missingFields.push("Receive Location");

  if (missingFields.length > 0) {
    console.error("❌ Missing Fields:", missingFields);
    return res.status(400).json({ 
      error: "Missing required fields", 
      details: `Missing: ${missingFields.join(", ")}` 
    });
  }

      const sql = `
        INSERT INTO returns (
          rrsp_no, date, description, quantity, ics_no, date_acquired, amount, end_user, remarks,
          returned_by, returned_by_position, returned_by_date, returned_by_location,
          received_by, received_by_position, received_by_date, received_by_location,
          second_received_by, second_received_by_position, second_received_by_date, second_received_by_location
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      // Ensure all locations are properly formatted or null
      const returnedLocation = returnedBy.location?.trim() || null;
      const receivedLocation = receivedBy.location?.trim() || null;
      const secondReceivedLocation = secondReceivedBy?.location?.trim() || null;

      // Validate that locations are not just single characters
      if (returnedLocation && returnedLocation.length < 2) {
        return res.status(400).json({ 
          error: "Invalid location", 
          details: "Returned By Location must be at least 2 characters long" 
        });
      }
      if (receivedLocation && receivedLocation.length < 2) {
        return res.status(400).json({ 
          error: "Invalid location", 
          details: "Received By Location must be at least 2 characters long" 
        });
      }
      if (secondReceivedLocation && secondReceivedLocation.length < 2) {
        return res.status(400).json({ 
          error: "Invalid location", 
          details: "Second Received By Location must be at least 2 characters long" 
        });
      }

      const values = [
        rrspNo, date, description, quantity, icsNo, dateAcquired, amount, endUser, remarks || null,
        returnedBy.name, returnedBy.position?.trim() || null, returnedBy.returnDate, returnedLocation,
        receivedBy.name, receivedBy.position?.trim() || null, receivedBy.receiveDate, receivedLocation,
        secondReceivedBy?.name?.trim() || null, secondReceivedBy?.position?.trim() || null,
        secondReceivedBy?.receiveDate?.trim() || null, secondReceivedLocation
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
  server.get("/get-products/:user", async (req, res) => {
    const userName = decodeURIComponent(req.params.user);
    console.log("🔍 Fetching products for user:", userName);
    
    try {
      // Clear any cached data to ensure fresh results
      cache.invalidate('get-products');
      cache.invalidate('products');
      
      // First verify if the employee exists and get their ID
      db.get(
        `SELECT e.id, e.name, e.position, e.department, e.employee_id
         FROM employee e 
         WHERE e.name = ? OR e.employee_id = ?`, 
        [userName, userName], 
        async (err, emp) => {
          if (err) {
            console.error("❌ Error finding employee:", err.message);
            return res.status(500).json({ error: "Database error", details: err.message });
          }
          if (!emp) {
            console.error("❌ Employee not found:", userName);
            return res.status(404).json({ error: "Employee not found" });
          }
          
          console.log("📊 Employee found:", emp);
          
          // Get all products for this employee with full details
          const query = `
            SELECT 
              p.*,
              e.name as employee_name,
              e.employee_id,
              e.position as employee_position,
              e.department as employee_department
            FROM products p 
            LEFT JOIN employee e ON p.FK_employee = e.id 
            WHERE p.FK_employee = ? 
            ORDER BY p.date_acquired DESC NULLS LAST, p.id DESC`;
          
          db.all(query, [emp.id], (err, results) => {
            if (err) {
              console.error("❌ Error fetching products:", err.message);
              return res.status(500).json({ error: "Database error", details: err.message });
            }

            // Ensure results is an array
            const resultsArray = Array.isArray(results) ? results : [];

            // Process the results to ensure all fields are properly formatted
            const processedResults = resultsArray.map(row => ({
              ...row,
              date_acquired: row.date_acquired || null,
              property_number: row.property_number || '',
              unit: row.unit || '',
              balance_per_card: row.balance_per_card || 0,
              on_hand_per_count: row.on_hand_per_count || 0,
              total_amount: row.total_amount || (row.unit_value * (row.balance_per_card || 0)),
              remarks: row.remarks || '',
              employee_name: row.employee_name || '',
              employee_id: row.employee_id || emp.employee_id || '',
              employee_position: row.employee_position || emp.position || '',
              employee_department: row.employee_department || emp.department || ''
            }));

            console.log(`✅ Found ${processedResults.length} products for user ${userName} (Employee ID: ${emp.id})`);
            if (processedResults.length === 0) {
              console.log("ℹ️ No products found for this employee");
            }
            res.status(200).json({ products: processedResults }); // Return as an object with products array
          });
      });
    } catch (error) {
      console.error("❌ Error in get-products:", error);
      res.status(500).json({ error: "Server error", details: error.message });
    }
  });
  });

  // 🚀 Get Receipts for Employee
  server.get("/get-receipts/:endUser", (req, res) => {
    const endUser = decodeURIComponent(req.params.endUser);
    console.log("🔍 Fetching receipts for user:", endUser);
    
    if (!endUser) {
      console.error("❌ No endUser provided");
      return res.status(400).json({ error: "End user is required" });
    }

    db.all(
      `SELECT r.*,
              c.name as creator_name,
              c.position as creator_position,
              c.department as creator_department,
              e.name as employee_name,
              e.position as employee_position,
              e.department as employee_department
       FROM returns r 
       LEFT JOIN users u ON r.created_by = u.id
       LEFT JOIN employee c ON u.FK_employee = c.id
       LEFT JOIN employee e ON e.name = r.end_user
       WHERE r.end_user = ? 
       ORDER BY r.date DESC, r.id DESC`,
      [req.params.endUser],
      (err, results) => {
        if (err) {
          console.error("❌ Database error fetching receipts:", err);
          return res.status(500).json({ error: "Database error", details: err.message });
        }
        console.log(`✅ Found ${results.length} receipts for user ${req.params.endUser}`);
        res.status(200).json(results);
      }
    );
  });

  server.get("/get-users", (req, res) => {
    db.all("SELECT id, name, role FROM users WHERE role != 'employee'", (err, results) => {
      if (err) {
        console.error("❌ Error fetching users:", err);
        return res.status(500).json({ error: "Database error", details: err.message });
      }
      res.status(200).json(results); // ✅ Only admin and supervisor users are returned
    });
  });

  // 🚀 Export Products as PDF
  server.get("/export-products/pdf", (req, res) => {
  const { startDate, endDate, includeReturns } = req.query;
  const doc = new PDFDocument();
  
  const filename = includeReturns === 'true' ? 'inventory_and_returns_report.pdf' : 'inventory_report.pdf';
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/pdf');
  doc.pipe(res);

  // Products section
  doc.fontSize(20).text('Inventory Report', { align: 'center' });
  doc.moveDown();

  const productsSql = `
    SELECT products.*, employee.name AS employee_name
    FROM products
    LEFT JOIN employee ON products.FK_employee = employee.id
    WHERE date_acquired BETWEEN ? AND ?
  `;

  db.all(productsSql, [startDate, endDate], (err, products) => {
    if (err) {
      console.error("Error fetching products:", err);
      return res.status(500).send("Error generating report");
    }

    // Add products table
    if (products.length > 0) {
      // Add table headers
      const productsTable = {
        title: "Products",
        headers: ['Article', 'Description', 'Unit', 'Value', 'Balance', 'On Hand', 'User'],
        rows: products.map(p => [
          p.article,
          p.description,
          p.unit,
          `₱${Number(p.unit_value).toLocaleString()}`,
          p.balance_per_card,
          p.on_hand_per_count,
          p.employee_name
        ])
      };

      doc.table(productsTable, {
        prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
        prepareRow: () => doc.font('Helvetica').fontSize(10)
      });
    }

    // If includeReturns is true, add returns section
    if (includeReturns === 'true') {
      const returnsSql = `
        SELECT r.*, e.name as employee_name
        FROM returns r
        LEFT JOIN employee e ON r.end_user = e.name
        WHERE r.date BETWEEN ? AND ?
      `;

      db.all(returnsSql, [startDate, endDate], (returnErr, returns) => {
        if (returnErr) {
          console.error("Error fetching returns:", returnErr);
          doc.end();
          return;
        }

        if (returns.length > 0) {
          doc.addPage();
          doc.fontSize(20).text('Returns Report', { align: 'center' });
          doc.moveDown();

          const returnsTable = {
            title: "Returns",
            headers: ['RRSP No', 'Date', 'Description', 'Quantity', 'Amount', 'End User'],
            rows: returns.map(r => [
              r.rrsp_no,
              new Date(r.date).toLocaleDateString(),
              r.description,
              r.quantity,
              `₱${Number(r.amount).toLocaleString()}`,
              r.employee_name
            ])
          };

          doc.table(returnsTable, {
            prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
            prepareRow: () => doc.font('Helvetica').fontSize(10)
          });
        }
        doc.end();
      });
    } else {
      doc.end();
    }
  });
});
  
  
 server.get("/export-products/excel", (req, res) => {
  const { startDate, endDate, includeReturns } = req.query;
  const workbook = new ExcelJS.Workbook();
  
  // Products worksheet
  const productsSheet = workbook.addWorksheet("Products Report");
  productsSheet.columns = [
    { header: "ID", key: "id", width: 5 },
    { header: "Article", key: "article", width: 20 },
    { header: "Description", key: "description", width: 30 },
    { header: "Unit", key: "unit", width: 10 },
    { header: "Unit Value", key: "unit_value", width: 15 },
    { header: "Balance Per Card", key: "balance_per_card", width: 20 },
    { header: "On Hand", key: "on_hand_per_count", width: 15 },
    { header: "Total Amount", key: "total_amount", width: 15 },
    { header: "Actual User", key: "employee_name", width: 20 }
  ];

  // Products query
  const productsSql = `
    SELECT products.*, employee.name AS employee_name
    FROM products
    LEFT JOIN employee ON products.FK_employee = employee.id
    WHERE date_acquired BETWEEN ? AND ?
  `;

  // Execute products query
  db.all(productsSql, [startDate, endDate], (err, products) => {
    if (err) {
      console.error("Error fetching products:", err);
      return res.status(500).send("Error generating report");
    }

    // Add products data
    productsSheet.addRows(products);

    // If includeReturns is true, add returns worksheet
    if (includeReturns === 'true') {
      const returnsSheet = workbook.addWorksheet("Returns Report");
      returnsSheet.columns = [
        { header: "RRSP No", key: "rrsp_no", width: 15 },
        { header: "Date", key: "date", width: 12 },
        { header: "Description", key: "description", width: 30 },
        { header: "Quantity", key: "quantity", width: 10 },
        { header: "Amount", key: "amount", width: 15 },
        { header: "End User", key: "end_user", width: 20 },
        { header: "Returned By", key: "returned_by", width: 20 },
        { header: "Received By", key: "received_by", width: 20 }
      ];

      // Returns query
      const returnsSql = `
        SELECT r.*, e.name as employee_name
        FROM returns r
        LEFT JOIN employee e ON r.end_user = e.name
        WHERE r.date BETWEEN ? AND ?
      `;

      // Execute returns query
      db.all(returnsSql, [startDate, endDate], (returnErr, returns) => {
        if (returnErr) {
          console.error("Error fetching returns:", returnErr);
          return res.status(500).send("Error generating report");
        }

        // Add returns data
        returnsSheet.addRows(returns);

        // Send the workbook
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=inventory_and_returns_report.xlsx');
        
        workbook.xlsx.write(res)
          .then(() => {
            res.end();
          })
          .catch(err => {
            console.error("Error writing excel:", err);
            res.status(500).send("Error generating excel file");
          });
      });
    } else {
      // Send only products workbook
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=inventory_report.xlsx');
      
      workbook.xlsx.write(res)
        .then(() => {
          res.end();
        })
        .catch(err => {
          console.error("Error writing excel:", err);
          res.status(500).send("Error generating excel file");
        });
    }
  });
});
  
  
  
    // 🚀 Get ALL articles (For Supervisor View)
    server.get("/api/products/all", async (req, res) => {
    console.log("🔍 Fetching all products for supervisor view");
    
    try {
      // First clear any cached data to ensure fresh results
      cache.invalidate('products');
      cache.invalidate('get-products');
      cache.invalidate('api/products');

      const query = `
        SELECT 
          p.*,
          e.name as employee_name,
          e.employee_id,
          e.position as employee_position,
          e.department as employee_department,
          e.email as employee_email,
          e.contact_number as employee_contact,
          e.address as employee_address,
          COALESCE(e.name, '') as actual_user
        FROM products p
        LEFT JOIN employee e ON p.FK_employee = e.id
        ORDER BY p.date_acquired DESC NULLS LAST, p.id DESC`;
      
      db.all(query, [], (err, rows) => {
        if (err) {
          console.error("❌ Error fetching articles:", err.message);
          return res.status(500).json({ error: "Database error", details: err.message });
        }

        // Process the rows to ensure all fields are properly formatted
        const processedRows = rows.map(row => ({
          ...row,
          date_acquired: row.date_acquired || null,
          property_number: row.property_number || '',
          unit: row.unit || '',
          balance_per_card: row.balance_per_card || 0,
          on_hand_per_count: row.on_hand_per_count || 0,
          total_amount: row.total_amount || 0,
          remarks: row.remarks || '',
          employee_name: row.employee_name || '',
          employee_id: row.employee_id || '',
          employee_position: row.employee_position || '',
          employee_department: row.employee_department || '',
          employee_email: row.employee_email || '',
          employee_contact: row.employee_contact || '',
          employee_address: row.employee_address || ''
        }));

        console.log(`✅ Found ${processedRows.length} articles`);
        res.status(200).json(processedRows);
      });
    } catch (error) {
      console.error("❌ Error in /api/products/all:", error);
      res.status(500).json({ error: "Server error", details: error.message });
    }
  });



  // 🚀 Get ALL receipts (For Supervisor View)
  server.get("/api/returns/all", (req, res) => {
    console.log("🔍 Fetching all returns for supervisor view");
    const query = `
      SELECT 
        r.*,
        e.name as creator_name,
        e.position as creator_position,
        e.department as creator_department,
        e.employee_id as creator_employee_id,
        e.email as creator_email,
        e.contact_number as creator_contact,
        e.address as creator_address,
        eu.name as end_user_name,
        eu.position as end_user_position,
        eu.department as end_user_department,
        eu.employee_id as end_user_employee_id,
        eu.email as end_user_email,
        eu.contact_number as end_user_contact,
        eu.address as end_user_address
      FROM returns r
      LEFT JOIN users u ON r.created_by = u.id
      LEFT JOIN employee e ON u.FK_employee = e.id
      LEFT JOIN employee eu ON r.end_user = eu.name
      ORDER BY r.date DESC, r.id DESC`;
    
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error("❌ Error fetching receipts:", err.message);
        return res.status(500).json({ error: "Database error", details: err.message });
      }
      console.log("✅ Supervisor Viewing Receipts:", rows.length, "receipts found.");
      
      // Map rows to ensure location fields are properly set
      const processedRows = rows.map(row => ({
        ...row,
        returned_by_location: row.returned_by_location || '',
        received_by_location: row.received_by_location || '',
        second_received_by_location: row.second_received_by_location || ''
      }));
      
      // Clear any cached data to ensure fresh results
      cache.invalidate('returns');
      res.status(200).json(processedRows);
    });
  });

  server.get("/api/logs", (req, res) => {
    db.all(
      `SELECT al.*, u.name as user_name, u.role as user_role
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.timestamp DESC`,
      [],
      (err, rows) => {
        if (err) {
          console.error("❌ Error fetching logs:", err.message);
          return res.status(500).json({ error: "Database error", details: err.message });
        }
        res.status(200).json(rows || []);
      }
    );
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

// Get all employees for dropdowns (no pagination)
server.get("/get-all-employees", (req, res) => {
  db.all(
    `SELECT e.*, COALESCE(u.role, 'employee') as role
     FROM employee e
     LEFT JOIN users u ON e.id = u.FK_employee
     ORDER BY e.name ASC`,
    [],
    (err, rows) => {
      if (err) {
        console.error("❌ Error fetching all employees:", err.message);
        return res.status(500).json({ error: "Database error", details: err.message });
      }
      res.json(rows || []);
    }
  );
});

// Get all employees with proper error handling and pagination
server.get("/get-employees", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  db.all(
    "SELECT COUNT(*) as total FROM employee",
    [],
    (countErr, [{ total }]) => {
      if (countErr) {
        console.error("❌ Error counting employees:", countErr.message);
        return res.status(500).json({ error: "Database error", details: countErr.message });
      }

      db.all(
        "SELECT * FROM employee LIMIT ? OFFSET ?",
        [limit, offset],
        (err, rows) => {
          if (err) {
            console.error("❌ Error fetching employees:", err.message);
            return res.status(500).json({ error: "Database error", details: err.message });
          }
          res.json({
            total,
            page,
            totalPages: Math.ceil(total / limit),
            employees: rows || []
          });
        }
      );
    }
  );
});

// Get employee profile by name
server.get("/get-employee-profile/:name", (req, res) => {
  const employeeName = decodeURIComponent(req.params.name);
  console.log("🔍 Fetching profile for employee:", employeeName);
  
  db.get(
    `SELECT e.*, u.role, u.id as user_id
     FROM employee e
     LEFT JOIN users u ON e.id = u.FK_employee
     WHERE e.name = ?`,
    [employeeName],
    (err, employee) => {
      if (err) {
        console.error("❌ Error fetching employee profile:", err.message);
        return res.status(500).json({ error: "Database error", details: err.message });
      }
      if (!employee) {
        console.error("❌ Employee not found:", employeeName);
        return res.status(404).json({ error: "Employee not found" });
      }
      console.log("✅ Found employee profile:", employee);
      res.json(employee);
    }
  );
});

// Edit employee profile
server.put("/edit-employee-profile/:id", (req, res) => {
  const { id } = req.params;
  const { 
    name, 
    position, 
    department, 
    email, 
    contact_number, 
    address 
  } = req.body;

  console.log("📝 Updating employee profile:", { id, ...req.body });

  // Validate required fields
  if (!name || !position || !department) {
    return res.status(400).json({ 
      error: "Missing required fields",
      details: "Name, position, and department are required"
    });
  }

  // Email format validation
  if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return res.status(400).json({ 
      error: "Invalid email format"
    });
  }

  db.serialize(() => {
    // First update the employee table
    db.run(
      `UPDATE employee 
       SET name = ?, 
           position = ?, 
           department = ?, 
           email = ?, 
           contact_number = ?, 
           address = ?
       WHERE id = ?`,
      [name, position, department, email, contact_number, address, id],
      function(err) {
        if (err) {
          console.error("❌ Error updating employee:", err.message);
          return res.status(500).json({ error: "Failed to update employee", details: err.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: "Employee not found" });
        }

        // Then update the associated user record if it exists
        db.run(
          `UPDATE users 
           SET name = ? 
           WHERE FK_employee = ?`,
          [name, id],
          function(err) {
            if (err) {
              console.error("❌ Error updating associated user:", err.message);
              // Don't return error here as the employee update was successful
            }
            
            // Return the updated profile
            db.get(
              `SELECT e.*, u.role 
               FROM employee e
               LEFT JOIN users u ON e.id = u.FK_employee
               WHERE e.id = ?`,
              [id],
              (err, updated) => {
                if (err) {
                  console.error("❌ Error fetching updated profile:", err.message);
                  return res.status(200).json({ 
                    message: "Profile updated but unable to fetch updated data"
                  });
                }
                console.log("✅ Employee profile updated successfully");
                res.json({ 
                  message: "Employee profile updated successfully",
                  profile: updated
                });
              }
            );
          }
        );
      }
    );
  });
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

// 🚀 Edit Product (Article) - Admin version
server.put("/admin/edit-product/:id", (req, res) => {
  console.log("📝 Admin editing product:", req.params.id, req.body);

  // Add admin-specific validation
  if (!req.body.adminNote) {
    console.log("ℹ️ No admin note provided");
  }
  
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
    actual_user // use actual_user instead of FK_employee for better clarity
  } = req.body;

  // Validate required fields
  const missingFields = [];
  if (!article) missingFields.push("Article name");
  if (!unit_value) missingFields.push("Unit value");
  
  if (missingFields.length > 0) {
    return res.status(400).json({ 
      error: "Missing required fields", 
      details: missingFields.join(", ") 
    });
  }

  // Validate numeric fields and convert to numbers
  const numericUnitValue = parseFloat(unit_value);
  if (isNaN(numericUnitValue)) {
    return res.status(400).json({ error: "Unit value must be a valid number" });
  }
  
  const numericBalancePerCard = balance_per_card ? parseInt(balance_per_card) : 0;
  if (balance_per_card && isNaN(numericBalancePerCard)) {
    return res.status(400).json({ error: "Balance per card must be a valid number" });
  }
  
  const numericOnHandPerCount = on_hand_per_count ? parseInt(on_hand_per_count) : 0;
  if (on_hand_per_count && isNaN(numericOnHandPerCount)) {
    return res.status(400).json({ error: "On hand per count must be a valid number" });
  }
  
  const numericTotalAmount = total_amount ? parseFloat(total_amount) : (numericUnitValue * numericBalancePerCard);
  if (total_amount && isNaN(numericTotalAmount)) {
    return res.status(400).json({ error: "Total amount must be a valid number" });
  }

  // Validate date format
  if (date_acquired && !date_acquired.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return res.status(400).json({ error: "Date acquired must be in YYYY-MM-DD format" });
  }

  // Function to update the product
  const updateProduct = (employeeId) => {
    console.log("✏️ Updating product with employeeId:", employeeId);
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
        description || null,
        date_acquired || null,
        property_number || null,
        unit || null,
        numericUnitValue,
        numericBalancePerCard,
        numericOnHandPerCount,
        numericTotalAmount,
        remarks || null,
        employeeId,
        req.params.id
      ],
      function(err) {
        if (err) {
          console.error("❌ Error updating product:", err.message);
          return res.status(500).json({ error: "Database error", details: err.message });
        }

        // Invalidate relevant caches
        cache.invalidate('get-products');
        cache.invalidate('products/all');
        cache.invalidate('api/products');

        res.status(200).json({ 
          message: "✅ Product updated successfully",
          product: {
            id: req.params.id,
            article,
            description,
            date_acquired,
            property_number,
            unit,
            unit_value: numericUnitValue,
            balance_per_card: numericBalancePerCard,
            on_hand_per_count: numericOnHandPerCount,
            total_amount: numericTotalAmount,
            remarks,
            FK_employee: employeeId
          }
        });
      }
    );
  };

  // If actual_user is provided, look up the employee ID
  if (actual_user) {
    db.get(
      "SELECT id FROM employee WHERE name = ?",
      [actual_user],
      (err, employee) => {
        if (err) {
          console.error("❌ Error finding employee:", err.message);
          return res.status(500).json({ error: "Database error", details: err.message });
        }
        if (!employee) {
          return res.status(400).json({ error: "Employee not found" });
        }
        updateProduct(employee.id);
      }
    );
  } else {
    // If no actual_user provided, use the product's current employee
    db.get(
      "SELECT FK_employee FROM products WHERE id = ?",
      [req.params.id],
      (err, product) => {
        if (err) {
          console.error("❌ Error getting current product:", err.message);
          return res.status(500).json({ error: "Database error", details: err.message });
        }
        updateProduct(product ? product.FK_employee : null);
      }
    );
  }
});

// 🚀 Edit Return - Admin version
server.put("/admin/edit-return/:id", (req, res) => {
  console.log("📝 Admin editing return:", req.params.id);
  
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
      
      // Add admin audit log
      const auditLog = {
        action: "admin_edit_return",
        returnId: req.params.id,
        timestamp: new Date().toISOString()
      };
      
      console.log("📝 Admin audit log:", auditLog);
      res.status(200).json({ 
        message: "✅ Return updated successfully by admin",
        auditLog
      });
    }
  );
});

  // 🚀 Edit User
server.put("/edit-user/:id", (req, res) => {
  const { name, role, employee_id } = req.body;
  
  // If updating an employee's profile
  if (employee_id) {
    db.run(
      `UPDATE employee SET 
       name = ?,
       position = ?,
       department = ?,
       email = ?,
       contact_number = ?,
       address = ?
       WHERE employee_id = ?`,
      [
        req.body.name,
        req.body.position,
        req.body.department,
        req.body.email,
        req.body.contact_number,
        req.body.address,
        employee_id
      ],
      function(err) {
        if (err) {
          console.error("❌ Error updating employee profile:", err.message);
          return res.status(500).json({ error: "Database error", details: err.message });
        }
        
        // Also update the associated user record if it exists
        db.run(
          `UPDATE users SET name = ?
           WHERE FK_employee = (SELECT id FROM employee WHERE employee_id = ?)`,
          [name, employee_id],
          function(err) {
            if (err) {
              console.error("❌ Error updating user record:", err.message);
              return res.status(500).json({ error: "Database error", details: err.message });
            }
            res.status(200).json({ message: "✅ Profile updated successfully" });
          }
        );
      }
    );
  } else {
    // For admin/supervisor updates
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
  }
});
