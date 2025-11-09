import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The School Quiz",
  description: "Weekly quiz for Australian students"
};

export default function RootLayout({
	children
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className="font-sans" suppressHydrationWarning>
			<head>
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
				<link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
				<script
					dangerouslySetInnerHTML={{
						__html: `
							(function() {
								const savedTheme = localStorage.getItem('theme');
								if (savedTheme === 'light') {
									document.documentElement.classList.remove('dark');
								} else {
									document.documentElement.classList.add('dark');
								}
							})();
						`,
					}}
				/>
			</head>
			<body className="bg-gray-50 dark:bg-[#1A1A1A] text-gray-900 dark:text-white" suppressHydrationWarning>
				{children}
			</body>
		</html>
	);
}
