import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LinguaFlow - Hyper-Personalized & Multilingual Lesson Architect",
  description: "Create personalized language lessons for your students",
  icons: {
    icon: [
      {
        url: '/linguaflowfavicon.png',
        sizes: '32x32',
        type: 'image/png'
      },
      {
        url: '/linguaflowfavicon.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        url: '/linguaflowfavicon.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ],
    apple: {
      url: '/linguaflowfavicon.png',
      sizes: '180x180',
      type: 'image/png'
    }
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/linguaflowfavicon.png" sizes="any" />
        <link rel="apple-touch-icon" href="/linguaflowfavicon.png" sizes="180x180" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}