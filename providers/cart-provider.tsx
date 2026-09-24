"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Overlay";
import { num } from "@/lib/format";
import type { MenuItem, RestaurantSummary } from "@/lib/types";

export type CartRestaurant = Pick<RestaurantSummary, "id" | "name" | "cover_image" | "cuisine" | "delivery_fee"> & {
    min_order?: string;
};
export type CartItem = Pick<MenuItem, "id" | "name" | "price" | "cover_image" | "is_vegetarian" | "category">;
export type CartLine = { item: CartItem; quantity: number; note: string };
type Cart = { restaurant: CartRestaurant | null; lines: CartLine[] };

type CartContextType = Cart & {
    count: number;
    subtotal: number;
    isOpen: boolean;
    open: () => void;
    close: () => void;
    add: (restaurant: CartRestaurant, item: CartItem, quantity?: number) => void;
    setQuantity: (itemId: number, quantity: number) => void;
    setNote: (itemId: number, note: string) => void;
    quantityOf: (itemId: number) => number;
    replace: (restaurant: CartRestaurant, lines: CartLine[]) => void;
    clear: () => void;
};

const STORAGE_KEY = "qf-cart";
const EMPTY: Cart = { restaurant: null, lines: [] };
const CartContext = createContext<CartContextType | undefined>(undefined);

const pick = (item: MenuItem | CartItem): CartItem => ({
    id: item.id,
    name: item.name,
    price: item.price,
    cover_image: item.cover_image,
    is_vegetarian: item.is_vegetarian,
    category: item.category,
});

export function CartProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<Cart>(EMPTY);
    const [hydrated, setHydrated] = useState(false);
    const [isOpen, setOpen] = useState(false);
    const [pending, setPending] = useState<{ restaurant: CartRestaurant; item: CartItem; quantity: number } | null>(null);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) setCart(JSON.parse(saved));
        } catch {}
        setHydrated(true);
    }, []);

    useEffect(() => {
        if (!hydrated) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
        } catch {}
    }, [cart, hydrated]);

    const addNow = useCallback((restaurant: CartRestaurant, item: CartItem, quantity: number) => {
        setCart((prev) => {
            const base = prev.restaurant?.id === restaurant.id ? prev : { restaurant, lines: [] };
            const existing = base.lines.find((l) => l.item.id === item.id);
            const lines = existing
                ? base.lines.map((l) => (l.item.id === item.id ? { ...l, quantity: Math.min(50, l.quantity + quantity) } : l))
                : [...base.lines, { item: pick(item), quantity, note: "" }];
            return { restaurant, lines };
        });
    }, []);

    const add = useCallback(
        (restaurant: CartRestaurant, item: CartItem, quantity = 1) => {
            if (cart.restaurant && cart.restaurant.id !== restaurant.id && cart.lines.length > 0) {
                setPending({ restaurant, item, quantity });
                return;
            }
            addNow(restaurant, item, quantity);
        },
        [cart.restaurant, cart.lines.length, addNow],
    );

    const setQuantity = useCallback((itemId: number, quantity: number) => {
        setCart((prev) => {
            const lines = quantity <= 0
                ? prev.lines.filter((l) => l.item.id !== itemId)
                : prev.lines.map((l) => (l.item.id === itemId ? { ...l, quantity } : l));
            return lines.length ? { ...prev, lines } : EMPTY;
        });
    }, []);

    const setNote = useCallback((itemId: number, note: string) => {
        setCart((prev) => ({ ...prev, lines: prev.lines.map((l) => (l.item.id === itemId ? { ...l, note } : l)) }));
    }, []);

    const value = useMemo<CartContextType>(() => {
        const count = cart.lines.reduce((s, l) => s + l.quantity, 0);
        const subtotal = cart.lines.reduce((s, l) => s + num(l.item.price) * l.quantity, 0);
        return {
            ...cart,
            count,
            subtotal,
            isOpen,
            open: () => setOpen(true),
            close: () => setOpen(false),
            add,
            setQuantity,
            setNote,
            quantityOf: (id) => cart.lines.find((l) => l.item.id === id)?.quantity ?? 0,
            replace: (restaurant, lines) => setCart({ restaurant, lines: lines.map((l) => ({ ...l, item: pick(l.item) })) }),
            clear: () => setCart(EMPTY),
        };
    }, [cart, isOpen, add, setQuantity, setNote]);

    return (
        <CartContext.Provider value={value}>
            {children}
            <Modal open={!!pending} onClose={() => setPending(null)} title="Start a new basket?">
                <p className="text-muted">
                    Your basket has items from <strong className="text-ink">{cart.restaurant?.name}</strong>. Orders come from one
                    kitchen at a time so everything arrives hot. Clear it and add{" "}
                    <strong className="text-ink">{pending?.item.name}</strong> from {pending?.restaurant.name}?
                </p>
                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button variant="outline" onClick={() => setPending(null)}>
                        Keep current basket
                    </Button>
                    <Button
                        onClick={() => {
                            if (pending) {
                                setCart(EMPTY);
                                addNow(pending.restaurant, pending.item, pending.quantity);
                            }
                            setPending(null);
                        }}
                    >
                        Start new basket
                    </Button>
                </div>
            </Modal>
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) throw new Error("useCart must be used within a CartProvider");
    return context;
}
