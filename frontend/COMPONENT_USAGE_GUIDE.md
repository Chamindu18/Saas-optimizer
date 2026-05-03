# Component Usage Guide — Quick Reference

## Button Component

```jsx
import Button from '../components/ui/Button';

// Basic button
<Button variant="primary">Click me</Button>

// With loading state
<Button variant="primary" loading={isLoading}>
  Submit
</Button>

// Different variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="danger">Delete</Button>
<Button variant="ghost">Subtle</Button>

// Different sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>      {/* default */}
<Button size="lg">Large</Button>

// With onClick handler
<Button onClick={() => handleAction()}>Action</Button>

// Disabled state
<Button disabled>Disabled</Button>

// Full width
<Button className="w-full">Full Width</Button>
```

---

## Input Component

```jsx
import Input from '../components/ui/Input';

// Basic text input
<Input
  type="text"
  placeholder="Enter name"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>

// With label and validation
<Input
  label="Email Address"
  type="email"
  placeholder="you@company.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={!!errors.email}
  errorMessage={errors.email}
  required
/>

// Password input
<Input
  label="Password"
  type="password"
  placeholder="••••••••"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
/>

// With hint text
<Input
  label="Username"
  hint="3-20 characters, letters and numbers only"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
/>

// Disabled state
<Input disabled value="Cannot edit this" />
```

---

## Card Component

```jsx
import Card from '../components/ui/Card';

// Basic card
<Card>
  <h3>Card Title</h3>
  <p>Card content here</p>
</Card>

// With custom options
<Card padding shadow="md" border hover>
  Content
</Card>

// As a container
<Card className="licenses-section">
  {/* page content */}
</Card>

// Without padding
<Card padding={false}>
  {/* no internal padding */}
</Card>

// Different shadow levels
<Card shadow="sm">Subtle</Card>
<Card shadow="md">Standard</Card>
<Card shadow="lg">Elevated</Card>
```

---

## MetricCard Component

```jsx
import MetricCard from '../components/ui/MetricCard';

// Basic KPI card
<MetricCard
  label="Total Spend"
  value="$124,500"
  icon="💰"
/>

// With trend
<MetricCard
  label="Active Licenses"
  value="245"
  trend={12}
  trendDirection="up"
  icon="✓"
/>

// Negative trend
<MetricCard
  label="Idle Licenses"
  value="15"
  trend={-3}
  trendDirection="down"
  icon="⚠️"
/>

// Loading state
<MetricCard loading label="Loading..." />
```

---

## Badge Component

```jsx
import Badge from '../components/ui/Badge';

// Status badges
<Badge variant="active">Active</Badge>
<Badge variant="idle">Idle</Badge>
<Badge variant="pruned">Pruned</Badge>

// Other variants
<Badge variant="primary">Primary</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="danger">Error</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="info">Info</Badge>

// Different sizes
<Badge size="sm">Small</Badge>
<Badge size="md">Medium</Badge>
<Badge size="lg">Large</Badge>
```

---

## Alert Component

```jsx
import Alert from '../components/ui/Alert';

// Info alert
<Alert
  type="info"
  title="Note"
  message="This is informational"
/>

// Success alert
<Alert
  type="success"
  title="Success!"
  message="Action completed successfully"
/>

// Warning alert
<Alert
  type="warning"
  title="Attention"
  message="You have 5 idle licenses"
  action={<Button size="sm">Review</Button>}
/>

// Error/Danger alert
<Alert
  type="danger"
  message="Failed to load data. Please try again."
  onClose={() => setError(null)}
/>
```

---

## EmptyState Component

```jsx
import EmptyState from '../components/ui/EmptyState';

// Basic empty state
<EmptyState
  title="No Licenses"
  description="Start by adding software and users to your workspace"
  icon="📋"
/>

// With action button
<EmptyState
  title="No Data"
  description="Create your first item to get started"
  icon="🚀"
  action={
    <Button variant="primary" onClick={() => setShowForm(true)}>
      Create Item
    </Button>
  }
/>
```

---

## Skeleton Component

```jsx
import { Spinner, SkeletonCard, SkeletonText } from '../components/ui/Skeleton';

// Loading spinner
<Spinner size="md" />

// Skeleton card (for metric cards)
<SkeletonCard />

// Skeleton text (for paragraphs)
<SkeletonText lines={3} />
```

---

## Form Pattern (Complete Example)

```jsx
import React, { useState } from 'react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Alert from '../components/ui/Alert';
import api from '../services/api';

export default function MyForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', formData);
      // Success — redirect or update state
      console.log('Success:', response.data);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {apiError && (
        <Alert
          type="danger"
          message={apiError}
          onClose={() => setApiError(null)}
        />
      )}

      <form onSubmit={handleSubmit}>
        <Input
          label="Email"
          type="email"
          name="email"
          placeholder="you@company.com"
          value={formData.email}
          onChange={handleChange}
          error={!!errors.email}
          errorMessage={errors.email}
          required
        />

        <Input
          label="Password"
          type="password"
          name="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          error={!!errors.password}
          errorMessage={errors.password}
          required
        />

        <Button
          type="submit"
          variant="primary"
          loading={loading}
        >
          Submit
        </Button>
      </form>
    </div>
  );
}
```

---

## Data Loading Pattern

```jsx
import React, { useState, useEffect } from 'react';
import { SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import Alert from '../components/ui/Alert';
import Card from '../components/ui/Card';
import api from '../services/api';

export default function DataDisplay() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/licenses');
      setData(response.data.data);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return <SkeletonCard />;
  }

  // Error state
  if (error) {
    return (
      <Alert
        type="danger"
        message={error}
        action={
          <Button onClick={fetchData} variant="secondary" size="sm">
            Retry
          </Button>
        }
      />
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No Data"
        description="Create your first item to get started"
        icon="📋"
      />
    );
  }

  // Success state - render data
  return (
    <Card>
      {data.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
    </Card>
  );
}
```

---

## Best Practices

### ✅ Do's

- Use design system variables (`--space-*`, `--color-*`)
- Use component library instead of raw HTML
- Validate forms before submission
- Show loading states
- Handle errors gracefully
- Use proper semantic HTML
- Test responsive behavior

### ❌ Don'ts

- Don't use inline styles
- Don't use random Tailwind classes
- Don't mix component libraries
- Don't ignore error states
- Don't forget accessibility
- Don't hardcode colors/spacing
- Don't submit forms without validation

---

## Styling with CSS Variables

Instead of:
```css
.card {
  padding: 16px;
  margin-bottom: 24px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

Use:
```css
.card {
  padding: var(--space-4);
  margin-bottom: var(--space-6);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}
```

This ensures:
- ✅ Consistency across the entire app
- ✅ Easy updates to design system
- ✅ Better maintainability
- ✅ Responsive scaling

---

Happy coding! 🚀
