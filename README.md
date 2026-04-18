# SaaS Management & Optimization Platform

A full-stack web application designed to help companies track, manage, and optimize their software subscription costs. Identify unused licenses, reduce spending waste, and gain visibility into your SaaS portfolio.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-MVP-green.svg)

---

## 🎯 The Problem

According to industry reports, companies waste **30-40% of their SaaS budget** on unused software licenses. Common issues:

- **No Visibility**: Organizations don't know which employees are using which tools
- **License Sprawl**: Multiple licenses are purchased but remain inactive
- **Manual Tracking**: Spending is tracked in spreadsheets, making it error-prone
- **Lack of Action**: Even when idle licenses are identified, they're rarely removed

**Result**: Thousands in unnecessary annual spending 💸

---

## 💡 The Solution

**SaaS Management & Optimization Platform** is your financial watchdog for software subscriptions.

- **Track All Licenses**: Centralized view of every SaaS tool and user
- **Detect Idle Usage**: Automatically identify licenses unused for 30+ days
- **Calculate Savings**: See exactly how much you're wasting
- **Take Action**: Prune unused licenses with a single click
- **Optimize Spending**: Make data-driven decisions about your software portfolio

---

## ✨ Key Features (MVP)

### 📊 Dashboard
- **Total Spend**: Real-time cost of all active licenses
- **Idle Licenses**: Count of unused subscriptions
- **Potential Savings**: Dollar amount you can recover by pruning
- **Waste Percentage**: Visual indicator of spending inefficiency

### 👥 User Management
- Add and manage employees
- Track user information (name, email)
- View user's assigned licenses

### 💻 Software Management
- Catalog of SaaS tools (Slack, Zoom, Adobe, etc.)
- Pricing per seat
- Categorization (Dev, Design, Marketing, etc.)

### 📜 License Management
- Assign licenses to users
- Track assignment and last activity dates
- Idle detection (30+ days of inactivity)
- Soft delete with "pruned" status
- License status tracking (active, idle, pruned)

### 🔍 Automation
- Idle detection runs on dashboard access
- Real-time spend calculations
- Automated status updates

---

## 🏗️ Tech Stack

### Frontend
- **React.js** or **Next.js** - Modern UI framework
- **Tailwind CSS** - Utility-first styling
- **Axios** - HTTP client for API calls

### Backend
- **Node.js (v18+)** - JavaScript runtime
- **Express.js** - Web framework
- **PostgreSQL** - Relational database
- **pg** - PostgreSQL client

### Infrastructure
- **Supabase** - PostgreSQL hosting & authentication-ready
- **Vercel/Netlify** - Frontend deployment
- **Render/Railway** - Backend deployment

---

## 🔄 System Architecture

```
┌─────────────────────────────────────────────────────┐
│           Frontend (React/Next.js)                  │
│       Dashboard • User Interface • Forms             │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ HTTP REST API
                   │
┌──────────────────▼──────────────────────────────────┐
│      Backend (Node.js + Express)                    │
│  Routes • Controllers • Services • Business Logic    │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ SQL Queries
                   │
┌──────────────────▼──────────────────────────────────┐
│    Database (PostgreSQL via Supabase)               │
│        Users • Software • Licenses                   │
└─────────────────────────────────────────────────────┘
```

### Data Flow

1. **Request**: User interacts with frontend
2. **API Call**: Frontend sends HTTP request to backend
3. **Processing**: Backend validates, calculates metrics, queries database
4. **Response**: Backend returns JSON data
5. **Display**: Frontend renders dashboard with real-time data

---

## 📁 Project Structure

```
saas-management-platform/
│
├── frontend/                    # React/Next.js frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page routes
│   │   ├── styles/             # CSS/Tailwind
│   │   └── api/                # API client functions
│   ├── package.json
│   └── README.md
│
├── backend/                     # Node.js + Express backend
│   ├── config/                 # Configuration files
│   │   └── db.js               # Database connection
│   ├── models/                 # Data models
│   │   ├── User.js
│   │   ├── Software.js
│   │   └── License.js
│   ├── controllers/            # Request handlers
│   │   ├── userController.js
│   │   ├── softwareController.js
│   │   └── licenseController.js
│   ├── services/               # Business logic
│   │   ├── userService.js
│   │   ├── softwareService.js
│   │   └── licenseService.js
│   ├── routes/                 # API route definitions
│   │   ├── userRoutes.js
│   │   ├── softwareRoutes.js
│   │   └── licenseRoutes.js
│   ├── utils/                  # Helper functions
│   ├── app.js                  # Express configuration
│   ├── server.js               # Server entry point
│   ├── package.json
│   ├── .env.example
│   └── README.md
│
├── docs/                        # Documentation
│   ├── API_GUIDE.md
│   ├── DATABASE_SCHEMA.md
│   └── ARCHITECTURE.md
│
└── README.md                    # This file
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database (Supabase recommended)
- npm or yarn package manager

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Chamindu18/Saas-optimizer.git
   cd saas-platform/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Configure .env**
   ```
   PORT=5000
   NODE_ENV=development
   DATABASE_URL=postgresql://user:password@host:port/database
   FRONTEND_URL=http://localhost:3000
   ```

5. **Start the backend**
   ```bash
   npm start
   ```
   
   Server runs at: `http://localhost:5000`

