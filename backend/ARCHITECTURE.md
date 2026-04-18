# Backend Architecture Overview

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (React/Next.js)                   │
│                   Makes HTTP requests to API                    │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              │ HTTP Requests
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXPRESS.JS HTTP SERVER                       │
│                     (server.js, app.js)                         │
├─────────────────────────────────────────────────────────────────┤
│                    MIDDLEWARE LAYER                             │
│          (CORS, JSON parsing, Error handling)                   │
├─────────────────────────────────────────────────────────────────┤
│                    ROUTES LAYER                                 │
│     (/api/users, /api/software, /api/licenses)                 │
├─────────────────────────────────────────────────────────────────┤
│                   CONTROLLERS LAYER                             │
│   (Handle HTTP requests, validate input, send responses)        │
├─────────────────────────────────────────────────────────────────┤
│                    SERVICES LAYER                               │
│    (Business logic: calculations, idle detection, validation)   │
├─────────────────────────────────────────────────────────────────┤
│                    MODELS LAYER                                 │
│          (Data operations: CRUD for Users, Software, Licenses)  │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ▼                                           ▼
   IN-MEMORY DATA               POSTGRESQL DATABASE
   (for development)            (for production)
   - Mock Users                 - Real users
   - Mock Software              - Real software
   - Mock Licenses              - Real licenses
```

---

## 📊 Data Flow for a Request

### Example: Create a User

```
┌──────────────────────────────────────────────────────────────┐
│ Frontend Component                                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Button clicked: "Add User"                              │ │
│ │ Sends: POST /api/users with {name, email}              │ │
│ └─────────────────────────────────────────────────────────┘ │
└──────────────────────┬───────────────────────────────────────┘
                       │ HTTP POST Request
                       │ { "name": "Alice", "email": "alice@example.com" }
                       ▼
┌──────────────────────────────────────────────────────────────┐
│ userRoutes.js                                                │
│ Matches: POST /api/users                                     │
│ Calls: userController.createUser()                           │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│ userController.createUser()                                  │
│ - Extracts name and email from req.body                      │
│ - Calls: userService.createUser()                            │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│ userService.createUser()                                     │
│ - Validates email format                                     │
│ - Checks required fields                                     │
│ - Calls: UserModel.createUser()                              │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│ UserModel.createUser()                                       │
│ - Generates new ID                                           │
│ - Adds created_at timestamp                                  │
│ - Stores in users array (or database)                        │
│ - Returns: new user object                                   │
└──────────────────────┬───────────────────────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         │ (responses flow upward)   │
         ▼                           
┌──────────────────────────────────────────────────────────────┐
│ userService.createUser()                                     │
│ Returns: { id, name, email, created_at }                     │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│ userController.createUser()                                  │
│ Sends HTTP 201 Response:                                     │
│ {                                                            │
│   "success": true,                                           │
│   "message": "User created successfully",                    │
│   "data": { id: 3, name: "Alice", ... }                      │
│ }                                                            │
└──────────────────────┬───────────────────────────────────────┘
                       │ HTTP Response
                       ▼
┌──────────────────────────────────────────────────────────────┐
│ Frontend Component                                           │
│ - Receives response                                          │
│ - Updates UI: "User Alice created!"                          │
│ - Updates list of users                                      │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔄 Business Logic Examples

### Idle License Detection

```
Current Date: April 18, 2024

License 1:
  - Assigned: Jan 15, 2024
  - Last Active: April 10, 2024
  - Days Inactive: 8 days
  - Status: ACTIVE ✓

License 2:
  - Assigned: Jan 15, 2024
  - Last Active: February 20, 2024
  - Days Inactive: 58 days
  - Status: IDLE ✓ (> 30 days)
  - Decision: Can be pruned
```

### Spend Calculation

```
All Licenses:
┌─────────────────────────────────────────────────┐
│ License 1: Slack (active)      → $8.00         │
│ License 2: Zoom (idle)         → $16.99        │
│ License 3: Adobe (active)      → $54.99        │
│ License 4: GitHub (pruned)     → $0.00 (skip)  │
└─────────────────────────────────────────────────┘

Total Spend (active only):      $62.99
Potential Savings (idle only):  $16.99
Waste Percentage:               26.95%
```

---

## 📁 File Relationships

