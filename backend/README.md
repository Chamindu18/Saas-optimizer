# SaaS Management Platform - Backend Setup Guide

Welcome! This is the backend API for the **SaaS Management & Optimization Platform**. Follow these steps to get your server running.

---

## 📋 Table of Contents

1. [What You'll Build](#what-youll-build)
2. [Project Structure](#project-structure)
3. [Step-by-Step Setup](#step-by-step-setup)
4. [API Endpoints](#api-endpoints)
5. [Testing the API](#testing-the-api)
6. [Next Steps](#next-steps)

---

## 🎯 What You'll Build

A **Node.js + Express** backend API that manages:
- **Users** (employees)
- **Software** (SaaS tools like Slack, Zoom)
- **Licenses** (subscriptions connecting users to software)

The API calculates:
- Total spending on licenses
- Idle licenses (unused for 30+ days)
- Potential savings from pruning idle licenses

---

## 📂 Project Structure

```
backend/
├── config/             # Configuration files
│   └── database.js     # Database setup (placeholder for PostgreSQL)
├── controllers/        # HTTP request handlers
│   ├── userController.js
│   ├── softwareController.js
│   └── licenseController.js
├── routes/             # API endpoint definitions
│   ├── userRoutes.js
│   ├── softwareRoutes.js
│   └── licenseRoutes.js
├── services/           # Business logic
│   ├── userService.js
│   ├── softwareService.js
│   └── licenseService.js
├── models/             # Data models (using mock data)
│   ├── User.js
│   ├── Software.js
│   └── License.js
├── utils/              # Helper functions
│   └── helpers.js
├── app.js              # Express app configuration
├── server.js           # Server entry point
├── package.json        # Node.js dependencies
└── .env.example        # Environment variables template
```

---

## 🚀 Step-by-Step Setup

### Step 1: Navigate to Backend Directory

```bash
cd backend
```

### Step 2: Initialize Node.js Project

If you haven't already initialized npm, run:

```bash
npm init -y
```

This creates a `package.json` file with default settings.

### Step 3: Install Dependencies

```bash
npm install
```

This installs the required packages:
- **express**: Web framework
- **cors**: Enable cross-origin requests (for frontend)
- **dotenv**: Load environment variables

For development, optionally install nodemon (auto-restart on file changes):

```bash
npm install --save-dev nodemon
```

### Step 4: Create Environment File

Copy `.env.example` to `.env`:

**On Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**On Mac/Linux:**
```bash
cp .env.example .env
```

Then edit `.env` with your settings:

```
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Step 5: Start the Server

**Using Node.js directly:**
```bash
npm start
```

**Using Nodemon (auto-restart on changes):**
```bash
npm run dev
```

You should see:
```
╔════════════════════════════════════════╗
║  SaaS Management Platform - Backend    ║
║  Server running on port 5000           ║
║  Environment: development              ║
╚════════════════════════════════════════╝

API available at: http://localhost:5000
Press CTRL+C to stop the server
```

---

## 📡 API Endpoints

### Base URL
```
http://localhost:5000
```

### 👥 User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users |
| GET | `/api/users/:id` | Get user by ID |
| POST | `/api/users` | Create new user |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |

### 💻 Software Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/software` | Get all software |
| GET | `/api/software/:id` | Get software by ID |
| POST | `/api/software` | Create new software |
| PUT | `/api/software/:id` | Update software |
| DELETE | `/api/software/:id` | Delete software |

### 📜 License Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/licenses` | Get all licenses |
| GET | `/api/licenses/:id` | Get license by ID |
| POST | `/api/licenses` | Assign license to user |
| PUT | `/api/licenses/:id` | Update license |
| DELETE | `/api/licenses/:id` | Delete license |
| POST | `/api/licenses/:id/prune` | Prune (disable) license |
| GET | `/api/licenses/dashboard/metrics` | Get dashboard data |
| GET | `/api/licenses/idle/list` | Get idle licenses |

---

## 🧪 Testing the API

### Option 1: Using cURL (Command Line)

Get all users:
```bash
curl http://localhost:5000/api/users
```

Create new user:
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice Johnson","email":"alice@example.com"}'
```

Get dashboard metrics:
```bash
curl http://localhost:5000/api/licenses/dashboard/metrics
```

### Option 2: Using Postman

1. Download [Postman](https://www.postman.com/downloads/)
2. Create a new request
3. Set method to `GET`
4. Enter URL: `http://localhost:5000/api/users`
5. Click **Send**

### Option 3: Using VS Code REST Client

Install the "REST Client" extension, then create a file `test.http`:

```http
### Get all users
GET http://localhost:5000/api/users

### Get all software
GET http://localhost:5000/api/software

### Create new user
POST http://localhost:5000/api/users
Content-Type: application/json

{
  "name": "Bob Wilson",
  "email": "bob@example.com"
}

### Get dashboard metrics
GET http://localhost:5000/api/licenses/dashboard/metrics

### Get idle licenses
GET http://localhost:5000/api/licenses/idle/list

### Assign license
POST http://localhost:5000/api/licenses
Content-Type: application/json

{
  "user_id": 1,
  "software_id": 2
}

### Prune license
POST http://localhost:5000/api/licenses/1/prune
```

Click "Send Request" above each endpoint.

---

## 📊 Understanding the Code

### Architecture Pattern: MVC + Services

The backend follows a clean architecture:

```
Request
  ↓
Route (userRoutes.js)
  ↓
Controller (userController.js) - Handles HTTP request/response
  ↓
Service (userService.js) - Contains business logic
  ↓
Model (User.js) - Data operations
  ↓
Response
```

### Why This Structure?

1. **Separation of Concerns**: Each file has one responsibility
2. **Reusability**: Services can be used by multiple controllers
3. **Testability**: Easy to test individual layers
4. **Scalability**: Easy to add new features

### Example: Flow of a Request

**Request:** `POST /api/users` with `{ "name": "John", "email": "john@example.com" }`

1. **Route** (`userRoutes.js`): Receives POST request
2. **Controller** (`userController.js`): Extracts data from request
3. **Service** (`userService.js`): Validates data and calls model
4. **Model** (`User.js`): Creates user in memory/database
5. **Response**: Returns `{ success: true, data: { id: 3, name: "John", ... } }`

---

## 🔧 Key Concepts

### Mock Data vs Real Database

Currently, the app uses **mock data in memory**:
- No real database connection
- Data is lost when server restarts
- Perfect for learning and testing

When ready for production:
1. Replace models with PostgreSQL queries
2. Use a database client like `pg` or `prisma`
3. Update `config/database.js`

### Idle License Detection

A license is considered **idle** if:
- Status is `active`
- `last_active_date` is more than 30 days old

Example:
```
Today: April 18, 2024
Last Active: February 15, 2024
Days Inactive: 63 days
Status: IDLE ✓
```

### Dashboard Metrics

The dashboard calculates:
- **Total Spend**: Sum of all active license costs
- **Active Licenses**: Count of active licenses
- **Idle Licenses**: Count of unused licenses
- **Potential Savings**: Sum of idle license costs
- **Waste Percentage**: (Potential Savings / Total Spend) × 100

---

## 🛠️ Common Tasks

### How to Find Sample Data?

Open `models/User.js`, `models/Software.js`, and `models/License.js` to see mock data.

### How to Add a New Feature?

1. Create a route in `routes/`
2. Create a controller function in `controllers/`
3. Add service logic in `services/`
4. Test with your HTTP client

### How to Debug?

Services use `try/catch` for error handling. Errors are logged and returned in responses.

---

## 📚 Next Steps

1. **Start the server** (`npm start`)
2. **Test endpoints** using curl or Postman
3. **Explore the code** - read the comments to understand the flow
4. **Build the frontend** - React/Next.js to display this data
5. **Connect a real database** - Replace mock data with PostgreSQL
6. **Add authentication** - Protect endpoints with login/JWT tokens

---

## 🚨 Troubleshooting

### Port 5000 Already in Use

Change the port in `.env`:
```
PORT=3001
```

### Modules Not Found

Make sure dependencies are installed:
```bash
npm install
```

### Server Won't Start

Check console for errors. Common issues:
- Missing `package.json` or `server.js`
- Wrong file paths
- Syntax errors in JavaScript

---

## 📖 File Guide

| File | Purpose |
|------|---------|
| `server.js` | Starts the Express server |
| `app.js` | Configures Express middleware and routes |
| `controllers/*` | Handles HTTP requests and responses |
| `services/*` | Contains business logic |
| `models/*` | Manages data (mock or database) |
| `routes/*` | Defines API endpoints |
| `config/database.js` | Database configuration |

---

## 🎓 Learning Resources

- [Express.js Documentation](https://expressjs.com/)
- [Async/Await in JavaScript](https://javascript.info/async-await)
- [REST API Design](https://restfulapi.net/)
- [Node.js Documentation](https://nodejs.org/docs/)

---

## 📝 Notes

- This is a **beginner-friendly** implementation
- All code includes comments for learning
- No authentication included (for MVP)
- No database connection yet (use mock data first)
- Perfect for understanding full-stack development

---

## ✅ Checklist

- [ ] Install Node.js (if not already installed)
- [ ] Navigate to `backend` folder
- [ ] Run `npm install`
- [ ] Create `.env` file
- [ ] Run `npm start`
- [ ] Test with curl/Postman
- [ ] Explore the code

---

**Happy coding! 🚀**
