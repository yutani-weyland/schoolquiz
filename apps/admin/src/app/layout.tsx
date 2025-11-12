import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import Script from "next/script";
import "./globals.css";
import { UserAccessProvider } from "@/contexts/UserAccessContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { getThemeFromCookie, Theme } from "@/lib/theme";

export const metadata: Metadata = {
  title: "The School Quiz",
  description: "Weekly quiz for Australian students"
};

// Ensure cookie is read per request (not cached)
export const dynamic = "force-dynamic";

export default async function RootLayout({
	children
}: {
	children: React.ReactNode;
}) {
	// Read theme from cookie server-side
	const cookieStore = await cookies();
	const themeCookie = cookieStore.get("sq_theme");
	const serverTheme = themeCookie?.value ? decodeURIComponent(themeCookie.value) : "";
	// Default to "light" for SSR - pre-paint script will set "color" for quiz pages before React hydrates
	// suppressHydrationWarning on html tag will handle the mismatch
	const ssrTheme = (serverTheme === "dark" || serverTheme === "light" || serverTheme === "color") ? serverTheme : "light";
	const isDark = ssrTheme === "dark";
	
	return (
		<html 
			lang="en" 
			className={`font-sans ${isDark ? "dark" : ""}`}
			data-theme={ssrTheme}
			suppressHydrationWarning
		>
			<head>
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
				<link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
				<script
					dangerouslySetInnerHTML={{
						__html: `
							(function() {
								// Capture safe-area-inset-top once to prevent header jumping on scroll
								try {
									// Create a temporary element to measure safe-area-inset-top
									const testEl = document.createElement('div');
									testEl.style.position = 'fixed';
									testEl.style.top = '0';
									testEl.style.left = '0';
									testEl.style.width = '1px';
									testEl.style.height = '1px';
									testEl.style.paddingTop = 'env(safe-area-inset-top)';
									testEl.style.visibility = 'hidden';
									document.documentElement.appendChild(testEl);
									const computedStyle = window.getComputedStyle(testEl);
									const safeAreaTop = computedStyle.paddingTop || '0px';
									document.documentElement.removeChild(testEl);
									document.documentElement.style.setProperty('--safe-area-top-fixed', safeAreaTop);
								} catch (e) {
									document.documentElement.style.setProperty('--safe-area-top-fixed', '0px');
								}
							})();
						`,
					}}
				/>
				<Script id="sq-theme-prepaint" strategy="beforeInteractive">
					{`
(function(){
	try{
		var m = document.cookie.match(/(?:^|; )sq_theme=([^;]*)/);
		var theme = m ? decodeURIComponent(m[1]) : "";
		if(!theme){
			// Check if we're on a quiz play page - default to "color" for quiz pages
			var isQuizPlayPage = window.location.pathname.includes('/play');
			if(isQuizPlayPage){
				theme = 'color';
			} else {
				var prefersDark = matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
				theme = prefersDark ? 'dark' : 'light';
			}
		}
		var html = document.documentElement;
		html.setAttribute('data-theme', theme);
		if(theme === 'dark') html.classList.add('dark'); else html.classList.remove('dark');
	}catch(e){}
})();
					`}
				</Script>
			</head>
			<body className="bg-gray-50 dark:bg-[#1A1A1A] text-gray-900 dark:text-white" suppressHydrationWarning>
				<ThemeProvider>
					<UserAccessProvider>
						{children}
					</UserAccessProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
