/**
 * localStorage abstraction utility
 * Provides type-safe, error-handled access to localStorage
 */

export class StorageError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'StorageError';
  }
}

class Storage {
  private isAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  get<T>(key: string, defaultValue: T): T {
    if (!this.isAvailable()) return defaultValue;
    
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      
      // Try to parse as JSON first
      try {
        return JSON.parse(item) as T;
      } catch {
        // If JSON parsing fails, return as plain string (for backwards compatibility)
        // This handles cases where values were stored directly without JSON.stringify
        return item as T;
      }
    } catch (error) {
      console.warn(`Failed to get localStorage item "${key}":`, error);
      return defaultValue;
    }
  }

  set<T>(key: string, value: T): void {
    if (!this.isAvailable()) {
      console.warn('localStorage is not available');
      return;
    }
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      throw new StorageError(`Failed to set localStorage item "${key}"`, error);
    }
  }

  remove(key: string): void {
    if (!this.isAvailable()) return;
    
    try {
      localStorage.removeItem(key);
    } catch (error) {
      throw new StorageError(`Failed to remove localStorage item "${key}"`, error);
    }
  }

  clear(): void {
    if (!this.isAvailable()) return;
    
    try {
      localStorage.clear();
    } catch (error) {
      throw new StorageError('Failed to clear localStorage', error);
    }
  }

  has(key: string): boolean {
    if (!this.isAvailable()) return false;
    return localStorage.getItem(key) !== null;
  }
}

class SessionStorage {
  private isAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const test = '__session_storage_test__';
      window.sessionStorage.setItem(test, test);
      window.sessionStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  get<T>(key: string, defaultValue: T): T {
    if (!this.isAvailable()) return defaultValue;
    
    try {
      const item = window.sessionStorage.getItem(key);
      if (item === null) return defaultValue;
      return JSON.parse(item) as T;
    } catch (error) {
      console.warn(`Failed to parse sessionStorage item "${key}":`, error);
      return defaultValue;
    }
  }

  set<T>(key: string, value: T): void {
    if (!this.isAvailable()) {
      console.warn('sessionStorage is not available');
      return;
    }
    
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      throw new StorageError(`Failed to set sessionStorage item "${key}"`, error);
    }
  }

  remove(key: string): void {
    if (!this.isAvailable()) return;
    
    try {
      window.sessionStorage.removeItem(key);
    } catch (error) {
      throw new StorageError(`Failed to remove sessionStorage item "${key}"`, error);
    }
  }

  clear(): void {
    if (!this.isAvailable()) return;
    
    try {
      window.sessionStorage.clear();
    } catch (error) {
      throw new StorageError('Failed to clear sessionStorage', error);
    }
  }

  has(key: string): boolean {
    if (!this.isAvailable()) return false;
    return window.sessionStorage.getItem(key) !== null;
  }
}

export const storage = new Storage();
export const sessionStorage = new SessionStorage();

// Convenience functions for common patterns
// These handle both JSON-stringified and plain string values for backwards compatibility
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const item = localStorage.getItem('authToken');
    if (!item) return null;
    // Try JSON parse, fallback to plain string
    try {
      return JSON.parse(item);
    } catch {
      return item;
    }
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  // Store as plain string for compatibility with sign-in form
  if (typeof window !== 'undefined') {
    localStorage.setItem('authToken', token);
  }
}

export function removeAuthToken(): void {
  storage.remove('authToken');
}

export function getUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const item = localStorage.getItem('userId');
    if (!item) return null;
    // Try JSON parse, fallback to plain string
    try {
      return JSON.parse(item);
    } catch {
      return item;
    }
  } catch {
    return null;
  }
}

export function setUserId(userId: string): void {
  // Store as plain string for compatibility with sign-in form
  if (typeof window !== 'undefined') {
    localStorage.setItem('userId', userId);
  }
}

export function getUserName(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const item = localStorage.getItem('userName');
    if (!item) return null;
    // Try JSON parse, fallback to plain string
    try {
      return JSON.parse(item);
    } catch {
      return item;
    }
  } catch {
    return null;
  }
}

export function setUserName(userName: string): void {
  // Store as plain string for compatibility with sign-in form
  if (typeof window !== 'undefined') {
    localStorage.setItem('userName', userName);
  }
}

export function getUserEmail(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const item = localStorage.getItem('userEmail');
    if (!item) return null;
    // Try JSON parse, fallback to plain string
    try {
      return JSON.parse(item);
    } catch {
      return item;
    }
  } catch {
    return null;
  }
}

export function setUserEmail(userEmail: string): void {
  // Store as plain string for compatibility with sign-in form
  if (typeof window !== 'undefined') {
    localStorage.setItem('userEmail', userEmail);
  }
}

export function isLoggedIn(): boolean {
  return storage.get('isLoggedIn', false);
}

export function setLoggedIn(value: boolean): void {
  storage.set('isLoggedIn', value);
}

export function getUserTier(): string | null {
  // Try to get from storage (JSON parsed)
  const tier = storage.get<string | null>('userTier', null);
  if (tier) return tier;
  
  // Fallback: try direct localStorage access (for backwards compatibility)
  if (typeof window !== 'undefined') {
    try {
      const direct = localStorage.getItem('userTier');
      if (direct) {
        // Try to parse if it's JSON, otherwise return as-is
        try {
          return JSON.parse(direct);
        } catch {
          return direct;
        }
      }
    } catch {
      // Ignore errors
    }
  }
  
  return null;
}

export function setUserTier(tier: string): void {
  storage.set('userTier', tier);
  // Also set directly for backwards compatibility
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('userTier', tier);
    } catch {
      // Ignore errors
    }
  }
}

