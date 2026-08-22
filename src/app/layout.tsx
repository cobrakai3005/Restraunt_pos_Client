import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { AuthProvider } from "@/context/auth-context";
import { AppDataProviders } from "@/lib/providers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Vinimay Frontend Starter",
  description: "Sanitized onboarding copy of the Vinimay frontend UI structure.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`w-full ${inter.variable}`} suppressHydrationWarning>
      <body
        className="w-full m-0 p-0 overflow-x-hidden font-sans antialiased"
        suppressHydrationWarning
        style={{ fontFamily: "var(--font-inter)" }}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AppDataProviders><AuthProvider>
            {children}<Toaster />
          </AuthProvider></AppDataProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
