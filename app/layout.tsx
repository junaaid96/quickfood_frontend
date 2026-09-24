import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/providers/auth-provider";
import { CartProvider } from "@/providers/cart-provider";
import { ThemeProvider, themeScript } from "@/providers/theme-provider";
import { ToastProvider } from "@/providers/toast-provider";
import Navbar from "@/components/shell/Navbar";
import MobileTabBar from "@/components/shell/MobileTabBar";
import CartDrawer from "@/components/cart/CartDrawer";
import SlowNetworkBanner from "@/components/shell/SlowNetworkBanner";
import Footer from "@/components/shell/Footer";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700", "800"] });
const body = Figtree({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
    title: { default: "QuickFood - Local food, delivered", template: "%s | QuickFood" },
    description: "Order from local kitchens with honest prices, live tracking and meals planned around your budget.",
};

export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#fbf8f4" },
        { media: "(prefers-color-scheme: dark)", color: "#13110f" },
    ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: themeScript }} />
            </head>
            <body className="min-h-[100dvh]" suppressHydrationWarning>
                <ThemeProvider>
                    <ToastProvider>
                        <AuthProvider>
                            <CartProvider>
                                <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-bg">
                                    Skip to content
                                </a>
                                <Navbar />
                                <SlowNetworkBanner />
                                <main id="main" className="min-h-[70dvh] pb-20 md:pb-0">
                                    {children}
                                </main>
                                <Footer />
                                <MobileTabBar />
                                <CartDrawer />
                            </CartProvider>
                        </AuthProvider>
                    </ToastProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
