/**
 * Secure Password Utilities
 * 
 * Uses bcrypt for password hashing with proper salt rounds.
 * This is the industry standard for password security.
 * 
 * Why bcrypt?
 * - Designed specifically for password hashing (not just cryptographic hashing)
 * - Built-in salt generation (prevents rainbow table attacks)
 * - Configurable cost factor (slows down brute force attacks)
 * - Timing attack resistant
 */

import bcrypt from 'bcryptjs'

/**
 * Number of salt rounds for bcrypt
 * 
 * 12 rounds = ~300ms per hash (good balance of security and performance)
 * Higher rounds = more secure but slower
 * 
 * Industry standard: 10-12 rounds for most applications
 * For high-security: 14-15 rounds
 */
const SALT_ROUNDS = 12

/**
 * Hash a password using bcrypt
 * 
 * @param password - Plain text password to hash
 * @returns Promise resolving to bcrypt hash string
 * 
 * @example
 * const hash = await hashPassword('mySecurePassword123')
 * // Store hash in database
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length === 0) {
    throw new Error('Password cannot be empty')
  }

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }

  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS)
    return hash
  } catch (error) {
    throw new Error(`Failed to hash password: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Verify a password against a bcrypt hash
 * 
 * @param password - Plain text password to verify
 * @param hash - Bcrypt hash from database
 * @returns Promise resolving to true if password matches, false otherwise
 * 
 * @example
 * const isValid = await verifyPassword('mySecurePassword123', storedHash)
 * if (isValid) {
 *   // Allow login
 * }
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || password.length === 0) {
    return false
  }

  if (!hash || hash.length === 0) {
    return false
  }

  try {
    // bcrypt.compare is timing-safe (prevents timing attacks)
    const isValid = await bcrypt.compare(password, hash)
    return isValid
  } catch (error) {
    // Log error but don't expose details to prevent information leakage
    console.error('Password verification error:', error)
    return false
  }
}

/**
 * Check if a hash is a valid bcrypt hash
 * Useful for migration scenarios
 * 
 * @param hash - Hash string to validate
 * @returns true if hash appears to be a valid bcrypt hash
 */
export function isValidBcryptHash(hash: string): boolean {
  if (!hash || hash.length === 0) {
    return false
  }

  // Bcrypt hashes start with $2a$, $2b$, or $2y$ followed by cost and salt
  const bcryptRegex = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/
  return bcryptRegex.test(hash)
}

/**
 * Check if a hash is the old SHA256 format (for migration)
 * 
 * @param hash - Hash string to check
 * @returns true if hash appears to be SHA256 (64 hex characters)
 */
export function isOldSHA256Hash(hash: string): boolean {
  if (!hash || hash.length === 0) {
    return false
  }

  // SHA256 produces 64 hex characters
  const sha256Regex = /^[a-f0-9]{64}$/i
  return sha256Regex.test(hash)
}

