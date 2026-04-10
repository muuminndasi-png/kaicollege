import type { Metadata } from "next";
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
  title: "Imperial College of Health and Allied Sciences - ICHAS",
  description: "Management System for Imperial College of Health and Allied Sciences, Zanzibar. Courses in Pharmaceutical Sciences, Nursing and Midwifery, and Clinical Dentistry.",
  keywords: ["ICHAS", "Imperial College", "Health Sciences", "Zanzibar", "Pharmaceutical Sciences", "Nursing", "Clinical Dentistry"],
  authors: [{ name: "Imperial College of Health and Allied Sciences" }],
  icons: {
    icon: "/images/college-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
