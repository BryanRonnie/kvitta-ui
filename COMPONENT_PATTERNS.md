# Component Patterns Cheat Sheet

Quick reference for common Next.js component patterns in Kvitta UI.

## Table of Contents
- [Server Component (Default)](#server-component-default)
- [Client Component](#client-component)
- [Component with Props](#component-with-props)
- [Form Handling](#form-handling)
- [API Data Fetching](#api-data-fetching)
- [Loading States](#loading-states)
- [Error Handling](#error-handling)
- [Conditional Rendering](#conditional-rendering)

---

## Server Component (Default)

**When to use:** Static content, no interactivity needed

```tsx
// app/about/page.tsx

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">About Us</h1>
      <p>This is a server component - no JavaScript sent to client!</p>
    </div>
  );
}
```

**Key Points:**
- No `'use client'` directive
- Can't use useState, useEffect, or event handlers
- Best for performance and SEO

---

## Client Component

**When to use:** Need hooks, event handlers, or browser APIs

```tsx
// components/Counter.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/Button';

export function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <Button onClick={() => setCount(count + 1)}>
        Increment
      </Button>
    </div>
  );
}
```

**Key Points:**
- Add `'use client'` at top
- Can use all React hooks
- Has access to window, document, localStorage

---

## Component with Props

```tsx
// components/UserCard.tsx

import { Card, CardHeader, CardContent } from '@/components/ui/card';

interface UserCardProps {
  name: string;
  email: string;
  isActive?: boolean; // Optional prop
  onDelete?: () => void; // Optional callback
}

export function UserCard({ 
  name, 
  email, 
  isActive = true, // Default value
  onDelete 
}: UserCardProps) {
  return (
    <Card>
      <CardHeader>
        <h3>{name}</h3>
        {isActive && <span className="text-green-600">Active</span>}
      </CardHeader>
      <CardContent>
        <p>{email}</p>
        {onDelete && (
          <button onClick={onDelete}>Delete</button>
        )}
      </CardContent>
    </Card>
  );
}
```

**Usage:**
```tsx
<UserCard 
  name="John Doe" 
  email="john@example.com"
  isActive={true}
  onDelete={() => console.log('Delete clicked')}
/>
```

---

## Form Handling

```tsx
// components/ContactForm.tsx
'use client';

import { useState, FormEvent } from 'react';
import { Button } from '@/components/Button';

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Your API call here
      await fetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      
      // Reset form
      setFormData({ name: '', email: '', message: '' });
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Name"
        value={formData.name}
        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        className="w-full px-4 py-2 border rounded"
        required
      />
      
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
        className="w-full px-4 py-2 border rounded"
        required
      />
      
      <textarea
        placeholder="Message"
        value={formData.message}
        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
        className="w-full px-4 py-2 border rounded"
        rows={4}
        required
      />
      
      <Button type="submit" disabled={submitting} loading={submitting}>
        Send Message
      </Button>
    </form>
  );
}
```

---

## API Data Fetching

### Pattern 1: Client-Side (useEffect)

```tsx
// app/users/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch('/api/users');
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch');
      } finally {
        setLoading(false);
      }
    }
    
    fetchUsers();
  }, []); // Empty dependency array = run once on mount
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {users.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

### Pattern 2: Server-Side (async component)

```tsx
// app/posts/page.tsx

async function getPosts() {
  const res = await fetch('https://api.example.com/posts', {
    cache: 'no-store' // Or 'force-cache' or { next: { revalidate: 60 } }
  });
  return res.json();
}

export default async function PostsPage() {
  const posts = await getPosts();
  
  return (
    <div>
      {posts.map(post => (
        <div key={post.id}>{post.title}</div>
      ))}
    </div>
  );
}
```

---

## Loading States

```tsx
// components/DataDisplay.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/Button';

export function DataDisplay() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/data');
      const result = await response.json();
      setData(result);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <Button onClick={loadData} loading={loading}>
        {loading ? 'Loading...' : 'Load Data'}
      </Button>
      
      {loading && <div>Fetching data...</div>}
      
      {!loading && data && (
        <div>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
```

---

## Error Handling

```tsx
// components/SafeComponent.tsx
'use client';

import { useState } from 'react';

export function SafeComponent() {
  const [error, setError] = useState<string | null>(null);
  
  const handleAction = async () => {
    setError(null); // Clear previous errors
    
    try {
      const response = await fetch('/api/action');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      // Process data...
      
    } catch (err) {
      // Handle different error types
      if (err instanceof TypeError) {
        setError('Network error - please check your connection');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    }
  };
  
  return (
    <div>
      <button onClick={handleAction}>Perform Action</button>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
}
```

---

## Conditional Rendering

```tsx
// Multiple patterns for conditional rendering

export function ConditionalExamples({ user, isLoading, error }) {
  // Pattern 1: Ternary operator
  return <div>{user ? <p>Hello {user.name}</p> : <p>Please log in</p>}</div>;
  
  // Pattern 2: Logical AND (&&)
  return <div>{user && <p>Hello {user.name}</p>}</div>;
  
  // Pattern 3: Early return
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>Please log in</div>;
  
  return <div>Hello {user.name}</div>;
  
  // Pattern 4: Switch/case for multiple states
  const renderContent = () => {
    switch (status) {
      case 'loading':
        return <div>Loading...</div>;
      case 'error':
        return <div>Error occurred</div>;
      case 'success':
        return <div>Success!</div>;
      default:
        return <div>Unknown status</div>;
    }
  };
  
  return <div>{renderContent()}</div>;
  
  // Pattern 5: Inline IIFE for complex logic
  return (
    <div>
      {(() => {
        if (user?.isAdmin) return <AdminPanel />;
        if (user?.isPremium) return <PremiumFeatures />;
        return <BasicFeatures />;
      })()}
    </div>
  );
}
```

---

## List Rendering

```tsx
// Best practices for rendering lists

import { Product } from '@/types';

interface ProductListProps {
  products: Product[];
}

export function ProductList({ products }: ProductListProps) {
  // Pattern 1: Basic map
  return (
    <div>
      {products.map(product => (
        <div key={product.id}>
          {product.name}
        </div>
      ))}
    </div>
  );
  
  // Pattern 2: With index (only if no unique ID)
  return (
    <div>
      {products.map((product, index) => (
        <div key={`product-${index}`}>
          {product.name}
        </div>
      ))}
    </div>
  );
  
  // Pattern 3: Empty state
  if (products.length === 0) {
    return <div>No products found</div>;
  }
  
  return (
    <div>
      {products.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
  
  // Pattern 4: Filtered list
  const inStockProducts = products.filter(p => p.inStock);
  
  return (
    <div>
      {inStockProducts.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

---

## Performance Optimization

```tsx
// components/OptimizedComponent.tsx
'use client';

import { useState, useMemo, useCallback } from 'react';

interface Item {
  id: string;
  name: string;
  price: number;
}

export function OptimizedComponent({ items }: { items: Item[] }) {
  const [filter, setFilter] = useState('');
  
  // useMemo: Cache expensive calculations
  const filteredItems = useMemo(() => {
    return items.filter(item =>
      item.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [items, filter]); // Recalculates only when dependencies change
  
  const totalPrice = useMemo(() => {
    return filteredItems.reduce((sum, item) => sum + item.price, 0);
  }, [filteredItems]);
  
  // useCallback: Cache function references
  const handleDelete = useCallback((id: string) => {
    console.log('Deleting', id);
    // Delete logic...
  }, []); // Function reference stays the same
  
  return (
    <div>
      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter items..."
      />
      
      <p>Total: ${totalPrice.toFixed(2)}</p>
      
      {filteredItems.map(item => (
        <div key={item.id}>
          {item.name} - ${item.price}
          <button onClick={() => handleDelete(item.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

---

## Common Tailwind Patterns

```tsx
// Responsive design patterns

export function ResponsiveExample() {
  return (
    <>
      {/* Mobile-first responsive text */}
      <h1 className="text-2xl md:text-4xl lg:text-6xl">
        Responsive Heading
      </h1>
      
      {/* Responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Grid items */}
      </div>
      
      {/* Responsive padding */}
      <div className="px-4 md:px-8 lg:px-16">
        Content with responsive padding
      </div>
      
      {/* Show/hide on different screens */}
      <div className="block md:hidden">
        Mobile only
      </div>
      <div className="hidden md:block">
        Desktop only
      </div>
      
      {/* Flexbox responsive */}
      <div className="flex flex-col md:flex-row gap-4">
        <div>Item 1</div>
        <div>Item 2</div>
      </div>
    </>
  );
}
```

---

## Quick Tips

✅ **Do:**
- Use Server Components by default
- Add proper TypeScript types
- Extract reusable logic to custom hooks
- Keep components small (< 200 lines)
- Use semantic HTML (`button`, `nav`, `article`)

❌ **Don't:**
- Add `'use client'` without a reason
- Use `any` type in TypeScript
- Inline complex logic in JSX
- Forget to add `key` prop in lists
- Skip accessibility attributes

---

**For more details, see [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)**
