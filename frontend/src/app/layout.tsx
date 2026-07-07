import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/lib/auth";
import { LibraryProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "Library Management System",
  description: "Multi-library book, member, and loan tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <AuthProvider>
          <LibraryProvider>
            <Navbar />
            <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
            <Footer />
          </LibraryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
