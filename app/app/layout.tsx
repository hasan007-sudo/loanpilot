import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "LoanPilot — Voice AI for Banks",
  description: "AI-powered loan pre-qualification dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Sidebar />
        <main className="min-h-screen pl-0 lg:pl-72">
          <div className="page-shell px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
