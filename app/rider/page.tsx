"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle, Coins, MapPin, Moped, Package, Phone, Star, Storefront, Timer } from "@phosphor-icons/react";
import { request } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import { clock, cn, money, timeAgo } from "@/lib/format";
import { STATUS_COPY, prepRemaining } from "@/lib/orders";
import { useRealtimeState, useRidersFeed, useUserPushes } from "@/lib/realtime";
import type { Order, RiderProfile } from "@/lib/types";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { Badge, EmptyState, Segmented, Skeleton } from "@/components/ui/Bits";
import { Button, LinkButton } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Field";
import { RiderBeacon } from "@/components/orders/RiderBeacon";

export default function RiderDashboard() {
    const { user, isLoading, isRider } = useAuth();
    const router = useRouter();
    const toast = useToast();
    const realtime = useRealtimeState();
    const [tab, setTab] = useState<"mine" | "available">("mine");
    const [busy, setBusy] = useState<number | null>(null);
    const { data: profile, mutate: mutateProfile } = useApi<RiderProfile>(isRider ? "/accounts/rider/" : null, { refreshInterval: 60000 });
    const online = !!profile?.is_available;
    const { data: mine, mutate: mutateMine } = useApi<Order[]>(isRider ? "/orders/?status=active" : null, { refreshInterval: realtime ? 30000 : 8000, revalidateOnFocus: true });
    const { data: available, mutate: mutateAvailable } = useApi<Order[]>(isRider && online ? "/orders/?scope=available" : null, {
        refreshInterval: realtime ? 30000 : 8000,
        revalidateOnFocus: true,
    });
    const seen = useRef<Set<number> | null>(null);

    useEffect(() => {
        if (!isLoading && !user) router.replace("/login?redirect=/rider");
        else if (!isLoading && user && !isRider) router.replace("/");
    }, [isLoading, user, isRider, router]);

    useUserPushes(user?.id, () => {
        mutateMine();
        mutateProfile();
    });
    useRidersFeed(isRider && online, (p) => {
        mutateAvailable();
        if (p.event === "order.available" && p.status === "ready") toast(`New pickup ready at ${p.restaurant}`, "info", { label: "View", onClick: () => setTab("available") });
    });

    // Fallback "new pickup" toast when polling finds ready orders we hadn't seen.
    useEffect(() => {
        if (!available) return;
        const ready = available.filter((o) => o.status === "ready").map((o) => o.id);
        if (seen.current && !realtime) {
            const fresh = ready.filter((id) => !seen.current!.has(id));
            if (fresh.length) toast(`${fresh.length} new pickup${fresh.length > 1 ? "s" : ""} ready`, "info");
        }
        seen.current = new Set(ready);
    }, [available, realtime, toast]);

    useEffect(() => {
        if (mine && mine.length === 0 && online) setTab("available");
    }, [mine, online]);

    const toggleOnline = async (v: boolean) => {
        mutateProfile((p) => (p ? { ...p, is_available: v } : p), { revalidate: false });
        try {
            await request("/accounts/rider/", { method: "PATCH", body: { is_available: v } });
            toast(v ? "You're online. New pickups will show up here." : "You're offline. No new pickups.", "info");
        } catch (e) {
            toast((e as Error).message, "error");
            mutateProfile();
        }
    };

    const act = async (o: Order, action: "claim" | "out_for_delivery" | "delivered") => {
        setBusy(o.id);
        try {
            if (action === "claim") {
                await request(`/orders/${o.id}/claim/`, { method: "POST" });
                toast(`Pickup accepted: #${o.id} at ${o.restaurant_details.name}`);
                setTab("mine");
            } else {
                await request(`/orders/${o.id}/`, { method: "PATCH", body: { status: action } });
                toast(action === "out_for_delivery" ? `Picked up #${o.id}. Customer's map is live.` : `Delivered #${o.id}. Nice work!`);
            }
        } catch (e) {
            toast((e as Error).message, "error");
        } finally {
            setBusy(null);
            mutateMine();
            mutateAvailable();
            mutateProfile();
        }
    };

    const sortedAvailable = useMemo(
        () => [...(available ?? [])].sort((a, b) => (a.status === "ready" ? -1 : 0) - (b.status === "ready" ? -1 : 0) || a.created_at.localeCompare(b.created_at)),
        [available],
    );
    const list = tab === "mine" ? mine : sortedAvailable;
    const s = profile?.stats;

    return (
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
            <div className="flex items-center gap-4">
                {profile?.photo_display ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.photo_display} alt="" className="size-14 rounded-full object-cover ring-2 ring-brand/30" />
                ) : (
                    <span className="grid size-14 place-items-center rounded-full bg-brand-soft text-brand">
                        <Moped size={28} weight="duotone" />
                    </span>
                )}
                <div className="min-w-0 flex-1">
                    <h1 className="truncate text-2xl font-extrabold sm:text-3xl">Hi, {profile?.first_name || user?.first_name || "rider"}</h1>
                    <p className="text-sm text-muted">
                        {profile ? `${profile.vehicle_label}${profile.vehicle_plate ? ` · ${profile.vehicle_plate}` : ""}` : "Loading…"} ·{" "}
                        <Link href="/rider/profile" className="font-semibold text-brand hover:underline">
                            Edit profile
                        </Link>
                    </p>
                </div>
            </div>

            <div className={cn("mt-5 flex items-center justify-between gap-3 rounded-3xl border-2 p-4", online ? "border-ok/40 bg-ok-soft" : "border-line bg-surface")}>
                <div>
                    <p className="font-bold">{online ? "You're online" : "You're offline"}</p>
                    <p className="text-sm text-muted">{online ? (realtime ? "New pickups arrive instantly." : "Checking for pickups every few seconds.") : "Go online to see orders waiting for a rider."}</p>
                </div>
                <Toggle checked={online} onChange={toggleOnline} label="Availability" description={online ? "Online" : "Offline"} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                    { label: "Today", value: s ? money(s.today_earnings) : "–", sub: s ? `${s.today_deliveries} deliveries` : "", icon: Coins },
                    { label: "Earned", value: s ? money(s.earnings) : "–", sub: s ? `incl. ${money(s.tips)} tips` : "", icon: Coins },
                    { label: "Deliveries", value: s ? String(s.deliveries) : "–", sub: "all time", icon: Package },
                    { label: "Rating", value: s?.rating ? s.rating.toFixed(1) : "New", sub: s ? `${s.rating_count} ratings` : "", icon: Star },
                ].map(({ label, value, sub, icon: Icon }) => (
                    <div key={label} className="rounded-2xl border border-line bg-surface p-3">
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-muted">
                            <Icon size={14} /> {label}
                        </p>
                        <p className="tabular mt-1 font-display text-xl font-extrabold">{value}</p>
                        <p className="text-xs text-muted">{sub}</p>
                    </div>
                ))}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
                <Segmented
                    value={tab}
                    onChange={setTab}
                    options={[
                        { value: "mine", label: `My deliveries${mine?.length ? ` (${mine.length})` : ""}` },
                        { value: "available", label: `Available${online && available?.length ? ` (${available.length})` : ""}` },
                    ]}
                />
                <span className={cn("hidden items-center gap-1.5 text-xs text-muted sm:inline-flex")}>
                    <span className={cn("size-2 rounded-full", realtime ? "animate-pulse bg-ok" : "bg-muted")} /> {realtime ? "Realtime" : "Polling"}
                </span>
            </div>

            <div className="mt-4 space-y-3">
                {tab === "available" && !online ? (
                    <EmptyState icon={<Moped size={26} />} title="You're offline" body="Go online to see orders waiting for a rider." action={<Button onClick={() => toggleOnline(true)}>Go online</Button>} />
                ) : !list ? (
                    Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-3xl" />)
                ) : list.length === 0 ? (
                    <EmptyState
                        icon={<Package size={26} />}
                        title={tab === "mine" ? "No active deliveries" : "No pickups right now"}
                        body={tab === "mine" ? "Accept a pickup from the Available tab." : "Orders appear here as kitchens start cooking. Ready ones are on top."}
                    />
                ) : (
                    list.map((o) => <DeliveryCard key={o.id} order={o} mine={tab === "mine"} busy={busy === o.id} onAct={act} gps={user?.username !== "demo_rider"} />)
                )}
            </div>
        </div>
    );
}

