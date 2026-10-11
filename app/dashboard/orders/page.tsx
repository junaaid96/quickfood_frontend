"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
    ArrowRight,
    CalendarCheck,
    ChatCircleDots,
    ChefHat,
    Leaf,
    Lightning,
    SpeakerHigh,
    SpeakerSlash,
    X,
} from "@phosphor-icons/react";
import { request } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import { clock, cn, money, timeAgo } from "@/lib/format";
import { prepRemaining } from "@/lib/orders";
import { useRealtimeState, useUserPushes } from "@/lib/realtime";
import { useAuth } from "@/providers/auth-provider";
import { RiderBeacon } from "@/components/orders/RiderBeacon";
import type { Order, OrderStatus, Restaurant } from "@/lib/types";
import { useToast } from "@/providers/toast-provider";
import { Badge, EmptyState } from "@/components/ui/Bits";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Overlay";

const COLUMNS: { status: OrderStatus; title: string; action: string; next: OrderStatus; hint: string }[] = [
    { status: "pending", title: "New", action: "Accept", next: "confirmed", hint: "Accept and set a prep time" },
    { status: "confirmed", title: "Accepted", action: "Start cooking", next: "preparing", hint: "Queued for the line" },
    { status: "preparing", title: "Cooking", action: "Mark ready", next: "ready", hint: "On the stove" },
    { status: "ready", title: "Ready", action: "Hand to rider", next: "out_for_delivery", hint: "Packed, waiting for pickup" },
    { status: "out_for_delivery", title: "On the way", action: "Mark delivered", next: "delivered", hint: "With the rider" },
];

const PREP_CHOICES = [10, 15, 20, 30, 45];

/** A short two-note chime, generated so we don't ship an audio file. */
function chime() {
    try {
        const ctx = new AudioContext();
        [880, 1320].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.16);
            gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + i * 0.16 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.16 + 0.3);
            osc.connect(gain).connect(ctx.destination);
            osc.start(ctx.currentTime + i * 0.16);
            osc.stop(ctx.currentTime + i * 0.16 + 0.32);
        });
    } catch {}
}

