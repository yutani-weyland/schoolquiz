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

// Cookie reading requires dynamic rendering, but we can still cache where possible
// Individual routes can override this with their own dynamic/static settings
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
				<link rel="preconnect" href="https://raw.githubusercontent.com" crossOrigin="anonymous" />
				<link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&display=swap" rel="stylesheet" />
				{/* Achievement card fonts - Expanded library */}
				{/* Sans Serif */}
				<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;500;600;700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;500;700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;500;700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Fira+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
				{/* Display - Bold & Edgy */}
				<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Righteous&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Bungee&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Bungee+Shade&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Bungee+Inline&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Bungee+Hairline&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Black+Ops+One&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Audiowide&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Rubik+Glitch&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Russo+One&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Creepster&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Fascinate&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Fascinate+Inline&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Faster+One&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Freckle+Face&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Frijole&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Fugaz+One&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Graduate&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Griffy&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Iceberg&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Iceland&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Jockey+One&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Knewave&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Londrina+Outline&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Londrina+Shadow&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Londrina+Sketch&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Londrina+Solid&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Megrim&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Metal&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Metal+Mania&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Monofett&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Monoton&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Nosifer&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Nova+Square&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Plaster&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Ribeye&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Ribeye+Marrow&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Rye&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Seymour+One&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Sigmar+One&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Stalinist+One&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Stardos+Stencil&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Wallpoet&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Wendy+One&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Zilla+Slab+Highlight&display=swap" rel="stylesheet" />
				{/* Futuristic & Tech */}
				<link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@400;500;600;700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Titillium+Web:wght@400;600;700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Aldrich&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Electrolize&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Share+Tech&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=VT323&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Quantico:wght@400;700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Sarpanch:wght@400;500;600;700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Saira:wght@400;500;600;700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@400;500;600;700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Saira+Extra+Condensed:wght@400;500;600;700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Saira+Semi+Condensed:wght@400;500;600;700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Saira+Stencil+One&display=swap" rel="stylesheet" />
				{/* Retro & Vintage */}
				<link href="https://fonts.googleapis.com/css2?family=Butcherman&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Ewert&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Flamenco:wght@400&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Gravitas+One&display=swap" rel="stylesheet" />
				{/* Serif */}
				<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;500;600;700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=PT+Serif:wght@400;700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com/css2?family=Source+Serif+Pro:wght@400;600;700&display=swap" rel="stylesheet" />
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
			<body className="bg-gray-50 dark:bg-[#0F1419] text-[hsl(var(--foreground))]" suppressHydrationWarning>
				<ThemeProvider>
					<UserAccessProvider>
						{children}
					</UserAccessProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
