import type { Order } from "./types";

/**
 * Demo geography. Restaurants and customers have street addresses but no coordinates, so we place them
 * deterministically around Dhaka (restaurants near Gulshan, customers near Dhanmondi/Banani) and build a
 * plausible street route between them. Real GPS from the rider's phone overrides the simulation.
 */
export type LatLng = [number, number];

function jitter(seed: number, scale: number): LatLng {
    const a = Math.sin(seed * 12.9898) * 43758.5453;
    const b = Math.sin(seed * 78.233) * 12345.6789;
    return [((a - Math.floor(a)) - 0.5) * scale, ((b - Math.floor(b)) - 0.5) * scale];
}

export function restaurantPoint(restaurantId: number): LatLng {
    const [dy, dx] = jitter(restaurantId + 1, 0.018);
    return [23.7937 + dy, 90.4066 + dx];
}

export function customerPoint(order: Pick<Order, "user" | "id">): LatLng {
    const [dy, dx] = jitter(order.user * 7 + 3, 0.02);
    return [23.7509 + dy, 90.3795 + dx];
}

/** A grid-like route: a few right-angle turns with gentle wobble, like real streets. */
export function routeFor(order: Pick<Order, "id" | "user" | "restaurant">): LatLng[] {
    const [lat1, lng1] = restaurantPoint(order.restaurant);
    const [lat2, lng2] = customerPoint(order);
    const pts: LatLng[] = [[lat1, lng1]];
    const legs = 6;
    for (let i = 1; i < legs; i++) {
        const t = i / legs;
        const [wy, wx] = jitter(order.id * 13 + i, 0.004);
        const prev = pts[pts.length - 1];
        const lat = lat1 + (lat2 - lat1) * t + wy;
        const lng = lng1 + (lng2 - lng1) * t + wx;
        // alternate: move along latitude, then longitude
        pts.push(i % 2 ? [lat, prev[1]] : [prev[0], lng]);
        pts.push([lat, lng]);
    }
    pts.push([lat2, lng1 + (lng2 - lng1) * 0.97]);
    pts.push([lat2, lng2]);
    return pts;
}

function dist(a: LatLng, b: LatLng) {
    const dLat = a[0] - b[0];
    const dLng = (a[1] - b[1]) * Math.cos((a[0] * Math.PI) / 180);
    return Math.sqrt(dLat * dLat + dLng * dLng) * 111_320;
}

export function routeLength(route: LatLng[]) {
    let total = 0;
    for (let i = 1; i < route.length; i++) total += dist(route[i - 1], route[i]);
    return total;
}

/** Point and heading at fraction t (0..1) along the route. */
export function pointAlong(route: LatLng[], t: number): { at: LatLng; heading: number } {
    const target = routeLength(route) * Math.min(1, Math.max(0, t));
    let walked = 0;
    for (let i = 1; i < route.length; i++) {
        const seg = dist(route[i - 1], route[i]);
        if (walked + seg >= target || i === route.length - 1) {
            const f = seg ? Math.min(1, (target - walked) / seg) : 0;
            const [a, b] = [route[i - 1], route[i]];
            const heading = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
            return { at: [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f], heading };
        }
        walked += seg;
    }
    return { at: route[route.length - 1], heading: 0 };
}

/** Where a simulated rider is right now: 0 at pickup, 1 at the ETA. */
export function simulatedFraction(order: Order, now = Date.now()) {
    if (order.status === "delivered") return 1;
    if (order.status !== "out_for_delivery") return 0;
    const start = new Date(order.events.find((e) => e.status === "out_for_delivery")?.created_at ?? order.updated_at).getTime();
    const end = order.estimated_delivery_at ? new Date(order.estimated_delivery_at).getTime() : start + 15 * 60000;
    return Math.min(0.98, Math.max(0, (now - start) / Math.max(end - start, 5 * 60000)));
}

export function metersLeft(route: LatLng[], at: LatLng) {
    // distance remaining ≈ straight line to the end via the nearest later vertex
    let best = Infinity;
    let idx = route.length - 1;
    route.forEach((p, i) => {
        const d = dist(p, at);
        if (d < best) {
            best = d;
            idx = i;
        }
    });
    let rest = dist(at, route[Math.min(idx + 1, route.length - 1)]);
    for (let i = idx + 2; i < route.length; i++) rest += dist(route[i - 1], route[i]);
    return rest;
}
