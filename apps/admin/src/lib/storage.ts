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
      return JSON.parse(item) as T;
    } catch (error) {
      console.warn(`Failed to parse localStorage item "${key}":`, error);
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
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  get<T>(key: string, defaultValue: T): T {
    if (!this.isAvailable()) return defaultValue;
    
    try {
      const item = sessionStorage.getItem(key);
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
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      throw new StorageError(`Failed to set sessionStorage item "${key}"`, error);
    }
  }

  remove(key: string): void {
    if (!this.isAvailable()) return;
    
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      throw new StorageError(`Failed to remove sessionStorage item "${key}"`, error);
    }
  }

  clear(): void {
    if (!this.isAvailable()) return;
    
    try {
      sessionStorage.clear();
    } catch (error) {
      throw new StorageError('Failed to clear sessionStorage', error);
    }
  }

  has(key: string): boolean {
    if (!this.isAvailable()) return false;
    return sessionStorage.getItem(key) !== null;
  }
}

export const storage = new Storage();
export const sessionStorage = new SessionStorage();

// Convenience functions for common patterns
export function getAuthToken(): string | null {
  return storage.get<string | null>('authToken', null);
}

export function setAuthToken(token: string): void {
  storage.set('authToken', token);
}

export function removeAuthToken(): void {
  storage.remove('authToken');
}

export function getUserId(): string | null {
  return storage.get<string | null>('userId', null);
}

export function setUserId(userId: string): void {
  storage.set('userId', userId);
}

export function getUserName(): string | null {
  return storage.get<string | null>('userName', null);
}

export function setUserName(userName: string): void {
  storage.set('userName', userName);
}

export function getUserEmail(): string | null {
  return storage.get<string | null>('userEmail', null);
}

export function setUserEmail(userEmail: string): void {
  storage.set('userEmail', userEmail);
}

export function isLoggedIn(): boolean {
  return storage.get('isLoggedIn', false);
}

export function setLoggedIn(value: boolean): void {
  storage.set('isLoggedIn', value);
}