export default function KitchenBoard() {
    const toast = useToast();
    const { user } = useAuth();
    const realtime = useRealtimeState();
    // New orders and status changes arrive over Ably; polling remains as the fallback.
    const { data: orders, mutate } = useApi<Order[]>("/orders/?status=active", { refreshInterval: realtime ? 20000 : 5000, revalidateOnFocus: true });
    useUserPushes(user?.id, () => mutate());
    const { data: restaurants, mutate: mutateRestaurants } = useApi<Restaurant[]>("/restaurants/restaurant/?owner=me");
    const [sound, setSound] = useState(true);
    const [busy, setBusy] = useState<number | null>(null);
    const [rejecting, setRejecting] = useState<Order | null>(null);
    const [accepting, setAccepting] = useState<Order | null>(null);
    const [focus, setFocus] = useState<OrderStatus>("pending");
    const [fresh, setFresh] = useState<Set<number>>(new Set());
    const seen = useRef<Set<number> | null>(null);
    const [, tick] = useState(0);

    useEffect(() => {
        const t = setInterval(() => tick((n) => n + 1), 30000);
        return () => clearInterval(t);
    }, []);

    // Detect new incoming orders between polls.
    useEffect(() => {
        if (!orders) return;
        const pendingIds = orders.filter((o) => o.status === "pending").map((o) => o.id);
        if (seen.current) {
            const incoming = pendingIds.filter((id) => !seen.current!.has(id));
            if (incoming.length) {
                if (sound) chime();
                toast(`${incoming.length} new ${incoming.length === 1 ? "order" : "orders"}!`, "info");
                setFresh((prev) => new Set([...prev, ...incoming]));
                setTimeout(() => setFresh((prev) => new Set([...prev].filter((id) => !incoming.includes(id)))), 8000);
            }
        }
        seen.current = new Set(orders.map((o) => o.id));
    }, [orders, sound, toast]);

    const advance = async (order: Order, status: OrderStatus, note = "", prepMinutes?: number) => {
        setBusy(order.id);
        mutate((list) => list?.map((o) => (o.id === order.id ? { ...o, status } : o)).filter((o) => status !== "delivered" && status !== "cancelled" ? true : o.id !== order.id), { revalidate: false });
        try {
            const body: Record<string, unknown> = { status };
            if (note) body.note = note;
            if (prepMinutes) body.prep_minutes = prepMinutes;
            await request(`/orders/${order.id}/`, { method: "PATCH", body });
            const label = COLUMNS.find((c) => c.next === status)?.action;
            if (status === "cancelled") toast(`Order #${order.id} rejected. The customer has been told.`, "info");
            else if (label) toast(`#${order.id}: ${label.toLowerCase()} ✓ · customer notified`);
        } catch (e) {
            toast((e as Error).message, "error");
        } finally {
            setBusy(null);
            mutate();
        }
    };

    const togglePause = async (r: Restaurant, accepting: boolean) => {
        mutateRestaurants((list) => list?.map((x) => (x.id === r.id ? { ...x, is_accepting_orders: accepting } : x)), { revalidate: false });
        try {
            await request(`/restaurants/restaurant/${r.id}/`, { method: "PATCH", body: { is_accepting_orders: accepting } });
            toast(accepting ? `${r.name} is taking orders again` : `${r.name} paused. No new orders will come in.`, "info");
        } catch (e) {
            toast((e as Error).message, "error");
            mutateRestaurants();
        }
    };

    const byStatus = (s: OrderStatus) => (orders ?? []).filter((o) => o.status === s).sort((a, b) => a.created_at.localeCompare(b.created_at));

    return (
        <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="flex items-center gap-3 text-3xl font-extrabold sm:text-4xl">
                        <ChefHat size={36} weight="duotone" className="text-brand" /> Kitchen board
                    </h1>
                    <p className="mt-1 text-muted">{realtime ? "Realtime: new orders appear instantly." : "Live. Updates every few seconds."} Oldest tickets first.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {restaurants?.map((r) => (
                        <div key={r.id} className="min-w-52 rounded-2xl border border-line bg-surface px-4 py-2">
                            <Toggle checked={r.is_accepting_orders} onChange={(v) => togglePause(r, v)} label={r.name} description={r.is_accepting_orders ? "Taking orders" : "Paused"} />
                        </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setSound(!sound)} icon={sound ? <SpeakerHigh size={16} /> : <SpeakerSlash size={16} />}>
                        {sound ? "Sound on" : "Muted"}
                    </Button>
                </div>
            </div>

            {orders && orders.length === 0 ? (
                <div className="mt-10">
                    <EmptyState icon={<ChefHat size={26} />} title="All quiet" body="New orders will pop up here with a chime. Keep this tab open during service." />
                </div>
            ) : (
                <>
                <nav aria-label="Jump to stage" className="no-scrollbar sticky top-16 z-20 -mx-4 mt-6 flex gap-2 overflow-x-auto bg-bg/90 px-4 py-2 backdrop-blur xl:hidden">
                    {COLUMNS.map((col) => {
                        const n = byStatus(col.status).length;
                        return (
                            <button
                                key={col.status}
                                onClick={() => {
                                    setFocus(col.status);
                                    document.getElementById(`col-${col.status}`)?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
                                }}
                                className={cn(
                                    "flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold",
                                    focus === col.status ? "border-ink bg-ink text-bg" : "border-line bg-surface",
                                )}
                            >
                                {col.title}
                                <span className={cn("tabular rounded-full px-1.5 text-xs", n ? "bg-brand text-brand-ink" : "bg-surface-2 text-muted")}>{n}</span>
                            </button>
                        );
                    })}
                </nav>
                <div className="no-scrollbar -mx-4 mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0 xl:mt-8 xl:grid xl:grid-cols-5 xl:overflow-visible">
                    {COLUMNS.map((col) => {
                        const list = byStatus(col.status);
                        return (
                            <section id={`col-${col.status}`} key={col.status} className="w-[86vw] max-w-sm shrink-0 snap-start scroll-ml-4 rounded-3xl bg-surface-2 p-3 sm:w-80 xl:w-auto xl:max-w-none">
                                <h2 className="flex items-center justify-between px-2 pt-1 pb-3 font-bold">
                                    <span>
                                        {col.title}
                                        <span className="block text-xs font-normal text-muted">{col.hint}</span>
                                    </span>
                                    <span className={cn("tabular grid min-w-7 place-items-center rounded-full px-2 text-sm", list.length ? "bg-ink text-bg" : "bg-surface text-muted")}>{list.length}</span>
                                </h2>
                                <div className="space-y-3">
                                    {!orders && <div className="skeleton h-40 rounded-2xl" />}
                                    {list.map((o) => {
                                        const waitMin = Math.round((Date.now() - new Date(o.created_at).getTime()) / 60000);
                                        const late = o.status === "pending" && waitMin >= 5;
                                        return (
                                            <article
                                                key={o.id}
                                                className={cn(
                                                    "rounded-2xl border bg-surface p-4 shadow-card transition",
                                                    fresh.has(o.id) ? "animate-pop border-brand ring-4 ring-brand/20" : late ? "border-danger/50" : "border-line",
                                                )}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <p className="font-bold">#{o.id} · {o.user_details.first_name || o.user_details.username}</p>
                                                        <p className={cn("text-xs", late ? "font-semibold text-danger" : "text-muted")}>
                                                            {timeAgo(o.created_at)}
                                                            {late && " · waiting"}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        {o.delivery_option === "priority" && (
                                                            <Badge tone="warn">
                                                                <Lightning size={12} weight="fill" /> Priority
                                                            </Badge>
                                                        )}
                                                        {o.delivery_option === "eco" && (
                                                            <Badge tone="ok">
                                                                <Leaf size={12} weight="fill" /> Batched
                                                            </Badge>
                                                        )}
                                                        {o.scheduled_for && (
                                                            <Badge tone="brand">
                                                                <CalendarCheck size={12} /> {clock(o.scheduled_for)}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                {restaurants && restaurants.length > 1 && <p className="mt-1 text-xs text-muted">{o.restaurant_details.name}</p>}
                                                <ul className="mt-3 space-y-1 border-t border-dashed border-line pt-3 text-sm">
                                                    {o.items.map((i) => (
                                                        <li key={i.id}>
                                                            <span className="tabular font-bold">{i.quantity}x</span> {i.menu_item_details.name}
                                                            {i.note && <span className="block pl-5 text-xs font-medium text-warn">Note: {i.note}</span>}
                                                        </li>
                                                    ))}
                                                </ul>
                                                {o.notes && <p className="mt-2 rounded-lg bg-warn-soft px-2 py-1 text-xs text-warn">{o.notes}</p>}
                                                {(() => {
                                                    const left = prepRemaining(o);
                                                    if (left === null) return null;
                                                    return (
                                                        <p className={cn("mt-2 flex items-center justify-between rounded-lg px-2 py-1 text-xs font-semibold", left < 0 ? "bg-danger-soft text-danger" : "bg-brand-soft text-brand")}>
                                                            <span>Prep {o.prep_minutes} min</span>
                                                            <span className="tabular">{left < 0 ? `${-left} min over` : `${left} min left`}</span>
                                                        </p>
                                                    );
                                                })()}
                                                {o.status === "out_for_delivery" && <RiderBeacon order={o} />}
                                                {o.estimated_delivery_at && o.status !== "pending" && (
                                                    <p className="mt-1 text-xs text-muted">Customer ETA {clock(o.estimated_delivery_at)}</p>
                                                )}
                                                <div className="mt-3 flex items-center justify-between text-sm">
                                                    <span className="tabular font-semibold">{money(o.total_price)}</span>
                                                    <span className="text-xs text-muted">{o.payment_method === "cash" ? "Cash" : "Card"} on delivery</span>
                                                </div>
                                                <div className="mt-3 flex gap-2">
                                                    <Button size="sm" className="flex-1" loading={busy === o.id} onClick={() => (col.status === "pending" ? setAccepting(o) : advance(o, col.next))}>
                                                        {col.action} <ArrowRight size={14} weight="bold" />
                                                    </Button>
                                                    <Link href={`/orders/${o.id}`} aria-label={`Open order ${o.id} and chat`} className="grid size-9 place-items-center rounded-full border border-line hover:border-brand hover:text-brand">
                                                        <ChatCircleDots size={18} />
                                                    </Link>
                                                    {(o.next_statuses ? o.next_statuses.includes("cancelled") : o.status !== "out_for_delivery") && (
                                                        <button onClick={() => setRejecting(o)} aria-label={`Reject order ${o.id}`} className="grid size-9 place-items-center rounded-full border border-line text-muted hover:border-danger hover:text-danger">
                                                            <X size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </article>
                                        );
                                    })}
                                    {orders && list.length === 0 && <p className="px-2 py-6 text-center text-sm text-muted">Nothing here</p>}
                                </div>
                            </section>
                        );
                    })}
                </div>
                </>
            )}

            <AcceptModal
                order={accepting}
                onClose={() => setAccepting(null)}
                onConfirm={(minutes) => {
                    if (accepting) advance(accepting, "confirmed", "", minutes);
                    setAccepting(null);
                }}
            />

            <RejectModal
                order={rejecting}
                onClose={() => setRejecting(null)}
                onConfirm={(reason) => {
                    if (rejecting) advance(rejecting, "cancelled", reason);
                    setRejecting(null);
                }}
            />
        </div>
    );
}

const REASONS = ["Too busy right now", "An item is out of stock", "Kitchen is closing", "Outside our delivery area"];

function RejectModal({ order, onClose, onConfirm }: { order: Order | null; onClose: () => void; onConfirm: (reason: string) => void }) {
    const [reason, setReason] = useState(REASONS[0]);
    return (
        <Modal open={!!order} onClose={onClose} title={`Reject order #${order?.id}?`}>
            <p className="text-sm text-muted">The customer sees this reason. Any points they used are refunded automatically.</p>
            <div className="mt-4 space-y-2">
                {REASONS.map((r) => (
                    <label key={r} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border p-3", reason === r ? "border-brand bg-brand-soft" : "border-line")}>
                        <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} className="accent-[var(--brand)]" />
                        {r}
                    </label>
                ))}
            </div>
            <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                    Keep it
                </Button>
                <Button variant="danger" onClick={() => onConfirm(reason)}>
                    Reject order
                </Button>
            </div>
        </Modal>
    );
}

function AcceptModal({ order, onClose, onConfirm }: { order: Order | null; onClose: () => void; onConfirm: (minutes: number) => void }) {
    const fallback = order?.restaurant_details?.prep_time_minutes ?? 20;
    const [minutes, setMinutes] = useState<number>(20);
    useEffect(() => {
        if (order) setMinutes(PREP_CHOICES.reduce((best, m) => (Math.abs(m - fallback) < Math.abs(best - fallback) ? m : best), 20));
    }, [order, fallback]);
    return (
        <Modal open={!!order} onClose={onClose} title={`Accept order #${order?.id}`}>
            <p className="text-sm text-muted">How long until it&apos;s packed? The customer&apos;s ETA updates from this.</p>
            <div className="mt-4 grid grid-cols-5 gap-2" role="radiogroup" aria-label="Prep time">
                {PREP_CHOICES.map((m) => (
                    <button
                        key={m}
                        role="radio"
                        aria-checked={minutes === m}
                        onClick={() => setMinutes(m)}
                        className={cn("rounded-2xl border py-3 text-center font-bold", minutes === m ? "border-brand bg-brand-soft text-brand" : "border-line")}
                    >
                        <span className="tabular block text-lg">{m}</span>
                        <span className="block text-xs font-medium text-muted">min</span>
                    </button>
                ))}
            </div>
            <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                    Not yet
                </Button>
                <Button onClick={() => onConfirm(minutes)}>Accept · {minutes} min</Button>
            </div>
        </Modal>
    );
}
