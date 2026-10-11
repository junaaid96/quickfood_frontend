"use client";

import * as Ably from "ably";
import { useEffect, useRef, useState } from "react";
import { request, tokens } from "./api";

/**
 * Ably realtime with token auth: the browser asks our API for a signed token request scoped to the
 * user's own channels and live orders. The API key never reaches the client. If realtime is not
 * available the app keeps polling, so every hook here is an optional speed-up.
 */
let client: Ably.Realtime | null = null;
let clientFor: string | null = null;
let unavailable = false;

export type RiderLocation = { lat: number; lng: number; heading?: number; accuracy?: number; source: "gps" | "simulated"; ts: number };
export type StatusPush = { id: number; status: string; status_label: string; restaurant: string; estimated_delivery_at: string | null };

export function getRealtime(): Ably.Realtime | null {
    if (typeof window === "undefined" || unavailable) return null;
    const access = tokens.access;
    if (!access) return null;
    if (client && clientFor === access) return client;
    client?.close();
    clientFor = access;
    client = new Ably.Realtime({
        authCallback: (_params, callback) => {
            request<Ably.TokenRequest>("/orders/realtime-token/")
                .then((tr) => callback(null, tr))
                .catch((e) => {
                    if ((e as { status?: number }).status === 503) unavailable = true;
                    callback(String((e as Error).message), null);
                });
        },
        autoConnect: true,
        echoMessages: false,
    });
    return client;
}

export function closeRealtime() {
    client?.close();
    client = null;
    clientFor = null;
}

/** Re-issue the token so a channel for a brand-new order is inside the capability. */
async function ensureAccess(rt: Ably.Realtime) {
    try {
        await rt.auth.authorize();
    } catch {}
}

/** Connection state for the "Live" badge. */
export function useRealtimeState() {
    const [state, setState] = useState<string>("initialized");
    useEffect(() => {
        const rt = getRealtime();
        if (!rt) return;
        setState(rt.connection.state);
        const fn = (change: Ably.ConnectionStateChange) => setState(change.current);
        rt.connection.on(fn);
        return () => rt.connection.off(fn);
    }, []);
    return state === "connected";
}

/** Status pushes for the signed-in user (customer or owner). */
export function useUserPushes(userId: number | undefined, onPush: (p: StatusPush) => void) {
    const cb = useRef(onPush);
    cb.current = onPush;
    useEffect(() => {
        const rt = userId ? getRealtime() : null;
        if (!rt || !userId) return;
        const ch = rt.channels.get(`user:${userId}`);
        const fn = (m: Ably.InboundMessage) => cb.current(m.data as StatusPush);
        ch.subscribe("order.status", fn).catch(() => {});
        return () => {
            ch.unsubscribe("order.status", fn);
        };
    }, [userId]);
}

/** Subscribe to one order: status pushes and the rider's live location. */
export function useOrderChannel(orderId: number | undefined, handlers: { onStatus?: (p: StatusPush) => void; onLocation?: (l: RiderLocation) => void }) {
    const h = useRef(handlers);
    h.current = handlers;
    useEffect(() => {
        const rt = orderId ? getRealtime() : null;
        if (!rt || !orderId) return;
        let cancelled = false;
        const ch = rt.channels.get(`order:${orderId}`, { params: { rewind: "1" } });
        const onStatus = (m: Ably.InboundMessage) => h.current.onStatus?.(m.data as StatusPush);
        const onLoc = (m: Ably.InboundMessage) => h.current.onLocation?.(m.data as RiderLocation);
        (async () => {
            await ensureAccess(rt);
            if (cancelled) return;
            ch.subscribe("order.status", onStatus).catch(() => {});
            ch.subscribe("rider.location", onLoc).catch(() => {});
        })();
        return () => {
            cancelled = true;
            ch.unsubscribe("order.status", onStatus);
            ch.unsubscribe("rider.location", onLoc);
            ch.detach().catch(() => {});
        };
    }, [orderId]);
}

/** Restaurant side: publish a rider position for an order. */
export async function publishLocation(orderId: number, loc: RiderLocation) {
    const rt = getRealtime();
    if (!rt) return false;
    const ch = rt.channels.get(`order:${orderId}`);
    try {
        await ch.publish("rider.location", loc);
        return true;
    } catch {
        await ensureAccess(rt);
        try {
            await ch.publish("rider.location", loc);
            return true;
        } catch {
            return false;
        }
    }
}

/** Riders: hear about orders waiting for pickup (and ones another rider just took). */
export function useRidersFeed(enabled: boolean, onChange: (p: StatusPush & { event?: string }) => void) {
    const cb = useRef(onChange);
    cb.current = onChange;
    useEffect(() => {
        const rt = enabled ? getRealtime() : null;
        if (!rt) return;
        const ch = rt.channels.get("riders");
        const fn = (m: Ably.InboundMessage) => cb.current({ ...(m.data as StatusPush), event: m.name });
        ch.subscribe(fn).catch(() => {});
        return () => {
            ch.unsubscribe(fn);
        };
    }, [enabled]);
}
