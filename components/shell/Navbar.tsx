"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
    CaretDown,
    ChartLine,
    Heart,
    MagnifyingGlass,
    Moon,
    Receipt,
    ShoppingBag,
    SignOut,
    Storefront,
    Sun,
    User,
} from "@phosphor-icons/react";
import { useAuth } from "@/providers/auth-provider";
import { useCart } from "@/providers/cart-provider";
import { useTheme } from "@/providers/theme-provider";
import { cn, initials } from "@/lib/format";
import { buttonClass } from "@/components/ui/Button";
import { Logo } from "./Logo";

const customerLinks = [
    { href: "/restaurants", label: "Discover" },
    { href: "/planner", label: "Budget Bites" },
    { href: "/orders", label: "Orders", auth: true },
];
const ownerLinks = [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/orders", label: "Kitchen" },
    { href: "/dashboard/restaurants", label: "Restaurants" },
];

export default function Navbar() {
    const { user, isAuthenticated, isRestaurantOwner, logout } = useAuth();
    const { count, open } = useCart();
    const { theme, toggle } = useTheme();
    const pathname = usePathname();
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const [query, setQuery] = useState("");
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => setMenuOpen(false), [pathname]);
    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    const links = (isRestaurantOwner ? ownerLinks : customerLinks).filter((l) => !("auth" in l) || isAuthenticated);
    const isActive = (href: string) =>
        href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(href + "/");

    return (
        <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/85 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:gap-4 sm:px-6">
                <Logo href={isRestaurantOwner ? "/dashboard" : "/"} />

                <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Main">
                    {links.map((l) => (
                        <Link
                            key={l.href}
                            href={l.href}
                            className={cn(
                                "rounded-full px-3.5 py-2 text-[15px] font-medium transition",
                                isActive(l.href) ? "bg-surface-2 text-ink" : "text-muted hover:text-ink",
                            )}
                        >
                            {l.label}
                        </Link>
                    ))}
                </nav>

                {!isRestaurantOwner && (
                    <form
                        role="search"
                        className="ml-auto hidden max-w-xs flex-1 lg:block"
                        onSubmit={(e) => {
                            e.preventDefault();
                            router.push(`/restaurants${query.trim() ? `?search=${encodeURIComponent(query.trim())}` : ""}`);
                        }}
                    >
                        <label className="flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm focus-within:border-brand">
                            <MagnifyingGlass size={17} className="text-muted" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search dishes or restaurants"
                                className="w-full bg-transparent placeholder:text-muted focus:outline-none"
                                aria-label="Search dishes or restaurants"
                            />
                        </label>
                    </form>
                )}

                <div className={cn("flex items-center gap-0.5 sm:gap-1.5", isRestaurantOwner ? "ml-auto" : "ml-auto lg:ml-2")}>
                    <button
                        onClick={toggle}
                        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                        className="grid size-10 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-ink"
                    >
                        {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    {!isRestaurantOwner && (
                        <button
                            onClick={open}
                            aria-label={`Open basket, ${count} items`}
                            className="relative grid size-10 place-items-center rounded-full text-ink transition hover:bg-surface-2"
                        >
                            <ShoppingBag size={22} />
                            {count > 0 && (
                                <span
                                    key={count}
                                    className="tabular absolute -top-0.5 -right-0.5 grid min-w-5 animate-pop place-items-center rounded-full bg-brand px-1 text-[11px] font-bold text-brand-ink"
                                >
                                    {count}
                                </span>
                            )}
                        </button>
                    )}

                    {isAuthenticated && user ? (
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setMenuOpen((o) => !o)}
                                aria-expanded={menuOpen}
                                aria-haspopup="menu"
                                className="flex items-center gap-1.5 rounded-full py-1 pr-2 pl-1 transition hover:bg-surface-2"
                            >
                                <span className="grid size-8 place-items-center rounded-full bg-ink text-xs font-bold text-bg">
                                    {initials(`${user.first_name || user.username} ${user.last_name || ""}`)}
                                </span>
                                <CaretDown size={14} className="hidden text-muted sm:block" />
                            </button>
                            {menuOpen && (
                                <div role="menu" className="absolute right-0 mt-2 w-60 animate-rise rounded-2xl border border-line bg-surface p-2 shadow-card">
                                    <div className="px-3 py-2">
                                        <p className="truncate font-semibold">{user.first_name || user.username}</p>
                                        <p className="text-sm text-muted">
                                            {isRestaurantOwner ? "Restaurant partner" : `${user.loyalty_tier} member, ${user.loyalty_points} pts`}
                                        </p>
                                    </div>
                                    <div className="my-1 h-px bg-line" />
                                    {(isRestaurantOwner
                                        ? [
                                              { href: "/dashboard", label: "Overview", icon: ChartLine },
                                              { href: "/dashboard/restaurants", label: "My restaurants", icon: Storefront },
                                              { href: "/profile", label: "Account", icon: User },
                                          ]
                                        : [
                                              { href: "/orders", label: "My orders", icon: Receipt },
                                              { href: "/favorites", label: "Favourites", icon: Heart },
                                              { href: "/profile", label: "Account and rewards", icon: User },
                                          ]
                                    ).map(({ href, label, icon: Icon }) => (
                                        <Link key={href} href={href} role="menuitem" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-surface-2">
                                            <Icon size={18} className="text-muted" /> {label}
                                        </Link>
                                    ))}
                                    <button onClick={logout} role="menuitem" className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-danger hover:bg-danger-soft">
                                        <SignOut size={18} /> Log out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5">
                            <span className="hidden sm:block">
                                <Link href="/login" className={buttonClass("ghost", "sm")}>
                                    Log in
                                </Link>
                            </span>
                            <Link href="/register" className={buttonClass("secondary", "sm")}>
                                Sign up
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
