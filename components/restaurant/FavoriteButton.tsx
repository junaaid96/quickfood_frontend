"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "@phosphor-icons/react";
import { request } from "@/lib/api";
import { cn } from "@/lib/format";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";

export function FavoriteButton({
    restaurantId,
    initial,
    className,
    onChange,
}: {
    restaurantId: number;
    initial: boolean;
    className?: string;
    onChange?: (value: boolean) => void;
}) {
    const [fav, setFav] = useState(initial);
    const [busy, setBusy] = useState(false);
    const { isAuthenticated, isRestaurantOwner } = useAuth();
    const router = useRouter();
    const toast = useToast();

    if (isRestaurantOwner) return null;

    const toggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) {
            router.push(`/login?redirect=${encodeURIComponent(location.pathname)}`);
            return;
        }
        if (busy) return;
        setBusy(true);
        setFav(!fav);
        try {
            const res = await request<{ is_favorite: boolean }>(`/restaurants/restaurant/${restaurantId}/favorite/`, { method: "POST" });
            setFav(res.is_favorite);
            onChange?.(res.is_favorite);
            toast(res.is_favorite ? "Saved to favourites" : "Removed from favourites", "info");
        } catch {
            setFav(fav);
            toast("Could not update favourites", "error");
        } finally {
            setBusy(false);
        }
    };

    return (
        <button
            onClick={toggle}
            aria-pressed={fav}
            aria-label={fav ? "Remove from favourites" : "Save to favourites"}
            className={cn(
                "grid size-10 place-items-center rounded-full bg-surface/90 shadow-card backdrop-blur transition hover:scale-105",
                className,
            )}
        >
            <Heart size={20} weight={fav ? "fill" : "regular"} className={cn(fav ? "animate-pop text-brand" : "text-ink")} />
        </button>
    );
}
