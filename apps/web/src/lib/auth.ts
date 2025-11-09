// Auth utilities for client-side session management

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  subscriptionStatus: string;
  subscriptionPlan: string | null;
  subscriptionEndsAt: string | null;
  freeTrialEndsAt: string | null;
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("authToken");
}

export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("isLoggedIn") === "true";
}

export function getUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("userId");
}

export function getUserEmail(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("userEmail");
}

export function setAuthSession(token: string, userId: string, email?: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("authToken", token);
  localStorage.setItem("isLoggedIn", "true");
  localStorage.setItem("userId", userId);
  if (email) {
    localStorage.setItem("userEmail", email);
  }
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("authToken");
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userId");
  localStorage.removeItem("userEmail");
}

export async function fetchUser(): Promise<User | null> {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const response = await fetch("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      clearAuthSession();
      return null;
    }

    return await response.json();
  } catch {
    clearAuthSession();
    return null;
  }
}

export function hasActiveSubscription(user: User | null): boolean {
  if (!user) return false;
  return user.subscriptionStatus === "ACTIVE";
}

export function isTrialActive(user: User | null): boolean {
  if (!user) return false;
  if (user.subscriptionStatus !== "FREE_TRIAL") return false;
  if (!user.freeTrialEndsAt) return false;
  return new Date(user.freeTrialEndsAt) > new Date();
}

export function getTrialDaysRemaining(user: User | null): number {
  if (!isTrialActive(user) || !user?.freeTrialEndsAt) return 0;
  return Math.ceil(
    (new Date(user.freeTrialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
}

