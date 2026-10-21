import { CreditCard, Money } from "@phosphor-icons/react";
import { cn } from "@/lib/format";
import type { PaymentMethod } from "@/lib/types";

/* Brand marks of the simulated gateways. Fixed brand colours on purpose: they identify the provider. */
const MARK: Record<string, { text: string; className: string }> = {
    bkash: { text: "bKash", className: "bg-[#E2136E] text-white" },
    nagad: { text: "Nagad", className: "bg-[#F6921E] text-white" },
    sslcommerz: { text: "SSL", className: "bg-[#1A5DAB] text-white" },
};

export function GatewayMark({ method, size = "md", className }: { method: PaymentMethod; size?: "sm" | "md"; className?: string }) {
    const m = MARK[method];
    if (!m) {
        const Icon = method === "card" ? CreditCard : Money;
        return (
            <span className={cn("inline-grid place-items-center rounded-lg bg-surface-2", size === "sm" ? "h-5 w-9" : "h-8 w-12", className)} aria-hidden>
                <Icon size={size === "sm" ? 13 : 20} className={method === "card" ? "text-brand" : "text-ok"} />
            </span>
        );
    }
    return (
        <span
            className={cn(
                "inline-grid shrink-0 place-items-center rounded-lg font-extrabold tracking-tight",
                size === "sm" ? "h-5 px-1.5 text-[10px]" : "h-8 min-w-12 px-2 text-xs",
                m.className,
                className,
            )}
            aria-hidden
        >
            {m.text}
        </span>
    );
}
