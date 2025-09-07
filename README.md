# 🚀 Telecom Device Management System

A comprehensive web application for managing telecom devices, locations, utilization logs, and system alerts. Built with React, TypeScript, PostgreSQL, and Express.js.

## ✨ Features

### 📊 Dashboard
- Real-time statistics and metrics
- Device utilization charts
- Recent alerts overview
- System health monitoring

### 🔧 Device Management
- Add, edit, and delete devices
- Device status tracking (Active, Inactive, Maintenance, Decommissioned)
- Serial number and model management
- Purchase date tracking

### 📍 Location Management
- Manage physical locations
- Address and city information
- Device-location relationships

### 📈 Utilization Logs
- Track device usage hours
- Date-based logging
- Interactive charts with tooltips
- Device-specific utilization tracking

### 🚨 Alert System
- System alerts and notifications
- Alert severity levels (High, Medium, Low, Critical)
- Alert status management

### 👥 User Management
- Role-based access control
- Admin, Manager, and Technician roles
- User authentication and authorization

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **React Router** - Navigation
- **React Hot Toast** - Notifications

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **pg** - PostgreSQL client

### Development Tools
- **ESLint** - Code linting
- **TypeScript** - Type checking
- **Vite HMR** - Hot module replacement

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (v16 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn** package manager

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd device-management-system
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup

#### PostgreSQL Configuration
Make sure PostgreSQL is running on your system with the following details:
- **Host**: localhost
- **Port**: 5432
- **Database**: telecom_device_management
- **Username**: postgres
- **Password**: 111111

#### Create Database
```sql
CREATE DATABASE telecom_device_management;
```

#### Initialize Database Schema
The database schema will be automatically created when you start the backend server for the first time.

### 4. Environment Variables
Create a `.env` file in the root directory (optional - defaults are provided):
```env
VITE_DEMO_ADMIN_EMAIL=admin@telecom.demo
VITE_DEMO_ADMIN_PASSWORD=demo123
```

### 5. Start the Application

#### Start Backend Server
```bash
node server.cjs
```
The backend will run on `http://localhost:3001`

#### Start Frontend Development Server
```bash
npm run dev
```
The frontend will run on `http://localhost:5173`

## 📁 Project Structure

```
device-management-system/
├── src/
│   ├── components/
│   │   ├── auth/           # Authentication components
│   │   ├── dashboard/      # Dashboard components
│   │   ├── layout/         # Layout components
│   │   └── ui/             # Reusable UI components
│   ├── contexts/           # React contexts
│   ├── lib/                # Utility libraries
│   ├── pages/              # Page components
│   └── types/              # TypeScript type definitions
├── server.cjs              # Backend Express server
├── package.json
└── README.md
```

## 🗄️ Database Schema

### Tables

#### Users
- `id` (UUID, Primary Key)
- `email` (String, Unique)
- `role` (Enum: admin, manager, technician)
- `created_at` (Timestamp)

#### Devices
- `id` (UUID, Primary Key)
- `device_name` (String)
- `type` (String: router, switch, server, etc.)
- `status` (String: Active, Inactive, Maintenance, Decommissioned)
- `serial_number` (String, Unique)
- `model` (String)
- `purchase_date` (Date)
- `location_id` (UUID, Foreign Key)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

#### Locations
- `id` (UUID, Primary Key)
- `location_name` (String)
- `address` (String)
- `city` (String)
- `country` (String)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

#### Utilization Logs
- `id` (UUID, Primary Key)
- `device_id` (UUID, Foreign Key)
- `hours_used` (Integer)
- `date` (Date)
- `notes` (Text)
- `logged_by` (UUID, Foreign Key)
- `created_at` (Timestamp)

#### System Alerts
- `id` (UUID, Primary Key)
- `alert` (String)
- `description` (Text)
- `type` (String: maintenance, low_stock, end_of_life, system)
- `severity` (String: high, medium, low, critical)
- `status` (String: Active, Resolved)
- `created_at` (Timestamp)

## 🔧 API Endpoints

### Devices
- `GET /api/devices` - Get all devices
- `POST /api/devices` - Create new device
- `PUT /api/devices/:id` - Update device
- `DELETE /api/devices/:id` - Delete device

### Locations
- `GET /api/locations` - Get all locations
- `POST /api/locations` - Create new location
- `PUT /api/locations/:id` - Update location
- `DELETE /api/locations/:id` - Delete location

### Utilization Logs
- `GET /api/utilization-logs` - Get all utilization logs
- `POST /api/utilization-logs` - Create new utilization log
- `PUT /api/utilization-logs/:id` - Update utilization log
- `DELETE /api/utilization-logs/:id` - Delete utilization log

### Alerts
- `GET /api/alerts` - Get all alerts
- `POST /api/alerts` - Create new alert
- `PUT /api/alerts/:id` - Update alert

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/device-types` - Get device type statistics
- `GET /api/dashboard/monthly-usage` - Get monthly usage data

## 🎯 Usage

### Adding Devices
1. Navigate to the Devices page
2. Click the "+" button to add a new device
3. Fill in device details (name, type, status, serial number, model, purchase date)
4. Select a location from the dropdown
5. Click "Add Device"

### Logging Utilization
1. Go to the Utilization Logs page
2. Click "Log Usage" button
3. Select a device from the dropdown
4. Enter hours used and date
5. Add optional notes
6. Click "Log Usage"

### Managing Locations
1. Navigate to the Locations page
2. Click "+" to add a new location
3. Fill in location details (name, address, city, country)
4. Click "Add Location"

## 🔐 Authentication

The application includes a demo authentication system:
- **Email**: admin@telecom.demo
- **Password**: demo123
- **Role**: Admin

Users are automatically logged in on application startup for demo purposes.

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Backend Deployment
1. Ensure PostgreSQL is accessible
2. Update database connection settings in `server.cjs`
3. Deploy the server to your hosting platform
4. Set up environment variables for production

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy the `dist` folder to your static hosting service
3. Update API endpoints to point to your production backend

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Issues
- Ensure PostgreSQL is running
- Check database credentials
- Verify database exists

#### Port Conflicts
- Backend runs on port 3001
- Frontend runs on port 5173
- Change ports in configuration if needed

#### UUID Errors
- Ensure all foreign key references use valid UUIDs
- Check database schema initialization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
- Device management
- Location management
- Utilization logging
- Dashboard and analytics
- Alert system

---

**Built with ❤️ for Telecom Device Management**
# demo1
