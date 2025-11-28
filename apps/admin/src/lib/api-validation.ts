/**
 * API Route Validation Utilities
 * 
 * Provides type-safe runtime validation for API route request bodies using Zod.
 * Integrates with existing error handling system.
 * 
 * Usage:
 *   import { validateRequest } from '@/lib/api-validation';
 *   import { z } from 'zod';
 * 
 *   const schema = z.object({ title: z.string().min(1) });
 *   const body = await validateRequest(request, schema);
 */

import { NextRequest } from 'next/server';
import { z, ZodSchema, ZodError } from 'zod';
import { ValidationError } from './api-error';

/**
 * Validate and parse request body with Zod schema
 * 
 * @param request - Next.js request object
 * @param schema - Zod schema to validate against
 * @returns Validated and parsed data (typed from schema)
 * @throws ValidationError if validation fails
 * 
 * @example
 * ```ts
 * const CreateQuizSchema = z.object({
 *   title: z.string().min(1),
 *   number: z.number(),
 * });
 * 
 * export async function POST(request: NextRequest) {
 *   const body = await validateRequest(request, CreateQuizSchema);
 *   // body is now typed and validated
 * }
 * ```
 */
export async function validateRequest<T extends ZodSchema>(
  request: NextRequest,
  schema: T
): Promise<z.infer<T>> {
  try {
    const rawBody = await request.json();
    const validated = schema.parse(rawBody);
    return validated;
  } catch (error) {
    if (error instanceof ZodError) {
      // Format Zod errors into a readable structure
      const formattedErrors = error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));

      throw new ValidationError(
        'Request validation failed',
        {
          errors: formattedErrors,
          // Also include raw Zod error for debugging
          _raw: error.errors,
        }
      );
    }

    // Handle JSON parse errors
    if (error instanceof SyntaxError || error instanceof TypeError) {
      throw new ValidationError(
        'Invalid JSON in request body',
        { originalError: error.message }
      );
    }

    // Re-throw unknown errors
    throw error;
  }
}

/**
 * Safe validation that returns result instead of throwing
 * Useful when you want to handle validation errors differently
 * 
 * @param request - Next.js request object
 * @param schema - Zod schema to validate against
 * @returns Validation result with success flag
 * 
 * @example
 * ```ts
 * const result = await validateRequestSafe(request, schema);
 * if (!result.success) {
 *   return NextResponse.json({ errors: result.errors }, { status: 400 });
 * }
 * const body = result.data;
 * ```
 */
export async function validateRequestSafe<T extends ZodSchema>(
  request: NextRequest,
  schema: T
): Promise<
  | { success: true; data: z.infer<T> }
  | { success: false; errors: Array<{ path: string; message: string; code: string }> }
> {
  try {
    const rawBody = await request.json();
    const result = schema.safeParse(rawBody);

    if (!result.success) {
      const formattedErrors = result.error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));

      return { success: false, errors: formattedErrors };
    }

    return { success: true, data: result.data };
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof TypeError) {
      return {
        success: false,
        errors: [
          {
            path: 'body',
            message: 'Invalid JSON in request body',
            code: 'invalid_json',
          },
        ],
      };
    }

    // Unknown error - return generic validation error
    return {
      success: false,
      errors: [
        {
          path: 'body',
          message: error instanceof Error ? error.message : 'Validation failed',
          code: 'unknown_error',
        },
      ],
    };
  }
}

/**
 * Validate query parameters
 * Useful for GET requests with search params
 * 
 * @param request - Next.js request object
 * @param schema - Zod schema to validate against
 * @returns Validated query parameters
 * 
 * @example
 * ```ts
 * const QuerySchema = z.object({
 *   page: z.coerce.number().min(1).default(1),
 *   limit: z.coerce.number().min(1).max(100).default(20),
 * });
 * 
 * export async function GET(request: NextRequest) {
 *   const query = await validateQuery(request, QuerySchema);
 * }
 * ```
 */
export async function validateQuery<T extends ZodSchema>(
  request: NextRequest,
  schema: T
): Promise<z.infer<T>> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params: Record<string, string | string[]> = {};

    // Convert URLSearchParams to object
    for (const [key, value] of searchParams.entries()) {
      // Handle array params (e.g., ?tags=foo&tags=bar)
      if (params[key]) {
        const existing = params[key];
        params[key] = Array.isArray(existing)
          ? [...existing, value]
          : [existing as string, value];
      } else {
        params[key] = value;
      }
    }

    const validated = schema.parse(params);
    return validated;
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));

      throw new ValidationError(
        'Query parameter validation failed',
        { errors: formattedErrors }
      );
    }

    throw error;
  }
}

/**
 * Validate route parameters (dynamic segments)
 * 
 * @param params - Route params object (from Next.js route handler)
 * @param schema - Zod schema to validate against
 * @returns Validated route parameters
 * 
 * @example
 * ```ts
 * const ParamsSchema = z.object({
 *   id: z.string().min(1),
 * });
 * 
 * export async function GET(
 *   request: NextRequest,
 *   { params }: { params: Promise<{ id: string }> }
 * ) {
 *   const { id } = await validateParams(await params, ParamsSchema);
 * }
 * ```
 */
export function validateParams<T extends ZodSchema>(
  params: Record<string, string | string[] | undefined>,
  schema: T
): z.infer<T> {
  try {
    const validated = schema.parse(params);
    return validated;
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));

      throw new ValidationError(
        'Route parameter validation failed',
        { errors: formattedErrors }
      );
    }

    throw error;
  }
}

