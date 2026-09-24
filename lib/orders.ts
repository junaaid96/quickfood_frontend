import type { Order, OrderStatus } from "./types";

export const FLOW: OrderStatus[] = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered"];

export const STATUS_COPY: Record<OrderStatus, { title: string; body: string; short: string }> = {
    pending: { title: "Waiting for the kitchen", body: "The restaurant will confirm your order in a moment.", short: "Placed" },
    confirmed: { title: "Order confirmed", body: "The kitchen accepted your order and it's next in line.", short: "Confirmed" },
    preparing: { title: "Being prepared", body: "Your food is on the stove right now.", short: "Preparing" },
    out_for_delivery: { title: "On the way", body: "Your rider picked it up and is heading to you.", short: "On the way" },
    delivered: { title: "Delivered. Enjoy!", body: "Hope it hit the spot.", short: "Delivered" },
    cancelled: { title: "Order cancelled", body: "This order won't be delivered. Any points used were returned.", short: "Cancelled" },
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
    if (order.status !== "out_for_delivery") return [0.06, 0.18, 0.35][idx] ?? 0;
    const started = order.events.find((e) => e.status === "out_for_delivery")?.created_at ?? order.updated_at;
    const eta = order.estimated_delivery_at ? new Date(order.estimated_delivery_at).getTime() : 0;
    const start = new Date(started).getTime();
    const total = Math.max(eta - start, 10 * 60 * 1000);
    return Math.min(0.97, 0.45 + 0.55 * ((now - start) / total));
}
