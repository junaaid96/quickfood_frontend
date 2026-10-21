"use client";

import { useEffect, useState } from "react";
import { ArrowCounterClockwise, CheckCircle, Copy, Info, Money, ShieldCheck, WarningCircle, XCircle } from "@phosphor-icons/react";
import { request } from "@/lib/api";
import { cn, dateTime, money, num } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import { METHOD_LABEL, ONLINE_GATEWAYS, PAYMENT_STATUS, needsPayment, startPayment, taka } from "@/lib/payments";
import type { OnlineGateway, Order, PaymentConfig } from "@/lib/types";
import { useToast } from "@/providers/toast-provider";
import { Badge, Card } from "@/components/ui/Bits";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Overlay";
import { GatewayMark } from "./GatewayMark";

type Outcome = "success" | "failed" | "cancelled" | "pending";

/** Banner shown when the gateway sends the customer back (?payment=...). */
export function PaymentResultBanner({ order, outcome }: { order: Order; outcome: Outcome }) {
    const p = order.payment;
    const paid = p && ["paid", "partially_refunded", "refunded"].includes(p.status);
    const label = p?.method_label ?? (p ? METHOD_LABEL[p.method] : "");
    if (paid) {
        return (
            <div role="status" className="mt-4 flex animate-rise items-start gap-3 rounded-2xl bg-ok-soft p-4 text-ok">
                <CheckCircle size={26} weight="fill" className="shrink-0" />
                <div>
                    <p className="font-semibold">Payment received via {label}. The kitchen has your order.</p>
                    {p?.trx_id && <p className="text-sm opacity-90">Transaction ID {p.trx_id}</p>}
                </div>
            </div>
        );
    }
    if (outcome === "pending" || (outcome === "success" && !paid)) {
        return (
            <div role="status" className="mt-4 flex animate-rise items-center gap-3 rounded-2xl bg-warn-soft p-4 text-warn">
                <Info size={24} weight="fill" className="shrink-0" />
                <p className="font-semibold">Confirming your payment with {label || "the gateway"}…</p>
            </div>
        );
    }
    return (
        <div role="alert" className="mt-4 flex animate-rise items-start gap-3 rounded-2xl bg-danger-soft p-4 text-danger">
            <XCircle size={26} weight="fill" className="shrink-0" />
            <div>
                <p className="font-semibold">{outcome === "cancelled" ? "You cancelled the payment." : "The payment didn't go through."} Nothing was charged.</p>
                <p className="text-sm opacity-90">{friendlyReason(p?.failure_reason) || "Try again, pick another method, or pay cash on delivery."}</p>
            </div>
        </div>
    );
}

/** Gateway codes like "IPN FAILED" aren't meant for people; keep only readable reasons. */
function friendlyReason(reason?: string) {
    if (!reason || /^[A-Z_ ]+$/.test(reason) || /^IPN\b/i.test(reason)) return "";
    return reason;
}

/** Customer: retry an online payment or switch to cash while the order is still pending. */
export function PayNowCard({ order, onChanged }: { order: Order; onChanged: (o?: Order) => void }) {
    const toast = useToast();
    const { data: config } = useApi<PaymentConfig>("/payments/config/");
    const current = order.payment?.method;
    const [gateway, setGateway] = useState<OnlineGateway>(current && current !== "cash" && current !== "card" ? current : "bkash");
    const [busy, setBusy] = useState<"pay" | "cash" | null>(null);
    const enabled = config?.gateways ?? ONLINE_GATEWAYS;

    const pay = async () => {
        setBusy("pay");
        try {
            await startPayment(order.id, gateway);
        } catch (e) {
            toast((e as Error).message, "error");
            setBusy(null);
            onChanged();
        }
    };
    const cash = async () => {
        setBusy("cash");
        try {
            const updated = await request<Order>("/payments/pay-on-delivery/", { method: "POST", body: { order: order.id } });
            toast("Switched to cash on delivery. The kitchen has your order.");
            onChanged(updated);
        } catch (e) {
            toast((e as Error).message, "error");
        } finally {
            setBusy(null);
        }
    };

    return (
        <Card className="border-warn/40">
            <div className="flex items-start gap-3">
                <WarningCircle size={24} weight="fill" className="mt-0.5 shrink-0 text-warn" />
                <div className="min-w-0">
                    <h2 className="font-bold">Finish paying to send this to the kitchen</h2>
                    <p className="text-sm text-muted">
                        {money(order.total_price)} <span className="tabular">≈ {taka(order.payment?.amount_bdt || num(order.total_price) * num(config?.bdt_rate || 120))}</span>. The restaurant only sees the order once it&apos;s paid.
                    </p>
                </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Payment method">
                {ONLINE_GATEWAYS.map((g) => {
                    const on = enabled.includes(g);
                    return (
                        <button
                            key={g}
                            type="button"
                            role="radio"
                            aria-checked={gateway === g}
                            disabled={!on || !!busy}
                            onClick={() => setGateway(g)}
                            className={cn(
                                "flex flex-col items-center gap-1.5 rounded-2xl border-2 px-2 py-3 text-xs font-semibold transition disabled:opacity-40",
                                gateway === g ? "border-brand bg-brand-soft/60" : "border-line hover:border-ink/25",
                            )}
                        >
                            <GatewayMark method={g} />
                            {METHOD_LABEL[g]}
                        </button>
                    );
                })}
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button className="w-full sm:flex-1" loading={busy === "pay"} disabled={!!busy} onClick={pay}>
                    Pay with {METHOD_LABEL[gateway]}
                </Button>
                <Button variant="outline" className="w-full sm:flex-1" loading={busy === "cash"} disabled={!!busy} onClick={cash} icon={<Money size={18} />}>
                    Pay cash instead
                </Button>
            </div>
            <p className="mt-3 text-xs text-muted">Payments run on PaySim BD, an open-source gateway simulator. No real money moves.</p>
        </Card>
    );
}

