import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/providers/auth-provider";
import NavbarClient from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "QuickFood - Food Delivery",
    description: "Order food from your favorite restaurants",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className} suppressHydrationWarning>
                <AuthProvider>
                    <main className="min-h-screen bg-gray-50">
                        <NavbarClient />
                        {children}
                    </main>
                </AuthProvider>
            </body>
        </html>
    );
}
