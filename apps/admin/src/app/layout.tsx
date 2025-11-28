import type { Metadata } from "next";
import Script from "next/script";
import { Atkinson_Hyperlegible, Cinzel, Inter } from "next/font/google";
// OPTIMIZATION: CSS is loaded normally - Next.js will optimize it automatically
// For critical CSS, consider using CSS-in-JS or inline critical styles
import "./globals.css";
import { UserAccessProvider } from "@/contexts/UserAccessContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ReactQueryProvider } from "@/providers/ReactQueryProvider";
import { SessionProviderWrapper } from "@/providers/SessionProviderWrapper";
// OPTIMIZATION: Lazy load NavigationProgress to reduce initial bundle size
// It uses framer-motion which is heavy, and navigation progress isn't critical for initial render
import { LazyNavigationProgressWrapper } from "@/components/ui/LazyNavigationProgress";
import { SiteSpeculationRules } from "@/components/SiteSpeculationRules";
import { CriticalSkeletonCSS } from "@/components/CriticalSkeletonCSS";

// Optimized font loading with next/font
// REVERTED: Keep display: 'swap' to maintain visual consistency
// The fonts are important to the site's design, so we want them to load even if slightly delayed
const inter = Inter({
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-inter',
});

const atkinson = Atkinson_Hyperlegible({
	weight: ['400', '700'],
	subsets: ['latin'],
	display: 'swap', // Keep swap - font is important for design
	variable: '--font-atkinson',
});

const cinzel = Cinzel({
	weight: ['400', '500', '600', '700'], // Restored all weights
	subsets: ['latin'],
	display: 'swap', // Keep swap - font is important for design
	variable: '--font-cinzel',
});

export const metadata: Metadata = {
	title: "The School Quiz",
	description: "Weekly quiz for Australian students"
};

// Cookie reading in this layout will make routes dynamic, but we don't force it globally
// Individual routes can opt into static rendering if they don't need cookies
// Routes that need cookies (like admin pages) will automatically be dynamic
// export const dynamic = "force-dynamic"; // Removed - let routes decide individually

export default function RootLayout({
	children
}: {
	children: React.ReactNode;
}) {
	// OPTIMIZATION: Layout is now synchronous - no cookie reading blocks initial render
	// The client-side script (sq-theme-prepaint) handles theme setting before React hydrates
	// This allows the HTML shell to render immediately, improving LCP significantly
	// Default to "light" for SSR - client script will update if needed
	// suppressHydrationWarning on html tag will handle any mismatch
	const ssrTheme = "light"; // Default - client script will update
	const isDark = false; // Default - client script will update

	return (
		<html
			lang="en"
			className={`${atkinson.variable} ${cinzel.variable} ${inter.variable} font-sans ${isDark ? "dark" : ""}`}
			data-theme={ssrTheme}
			suppressHydrationWarning
		>
			<head>
				{/* OPTIMIZATION: Preconnect to critical origins to reduce connection time */}
				<link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL || ''} crossOrigin="anonymous" />
				<link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL || ''} />
				
				{/* OPTIMIZATION: Prefetch likely next pages for faster navigation */}
				<link rel="prefetch" href="/quizzes" />
				<link rel="prefetch" href="/account" />
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
								
								// Suppress Next.js scroll warning for fixed header (development only)
								if (typeof window !== 'undefined' && window.console) {
									const originalWarn = console.warn;
									console.warn = function(...args) {
										const message = String(args[0] || '');
										// Suppress the specific Next.js scroll warning about fixed/sticky headers
										if (message.includes('Skipping auto-scroll behavior due to') && 
											(message.includes('position: sticky') || message.includes('position: fixed'))) {
											return; // Suppress this warning
										}
										originalWarn.apply(console, args);
									};
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
			<body className="bg-gray-50 dark:bg-[#0F1419] text-[hsl(var(--foreground))] overflow-x-hidden" suppressHydrationWarning>
				<CriticalSkeletonCSS />
				<LazyNavigationProgressWrapper />
				<SessionProviderWrapper>
					<ReactQueryProvider>
						<ThemeProvider>
							<UserAccessProvider>
								<SiteSpeculationRules />
								{children}
							</UserAccessProvider>
						</ThemeProvider>
					</ReactQueryProvider>
				</SessionProviderWrapper>
			</body>
		</html>
	);
}