### Frontend Setup *(Coming Soon)*

```bash
cd ../frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## 📡 API Overview

The backend provides **21 RESTful endpoints** for managing users, software, and licenses.

### Users API
```
GET    /api/users              # Get all users
POST   /api/users              # Create new user
GET    /api/users/:id          # Get user by ID
PUT    /api/users/:id          # Update user
DELETE /api/users/:id          # Delete user
```

### Software API
```
GET    /api/software           # Get all software
POST   /api/software           # Add new software
GET    /api/software/:id       # Get software by ID
PUT    /api/software/:id       # Update software
DELETE /api/software/:id       # Remove software
```

### Licenses API
```
GET    /api/licenses           # Get all licenses
POST   /api/licenses           # Assign license to user
GET    /api/licenses/:id       # Get license by ID
PUT    /api/licenses/:id       # Update license
DELETE /api/licenses/:id       # Delete license
POST   /api/licenses/:id/prune # Mark as pruned (unused)

GET    /api/licenses/dashboard/metrics   # Dashboard data
GET    /api/licenses/idle/list           # All idle licenses
```

### Example Request
```bash
# Get all users
curl http://localhost:5000/api/users

# Create new user
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@company.com"}'

# Get dashboard metrics
curl http://localhost:5000/api/licenses/dashboard/metrics
```

---

## 🎓 How It Works

### 1. Add Users & Software
Managers upload employees and the company's software tools into the system.

### 2. Assign Licenses
Create assignments linking users to software they need.

### 3. Track Activity
The system records the last activity date for each license.

### 4. Detect Idle
Every dashboard load, the system identifies licenses with no activity for 30+ days.

### 5. Calculate Savings
Potential savings are calculated by summing idle license costs.

### 6. Take Action
Managers review reports and prune licenses, immediately reducing spend.

---

## 📊 Dashboard Metrics

The dashboard displays key metrics in real-time:

| Metric | Definition | Use Case |
|--------|-----------|----------|
| **Total Spend** | Sum of all active license costs | Budget tracking |
| **Active Licenses** | Count of licenses with status "active" | Resource monitoring |
| **Idle Licenses** | Count unused for 30+ days | Optimization target |
| **Potential Savings** | Cost of idle licenses | ROI calculation |
| **Waste %** | (Savings / Total Spend) × 100 | Efficiency metric |

---

## 🔮 Future Improvements

### Phase 2
- **User Authentication**: Secure login with JWT tokens
- **Role-Based Access**: CTO, Finance Manager, Operations Manager roles
- **Email Notifications**: Alert managers about idle licenses
- **Advanced Reporting**: PDF reports & email summaries

### Phase 3
- **Live Activity Tracking**: Integrate with Slack, GitHub, Zoom APIs
- **Automated Actions**: Cron jobs to auto-prune idle licenses
- **Forecasting**: Predict future spending based on trends
- **Integration**: Sync with Okta, Microsoft Entra for real user data

### Phase 4
- **Multi-Tenant Support**: Multiple companies on one platform
- **Custom Rules**: Define custom idle detection logic
- **Webhook Integrations**: Real-time integrations with external tools
- **Analytics**: Advanced charts and historical trending

---

## 💼 Why This Project Matters

### Business Impact
- **Cost Reduction**: Save 20-40% on SaaS spending annually
- **Quick ROI**: Identify savings within days of implementation
- **Better Decision Making**: Data-driven software portfolio optimization
- **Accountability**: Clear visibility into spending and usage

### Learning Outcomes
This project demonstrates:
- ✅ Full-stack development (Frontend + Backend + Database)
- ✅ REST API design and implementation
- ✅ Database modeling and relationships
- ✅ Business logic complexity
- ✅ Real-world problem solving
- ✅ Clean code principles
- ✅ Scalable architecture

### Real-World Relevance
Every company with 50+ employees wastes money on SaaS. This problem is universal and billions are lost annually.

---

## 🤝 Contributing

This is an **open-source project** for learning and development. Contributions welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 📧 Contact & Support

- **Issues**: Please use GitHub Issues for bug reports
- **Discussions**: Open for feature requests and questions
- **Email**: chamindu553@gmail.com

---

## 🎯 Project Status

- ✅ Backend API (Complete)
- ✅ Database schema (Complete)
- ⏳ Frontend UI (In Progress)
- ⏳ Authentication (Planned)
- ⏳ Advanced features (Planned)

---

## 🙏 Acknowledgments

- Built as a portfolio project to demonstrate full-stack development
- Inspired by real-world SaaS management challenges
- Thanks to open-source community (Express, React, PostgreSQL, etc.)

---

<div align="center">

**Made with ❤️ for SaaS optimization**

[⭐ Star this project](https://github.com/your-username/saas-platform) if you find it useful!

</div>