function DeliveryCard({ order: o, mine, busy, onAct, gps }: { order: Order; mine: boolean; busy: boolean; gps: boolean; onAct: (o: Order, a: "claim" | "out_for_delivery" | "delivered") => void }) {
    const next = o.next_statuses ?? [];
    const prep = prepRemaining(o);
    const items = o.items.reduce((n, i) => n + i.quantity, 0);
    const payout = Number(o.delivery_fee) + Number(o.tip);
    return (
        <article className={cn("rounded-3xl border bg-surface p-4 shadow-card sm:p-5", o.status === "ready" ? "border-brand/50" : "border-line")}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs text-muted">
                        #{o.id} · placed {timeAgo(o.created_at)}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 truncate font-bold">
                        <Storefront size={16} className="shrink-0 text-brand" /> {o.restaurant_details.name}
                    </p>
                    <p className="truncate text-sm text-muted">{o.restaurant_details.address}</p>
                </div>
                <div className="text-right">
                    <p className="tabular font-display text-lg font-extrabold text-ok">{money(payout)}</p>
                    <p className="text-xs text-muted">fee + tip</p>
                </div>
            </div>
            <div className="mt-3 flex items-start gap-1.5 rounded-2xl bg-surface-2 p-3 text-sm">
                <MapPin size={16} className="mt-0.5 shrink-0 text-brand" />
                <div className="min-w-0">
                    <p className="font-semibold">
                        {o.user_details.first_name || o.user_details.username} · {items} item{items === 1 ? "" : "s"} · {o.payment_method === "cash" ? `collect ${money(o.total_price)} cash` : "paid by card"}
                    </p>
                    <p className="text-muted">{o.delivery_address}</p>
                </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <Badge tone={o.status === "ready" ? "brand" : o.status === "out_for_delivery" ? "ok" : "neutral"}>{STATUS_COPY[o.status].short}</Badge>
                {prep !== null && (
                    <Badge tone={prep < 0 ? "warn" : "neutral"}>
                        <Timer size={12} /> {prep < 0 ? "any minute" : `ready in ~${prep} min`}
                    </Badge>
                )}
                {o.estimated_delivery_at && <span className="text-muted">Customer ETA {clock(o.estimated_delivery_at)}</span>}
            </div>
            {mine && o.status === "out_for_delivery" && <RiderBeacon order={o} preferGps={gps} />}
            <div className="mt-4 flex gap-2">
                {next.includes("claim") && (
                    <Button className="flex-1" loading={busy} onClick={() => onAct(o, "claim")}>
                        Accept pickup <ArrowRight size={16} weight="bold" />
                    </Button>
                )}
                {next.includes("out_for_delivery") && (
                    <Button className="flex-1" loading={busy} onClick={() => onAct(o, "out_for_delivery")}>
                        <Package size={18} /> Picked up · start delivery
                    </Button>
                )}
                {next.includes("delivered") && (
                    <Button className="flex-1" loading={busy} onClick={() => onAct(o, "delivered")}>
                        <CheckCircle size={18} /> Mark delivered
                    </Button>
                )}
                {mine && !next.length && o.status !== "out_for_delivery" && <p className="flex-1 self-center text-sm text-muted">Waiting for the kitchen to mark it ready…</p>}
                {mine && o.contact_phone && (
                    <a href={`tel:${o.contact_phone}`} aria-label="Call customer" className="grid size-11 place-items-center rounded-full border border-line hover:border-brand hover:text-brand">
                        <Phone size={18} />
                    </a>
                )}
                {mine && (
                    <LinkButton href={`/orders/${o.id}`} variant="outline" size="md">
                        Map
                    </LinkButton>
                )}
            </div>
        </article>
    );
}
