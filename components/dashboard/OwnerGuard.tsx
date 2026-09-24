"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { Skeleton } from "@/components/ui/Bits";

/** Renders children only for signed-in restaurant owners. */
export function OwnerGuard({ children }: { children: React.ReactNode }) {
    const { user, isLoading, isRestaurantOwner } = useAuth();
    const router = useRouter();
    useEffect(() => {
        if (isLoading) return;
        if (!user) router.replace(`/login?redirect=${encodeURIComponent(location.pathname)}`);
        else if (!isRestaurantOwner) router.replace("/restaurants");
    }, [isLoading, user, isRestaurantOwner, router]);

    if (!user || !isRestaurantOwner) {
        return (
            <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6">
                <Skeleton className="h-10 w-72" />
                <div className="grid gap-4 sm:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-28 rounded-3xl" />
                    ))}
                </div>
            </div>
        );
    }
    return <>{children}</>;
}
