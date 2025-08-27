import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/components/auth/AuthProvider'
import { PWAProvider } from '@/components/pwa/PWAProvider'

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CycleWise - Privacy-First Period Tracker",
  description: "A secure, offline-capable period and reproductive health tracker with wellness features. Your data stays private and encrypted.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CycleWise",
  },
  formatDetection: {
    telephone: false,
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="theme-color" content="#ec4899" />
      </head>
      <body
        className={`${inter.variable} antialiased min-h-screen bg-background font-sans`}
      >
        <PWAProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </PWAProvider>
      </body>
    </html>
  );
}