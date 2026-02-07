/**
 * Card Component
 * 
 * A reusable container component for content sections.
 * 
 * @example
 * ```tsx
 * <Card>
 *   <CardHeader>
 *     <h2>Title</h2>
 *   </CardHeader>
 *   <CardContent>
 *     <p>Content goes here</p>
 *   </CardContent>
 * </Card>
 * ```
 */

import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-lg shadow-md border border-gray-200
        overflow-hidden
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`px-6 py-4 border-b border-gray-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({ children, className = '', ...props }: CardProps) {
  return (
    <div className={`px-6 py-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`px-6 py-4 border-t border-gray-200 bg-gray-50 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
