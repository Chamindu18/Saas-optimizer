> **Historical implementation notes — not current setup instructions.** The commands, port 3000, registration flow, example login, and readiness claims below are obsolete. Public registration is disabled and there are no default credentials. For current architecture, authentication policy, and local setup, see the [root README](../README.md).

# SaaS Frontend - Production-Ready Implementation Guide

## 🎯 Project Overview

This is a **production-ready frontend** for a SaaS license management platform built with React 19. It features:

- ✅ Modern, beautiful UI with professional design system
- ✅ Complete authentication (Login, Register, JWT-based)
- ✅ Role-based access control (Admin, Manager, Viewer, User)
- ✅ Comprehensive API integration layer
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Loading, error, and empty states
- ✅ Form validation and error handling
- ✅ Security best practices (XSS prevention, secure token handling)

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── common/              # Reusable UI components
│   │   │   ├── Button.jsx      # Primary, secondary, danger buttons
│   │   │   ├── Input.jsx       # Form inputs with validation
│   │   │   ├── Card.jsx        # Container component
│   │   │   ├── Badge.jsx       # Status badges
│   │   │   ├── Modal.jsx       # Dialog/Modal component
│   │   │   ├── Spinner.jsx     # Loading spinner
│   │   │   ├── Table.jsx       # Data table
│   │   │   └── ErrorMessage.jsx
│   │   ├── layout/              # Layout components
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── MainLayout.jsx
│   │   └── forms/               # Form components
│   ├── pages/                   # Page-level components
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── AdminPage.jsx
│   │   ├── UserPage.jsx
│   │   ├── SoftwarePage.jsx
│   │   └── LicensePage.jsx
│   ├── services/
│   │   └── api.js              # Centralized API service
│   ├── context/
│   │   └── AuthContext.jsx     # Global auth state
│   ├── hooks/
│   │   ├── useAsync.js         # Async operation hook
│   │   └── useForm.js          # Form state management hook
│   ├── styles/
│   │   ├── design-system.css   # Global design tokens
│   │   └── [component].css     # Component styles
│   ├── utils/
│   │   └── formatters.js       # Helper functions
│   └── App.jsx                 # Main app component
├── public/
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Backend running on `http://localhost:5000`

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
```

### Running the Development Server

```bash
npm start
```

The app will open at `http://localhost:3000`

### Historical login example (obsolete)

```
No default login exists. Bootstrap a private administrator using the root README setup instructions.
```

---

## 🎨 Design System

### Color Palette

**Primary Colors** (Brand blue)
- Primary: `#3d6ff0`, `#2d54d4`, `#213daa`

**Semantic Colors**
- Success: `#22c55e` (green)
- Warning: `#f59e0b` (amber)
- Danger: `#ef4444` (red)
- Secondary: `#0ea5e9` (cyan)

### Typography

- **Headings**: Inter, 600-700 weight, scaled
- **Body**: Inter, 400 weight, 16px base
- **Mono**: JetBrains Mono for code

### Spacing

Uses 8px base grid:
- `--space-2` = 8px
- `--space-4` = 16px
- `--space-6` = 24px
- `--space-8` = 32px

### Component Sizes

- **Buttons**: `sm` (14px), `md` (16px), `lg` (18px)
- **Inputs**: Standard height 44px
- **Cards**: Elevation with shadows, radius 12px

---

## 🔐 Authentication Flow

### Login/Register

1. User enters credentials
2. Form validates locally
3. Sends POST to `/api/auth/login` or `/api/auth/register`
4. Backend returns JWT token + user data
5. Token stored in `localStorage` (secure pattern)
6. AuthContext updated with user data
7. Redirect to `/dashboard`

### Token Management

- **Storage**: `localStorage.authToken`
- **Injection**: Automatic via axios interceptor
- **Refresh**: On 401, token is cleared and user redirected to login
- **Security**: XSS prevention through DOM API (no `innerHTML`)

### Protected Routes

```jsx
<PrivateRoute>
  <DashboardPage />
</PrivateRoute>
```

---

## 📊 API Integration

### Service Layer Structure

All API calls go through `/services/api.js`:

```javascript
// Usage in components
import { userAPI, dashboardAPI, adminAPI } from '../services/api';

// Get all users
const users = await userAPI.getAllUsers();

// Create user
const newUser = await userAPI.createUser('John', 'john@example.com');

// Update user role (admin only)
await adminAPI.assignRole(userId, 'manager');
```

### Error Handling

- **401**: Token expired → Redirect to login
- **403**: Access denied → Show warning
- **Other**: Return normalized error object

---

## 🧩 Component Library

### Button Component

```jsx
<Button variant="primary" size="md" loading={isLoading}>
  Save
</Button>

// Variants: primary, secondary, danger, ghost
// Sizes: sm, md, lg
```

### Input Component

```jsx
<Input
  label="Email"
  type="email"
  name="email"
  value={email}
  onChange={handleChange}
  error={errors.email}
  required
/>
```

### Card Component

