import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AppProvider } from "@/components/app-provider";
import NextTopLoader from "nextjs-toploader";
import { DynamicFavicon } from "./dynamic-favicon";
import { DynamicMetadata } from "./dynamic-metadata";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Rently - Tìm phòng trọ dễ dàng",
  description: "Nền tảng kết nối chủ trọ và người thuê",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased w-auto min-h-screen bg-background overflow-x-hidden`}
      >
        <NextTopLoader
          color="hsl(var(--secondary-foreground))"
          showSpinner={false}
          speed={500}
        />
        <AppProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <DynamicFavicon />
            <DynamicMetadata />
            {children}
            <Toaster />
          </ThemeProvider>
        </AppProvider>
      </body>
    </html>
  );
}