```
server.js (entry point)
    │
    └─> app.js (Express configuration)
        │
        ├─> routes/
        │   ├─> userRoutes.js
        │   ├─> softwareRoutes.js
        │   └─> licenseRoutes.js
        │
        ├─> controllers/
        │   ├─> userController.js
        │   ├─> softwareController.js
        │   └─> licenseController.js
        │
        ├─> services/
        │   ├─> userService.js
        │   ├─> softwareService.js
        │   └─> licenseService.js
        │
        ├─> models/
        │   ├─> User.js
        │   ├─> Software.js
        │   └─> License.js
        │
        └─> config/
            └─> database.js
```

---

## 🔑 Key Concepts

### Controllers
- **Purpose**: Handle HTTP requests and responses
- **Responsibility**: Extract data, call services, format responses
- **Should NOT**: Contain business logic

### Services
- **Purpose**: Contain all business logic
- **Responsibility**: Validate data, perform calculations, call models
- **Should NOT**: Deal with HTTP details

### Models
- **Purpose**: Handle data operations
- **Responsibility**: CRUD operations, data persistence
- **Currently**: Use in-memory mock data
- **Later**: Replace with database queries

### Routes
- **Purpose**: Define API endpoints
- **Responsibility**: Map URLs to controllers
- **Pattern**: GET, POST, PUT, DELETE

---

## 🎯 Design Principles Used

### 1. Separation of Concerns
Each layer has one job:
- Routes: URL mapping
- Controllers: HTTP handling
- Services: Business logic
- Models: Data operations

### 2. DRY (Don't Repeat Yourself)
Shared logic goes in services (can be reused by multiple controllers)

### 3. Error Handling
All errors caught and formatted as JSON responses

### 4. Validation
Input validated in services before processing

### 5. Async/Await
All database operations ready for async (prepared for real database)

---

## 🚀 Scalability Plan

### Phase 1: Current (Learning)
- In-memory data
- Single server
- Perfect for understanding concepts

### Phase 2: Add Database
- Replace models with PostgreSQL queries
- Install `pg` package
- Update `config/database.js`
- User data persists across server restarts

### Phase 3: Add Authentication
- Install `jsonwebtoken` and `bcrypt`
- Create auth routes (login, signup)
- Protect endpoints with middleware

### Phase 4: Advanced Features
- Automated idle detection (cron jobs)
- Email notifications
- Webhook integrations
- Real-time dashboards (WebSockets)

---

## 📚 Testing the Architecture

### Test Each Layer

```bash
# Test 1: Routes Work
curl http://localhost:5000/api/users

# Test 2: Controllers Format Response
# Check that response includes success: true, data: [...]

# Test 3: Services Validate
curl -X POST http://localhost:5000/api/users \
  -d '{"name":""}' \
  # Should get error: "Name and email are required"

# Test 4: Models Store Data
# Create user, then GET /api/users/3 - should see it
```

---

## 🔍 Code Reading Guide

### If you want to understand...

| Topic | Read This | Then This |
|-------|-----------|-----------|
| How a request flows | `routes/userRoutes.js` | `controllers/userController.js` |
| Business logic | `services/userService.js` | Look at validation and method names |
| Data structure | `models/User.js` | Check the fields and CRUD methods |
| Error handling | Any `try/catch` block | See how errors are caught and returned |
| Middleware | `app.js` | Look at `app.use()` statements |
| API response format | Any controller | Check the `res.json()` calls |

---

## 🎓 Learning Outcomes

After understanding this architecture, you'll know:
- ✅ How Express routes HTTP requests
- ✅ Why controllers should be thin
- ✅ Where business logic belongs (services)
- ✅ How to structure a scalable API
- ✅ How to handle errors properly
- ✅ How to validate user input
- ✅ Design patterns for clean code

---

## 💡 Quick Reference

### Common Patterns

**Create resource:**
1. POST route receives data
2. Controller validates with service
3. Service checks for errors
4. Model creates and returns data
5. Controller sends 201 response

**Read resource:**
1. GET route receives ID
2. Controller calls service
3. Service calls model
4. Model retrieves data
5. Controller sends 200 response

**Update resource:**
1. PUT route receives ID and data
2. Controller validates
3. Service checks if exists
4. Model updates data
5. Controller sends 200 response

**Delete resource:**
1. DELETE route receives ID
2. Controller validates
3. Service checks if exists
4. Model deletes data
5. Controller sends 200 response

---

## 🔐 Security Notes (MVP)

This MVP is meant for learning. For production:
- [ ] Add authentication (JWT tokens)
- [ ] Validate and sanitize all inputs
- [ ] Use environment variables for secrets
- [ ] Add rate limiting
- [ ] Use HTTPS
- [ ] Add request logging
- [ ] Implement CORS properly
- [ ] Use database transactions

---

**Start simple, scale smart!** 🚀
