/**
 * Client-side Providers
 * 
 * Wraps the app with client-side providers like AuthProvider.
 * Separated from layout.tsx to keep the root layout as a Server Component.
 */

'use client';

import { AuthProvider } from '@/lib/auth-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
