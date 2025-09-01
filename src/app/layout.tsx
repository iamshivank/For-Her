import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
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
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ec4899",
}

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
      </head>
      <body
        className={`${inter.variable} antialiased min-h-screen bg-background font-sans`}
      >
        {/* Animated gradient background */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]">
          <div className="absolute -inset-[10%] animate-[spin_18s_linear_infinite] bg-[conic-gradient(from_0deg,theme(colors.pink.200),theme(colors.purple.200),theme(colors.pink.200))] opacity-30" />
        </div>
        <PWAProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </PWAProvider>
        <Analytics />
      </body>
    </html>
  );
}