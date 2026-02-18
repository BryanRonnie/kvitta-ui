import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('lib/utils', () => {
    describe('cn (className utility)', () => {
        it('should merge class names', () => {
            const result = cn('base-class', 'additional-class');
            expect(result).toBeTruthy();
            expect(result).toContain('base-class');
        });

        it('should handle conditional classes', () => {
            const isActive = true;
            const result = cn('base', isActive && 'active');
            expect(result).toContain('active');
        });

        it('should filter out falsy values', () => {
            const result = cn('base', false && 'hidden', null, undefined, 'visible');
            expect(result).not.toContain('hidden');
            expect(result).toContain('visible');
        });

        it('should handle empty input', () => {
            const result = cn();
            expect(result).toBeDefined();
        });
    });
});
