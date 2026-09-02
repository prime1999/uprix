import type { Metadata } from "next";
import { Bricolage_Grotesque, Lato } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Next.js and Supabase Starter Kit",
  description: "The fastest way to build apps with Next.js and Supabase",
};

const bricolage = Bricolage_Grotesque({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const lato = Lato({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

// Configure custom local font
const myCustomFont = localFont({
  src: [
    {
      path: "./fonts/font-embrace.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-custom",
});
const myDeepFont = localFont({
  src: [
    {
      path: "./fonts/font-adelia.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-deep",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${bricolage.variable} ${lato.variable} ${myCustomFont.variable} ${myDeepFont.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
