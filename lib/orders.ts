import type { Order, OrderStatus } from "./types";
import { clock } from "./format";

export const FLOW: OrderStatus[] = ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered"];

export const STATUS_COPY: Record<OrderStatus, { title: string; body: string; short: string; next?: string }> = {
    pending: { title: "Waiting for the kitchen", body: "The restaurant will accept your order in a moment.", short: "Order placed", next: "The kitchen accepts and sets a prep time" },
    confirmed: { title: "Order accepted", body: "The kitchen accepted your order and it's next in line.", short: "Accepted", next: "Cooking starts" },
    preparing: { title: "Being prepared", body: "Your food is being cooked right now.", short: "Preparing", next: "Packed and handed to a rider" },
    ready: { title: "Packed and ready", body: "Your order is packed and waiting for the rider.", short: "Ready for pickup", next: "Rider picks it up" },
    out_for_delivery: { title: "On the way", body: "Your rider picked it up and is heading to you.", short: "Out for delivery", next: "At your door" },
    delivered: { title: "Delivered. Enjoy!", body: "Hope it hit the spot.", short: "Delivered" },
    cancelled: { title: "Order cancelled", body: "This order won't be delivered. Any points used were returned.", short: "Cancelled" },
};

/** Short, notification-friendly copy for each change a customer cares about. */
export const STATUS_NOTICE: Partial<Record<OrderStatus, string>> = {
    confirmed: "accepted your order",
    preparing: "started cooking your order",
    ready: "packed your order. A rider is on the way to pick it up",
    out_for_delivery: "handed your order to the rider. It's on the way!",
    delivered: "delivered your order. Enjoy!",
    cancelled: "cancelled your order",
};

export const isActive = (s: OrderStatus) => s !== "delivered" && s !== "cancelled";

export function stepIndex(status: OrderStatus) {
    return FLOW.indexOf(status);
}

/** 0..1 progress used by progress bars and the courier on the map. */
export function orderProgress(order: Order, now = Date.now()): number {
    if (order.status === "delivered") return 1;
    if (order.status === "cancelled") return 0;
    const idx = stepIndex(order.status);
    if (order.status !== "out_for_delivery") return [0.06, 0.16, 0.27, 0.38][idx] ?? 0;
    const started = order.events.find((e) => e.status === "out_for_delivery")?.created_at ?? order.updated_at;
    const eta = order.estimated_delivery_at ? new Date(order.estimated_delivery_at).getTime() : 0;
    const start = new Date(started).getTime();
    const total = Math.max(eta - start, 10 * 60 * 1000);
    return Math.min(0.97, 0.45 + 0.55 * ((now - start) / total));
}

/**
 * Honest ETA copy: a time window while the kitchen is still working (estimates are rough),
 * then a precise "N min" once the rider has the food.
 */
export function etaDisplay(order: Order, now = Date.now()): { big: string; small: string; late: boolean } | null {
    if (!isActive(order.status) || !order.estimated_delivery_at) return null;
    if (order.scheduled_for && new Date(order.scheduled_for).getTime() > now + 30 * 60000) {
        return { big: clock(order.scheduled_for), small: "scheduled delivery", late: false };
    }
    const eta = new Date(order.estimated_delivery_at).getTime();
    const mins = Math.round((eta - now) / 60000);
    const late = mins < -2;
    if (order.status === "out_for_delivery") {
        return { big: mins > 1 ? `${mins} min` : "Any minute", small: `arriving by ${clock(eta)}`, late };
    }
    if (order.status === "pending") {
        return { big: "Waiting", small: "ETA appears once the kitchen accepts", late: false };
    }
    const spread = order.status === "ready" ? 3 : 5;
    const from = Math.max(eta - spread * 60000, now + 60000);
    const to = Math.max(eta + spread * 60000, from + 5 * 60000);
    return { big: `${clock(from)} – ${clock(to)}`, small: late ? "running a little late" : "estimated arrival", late };
}

/** Minutes the kitchen has left on its own prep estimate (negative = over). */
export function prepRemaining(order: Order, now = Date.now()): number | null {
    if (!order.prep_minutes || !["confirmed", "preparing"].includes(order.status)) return null;
    const accepted = order.events.find((e) => e.status === "confirmed" || e.status === "preparing")?.created_at;
    if (!accepted) return null;
    return Math.round((new Date(accepted).getTime() + order.prep_minutes * 60000 - now) / 60000);
}