/** Receipt block: method, status, reference, transaction ID, refunds. */
export function PaymentReceipt({ order }: { order: Order }) {
    const toast = useToast();
    const p = order.payment;
    if (!p) return null;
    const status = PAYMENT_STATUS[p.status] ?? PAYMENT_STATUS.unpaid;
    const copy = (v: string) => {
        navigator.clipboard?.writeText(v).then(() => toast("Copied"), () => null);
    };
    return (
        <div className="mt-4 rounded-2xl bg-surface-2 p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
                <span className="inline-flex min-w-0 items-center gap-2 font-semibold">
                    <GatewayMark method={p.method} size="sm" />
                    <span className="truncate">{p.method_label ?? METHOD_LABEL[p.method]}</span>
                </span>
                <Badge tone={status.tone}>{status.label}</Badge>
            </div>
            {p.online && (p.reference || p.trx_id) && (
                <dl className="mt-2 space-y-1 text-xs">
                    {p.amount_bdt && num(p.amount_bdt) > 0 && <IdRow label="Charged" value={taka(p.amount_bdt)} />}
                    {p.reference && <IdRow label="Reference" value={p.reference} onCopy={copy} />}
                    {p.trx_id && <IdRow label="Transaction ID" value={p.trx_id} onCopy={copy} />}
                    {p.paid_at && <IdRow label="Paid" value={dateTime(p.paid_at)} />}
                </dl>
            )}
            {!!p.refunds?.length && (
                <ul className="mt-3 space-y-1.5 border-t border-line pt-2 text-xs">
                    {p.refunds.map((r) => (
                        <li key={r.id} className="flex items-start justify-between gap-3">
                            <span className="min-w-0">
                                <span className={cn("font-semibold", r.status === "refunded" ? "text-ok" : "text-danger")}>
                                    {r.status === "refunded" ? "Refunded" : "Refund declined"}
                                </span>
                                <span className="text-muted">
                                    {" "}
                                    · {r.automatic ? "order cancelled" : r.reason || "by the restaurant"}
                                </span>
                                {r.reference && <span className="block truncate font-mono text-[11px] text-muted">{r.reference}</span>}
                            </span>
                            <span className="tabular shrink-0 text-right">
                                {money(r.amount)}
                                <span className="block text-muted">{taka(r.amount_bdt)}</span>
                            </span>
                        </li>
                    ))}
                </ul>
            )}
            {p.status === "refunded" && <p className="mt-2 text-xs text-muted">The full amount went back to your {p.method_label ?? METHOD_LABEL[p.method]} account.</p>}
            {p.online && p.status !== "on_delivery" && (
                <p className="mt-2 flex items-center gap-1 text-[11px] text-muted">
                    <ShieldCheck size={12} /> Simulated by PaySim BD
                </p>
            )}
        </div>
    );
}

