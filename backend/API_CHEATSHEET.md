# API Cheatsheet

Quick reference for all API endpoints with example requests and responses.

## Base URL
```
http://localhost:5000
```

---

## 👥 Users API

### Get All Users
```
GET /api/users
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "created_at": "2024-01-15T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

### Get User by ID
```
GET /api/users/1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2024-01-15T00:00:00.000Z"
  }
}
```

### Create User
```
POST /api/users
Content-Type: application/json

{
  "name": "Alice Johnson",
  "email": "alice@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 3,
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "created_at": "2024-04-18T10:30:00.000Z"
  }
}
```

### Update User
```
PUT /api/users/1
Content-Type: application/json

{
  "name": "John Updated",
  "email": "john.new@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": 1,
    "name": "John Updated",
    "email": "john.new@example.com",
    "created_at": "2024-01-15T00:00:00.000Z"
  }
}
```

### Delete User
```
DELETE /api/users/1
```

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2024-01-15T00:00:00.000Z"
  }
}
```

---

## 💻 Software API

### Get All Software
```
GET /api/software
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Slack",
      "category": "Communication",
      "price_per_seat": 8.0
    }
  ],
  "count": 1
}
```

### Get Software by ID
```
GET /api/software/1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Slack",
    "category": "Communication",
    "price_per_seat": 8.0
  }
}
```

### Create Software
```
POST /api/software
Content-Type: application/json

{
  "name": "Figma",
  "category": "Design",
  "price_per_seat": 12.0
}
```

**Response:**
```json
{
  "success": true,
  "message": "Software created successfully",
  "data": {
    "id": 5,
    "name": "Figma",
    "category": "Design",
    "price_per_seat": 12.0
  }
}
```

### Update Software
```
PUT /api/software/1
Content-Type: application/json

{
  "price_per_seat": 10.0
}
```

**Response:**
```json
{
  "success": true,
  "message": "Software updated successfully",
  "data": {
    "id": 1,
    "name": "Slack",
    "category": "Communication",
    "price_per_seat": 10.0
  }
}
```

### Delete Software
```
DELETE /api/software/1
```

**Response:**
```json
{
  "success": true,
  "message": "Software deleted successfully",
  "data": {
    "id": 1,
    "name": "Slack",
    "category": "Communication",
    "price_per_seat": 8.0
  }
}
```

---

## 📜 Licenses API

### Get All Licenses
```
GET /api/licenses
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "software_id": 1,
      "assigned_date": "2024-01-15T00:00:00.000Z",
      "last_active_date": "2024-04-10T00:00:00.000Z",
      "status": "active"
    }
  ],
  "count": 1
}
```

### Get License by ID
```
GET /api/licenses/1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 1,
    "software_id": 1,
    "assigned_date": "2024-01-15T00:00:00.000Z",
    "last_active_date": "2024-04-10T00:00:00.000Z",
    "status": "active"
  }
}
```

### Assign License to User
```
POST /api/licenses
Content-Type: application/json

{
  "user_id": 2,
  "software_id": 3
}
```

**Response:**
```json
{
  "success": true,
  "message": "License assigned successfully",
  "data": {
    "id": 5,
    "user_id": 2,
    "software_id": 3,
    "assigned_date": "2024-04-18T10:30:00.000Z",
    "last_active_date": "2024-04-18T10:30:00.000Z",
    "status": "active"
  }
}
```

### Update License
```
PUT /api/licenses/1
Content-Type: application/json

{
  "last_active_date": "2024-04-18T15:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "License updated successfully",
  "data": {
    "id": 1,
    "user_id": 1,
    "software_id": 1,
    "assigned_date": "2024-01-15T00:00:00.000Z",
    "last_active_date": "2024-04-18T15:00:00.000Z",
    "status": "active"
  }
}
```

### Prune License
Mark a license as pruned (disabled, but not deleted).

```
POST /api/licenses/1/prune
```

**Response:**
```json
{
  "success": true,
  "message": "License pruned successfully",
  "data": {
    "id": 1,
    "user_id": 1,
    "software_id": 1,
    "assigned_date": "2024-01-15T00:00:00.000Z",
    "last_active_date": "2024-04-10T00:00:00.000Z",
    "status": "pruned"
  }
}
```

### Delete License
```
DELETE /api/licenses/1
```

**Response:**
```json
{
  "success": true,
  "message": "License deleted successfully",
  "data": {
    "id": 1,
    "user_id": 1,
    "software_id": 1,
    "assigned_date": "2024-01-15T00:00:00.000Z",
    "last_active_date": "2024-04-10T00:00:00.000Z",
    "status": "active"
  }
}
```

---

## 📊 Dashboard & Analytics

### Get Dashboard Metrics
Shows total spend, idle count, potential savings, and waste percentage.

```
GET /api/licenses/dashboard/metrics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSpend": 124.98,
    "activeLicenseCount": 3,
    "idleLicenseCount": 1,
    "potentialSavings": 16.99,
    "metrics": {
      "percentageOfSpendBeingWasted": 13.6
    }
  }
}
```

### Get Idle Licenses
Returns all licenses not used in 30+ days.

```
GET /api/licenses/idle/list
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "user_id": 1,
      "software_id": 2,
      "assigned_date": "2024-01-15T00:00:00.000Z",
      "last_active_date": "2024-02-20T00:00:00.000Z",
      "status": "active"
    }
  ],
  "count": 1
}
```

---

## 🔴 Error Responses

### 404 Not Found
```json
{
  "success": false,
  "error": "User not found"
}
```

### 400 Bad Request
```json
{
  "success": false,
  "error": "Name and email are required"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Failed to fetch users: [error details]"
}
```

---

## 📝 Testing with cURL

**Get all users:**
```bash
curl http://localhost:5000/api/users
```

**Create user:**
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Bob","email":"bob@example.com"}'
```

**Get dashboard:**
```bash
curl http://localhost:5000/api/licenses/dashboard/metrics
```

**Prune license:**
```bash
curl -X POST http://localhost:5000/api/licenses/1/prune
```

---

## 📋 Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid data |
| 404 | Not Found - Resource doesn't exist |
| 500 | Server Error - Something went wrong |

---

## 🎯 Common Workflows

### Workflow 1: Add New User and Assign License

1. Create user:
```bash
POST /api/users
{ "name": "Charlie", "email": "charlie@example.com" }
```

2. Get the new user ID from response (e.g., `id: 5`)

3. Assign license:
```bash
POST /api/licenses
{ "user_id": 5, "software_id": 1 }
```

### Workflow 2: Check Spending & Idle Licenses

1. Get dashboard metrics:
```bash
GET /api/licenses/dashboard/metrics
```

2. Get idle licenses:
```bash
GET /api/licenses/idle/list
```

3. Prune unused licenses:
```bash
POST /api/licenses/{id}/prune
```

---

## 💡 Tips

- All dates are returned in ISO 8601 format
- Price is in USD per seat per month
- Licenses with status "pruned" are no longer counted in spend
- Use `last_active_date` to track user activity
- Always include `Content-Type: application/json` header for POST/PUT requests
