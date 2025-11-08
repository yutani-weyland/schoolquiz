import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SchoolQuiz Admin",
  description: "Quiz builder and management for SchoolQuiz"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="font-sans">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-background text-foreground">{children}</body>
    </html>
  );
}