function IdRow({ label, value, onCopy }: { label: string; value: string; onCopy?: (v: string) => void }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <dt className="text-muted">{label}</dt>
            <dd className="flex min-w-0 items-center gap-1 font-mono">
                <span className="truncate">{value}</span>
                {onCopy && (
                    <button type="button" onClick={() => onCopy(value)} aria-label={`Copy ${label.toLowerCase()}`} className="shrink-0 rounded p-0.5 text-muted hover:text-ink">
                        <Copy size={12} />
                    </button>
                )}
            </dd>
        </div>
    );
}

/** Owner: refund all or part of an online payment. */
export function RefundDialog({ order, open, onClose, onDone }: { order: Order; open: boolean; onClose: () => void; onDone: (o: Order) => void }) {
    const toast = useToast();
    const p = order.payment;
    const max = num(p?.refundable_amount);
    const rate = num(p?.bdt_rate) || 120;
    const [mode, setMode] = useState<"full" | "partial">("full");
    const [amount, setAmount] = useState("");
    const [reason, setReason] = useState("");
    const [confirming, setConfirming] = useState(false);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (open) {
            setMode("full");
            setAmount("");
            setReason("");
            setConfirming(false);
        }
    }, [open]);

    const value = mode === "full" ? max : num(amount);
    const invalid = !(value > 0) || value > max + 1e-9 || (mode === "partial" && !/^\d+(\.\d{1,2})?$/.test(amount.trim()));

    const submit = async () => {
        setBusy(true);
        try {
            const res = await request<{ refund_status: string; error: string; order: Order }>("/payments/refund/", {
                method: "POST",
                body: { order: order.id, amount: mode === "full" ? "" : value.toFixed(2), reason: reason.trim().slice(0, 200) },
            });
            if (res.refund_status === "refunded") toast(`Refunded ${money(value)} to the customer's ${p?.method_label ?? "account"}`);
            else toast(res.error || "The gateway declined the refund.", "error");
            onDone(res.order);
            onClose();
        } catch (e) {
            toast((e as Error).message, "error");
        } finally {
            setBusy(false);
        }
    };

    if (!p) return null;
    return (
        <Modal open={open} onClose={busy ? () => null : onClose} title={confirming ? "Confirm refund" : `Refund order #${order.id}`}>
            {!confirming ? (
                <>
                    <p className="text-sm text-muted">
                        Paid {money(p.amount)} via {p.method_label}. Up to <span className="font-semibold text-ink">{money(max)}</span> can still be refunded.
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Refund type">
                        {(["full", "partial"] as const).map((m) => (
                            <button
                                key={m}
                                type="button"
                                role="radio"
                                aria-checked={mode === m}
                                onClick={() => setMode(m)}
                                className={cn("rounded-2xl border-2 p-3 text-left text-sm transition", mode === m ? "border-brand bg-brand-soft/60" : "border-line hover:border-ink/25")}
                            >
                                <span className="block font-semibold">{m === "full" ? "Full refund" : "Partial refund"}</span>
                                <span className="tabular text-xs text-muted">{m === "full" ? money(max) : "Choose an amount"}</span>
                            </button>
                        ))}
                    </div>
                    {mode === "partial" && (
                        <label className="mt-4 block text-sm font-semibold">
                            Amount
                            <Input type="number" inputMode="decimal" min={0.01} max={max} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="mt-1" autoFocus />
                            {amount && invalid && <span className="mt-1 block text-xs font-normal text-danger">Enter an amount between {money(0.01)} and {money(max)}.</span>}
                        </label>
                    )}
                    <label className="mt-4 block text-sm font-semibold">
                        Reason <span className="font-normal text-muted">(shown to the customer)</span>
                        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Item out of stock" maxLength={200} className="mt-1" />
                    </label>
                    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button disabled={invalid} onClick={() => setConfirming(true)}>
                            Continue
                        </Button>
                    </div>
                </>
            ) : (
                <>
                    <p className="text-muted">
                        Send <span className="font-semibold text-ink">{money(value)}</span> <span className="tabular">({taka(value * rate)})</span> back to the customer&apos;s {p.method_label} account? This can&apos;t be undone.
                    </p>
                    {reason.trim() && <p className="mt-2 rounded-xl bg-surface-2 px-3 py-2 text-sm">Reason: {reason.trim()}</p>}
                    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button variant="outline" disabled={busy} onClick={() => setConfirming(false)}>
                            Back
                        </Button>
                        <Button loading={busy} onClick={submit} icon={<ArrowCounterClockwise size={18} />}>
                            Refund {money(value)}
                        </Button>
                    </div>
                </>
            )}
        </Modal>
    );
}

export { needsPayment };
