/**
 * Password Utility Tests
 * 
 * Tests for secure password hashing and verification
 */

import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword, isValidBcryptHash, isOldSHA256Hash } from './password'

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a valid password', async () => {
      const password = 'mySecurePassword123'
      const hash = await hashPassword(password)
      
      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(50) // Bcrypt hashes are ~60 chars
      expect(isValidBcryptHash(hash)).toBe(true)
    })

    it('should produce different hashes for the same password (salt)', async () => {
      const password = 'samePassword123'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)
      
      // Different salts should produce different hashes
      expect(hash1).not.toBe(hash2)
      
      // But both should verify correctly
      expect(await verifyPassword(password, hash1)).toBe(true)
      expect(await verifyPassword(password, hash2)).toBe(true)
    })

    it('should throw error for empty password', async () => {
      await expect(hashPassword('')).rejects.toThrow('Password cannot be empty')
    })

    it('should throw error for password shorter than 8 characters', async () => {
      await expect(hashPassword('short')).rejects.toThrow('Password must be at least 8 characters')
    })

    it('should handle long passwords', async () => {
      const longPassword = 'a'.repeat(200) + 'Password123'
      const hash = await hashPassword(longPassword)
      
      expect(hash).toBeDefined()
      expect(await verifyPassword(longPassword, hash)).toBe(true)
    })
  })

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'correctPassword123'
      const hash = await hashPassword(password)
      
      const isValid = await verifyPassword(password, hash)
      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const password = 'correctPassword123'
      const hash = await hashPassword(password)
      
      const isValid = await verifyPassword('wrongPassword', hash)
      expect(isValid).toBe(false)
    })

    it('should return false for empty password', async () => {
      const hash = await hashPassword('somePassword123')
      const isValid = await verifyPassword('', hash)
      expect(isValid).toBe(false)
    })

    it('should return false for empty hash', async () => {
      const isValid = await verifyPassword('somePassword123', '')
      expect(isValid).toBe(false)
    })

    it('should handle timing attacks (verify takes similar time for wrong passwords)', async () => {
      const password = 'correctPassword123'
      const hash = await hashPassword(password)
      
      const wrongPasswords = [
        'wrongPassword1',
        'wrongPassword2',
        'wrongPassword3',
      ]
      
      const times: number[] = []
      
      for (const wrongPassword of wrongPasswords) {
        const start = Date.now()
        await verifyPassword(wrongPassword, hash)
        const end = Date.now()
        times.push(end - start)
      }
      
      // All verifications should take similar time (within 50ms variance)
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length
      const variance = times.every(t => Math.abs(t - avgTime) < 50)
      expect(variance).toBe(true)
    })
  })

  describe('isValidBcryptHash', () => {
    it('should identify valid bcrypt hash', async () => {
      const hash = await hashPassword('testPassword123')
      expect(isValidBcryptHash(hash)).toBe(true)
    })

    it('should reject invalid hash', () => {
      expect(isValidBcryptHash('not-a-hash')).toBe(false)
      expect(isValidBcryptHash('$2a$10$short')).toBe(false)
      expect(isValidBcryptHash('')).toBe(false)
    })
  })

  describe('isOldSHA256Hash', () => {
    it('should identify SHA256 hash', () => {
      // SHA256 of "test" = 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
      const sha256Hash = '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
      expect(isOldSHA256Hash(sha256Hash)).toBe(true)
    })

    it('should reject non-SHA256 strings', () => {
      expect(isOldSHA256Hash('not-sha256')).toBe(false)
      expect(isOldSHA256Hash('abc123')).toBe(false)
      expect(isOldSHA256Hash('')).toBe(false)
    })
  })

  describe('Integration: Real-world scenarios', () => {
    it('should handle user signup and login flow', async () => {
      // Simulate signup
      const userPassword = 'UserPassword123!'
      const storedHash = await hashPassword(userPassword)
      
      // Simulate login attempt with correct password
      const loginValid = await verifyPassword(userPassword, storedHash)
      expect(loginValid).toBe(true)
      
      // Simulate login attempt with wrong password
      const loginInvalid = await verifyPassword('WrongPassword', storedHash)
      expect(loginInvalid).toBe(false)
    })

    it('should handle password migration scenario', async () => {
      // Old SHA256 hash (for migration detection)
      const oldHash = '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
      expect(isOldSHA256Hash(oldHash)).toBe(true)
      
      // New bcrypt hash
      const newPassword = 'NewSecurePassword123'
      const newHash = await hashPassword(newPassword)
      expect(isValidBcryptHash(newHash)).toBe(true)
      expect(isOldSHA256Hash(newHash)).toBe(false)
    })
  })
})







