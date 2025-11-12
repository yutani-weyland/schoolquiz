/**
 * Unified theme system - single source of truth
 * Supports: "dark" | "light" | "color"
 */

export type Theme = "light" | "dark" | "color";

const THEME_COOKIE_NAME = "sq_theme";
const THEME_COOKIE_PATH = "/";
const THEME_COOKIE_MAX_AGE = 31536000; // 1 year

/**
 * Get theme from cookie (for SSR)
 */
export function getThemeFromCookie(cookieHeader?: string | null): Theme | "" {
	if (!cookieHeader) return "";
	
	try {
		const match = cookieHeader.match(/(?:^|; )sq_theme=([^;]*)/);
		if (match) {
			const decoded = decodeURIComponent(match[1]);
			if (decoded === "dark" || decoded === "light" || decoded === "color") {
				return decoded as Theme;
			}
		}
	} catch (e) {
		// Ignore cookie parsing errors
	}
	
	return "";
}

/**
 * Get theme from cookie (client-side)
 */
export function getThemeFromCookieClient(): Theme | "" {
	if (typeof document === "undefined") return "";
	return getThemeFromCookie(document.cookie);
}

/**
 * Unified theme setter - use this everywhere
 * Sets <html data-theme="...">, toggles dark class, writes cookie, and optionally mirrors to localStorage
 */
export function applyTheme(next: Theme): void {
	if (typeof document === "undefined") return;
	
	const html = document.documentElement;
	
	// Set data-theme attribute
	html.setAttribute("data-theme", next);
	
	// Toggle dark class
	if (next === "dark") {
		html.classList.add("dark");
	} else {
		html.classList.remove("dark");
	}
	
	// IMPORTANT: cookie visible to all routes
	// Write cookie with proper format (Path=/ with capital P, Max-Age with capital M)
	try {
		document.cookie = [
			`${THEME_COOKIE_NAME}=${encodeURIComponent(next)}`,
			`Path=${THEME_COOKIE_PATH}`,
			`Max-Age=${THEME_COOKIE_MAX_AGE}`,
			"SameSite=Lax"
		].join("; ");
	} catch (e) {
		// Ignore cookie errors
	}
	
	// Optional: mirror to localStorage
	try {
		localStorage.setItem("sq_theme", next);
	} catch (e) {
		// Ignore localStorage errors
	}
}

/**
 * Set theme cookie (deprecated - use applyTheme instead)
 * @deprecated Use applyTheme instead
 */
export function setThemeCookie(theme: Theme): void {
	applyTheme(theme);
}

/**
 * Apply theme to document (deprecated - use applyTheme instead)
 * @deprecated Use applyTheme instead
 */
export function applyThemeToDocument(theme: Theme): void {
	applyTheme(theme);
}

/**
 * Get initial theme (client-side)
 * Checks cookie first, then falls back to OS preference
 */
export function getInitialTheme(): Theme {
	if (typeof window === "undefined") return "light";
	
	// Check cookie first
	const cookieTheme = getThemeFromCookieClient();
	if (cookieTheme) {
		return cookieTheme;
	}
	
	// Fallback to OS preference
	try {
		if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
			return "dark";
		}
	} catch (e) {
		// Ignore matchMedia errors
	}
	
	return "light";
}

