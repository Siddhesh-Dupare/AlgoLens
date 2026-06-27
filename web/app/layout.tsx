import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AlgoLens — See your data structures come alive",
  description:
    "AlgoLens is an open-source desktop tool that runs your real code and visualizes data structures — arrays, stacks, queues, linked lists, trees, graphs and more — step by step.",
  openGraph: {
    title: "AlgoLens — See your data structures come alive",
    description:
      "Run your real code and watch every data structure animate, step by step. Open source. For IEEE PuneCon 2026.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        "dark",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable,
      )}
    >
      <body className="min-h-full bg-[#0a0b0d] text-zinc-300 antialiased">
        {children}
      </body>
    </html>
  );
}
