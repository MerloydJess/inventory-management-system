# 📋 Inventory Management System - User Manual

## Table of Contents
1. [System Overview](#system-overview)
2. [Getting Started](#getting-started)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Login & Authentication](#login--authentication)
5. [Admin Dashboard](#admin-dashboard)
6. [Product Management](#product-management)
7. [Employee Management](#employee-management)
8. [Returns Management](#returns-management)
9. [Reports & Exports](#reports--exports)
10. [User Management](#user-management)
11. [Activity Logs](#activity-logs)
12. [Troubleshooting](#troubleshooting)
13. [Technical Specifications](#technical-specifications)

---

## System Overview

### What is the Inventory Management System?
The Inventory Management System is a comprehensive desktop application built using Electron, React, and Node.js designed to help organizations track, manage, and monitor their inventory items, employee assignments, returns, and generate detailed reports.

### Key Features
- ✅ **Product/Article Management** - Add, edit, delete, and track inventory items
- ✅ **Employee Management** - Manage staff information and assignments
- ✅ **Returns Processing** - Handle item returns with detailed tracking
- ✅ **User Account Management** - Control system access and permissions
- ✅ **Report Generation** - Export data to PDF and Excel formats
- ✅ **Activity Logging** - Track all system activities for audit purposes
- ✅ **Real-time Dashboard** - View statistics and quick actions
- ✅ **Modern UI/UX** - Glassmorphism design with responsive layout

### System Architecture
- **Frontend**: React.js with modern CSS (Glassmorphism design)
- **Backend**: Node.js with Express.js
- **Database**: SQLite with WAL mode for better performance
- **Desktop App**: Electron for cross-platform compatibility
- **Authentication**: Bcrypt password hashing with JWT tokens

---

## Getting Started

### System Requirements
- **Operating System**: Windows 10/11, macOS 10.14+, or Linux
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Storage**: 500MB free disk space
- **Node.js**: Version 16 or higher (for development)

### Installation
1. **Download** the application installer from your organization's IT department
2. **Run** the installer and follow the setup wizard
3. **Launch** the application from your desktop shortcut
4. **Login** with your provided credentials

### First Time Setup
When launching for the first time, the system will:
- Create the local database
- Initialize system tables
- Create the default administrator account
- Set up logging and audit systems

---

## User Roles & Permissions

### Administrator
**Full System Access**
- ✅ All dashboard features
- ✅ Add/edit/delete products
- ✅ Manage all employees
- ✅ Process all returns
- ✅ User account management
- ✅ Generate all reports
- ✅ View activity logs
- ✅ System configuration

### Supervisor
**Limited Management Access**
- ✅ View dashboard (limited)
- ✅ Add/edit products
- ✅ View employee information
- ✅ Process returns (assigned items)
- ✅ Generate basic reports
- ❌ User management
- ❌ System logs
- ❌ Delete critical data

### Employee
**Basic Access**
- ✅ View assigned products
- ✅ Submit return requests
- ✅ View personal information
- ✅ Update contact details
- ❌ Add/edit products
- ❌ Access other user data
- ❌ Generate reports
- ❌ Administrative functions

---

## Login & Authentication

### Accessing the System
1. **Launch** the application
2. **Enter** your username and password
3. **Click** "Login" to access the system

### Default Administrator Account
- **Username**: `Administrator`
- **Password**: `password123`
- ⚠️ **Important**: Change this password immediately after first login

### Password Security
- Minimum 8 characters
- Combination of letters, numbers, and symbols recommended
- Passwords are encrypted using bcrypt hashing
- Failed login attempts are logged for security

### Forgot Password
Contact your system administrator to reset your password. The system maintains audit logs of all password changes.

---

## Admin Dashboard

### Dashboard Overview
The Admin Dashboard provides a comprehensive view of your inventory system with real-time statistics and quick actions.

### Main Components

#### Statistics Cards
- **Total Products**: Shows count of all inventory items
- **Total Employees**: Number of registered staff members
- **Total Returns**: Count of processed returns
- **System Users**: Number of active user accounts

#### Quick Actions
- **Add New Product**: Direct access to product registration
- **Manage Users**: User account management
- **Export Reports**: Generate system reports
- **View Returns**: Access returns processing

#### Recent Activity
- **Recent Products**: Last 5 items added to inventory
- **Low Stock Alert**: Items with quantity ≤ 5 units
- **System Notifications**: Important system messages

### Navigation
- **Refresh Button**: Updates all dashboard data
- **Menu Buttons**: Access different system modules
- **Logout**: Secure session termination

---

## Product Management

### Adding New Products
1. **Navigate** to Articles/Products section
2. **Click** "Add New Product" button
3. **Fill** in required information:
   - Article name/description
   - Property number
   - Unit value/cost
   - Date acquired
   - Employee assignment
   - Quantity details

### Product Information Fields
- **Article**: Product name or description
- **Property Number**: Unique identifier
- **Unit**: Measurement unit (pcs, kg, etc.)
- **Unit Value**: Cost per unit
- **Date Acquired**: Purchase/acquisition date
- **Balance per Card**: Recorded quantity
- **On Hand per Count**: Physical count
- **Total Amount**: Calculated total value
- **Assigned Employee**: Staff member responsible
- **Remarks**: Additional notes

### Editing Products
1. **Locate** the product in the list
2. **Click** the "Edit" button
3. **Modify** the necessary fields
4. **Save** changes
5. **Confirm** the update

### Product Search & Filtering
- **Search Bar**: Find products by name or property number
- **Date Range**: Filter by acquisition date
- **Employee Filter**: Show products by assigned staff
- **Status Filter**: Active, returned, or all items

### Bulk Operations
- **Export Selected**: Generate reports for specific items
- **Bulk Edit**: Update multiple items simultaneously
- **Mass Assignment**: Assign multiple items to an employee

---

## Employee Management

### Adding New Employees
1. **Go** to Employee Management section
2. **Click** "Add Employee" button
3. **Enter** employee details:
   - Full name
   - Employee ID
   - Position/job title
   - Department
   - Contact information
   - Address

### Employee Information
- **Employee ID**: Unique identifier (auto-generated)
- **Full Name**: First and last name
- **Position**: Job title or role
- **Department**: Organizational unit
- **Email**: Contact email address
- **Phone**: Contact number
- **Address**: Physical address
- **Status**: Active/Inactive

### Creating User Accounts
When adding employees, you can optionally create login accounts:
1. **Check** "Create User Account" option
2. **Select** user role (Employee/Supervisor/Admin)
3. **Set** initial password
4. **Confirm** account creation

### Employee-Product Assignment
- View all products assigned to each employee
- Reassign products between employees
- Track assignment history
- Generate employee-specific reports

### Editing Employee Information
1. **Find** the employee in the list
2. **Click** "Edit" button
3. **Update** necessary information
4. **Save** changes
5. **Verify** updates in the system

---

## Returns Management

### Return Process Overview
The returns system handles the formal process of returning inventory items, with proper documentation and approval workflow.

### Creating a Return Request
1. **Access** Returns Management
2. **Click** "Add New Return"
3. **Fill** out the return form:
   - RRSP Number
   - Return date
   - Item description
   - Quantity being returned
   - ICS Number
   - Original acquisition date
   - Item value/amount
   - End user information
   - Return reason/remarks

### Return Form Fields
- **RRSP No**: Return Receipt and Supporting Papers number
- **Date**: Date of return processing
- **Description**: Item being returned
- **Quantity**: Number of units returned
- **ICS No**: Inventory Custodian Slip number
- **Date Acquired**: Original purchase date
- **Amount**: Monetary value
- **End User**: Person returning the item
- **Remarks**: Reason for return (Damaged, Obsolete, etc.)

### Return Approval Workflow
#### Returned By Section
- **Name**: Person initiating the return
- **Position**: Job title
- **Return Date**: When item was returned
- **Location**: Where return was processed

#### Received By Section
- **Name**: First receiving officer
- **Position**: Job title
- **Receive Date**: When received
- **Location**: Receiving location

#### Second Received By Section (Optional)
- **Name**: Second approver
- **Position**: Job title
- **Receive Date**: Final approval date
- **Location**: Final processing location

### Return Status Tracking
- **Pending**: Awaiting approval
- **In Progress**: Being processed
- **Approved**: Return approved
- **Completed**: Return finalized
- **Rejected**: Return denied

### Return Reports
Generate detailed reports showing:
- All returns by date range
- Returns by employee
- Returns by reason
- Financial impact analysis

---

## Reports & Exports

### Available Report Types

#### Product Reports
- **Complete Inventory**: All products with full details
- **Products by Employee**: Items assigned to specific staff
- **Products by Date Range**: Items acquired within timeframe
- **Low Stock Report**: Items below minimum threshold
- **High Value Items**: Products above specified value

#### Return Reports
- **All Returns**: Complete returns history
- **Returns by Period**: Returns within date range
- **Returns by Reason**: Categorized by return type
- **Return Value Analysis**: Financial impact assessment

#### Employee Reports
- **Employee List**: All staff with contact information
- **Product Assignments**: Items assigned per employee
- **Employee Activity**: Staff-related transactions

### Export Formats

#### PDF Reports
- Professional formatted documents
- Includes company header and footer
- Detailed tables with proper formatting
- Suitable for official documentation
- Includes generation date and user information

#### Excel Exports
- Spreadsheet format for data analysis
- Multiple worksheets for different data types
- Formulas for automatic calculations
- Easy to modify and share
- Compatible with Microsoft Excel and LibreOffice

### Generating Reports
1. **Navigate** to Reports section
2. **Select** report type
3. **Choose** date range (if applicable)
4. **Select** filters (employee, department, etc.)
5. **Choose** export format (PDF/Excel)
6. **Click** "Generate Report"
7. **Download** or view the generated file

### Report Customization
- **Date Ranges**: Custom start and end dates
- **Employee Filters**: Specific staff members
- **Department Filters**: Organizational units
- **Status Filters**: Active, returned, all items
- **Value Ranges**: Items within price ranges

---

## User Management

### User Account Overview
User accounts control access to the system and determine what features each person can use.

### Adding New Users
1. **Access** User Management (Admin only)
2. **Click** "Add User" button
3. **Fill** user information:
   - Username
   - Password
   - Full name
   - Email address
   - Role assignment
   - Employee linkage (if applicable)

### User Roles Configuration
- **Administrator**: Full system access
- **Supervisor**: Limited management functions
- **Employee**: Basic access only

### User Information Fields
- **Username**: Unique login identifier
- **Password**: Encrypted access credential
- **Full Name**: Display name
- **Email**: Contact email
- **Role**: Permission level
- **Status**: Active/Inactive
- **Last Login**: Recent access timestamp
- **Created Date**: Account creation date

### Password Management
- **Password Requirements**: Minimum 8 characters
- **Password Reset**: Admin can reset user passwords
- **Password Change**: Users can change their own passwords
- **Password History**: System tracks password changes

### User Account Security
- **Failed Login Tracking**: Monitor login attempts
- **Session Management**: Automatic logout after inactivity
- **Access Logging**: Track user activities
- **Permission Validation**: Verify access rights

---

## Activity Logs

### Log Overview
The system maintains comprehensive logs of all user activities for audit and security purposes.

### Types of Logged Activities
- **User Login/Logout**: Authentication events
- **Product Operations**: Add, edit, delete items
- **Employee Management**: Staff record changes
- **Return Processing**: Return transactions
- **Report Generation**: Export activities
- **User Management**: Account changes
- **System Events**: Database operations

### Log Information
Each log entry contains:
- **Timestamp**: Exact date and time
- **User**: Who performed the action
- **Action Type**: What was done
- **Details**: Specific information
- **IP Address**: Source location
- **Result**: Success or failure
- **Duration**: Time taken

### Viewing Activity Logs
1. **Access** Admin Panel
2. **Navigate** to Activity Logs section
3. **Use** filters to find specific events:
   - Date range
   - User filter
   - Action type
   - Success/failure status

### Log Filtering Options
- **Date Range**: Specific time periods
- **User Filter**: Activities by specific users
- **Action Filter**: Specific types of operations
- **Status Filter**: Successful or failed operations
- **IP Filter**: Activities from specific locations

### Log Export
- Export logs to CSV for external analysis
- Include detailed information for compliance
- Filter before export for relevant data
- Maintain log history for audit purposes

---

## Troubleshooting

### Common Issues & Solutions

#### Login Problems
**Issue**: Cannot login with correct credentials
**Solutions**:
1. Verify username and password spelling
2. Check Caps Lock status
3. Contact administrator for password reset
4. Clear browser cache (if applicable)

**Issue**: "Invalid username" error
**Solutions**:
1. Confirm username with administrator
2. Check if account is active
3. Verify user account exists in system

#### Application Not Starting
**Issue**: Application won't launch
**Solutions**:
1. Check if another instance is running
2. Restart computer
3. Run as administrator
4. Check system requirements
5. Reinstall application

#### Database Connection Errors
**Issue**: "Database connection failed"
**Solutions**:
1. Ensure database file isn't locked
2. Check disk space availability
3. Verify file permissions
4. Restart application
5. Contact IT support

#### Performance Issues
**Issue**: Application running slowly
**Solutions**:
1. Close unnecessary programs
2. Check available RAM
3. Clear application cache
4. Restart application
5. Check for large report generations

#### Export/Report Issues
**Issue**: Reports fail to generate
**Solutions**:
1. Check disk space for output files
2. Verify export folder permissions
3. Try smaller date ranges
4. Check if file is open in another program
5. Restart application

### Error Messages

#### "Failed to fetch data"
- **Cause**: Network or database connectivity issue
- **Solution**: Check server connection, restart application

#### "Unauthorized access"
- **Cause**: Insufficient permissions
- **Solution**: Contact administrator for role adjustment

#### "Database is locked"
- **Cause**: Multiple access attempts or crashed session
- **Solution**: Close all instances, restart application

#### "Export failed"
- **Cause**: File permissions or disk space
- **Solution**: Check output folder, free disk space

### Getting Help
1. **Check** this user manual first
2. **Contact** your system administrator
3. **Provide** specific error messages
4. **Include** steps to reproduce the issue
5. **Note** your user role and permissions

---

## Technical Specifications

### System Architecture
- **Frontend Framework**: React.js 18+
- **Backend Framework**: Node.js with Express.js
- **Database**: SQLite with WAL mode
- **Desktop Platform**: Electron
- **Authentication**: JWT tokens with bcrypt hashing

### Database Schema

#### Tables Overview
- **products**: Inventory items and details
- **employee**: Staff information
- **users**: System login accounts
- **returns**: Return transaction records
- **activity_logs**: System activity tracking

#### Key Relationships
- Users linked to employees
- Products assigned to employees
- Returns reference products and employees
- Activity logs track all operations

### File Structure
```
Inventory-Management-System/
├── src/                     # React frontend source
│   ├── components/          # React components
│   ├── styles/             # CSS stylesheets
│   └── utils/              # Utility functions
├── server.js               # Express backend server
├── main.js                 # Electron main process
├── resources/              # Application resources
│   └── database.sqlite     # SQLite database
└── package.json           # Dependencies and scripts
```

### API Endpoints
- **Authentication**: `/login`, `/logout`
- **Products**: `/get-products/*`, `/add-product`, `/edit-product/*`
- **Employees**: `/get-employees`, `/add-employee`, `/edit-employee/*`
- **Returns**: `/api/returns/*`, `/add-return`
- **Reports**: `/export-products/*`
- **Users**: `/get-users`, `/add-user`, `/edit-user/*`
- **Logs**: `/api/logs`

### Security Features
- **Password Encryption**: Bcrypt with salt rounds
- **SQL Injection Protection**: Parameterized queries
- **Authentication Validation**: JWT token verification
- **Role-based Access Control**: Permission level checking
- **Activity Logging**: Comprehensive audit trail
- **Session Management**: Automatic timeout handling

### Performance Optimizations
- **Database WAL Mode**: Better concurrent access
- **Lazy Loading**: Components loaded on demand
- **Cached Queries**: Reduced database calls
- **Optimized Indexes**: Faster search operations
- **Compressed Assets**: Smaller application size

### Backup & Recovery
- **Database Backup**: Regular SQLite file copies
- **Configuration Backup**: Settings and preferences
- **Export Functionality**: Data extraction capabilities
- **Recovery Procedures**: Restore from backup files

### Version Information
- **Application Version**: 1.0.0
- **Database Version**: 1.0
- **API Version**: 1.0
- **Compatibility**: Windows 10+, macOS 10.14+, Linux

---

## Appendix

### Keyboard Shortcuts
- **Ctrl + R**: Refresh current view
- **Ctrl + N**: Add new item (context-dependent)
- **Ctrl + S**: Save current form
- **Ctrl + F**: Search/Filter
- **Ctrl + E**: Export current view
- **Ctrl + L**: Logout
- **F5**: Refresh application

### Default Configuration
- **Server Port**: 5000
- **Frontend Port**: 3000
- **Database**: SQLite WAL mode
- **Session Timeout**: 30 minutes
- **Max Login Attempts**: 5
- **Password Min Length**: 8 characters

### Support Contacts
- **System Administrator**: Contact your IT department
- **Technical Support**: [Your organization's IT support]
- **User Training**: [Training coordinator contact]

### Version History
- **v1.0.0**: Initial release with core functionality
- **Future Updates**: Check with administrator for updates

---

*This manual was generated for the Inventory Management System. For the latest version and updates, contact your system administrator.*

**Document Version**: 1.0  
**Last Updated**: August 2025  
**Document Type**: User Manual
