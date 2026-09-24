"use client";

import { useState } from "react";
import { request } from "./api";
import type { MenuItem, RestaurantSummary } from "./types";
import { toCartRestaurant } from "./plan";
import { useCart } from "@/providers/cart-provider";
import { useToast } from "@/providers/toast-provider";

type ReorderResponse = { restaurant: RestaurantSummary; items: { menu_item: MenuItem; quantity: number; note: string }[]; unavailable: string[] };

export function useReorder() {
    const cart = useCart();
    const toast = useToast();
    const [busy, setBusy] = useState<number | null>(null);

    const reorder = async (orderId: number) => {
        setBusy(orderId);
        try {
            const res = await request<ReorderResponse>(`/orders/${orderId}/reorder/`, { method: "POST" });
            if (!res.items.length) {
                toast("None of those dishes are available right now", "error");
                return;
            }
            cart.replace(
                toCartRestaurant(res.restaurant),
                res.items.map((i) => ({ item: i.menu_item, quantity: i.quantity, note: i.note })),
            );
            cart.open();
            if (res.unavailable.length) toast(`Unavailable today: ${res.unavailable.join(", ")}`, "info");
        } catch (e) {
            toast((e as Error).message, "error");
        } finally {
            setBusy(null);
        }
    };
    return { reorder, busy };
}
