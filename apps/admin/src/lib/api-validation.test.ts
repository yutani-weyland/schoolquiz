/**
 * Tests for API Validation Utilities
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  SignupSchema,
  CreateQuizSchema,
  AdminCreateUserSchema,
  AdminUsersQuerySchema,
} from './validation/schemas';

describe('Zod Validation Schemas', () => {
  describe('SignupSchema', () => {

    it('should validate email signup', () => {
      const valid = {
        method: 'email',
        email: 'test@example.com',
        password: 'password123',
      };
      const result = SignupSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject email signup without email', () => {
      const invalid = {
        method: 'email',
        password: 'password123',
      };
      const result = SignupSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        // The refine error will be at root level, not on email path
        const hasError = result.error.errors.length > 0;
        expect(hasError).toBe(true);
        // Check that it mentions the required field for email method
        const errorMessage = result.error.errors.map(e => e.message).join(' ');
        expect(errorMessage.toLowerCase()).toMatch(/required|missing/);
      }
    });

    it('should validate phone signup', () => {
      const valid = {
        method: 'phone',
        phone: '+1234567890',
      };
      const result = SignupSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe('CreateQuizSchema', () => {

    it('should validate valid quiz', () => {
      const valid = {
        number: 1,
        title: 'Test Quiz',
        description: 'A test quiz',
        status: 'draft',
        rounds: [
          {
            category: 'General',
            title: 'Round 1',
            questions: [
              { question: 'Q1?', answer: 'A1' },
              { question: 'Q2?', answer: 'A2' },
            ],
          },
        ],
      };
      const result = CreateQuizSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject quiz without title', () => {
      const invalid = {
        number: 1,
        status: 'draft',
        rounds: [],
      };
      const result = CreateQuizSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('title');
      }
    });

    it('should reject quiz without rounds', () => {
      const invalid = {
        number: 1,
        title: 'Test Quiz',
        status: 'draft',
        rounds: [],
      };
      const result = CreateQuizSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('rounds');
      }
    });

    it('should reject invalid status', () => {
      const invalid = {
        number: 1,
        title: 'Test Quiz',
        status: 'invalid_status',
        rounds: [
          {
            category: 'General',
            title: 'Round 1',
            questions: [{ question: 'Q1?', answer: 'A1' }],
          },
        ],
      };
      const result = CreateQuizSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('AdminCreateUserSchema', () => {

    it('should validate valid user creation', () => {
      const valid = {
        email: 'user@example.com',
        name: 'John Doe',
        tier: 'basic',
      };
      const result = AdminCreateUserSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalid = {
        email: 'not-an-email',
        name: 'John Doe',
      };
      const result = AdminCreateUserSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('email');
      }
    });

    it('should reject missing email', () => {
      const invalid = {
        name: 'John Doe',
      };
      const result = AdminCreateUserSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('email');
      }
    });
  });

  describe('Query Parameter Schemas', () => {

    it('should validate pagination query', () => {
      const valid = {
        page: '1',
        limit: '20',
        search: 'test',
        tier: 'premium',
        sortBy: 'name',
        sortOrder: 'asc',
      };
      const result = AdminUsersQuerySchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        // Should coerce strings to numbers
        expect(typeof result.data.page).toBe('number');
        expect(typeof result.data.limit).toBe('number');
      }
    });

    it('should handle missing optional fields', () => {
      const minimal = {
        page: '1',
      };
      const result = AdminUsersQuerySchema.safeParse(minimal);
      expect(result.success).toBe(true);
    });

    it('should reject invalid page number', () => {
      const invalid = {
        page: '0', // Must be >= 1
      };
      const result = AdminUsersQuerySchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject invalid sort order', () => {
      const invalid = {
        sortOrder: 'invalid',
      };
      const result = AdminUsersQuerySchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});

describe('Validation Error Formatting', () => {
  it('should format Zod errors correctly', () => {
    const schema = z.object({
      email: z.string().email(),
      name: z.string().min(1),
    });

    const result = schema.safeParse({ email: 'invalid', name: '' });

    expect(result.success).toBe(false);
    if (!result.success) {
      const formatted = result.error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));

      expect(formatted).toHaveLength(2);
      expect(formatted[0].path).toBe('email');
      expect(formatted[1].path).toBe('name');
    }
  });
});

