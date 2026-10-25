import { request } from "@/lib/api";
import { num } from "@/lib/format";
import type { OnlineGateway, Order, PaymentMethod, PaymentStatus } from "@/lib/types";

export const ONLINE_GATEWAYS: OnlineGateway[] = ["bkash", "nagad", "rocket", "upay", "sslcommerz"];

export const METHOD_LABEL: Record<PaymentMethod, string> = {
    cash: "Cash on delivery",
    card: "Card on delivery",
    bkash: "bKash",
    nagad: "Nagad",
    rocket: "Rocket",
    upay: "Upay",
    sslcommerz: "SSLCommerz",
};

export const GATEWAY_COPY: Record<OnlineGateway, { blurb: string; how: string }> = {
    bkash: { blurb: "Mobile wallet", how: "Wallet number, OTP and PIN on the bKash page" },
    nagad: { blurb: "Mobile wallet", how: "Account number, OTP and PIN on the Nagad page" },
    rocket: { blurb: "DBBL mobile wallet", how: "Rocket wallet number and PIN on the DBBL page" },
    upay: { blurb: "Mobile wallet", how: "Upay wallet number, OTP and PIN on the Upay page" },
    sslcommerz: { blurb: "Cards, wallets, net banking", how: "Choose a card or wallet on the SSLCommerz page" },
};

export function isOnline(method: PaymentMethod | undefined): method is OnlineGateway {
    return !!method && (ONLINE_GATEWAYS as string[]).includes(method);
}

export const PAYMENT_STATUS: Record<PaymentStatus, { label: string; tone: "ok" | "warn" | "danger" | "neutral" | "brand" }> = {
    on_delivery: { label: "Pay on delivery", tone: "neutral" },
    unpaid: { label: "Awaiting payment", tone: "warn" },
    paid: { label: "Paid", tone: "ok" },
    partially_refunded: { label: "Partly refunded", tone: "brand" },
    refunded: { label: "Refunded", tone: "brand" },
    failed: { label: "Payment failed", tone: "danger" },
    cancelled: { label: "Payment cancelled", tone: "danger" },
};

/** Taka amount shown next to the dollar total (the simulator charges in BDT). */
export function taka(value: string | number | null | undefined): string {
    return `৳${num(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Online order still waiting for money (kitchen can't see it yet). */
export function needsPayment(order: Order): boolean {
    const p = order.payment;
    return !!p?.online && order.status === "pending" && ["unpaid", "failed", "cancelled"].includes(p.status);
}

/** Opens a PaySim BD checkout session and sends the browser there. */
export async function startPayment(orderId: number, gateway: OnlineGateway): Promise<void> {
    const res = await request<{ redirect_url: string }>("/payments/start/", { method: "POST", body: { order: orderId, gateway } });
    window.location.assign(res.redirect_url);
}
