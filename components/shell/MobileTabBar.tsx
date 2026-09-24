"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartLine, ChefHat, Compass, House, Receipt, Storefront, User, Wallet } from "@phosphor-icons/react";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/format";

export default function MobileTabBar() {
    const { isRestaurantOwner, isAuthenticated } = useAuth();
    const pathname = usePathname();
    if (pathname === "/login" || pathname === "/register") return null;

    const tabs = isRestaurantOwner
        ? [
              { href: "/dashboard", label: "Overview", icon: ChartLine },
              { href: "/dashboard/orders", label: "Kitchen", icon: ChefHat },
              { href: "/dashboard/restaurants", label: "Restaurants", icon: Storefront },
              { href: "/profile", label: "Account", icon: User },
          ]
        : [
              { href: "/", label: "Home", icon: House },
              { href: "/restaurants", label: "Discover", icon: Compass },
              { href: "/planner", label: "Budget", icon: Wallet },
              { href: isAuthenticated ? "/orders" : "/login?redirect=/orders", label: "Orders", icon: Receipt },
              { href: isAuthenticated ? "/profile" : "/login", label: "Account", icon: User },
          ];

    const active = (href: string) => (href === "/" || href === "/dashboard" ? pathname === href : pathname.startsWith(href.split("?")[0]));

    return (
        <nav
            aria-label="Primary"
            className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
        >
            <div className="mx-auto grid max-w-md" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
                {tabs.map(({ href, label, icon: Icon }) => {
                    const on = active(href);
                    return (
                        <Link key={label} href={href} className={cn("flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold", on ? "text-brand" : "text-muted")}>
                            <Icon size={23} weight={on ? "fill" : "regular"} />
                            {label}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
