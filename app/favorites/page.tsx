"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "@phosphor-icons/react";
import { useApi } from "@/lib/hooks";
import type { Restaurant } from "@/lib/types";
import { useAuth } from "@/providers/auth-provider";
import { EmptyState } from "@/components/ui/Bits";
import { LinkButton } from "@/components/ui/Button";
import { RestaurantCard, RestaurantCardSkeleton } from "@/components/restaurant/RestaurantCard";

export default function FavoritesPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const { data } = useApi<Restaurant[]>(user ? "/restaurants/restaurant/?favorites=1" : null);

    useEffect(() => {
        if (!isLoading && !user) router.replace("/login?redirect=/favorites");
    }, [isLoading, user, router]);

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
            <h1 className="text-3xl font-extrabold sm:text-4xl">Favourites</h1>
            <p className="mt-1 text-muted">Your go-to kitchens, one tap away.</p>
            <div className="mt-8">
                {!data ? (
                    <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <RestaurantCardSkeleton key={i} />
                        ))}
                    </div>
                ) : data.length === 0 ? (
                    <EmptyState icon={<Heart size={26} />} title="No favourites yet" body="Tap the heart on any restaurant to keep it here." action={<LinkButton href="/restaurants">Discover restaurants</LinkButton>} />
                ) : (
                    <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                        {data.map((r) => (
                            <RestaurantCard key={r.id} restaurant={r} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
