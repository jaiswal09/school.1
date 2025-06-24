# SchoolSync - Intelligent Resource Management System

## 📋 Table of Contents
1. [Overview](#overview)
2. [User Roles & Privileges](#user-roles--privileges)
3. [Core Functionalities](#core-functionalities)
4. [Setup Instructions](#setup-instructions)
5. [Database Schema](#database-schema)
6. [API Documentation](#api-documentation)
7. [Troubleshooting](#troubleshooting)

## 🎯 Overview

SchoolSync is a comprehensive school inventory and resource management system built with React, TypeScript, Tailwind CSS, and Supabase. It provides real-time tracking, intelligent analytics, and streamlined workflows for educational institutions.

### Key Features
- **Inventory Management**: Track items, quantities, locations, and maintenance
- **Resource Scheduling**: Book rooms, labs, and equipment
- **Transaction System**: Check-in/out items with due date tracking
- **User Management**: Role-based access control
- **Analytics & Reports**: Real-time insights and predictive analytics
- **QR Code Integration**: Quick item identification and management
- **Stripe Integration**: Payment processing for premium features

## 👥 User Roles & Privileges

### 🔴 Admin
**Full System Access**
- ✅ Manage all users (create, edit, delete, change roles)
- ✅ Full inventory management (add, edit, delete items)
- ✅ Manage categories and resources
- ✅ View all transactions and reservations
- ✅ Access all reports and analytics
- ✅ System settings and configuration
- ✅ Approve/reject reservations
- ✅ Schedule maintenance

### 🟡 Staff
**Operational Management**
- ✅ Manage inventory items (add, edit, delete)
- ✅ Manage categories and resources
- ✅ View all transactions and reservations
- ✅ Access reports and analytics
- ✅ Approve/reject reservations
- ✅ Schedule maintenance
- ❌ Cannot manage users or change roles
- ❌ Cannot access system settings

### 🟢 Teacher
**Educational Resource Access**
- ✅ View all inventory items
- ✅ Check out/return items
- ✅ Make resource reservations
- ✅ View own transaction history
- ✅ Update own profile
- ❌ Cannot manage inventory
- ❌ Cannot approve reservations
- ❌ Limited report access

### 🔵 Student
**Basic Access**
- ✅ View available inventory items
- ✅ Check out/return items (with restrictions)
- ✅ Make resource reservations
- ✅ View own transaction history
- ✅ Update own profile
- ❌ Cannot manage inventory
- ❌ Cannot approve reservations
- ❌ Limited report access

## 🚀 Core Functionalities

### 📦 Inventory Management
- **Item Tracking**: Name, description, type, quantity, location
- **Categories**: Organize items by type (equipment, supplies, textbooks, etc.)
- **Stock Levels**: Minimum quantity alerts and low stock notifications
- **QR Codes**: Auto-generated for quick item identification
- **Maintenance**: Schedule and track maintenance activities
- **Status Tracking**: Available, in-use, maintenance, lost, expired

### 🏢 Resource Management
- **Resource Types**: Rooms, labs, equipment, devices
- **Scheduling**: Time-based reservations with conflict detection
- **Approval Workflow**: Pending → Approved/Rejected → Completed
- **Availability**: Real-time status tracking

### 🔄 Transaction System
- **Check-out/Check-in**: Track item borrowing and returns
- **Due Dates**: Expected return date tracking
- **Overdue Management**: Automatic overdue detection
- **Quantity Tracking**: Partial returns supported
- **Notes**: Additional information for transactions

### 📊 Analytics & Reports
- **Real-time Dashboards**: Key metrics and KPIs
- **Transaction Analytics**: Usage patterns and trends
- **Predictive Analytics**: Future demand forecasting
- **Low Stock Alerts**: Automated inventory warnings
- **Usage Reports**: Detailed activity reports

### 🔐 Security Features
- **Row Level Security (RLS)**: Database-level access control
- **Role-based Permissions**: Granular access control
- **Authentication**: Secure login with Supabase Auth
- **Data Validation**: Input sanitization and validation

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Git installed
- A Supabase account
- VS Code (recommended)

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd school-inventory-management
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Environment Setup
1. Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

2. Get your Supabase credentials:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Go to Settings → API
   - Copy the Project URL and anon public key

### Step 4: Database Setup
1. In your Supabase dashboard, go to SQL Editor
2. Run each migration file in order from `supabase/migrations/`
3. The migrations will create all necessary tables and security policies

### Step 5: Create Admin User
1. Start the development server:
```bash
npm run dev
```

2. Register a new account at `/register`
3. In Supabase dashboard, go to Table Editor → users
4. Find your user and change the role to 'admin'

### Step 6: Stripe Setup (Optional)
1. Create a Stripe account
2. Get your API keys from Stripe dashboard
3. Add to Supabase Edge Functions environment variables
4. Deploy the Stripe webhook and checkout functions

## 📊 Database Schema

### Core Tables

#### Users
```sql
users (
  id: uuid PRIMARY KEY,
  email: text UNIQUE,
  full_name: text,
  role: text, -- admin, staff, teacher, student
  department: text,
  created_at: timestamp
)
```

#### Items
```sql
items (
  id: uuid PRIMARY KEY,
  name: text,
  description: text,
  type: text, -- equipment, supply, textbook, digital, furniture, other
  quantity: integer,
  min_quantity: integer,
  location: text,
  category_id: uuid REFERENCES categories(id),
  status: text, -- available, in_use, maintenance, lost, expired
  cost: decimal,
  supplier: text,
  qr_code: text,
  created_at: timestamp,
  updated_at: timestamp
)
```

#### Transactions
```sql
transactions (
  id: uuid PRIMARY KEY,
  item_id: uuid REFERENCES items(id),
  user_id: uuid REFERENCES users(id),
  quantity: integer,
  checkout_date: timestamp,
  expected_return_date: timestamp,
  actual_return_date: timestamp,
  status: text, -- checked_out, returned, overdue, lost
  notes: text,
  created_at: timestamp
)
```

#### Resources
```sql
resources (
  id: uuid PRIMARY KEY,
  name: text,
  description: text,
  type: text, -- room, lab, equipment, device, other
  location: text,
  status: text, -- available, in_use, maintenance, unavailable
  created_at: timestamp
)
```

#### Reservations
```sql
reservations (
  id: uuid PRIMARY KEY,
  resource_id: uuid REFERENCES resources(id),
  user_id: uuid REFERENCES users(id),
  start_time: timestamp,
  end_time: timestamp,
  purpose: text,
  status: text, -- pending, approved, rejected, cancelled, completed
  created_at: timestamp
)
```

## 🔧 VS Code Setup for Beginners

### Step 1: Install VS Code
1. Download from [code.visualstudio.com](https://code.visualstudio.com)
2. Install with default settings

### Step 2: Install Required Extensions
1. Open VS Code
2. Click Extensions icon (Ctrl+Shift+X)
3. Install these extensions:
   - **ES7+ React/Redux/React-Native snippets**
   - **TypeScript Importer**
   - **Tailwind CSS IntelliSense**
   - **Auto Rename Tag**
   - **Bracket Pair Colorizer**
   - **GitLens**
   - **Prettier - Code formatter**

### Step 3: Configure VS Code Settings
1. Press Ctrl+Shift+P
2. Type "Preferences: Open Settings (JSON)"
3. Add these settings:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

### Step 4: Open Project
1. File → Open Folder
2. Select the cloned project folder
3. VS Code will automatically detect it's a Node.js project

### Step 5: Terminal Setup
1. View → Terminal (Ctrl+`)
2. Run commands in the integrated terminal

## 🐛 Troubleshooting

### Common Issues

#### 1. RLS Policy Errors
**Problem**: "Row Level Security policy violation"
**Solution**: 
- Check user role in database
- Verify RLS policies are correctly applied
- Ensure user is authenticated

#### 2. Environment Variables
**Problem**: "Supabase client not configured"
**Solution**:
- Verify `.env` file exists and has correct values
- Restart development server after changes
- Check environment variable names match exactly

#### 3. Database Connection
**Problem**: "Failed to connect to database"
**Solution**:
- Verify Supabase URL and key are correct
- Check internet connection
- Ensure Supabase project is active

#### 4. Stripe Integration
**Problem**: "Failed to create checkout session"
**Solution**:
- Verify Stripe keys are configured
- Check Edge Functions are deployed
- Ensure webhook endpoints are correct

#### 5. Build Errors
**Problem**: TypeScript compilation errors
**Solution**:
- Run `npm install` to ensure all dependencies
- Check for missing type definitions
- Verify import paths are correct

### Getting Help

1. **Check Console**: Browser DevTools → Console for errors
2. **Check Network**: DevTools → Network for API failures
3. **Check Supabase Logs**: Dashboard → Logs for database errors
4. **Check Documentation**: Refer to this README and setup guide

## 📝 Development Guidelines

### Code Structure
```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── hooks/         # Custom React hooks
├── contexts/      # React contexts
├── lib/           # Utilities and configurations
├── types/         # TypeScript type definitions
└── styles/        # Global styles
```

### Best Practices
1. **Components**: Keep components small and focused
2. **Hooks**: Use custom hooks for data fetching
3. **Types**: Define TypeScript interfaces for all data
4. **Security**: Always validate user permissions
5. **Performance**: Use React.memo for expensive components

### Adding New Features
1. Create database migration if needed
2. Update TypeScript types
3. Implement RLS policies
4. Create/update hooks for data access
5. Build UI components
6. Add proper error handling
7. Test with different user roles

## 📄 License

MIT License - See LICENSE file for details.

---

**Need Help?** Check the troubleshooting section or contact the development team.
