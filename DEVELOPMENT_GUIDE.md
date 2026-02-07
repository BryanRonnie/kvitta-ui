# Kvitta UI - Development Guide

A modern Next.js 16 application following 2025/2026 best practices for receipt processing with Nvidia AI.

## Table of Contents

- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Architecture Principles](#architecture-principles)
- [Common Tasks](#common-tasks)
  - [Creating a New Page](#creating-a-new-page)
  - [Building Components](#building-components)
  - [Adding API Endpoints](#adding-api-endpoints)
  - [Working with Types](#working-with-types)
- [Best Practices Checklist](#best-practices-checklist)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)

---

## Quick Start

### Prerequisites
- Node.js 18+ or Bun installed
- kvitta-api backend running (see `kvitta-api/README.md`)

### Installation

```bash
# Navigate to project
cd kvitta-ui

# Install dependencies (using Bun)
bun install

# Or using npm
npm install
```

### Environment Setup

Create a `.env.local` file in the project root:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Running Development Server

```bash
# Using Bun
bun dev

# Or using npm
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

---

## Project Structure

```
kvitta-ui/
├── app/                    # App Router (pages and layouts)
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Landing page (/)
│   └── upload/
│       └── page.tsx        # Upload page (/upload)
│
├── components/             # Reusable UI components
│   ├── Button.tsx          # Button with variants
│   ├── Card.tsx            # Card container components
│   └── FileUpload.tsx      # File upload with drag-and-drop
│
├── lib/                    # Utility functions and clients
│   └── api.ts              # Centralized API client
│
├── types/                  # TypeScript type definitions
│   └── index.ts            # All shared types
│
├── public/                 # Static assets
│
└── package.json            # Dependencies and scripts
```

### Key Directories Explained

- **`/app`**: Contains all routes using Next.js App Router. Each folder represents a route.
- **`/components`**: Reusable UI components that can be used across pages.
- **`/lib`**: Utility functions, API clients, and helper modules.
- **`/types`**: TypeScript interfaces and type definitions for type safety.

---

## Architecture Principles

### 1. Server Components by Default

In Next.js 16 with App Router, **all components are Server Components by default**.

**Benefits:**
- Zero JavaScript sent to client
- Faster page loads
- Better SEO
- Direct database access possible

**Example (Server Component):**

```tsx
// app/products/page.tsx
// No 'use client' directive = Server Component

import { Card } from '@/components/ui/card';

export default async function ProductsPage() {
  // Can make API calls directly here
  const products = await fetch('https://api.example.com/products').then(r => r.json());
  
  return (
    <div>
      <h1>Products</h1>
      {products.map(product => (
        <Card key={product.id}>
          <h2>{product.name}</h2>
          <p>${product.price}</p>
        </Card>
      ))}
    </div>
  );
}
```

### 2. Client Components When Needed

Use `'use client'` directive **only when you need:**
- React hooks (`useState`, `useEffect`, `useCallback`, etc.)
- Browser APIs (`window`, `document`, `localStorage`)
- Event handlers (`onClick`, `onChange`, etc.)
- Third-party libraries that use browser APIs

**Example (Client Component):**

```tsx
// components/Counter.tsx
'use client'; // Required for useState

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function Counter() {
  const [count, setCount] = useState(0); // useState requires client component
  
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

### 3. Centralized API Client

All API calls go through `lib/api.ts` for consistency and error handling.

**Benefits:**
- Single source of truth for API URLs
- Consistent error handling
- Easy to mock for testing
- Type-safe responses

---

## Common Tasks

### Creating a New Page

Pages in Next.js App Router are created by adding files to the `/app` directory.

#### Example: Create an "About" Page

**1. Create the file:**

```bash
# Create app/about/page.tsx
```

**2. Add the component:**

```tsx
// app/about/page.tsx

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-6">About Kvitta</h1>
      <p className="text-lg text-gray-600">
        Kvitta uses advanced AI technology to process receipts...
      </p>
    </div>
  );
}
```

**3. Access the page:**
Navigate to `http://localhost:3000/about`

#### With Dynamic Routes

For dynamic routes like `/products/[id]`, create:

```
app/
└── products/
    └── [id]/
        └── page.tsx
```

```tsx
// app/products/[id]/page.tsx

interface ProductPageProps {
  params: { id: string };
}

export default function ProductPage({ params }: ProductPageProps) {
  return (
    <div>
      <h1>Product ID: {params.id}</h1>
    </div>
  );
}
```

---

### Building Components

Components should be reusable, type-safe, and accessible.

#### Example: Creating a Badge Component

**1. Create the file:**

```tsx
// components/Badge.tsx

import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info';
}

export function Badge({ children, variant = 'info' }: BadgeProps) {
  // Define variant styles
  const variantClasses = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };
  
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}
```

**2. Use the component:**

```tsx
// app/dashboard/page.tsx

import { Badge } from '@/components/Badge';

export default function DashboardPage() {
  return (
    <div>
      <Badge variant="success">Active</Badge>
      <Badge variant="error">Failed</Badge>
    </div>
  );
}
```

#### Component Best Practices

✅ **DO:**
- Export named functions: `export function Button() {}`
- Use TypeScript interfaces for props
- Add JSDoc comments for documentation
- Make components composable (like Card + CardHeader + CardContent)
- Add appropriate accessibility attributes (`aria-label`, `role`, etc.)

❌ **DON'T:**
- Use default exports for components (except pages)
- Add `'use client'` unless absolutely necessary
- Hard-code values that could be props
- Forget to handle loading and error states

---

### Adding API Endpoints

All API interactions should go through the centralized `lib/api.ts` client.

#### Example: Add a New API Function

**1. Define the type in `types/index.ts`:**

```tsx
// types/index.ts

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
}
```

**2. Add the function to `lib/api.ts`:**

```tsx
// lib/api.ts

import { User, CreateUserRequest } from '@/types';

// ... existing code ...

/**
 * Create a new user
 * 
 * @example
 * ```tsx
 * const user = await createUser({
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   password: 'secure123'
 * });
 * ```
 */
export async function createUser(data: CreateUserRequest): Promise<User> {
  return apiRequest<User>('/users', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Get user by ID
 */
export async function getUser(userId: string): Promise<User> {
  return apiRequest<User>(`/users/${userId}`);
}
```

**3. Use in a component:**

```tsx
// app/profile/page.tsx
'use client'; // Need client component for useState

import { useState, useEffect } from 'react';
import { getUser } from '@/lib/api';
import { User } from '@/types';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function loadUser() {
      try {
        const userData = await getUser('123');
        setUser(userData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user');
      } finally {
        setLoading(false);
      }
    }
    
    loadUser();
  }, []);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>User not found</div>;
  
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

---

### Working with Types

TypeScript provides type safety and better developer experience.

#### Defining Types

Add all shared types to `types/index.ts`:

```tsx
// types/index.ts

/**
 * Product from the catalog
 */
export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  inStock: boolean;
}

/**
 * Shopping cart item
 */
export interface CartItem {
  product: Product;
  quantity: number;
}

/**
 * Order status enum
 */
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

/**
 * Full order details
 */
export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
}
```

#### Using Types in Components

```tsx
// components/ProductCard.tsx

import { Product } from '@/types';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <Card>
      <CardHeader>
        <h3>{product.name}</h3>
      </CardHeader>
      <CardContent>
        <p>{product.description}</p>
        <p className="font-bold">${product.price.toFixed(2)}</p>
        {product.inStock ? (
          <button onClick={() => onAddToCart?.(product)}>
            Add to Cart
          </button>
        ) : (
          <span>Out of Stock</span>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Best Practices Checklist

### Performance

- ✅ Use Server Components by default
- ✅ Add `'use client'` only when necessary
- ✅ Use Next.js `<Image>` component for images
- ✅ Use `<Link>` for navigation (not `<a>`)
- ✅ Implement loading.tsx for suspense boundaries
- ✅ Use `useCallback` and `useMemo` for expensive operations

### Type Safety

- ✅ Define interfaces for all props
- ✅ Use TypeScript strict mode
- ✅ Avoid `any` type - use `unknown` if needed
- ✅ Export types from `types/index.ts`
- ✅ Type all API responses

### Accessibility

- ✅ Use semantic HTML (`<button>`, `<nav>`, `<main>`, etc.)
- ✅ Add ARIA labels where needed
- ✅ Test keyboard navigation
- ✅ Ensure sufficient color contrast
- ✅ Add alt text to images

### Code Organization

- ✅ Keep components small and focused
- ✅ Use composition over prop drilling
- ✅ Centralize API calls in `lib/api.ts`
- ✅ Group related code in folders
- ✅ Add JSDoc comments to exported functions

### Styling

- ✅ Use Tailwind CSS utility classes
- ✅ Keep inline styles minimal
- ✅ Use consistent spacing scale
- ✅ Make designs responsive (mobile-first)
- ✅ Extract repeated class combinations into components

---

## Environment Variables

Environment variables must be prefixed with `NEXT_PUBLIC_` to be accessible in the browser.

### Setup

Create `.env.local` (ignored by git):

```env
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Feature flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false

# API Keys (server-side only - no NEXT_PUBLIC_ prefix)
NVIDIA_API_KEY=your_key_here
```

### Usage

```tsx
// Client-side (browser accessible)
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// Server-side only (not sent to browser)
const apiKey = process.env.NVIDIA_API_KEY; // Only works in Server Components
```

### Best Practices

- ✅ Use `.env.local` for local development
- ✅ Add `.env.production` for production overrides
- ✅ Never commit `.env.local` or actual API keys
- ✅ Document required variables in README
- ❌ Don't expose sensitive keys with `NEXT_PUBLIC_` prefix

---

## Deployment

### Build for Production

```bash
# Create optimized production build
bun run build

# Test production build locally
bun run start
```

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy automatically on every push

### Deploy to Other Platforms

#### Docker

```dockerfile
# Dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN bun run build

# Production image
FROM oven/bun:1-slim
WORKDIR /app

COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/public ./public

EXPOSE 3000
CMD ["bun", "server.js"]
```

Build and run:

```bash
docker build -t kvitta-ui .
docker run -p 3000:3000 kvitta-ui
```

### Environment Variables in Production

Add these in your deployment platform:

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NODE_ENV=production
```

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Getting Help

- Check existing issues in the repository
- Review Next.js documentation
- Ask team members on Slack
- Create detailed bug reports with reproduction steps

---

## Example Workflow: Adding a "History" Feature

Let's walk through a complete example of adding a new feature.

### Goal
Create a page showing receipt processing history with sorting and filtering.

### Step 1: Define Types

```tsx
// types/index.ts

export interface ReceiptHistory {
  id: string;
  fileName: string;
  status: 'success' | 'failed' | 'processing';
  totalAmount: number;
  processedAt: string;
}
```

### Step 2: Add API Function

```tsx
// lib/api.ts

export async function getReceiptHistory(): Promise<ReceiptHistory[]> {
  return apiRequest<ReceiptHistory[]>('/receipts/history');
}
```

### Step 3: Create the Page

```tsx
// app/history/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { getReceiptHistory } from '@/lib/api';
import { ReceiptHistory } from '@/types';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

export default function HistoryPage() {
  const [receipts, setReceipts] = useState<ReceiptHistory[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await getReceiptHistory();
        setReceipts(data);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Receipt History</h1>
      <div className="space-y-4">
        {receipts.map(receipt => (
          <Card key={receipt.id}>
            <CardHeader>
              <h2>{receipt.fileName}</h2>
            </CardHeader>
            <CardContent>
              <p>Status: {receipt.status}</p>
              <p>Total: ${receipt.totalAmount.toFixed(2)}</p>
              <p>Processed: {new Date(receipt.processedAt).toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### Step 4: Add Navigation Link

```tsx
// app/layout.tsx or a Navigation component

<Link href="/history">
  <Button variant="ghost">History</Button>
</Link>
```

That's it! You've added a complete feature following best practices.

---

**Happy coding! 🚀**
