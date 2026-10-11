"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Polyline, TileLayer, ZoomControl, useMap } from "react-leaflet";
import type { Order } from "@/lib/types";
import type { RiderLocation } from "@/lib/realtime";
import { customerPoint, metersLeft, pointAlong, restaurantPoint, routeFor, simulatedFraction, type LatLng } from "@/lib/geo";
import { cn } from "@/lib/format";

const pin = (html: string, cls: string, size = 36) =>
    L.divIcon({ html, className: cn("qf-pin", cls), iconSize: [size, size], iconAnchor: [size / 2, size / 2] });

const ICONS = {
    restaurant: pin('<span>🍳</span>', "qf-pin-restaurant"),
    home: pin('<span>🏠</span>', "qf-pin-home"),
};

function riderIcon(heading: number, live: boolean) {
    return pin(
        `<span class="qf-rider-pulse${live ? " is-live" : ""}"></span><span class="qf-rider-dot" data-heading="${Math.round(heading)}">🛵</span>`,
        "qf-pin-rider",
        44,
    );
}

function FitOnce({ points }: { points: LatLng[] }) {
    const map = useMap();
    useEffect(() => {
        map.fitBounds(L.latLngBounds(points), { padding: [36, 36] });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map]);
    return null;
}

function Follow({ at, enabled }: { at: LatLng; enabled: boolean }) {
    const map = useMap();
    useEffect(() => {
        if (enabled && !map.getBounds().pad(-0.15).contains(at)) map.panTo(at, { animate: true });
    }, [at, enabled, map]);
    return null;
}

/**
 * Real map (OpenStreetMap tiles) with the rider moving live. Positions come from Ably when the
 * restaurant/rider is publishing (GPS or the demo route), otherwise from the ETA so it never freezes.
 */
export default function LiveMap({ order, live, onEta }: { order: Order; live: RiderLocation | null; onEta?: (minutes: number | null, source: "gps" | "simulated" | "estimate") => void }) {
    const route = useMemo(() => routeFor(order), [order.id, order.user, order.restaurant]); // eslint-disable-line react-hooks/exhaustive-deps
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 2000);
        return () => clearInterval(t);
    }, []);

    const fresh = live && now - live.ts < 20000 && order.status === "out_for_delivery";
    const moving = order.status === "out_for_delivery";
    const est = pointAlong(route, simulatedFraction(order, now));
    const at: LatLng = fresh ? [live!.lat, live!.lng] : moving ? est.at : order.status === "delivered" ? route[route.length - 1] : route[0];
    const heading = fresh ? live!.heading ?? est.heading : est.heading;
    const source: "gps" | "simulated" | "estimate" = fresh ? live!.source : "estimate";
    const left = moving ? metersLeft(route, at) : null;
    const minutes = left !== null ? Math.max(1, Math.round(left / 380)) : null;

    useEffect(() => {
        onEta?.(moving ? minutes : null, source);
    }, [minutes, source, moving, onEta]);

    const done: LatLng[] = useMemo(() => {
        if (!moving) return [];
        const out: LatLng[] = [route[0]];
        for (const p of route.slice(1)) {
            if (metersLeft(route, p) < (left ?? 0)) break;
            out.push(p);
        }
        out.push(at);
        return out;
    }, [route, at, left, moving]);

    return (
        <div className="relative overflow-hidden rounded-3xl border border-line">
            <MapContainer center={at} zoom={14} scrollWheelZoom={false} zoomControl={false} className="h-72 w-full sm:h-80" attributionControl>
                <TileLayer
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={19}
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <FitOnce points={[restaurantPoint(order.restaurant), customerPoint(order)]} />
                <Polyline positions={route} pathOptions={{ color: "#c2410c", weight: 5, opacity: 0.25, dashArray: moving ? undefined : "6 8" }} />
                {done.length > 1 && <Polyline positions={done} pathOptions={{ color: "#c2410c", weight: 5, opacity: 0.9 }} />}
                <Marker position={route[0]} icon={ICONS.restaurant} title={order.restaurant_details.name} />
                <Marker position={route[route.length - 1]} icon={ICONS.home} title="You" />
                {order.status !== "cancelled" && <Marker position={at} icon={riderIcon(heading - 90, !!fresh)} title="Rider" zIndexOffset={1000} />}
                <Follow at={at} enabled={moving} />
                <ZoomControl position="bottomright" />
            </MapContainer>
            <div className="pointer-events-none absolute top-3 left-3 z-[500] flex flex-wrap gap-2">
                <span
                    className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-card",
                        fresh ? "bg-ok text-white" : "bg-surface text-muted",
                    )}
                >
                    <span className={cn("size-2 rounded-full", fresh ? "animate-pulse bg-white" : "bg-muted")} />
                    {fresh ? (live!.source === "gps" ? "Live GPS" : "Live · demo route") : moving ? "Estimated position" : order.status === "delivered" ? "Delivered" : "Waiting for pickup"}
                </span>
                {moving && left !== null && (
                    <span className="tabular rounded-full bg-surface px-3 py-1 text-xs font-bold shadow-card">
                        {(left / 1000).toFixed(1)} km · ~{minutes} min
                    </span>
                )}
            </div>
        </div>
    );
}
