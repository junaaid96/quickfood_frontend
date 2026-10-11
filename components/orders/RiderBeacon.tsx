"use client";

import { useEffect, useRef, useState } from "react";
import { Crosshair, Path } from "@phosphor-icons/react";
import { pointAlong, routeFor, simulatedFraction } from "@/lib/geo";
import { publishLocation } from "@/lib/realtime";
import type { Order } from "@/lib/types";
import { cn } from "@/lib/format";

/**
 * Restaurant / rider side of live tracking. Publishes the rider's position to the order's Ably channel:
 * real browser GPS when the person delivering turns it on, otherwise the demo route driven by the ETA.
 */
export function RiderBeacon({ order }: { order: Order }) {
    const [gps, setGps] = useState(false);
    const [ok, setOk] = useState<boolean | null>(null);
    const [error, setError] = useState("");
    const ref = useRef(order);
    ref.current = order;

    useEffect(() => {
        if (gps) return;
        const route = routeFor(ref.current);
        const tick = () => {
            const { at, heading } = pointAlong(route, simulatedFraction(ref.current));
            publishLocation(ref.current.id, { lat: at[0], lng: at[1], heading, source: "simulated", ts: Date.now() }).then(setOk);
        };
        tick();
        const t = setInterval(tick, 3000);
        return () => clearInterval(t);
    }, [gps, order.id]);

    useEffect(() => {
        if (!gps) return;
        if (!("geolocation" in navigator)) {
            setError("GPS not available on this device");
            setGps(false);
            return;
        }
        const watch = navigator.geolocation.watchPosition(
            (p) => {
                setError("");
                publishLocation(ref.current.id, {
                    lat: p.coords.latitude,
                    lng: p.coords.longitude,
                    heading: p.coords.heading ?? undefined,
                    accuracy: p.coords.accuracy,
                    source: "gps",
                    ts: Date.now(),
                }).then(setOk);
            },
            (e) => {
                setError(e.code === e.PERMISSION_DENIED ? "Location permission denied" : "Couldn't get a GPS fix");
                setGps(false);
            },
            { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 },
        );
        return () => navigator.geolocation.clearWatch(watch);
    }, [gps]);

    return (
        <div className="mt-2 rounded-lg bg-surface-2 px-2 py-1.5 text-xs">
            <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-semibold">
                    <span className={cn("size-2 rounded-full", ok ? "animate-pulse bg-ok" : ok === false ? "bg-danger" : "bg-muted")} aria-hidden />
                    {ok === false ? "Live location offline" : gps ? "Sharing live GPS" : "Live · demo route"}
                </span>
                <button onClick={() => setGps(!gps)} className="inline-flex items-center gap-1 font-semibold text-brand hover:underline">
                    {gps ? <Path size={14} /> : <Crosshair size={14} />} {gps ? "Use demo route" : "Use my GPS"}
                </button>
            </div>
            {error && <p className="mt-1 text-danger">{error}</p>}
        </div>
    );
}
