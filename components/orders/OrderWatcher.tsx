"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, BellRinging, X } from "@phosphor-icons/react";
import { request } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import { useRealtimeState, useUserPushes } from "@/lib/realtime";
import { STATUS_COPY, STATUS_NOTICE, etaDisplay, isActive, orderProgress } from "@/lib/orders";
import type { Order, OrderStatus } from "@/lib/types";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { cn } from "@/lib/format";

const KEY = "qf-order-status";

function remembered(): Record<number, OrderStatus> {
    try {
        return JSON.parse(sessionStorage.getItem(KEY) || "{}");
    } catch {
        return {};
    }
}

/** Plays nicely on phones: short buzz, a system notification only when the tab is in the background. */
function notify(title: string, body: string, url: string) {
    try {
        navigator.vibrate?.(120);
        if (typeof Notification !== "undefined" && Notification.permission === "granted" && document.visibilityState === "hidden") {
            const n = new Notification(title, { body, icon: "/favicon.ico", tag: url });
            n.onclick = () => {
                window.focus();
                window.location.href = url;
            };
        }
    } catch {}
}

/**
 * Polls the customer's live orders (Vercel has no websockets) and turns every status change into a toast,
 * wherever they are in the app. Also shows a slim "live order" bar so tracking is one tap away.
 */
export function OrderWatcher() {
    const { user, isStaff } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const toast = useToast();
    const enabled = !!user && !isStaff;
    const [visible, setVisible] = useState(true);
    const [hidden, setHidden] = useState(false);
    const [canAsk, setCanAsk] = useState(false);
    const realtime = useRealtimeState();
    const { data: orders, mutate } = useApi<Order[]>(enabled ? "/orders/?status=active" : null, {
        refreshInterval: realtime ? 30000 : visible ? 12000 : 45000,
        revalidateOnFocus: true,
    });
    useUserPushes(enabled ? user?.id : undefined, () => mutate());
    const known = useRef<Record<number, OrderStatus> | null>(null);

    useEffect(() => {
        const onVis = () => setVisible(document.visibilityState === "visible");
        document.addEventListener("visibilitychange", onVis);
        setCanAsk(typeof Notification !== "undefined" && Notification.permission === "default");
        return () => document.removeEventListener("visibilitychange", onVis);
    }, []);

    useEffect(() => {
        if (!orders) return;
        const before = known.current ?? remembered();
        const now: Record<number, OrderStatus> = {};
        orders.forEach((o) => (now[o.id] = o.status));

        const announce = (o: Pick<Order, "id" | "status" | "restaurant_details">) => {
            const prev = before[o.id];
            if (!prev || prev === o.status || !STATUS_NOTICE[o.status]) return;
            const msg = `${o.restaurant_details.name} ${STATUS_NOTICE[o.status]}`;
            toast(msg, o.status === "cancelled" ? "error" : "info", pathname === `/orders/${o.id}` ? undefined : { label: "Track", onClick: () => router.push(`/orders/${o.id}`) });
            notify(STATUS_COPY[o.status].title, msg, `/orders/${o.id}`);
        };
        orders.forEach(announce);

        // Orders that left the active list were delivered or cancelled: fetch them once to say which.
        const gone = Object.keys(before).map(Number).filter((id) => !(id in now) && isActive(before[id]));
        gone.forEach((id) =>
            request<Order>(`/orders/${id}/`)
                .then(announce)
                .catch(() => {}),
        );

        known.current = now;
        try {
            sessionStorage.setItem(KEY, JSON.stringify(now));
        } catch {}
    }, [orders, pathname, router, toast]);

    const live = orders?.[0];
    const onTrackingPage = pathname?.startsWith("/orders/") || pathname === "/checkout" || pathname === "/login";
    if (!enabled || !live || onTrackingPage || hidden) return null;
    const eta = etaDisplay(live);

    return (
        <div className="fixed inset-x-3 bottom-[5.25rem] z-40 md:inset-x-auto md:right-6 md:bottom-6 md:w-96">
            <div className="flex animate-rise items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-card">
                <Link href={`/orders/${live.id}`} className="flex min-w-0 flex-1 items-center gap-3" aria-label={`Track order ${live.id}`}>
                    <span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                        <span className="absolute inset-0 animate-ping rounded-full bg-brand/20" aria-hidden />
                        <span className="text-xs font-extrabold">{Math.round(orderProgress(live) * 100)}%</span>
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold">{STATUS_COPY[live.status].title}</span>
                        <span className="block truncate text-xs text-muted">
                            {live.restaurant_details.name}
                            {eta && ` · ${eta.big}`}
                            {orders.length > 1 && ` · +${orders.length - 1} more`}
                        </span>
                    </span>
                    <ArrowRight size={18} className="text-brand" />
                </Link>
                {canAsk && (
                    <button
                        onClick={() => Notification.requestPermission().then(() => setCanAsk(false))}
                        aria-label="Turn on order notifications"
                        title="Notify me about updates"
                        className={cn("grid size-9 place-items-center rounded-full bg-surface-2 text-muted hover:text-brand")}
                    >
                        <BellRinging size={18} />
                    </button>
                )}
                <button onClick={() => setHidden(true)} aria-label="Hide live order bar" className="grid size-9 place-items-center rounded-full text-muted hover:text-ink">
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}
