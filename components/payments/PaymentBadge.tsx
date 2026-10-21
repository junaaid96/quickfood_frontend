import { cn } from "@/lib/format";
import { METHOD_LABEL, PAYMENT_STATUS, isOnline } from "@/lib/payments";
import type { Order } from "@/lib/types";
import { GatewayMark } from "./GatewayMark";

const TONE = {
    ok: "bg-ok-soft text-ok",
    warn: "bg-warn-soft text-warn",
    danger: "bg-danger-soft text-danger",
    brand: "bg-brand-soft text-brand",
    neutral: "bg-surface-2 text-muted",
};

/** Compact "how is this paid" chip for the kitchen board and rider cards. */
export function PaymentBadge({ order, className }: { order: Order; className?: string }) {
    const p = order.payment;
    const method = p?.method ?? order.payment_method;
    const online = isOnline(method);
    const status = online && p ? PAYMENT_STATUS[p.status] : null;
    const text = online ? `${status?.label ?? "Paid"} · ${p?.method_label ?? METHOD_LABEL[method]}` : method === "card" ? "Card on delivery" : "Cash on delivery";
    return (
        <span className={cn("inline-flex min-w-0 items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-2 text-xs font-semibold", TONE[status?.tone ?? "neutral"], className)}>
            <GatewayMark method={method} size="sm" className="rounded-full" />
            <span className="truncate">{text}</span>
        </span>
    );
}