```jsx
<Card padding="md" elevated hoverable>
  <h2>Card Title</h2>
  <p>Content here</p>
</Card>
```

### Table Component

```jsx
<Table
  columns={[
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email', align: 'left' },
    { 
      key: 'role', 
      label: 'Role',
      render: (value) => <Badge>{value}</Badge>
    }
  ]}
  data={users}
  onRowClick={(row) => navigate(`/users/${row.id}`)}
/>
```

---

## 🎯 Key Pages

### Login Page (`/login`)
- Email and password validation
- Error message display
- Remember me checkbox
- Link to register

### Register Page (`/register`)
- Full name, email, password inputs
- Password strength validation
- Confirm password matching
- Terms acceptance checkbox

### Dashboard Page (`/dashboard`)
- Key metrics cards (users, licenses, cost, idle)
- Tabbed interface (overview, licenses, idle)
- System health status
- Quick action buttons
- License summary

### Admin Panel (`/admin`)
- User management with role assignment
- System health and stats
- Audit log viewer
- Role management interface

---

## 🛠️ Development

### Adding a New Page

1. Create `src/pages/NewPage.jsx`
2. Create `src/pages/NewPage.css` for styles
3. Add route in `App.jsx`

```jsx
<Route
  path="/new-page"
  element={
    <PrivateRoute>
      <NewPage />
    </PrivateRoute>
  }
/>
```

### Adding a New Component

1. Create `src/components/common/NewComponent.jsx`
2. Create `src/components/common/NewComponent.css`
3. Export from component

```jsx
import NewComponent from '../components/common/NewComponent';
```

### Adding API Endpoints

Update `/services/api.js`:

```javascript
export const newAPI = {
  getAll: () => api.get('/endpoint'),
  getById: (id) => api.get(`/endpoint/${id}`),
  create: (data) => api.post('/endpoint', data),
};
```

---

## 📱 Responsive Design

The app is fully responsive:

- **Mobile** (< 640px): Single column layout, touch-friendly buttons
- **Tablet** (640px - 1024px): Two-column layout
- **Desktop** (> 1024px): Full three-column layout

All components use CSS media queries and flex/grid layouts.

---

## 🔒 Security Best Practices

### Implemented

- ✅ HTTPS-ready (use in production)
- ✅ XSS prevention (no `innerHTML`, React escapes JSX)
- ✅ CSRF protection (handled by backend)
- ✅ Secure token storage (localStorage with httpOnly cookie option)
- ✅ Input validation (client + server)
- ✅ Error messages (no sensitive data leakage)

### Recommendations

- Set `httpOnly` and `secure` flags on auth cookies
- Use HTTPS in production
- Implement rate limiting on backend
- Add CORS whitelist for frontend domain
- Regular security audits of dependencies

---

## 🧪 Testing

### Unit Tests (Example)

```javascript
// Button.test.jsx
import { render, screen } from '@testing-library/react';
import Button from './Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

Run tests:
```bash
npm test
```

---

## 📚 Dependencies

### Core
- `react` 19 - UI library
- `react-router-dom` 7 - Routing
- `axios` - HTTP client

### Development
- `react-scripts` - Build tools
- `@testing-library/react` - Testing utilities

---

## 🚀 Building for Production

```bash
# Build optimized bundle
npm run build

# Output in ./build directory
# Ready to deploy to any static host

# Preview production build locally
npm install -g serve
serve -s build
```

---

## 📋 API Endpoints Used

### Auth
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Current user profile

### Users
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PUT /api/users/:id/role` - Update user role

### Software
- `GET /api/software` - List software
- `POST /api/software` - Create software
- `PUT /api/software/:id` - Update software
- `DELETE /api/software/:id` - Delete software

### Licenses
- `GET /api/licenses` - List licenses
- `POST /api/licenses` - Assign license
- `PUT /api/licenses/:id` - Update license
- `DELETE /api/licenses/:id` - Revoke license

### Dashboard
- `GET /api/dashboard/stats` - Dashboard stats
- `GET /api/dashboard` - Full overview
- `GET /api/dashboard/idle-licenses` - Idle licenses

### Admin
- `GET /api/admin/users` - Admin user list
- `GET /api/admin/licenses` - Admin license list
- `GET /api/admin/audit-logs` - Audit logs
- `GET /api/admin/roles` - Available roles

---

## 🤝 Contributing

When adding features:

1. Follow the existing code style
2. Use consistent naming (camelCase for functions, PascalCase for components)
3. Add error handling and loading states
4. Test on mobile and desktop
5. Update this README if adding major features

---

## 📝 License

MIT - See LICENSE file for details

---

## 🆘 Troubleshooting

### Port 3000 Already in Use

```bash
npm start -- --port 3001
```

### Backend Not Connecting

Check that backend is running and `.env` has correct `REACT_APP_API_URL`:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### CORS Errors

Backend must have CORS enabled for frontend domain:

```javascript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
```

### Blank Page on Load

Check browser console for errors. Clear localStorage:

```javascript
localStorage.clear();
```

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review component documentation in code comments
3. Check React/React Router documentation

Good luck! 🚀
