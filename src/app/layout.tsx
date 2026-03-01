import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BreedFinder - Find Your Perfect Pet Companion",
  description: "The most accurate, honest, and practical breed finder app with real cost/time data and breed-specific dietary information. Discover your perfect pet match through our smart quiz and swipeable breed cards.",
  keywords: ["pet finder", "dog breeds", "cat breeds", "pet adoption", "breed matching", "pet companion", "animal breeds"],
  authors: [{ name: "BreedFinder Team" }],
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BreedFinder",
  },
  openGraph: {
    title: "BreedFinder - Find Your Perfect Pet",
    description: "Smart breed matching with real costs, time commitments, and dietary info",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BreedFinder",
    description: "Find your perfect pet companion",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f97316",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
