"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BellRinging, Leaf, Lightning, Moped, Plus, Storefront } from "@phosphor-icons/react";
import { useApi } from "@/lib/hooks";
import { qs } from "@/lib/api";
import { money } from "@/lib/format";
import type { Analytics, Restaurant, Review } from "@/lib/types";
import { useAuth } from "@/providers/auth-provider";
import { Card, EmptyState, Segmented, Skeleton } from "@/components/ui/Bits";
import { LinkButton } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { BarChart, KpiTile } from "@/components/dashboard/BarChart";
import { ReviewReplyList } from "@/components/dashboard/ReviewReplyList";

export default function DashboardPage() {
    const { user } = useAuth();
    const [days, setDays] = useState<"7" | "30" | "90">("30");
    const [restaurant, setRestaurant] = useState("");
    const { data: restaurants } = useApi<Restaurant[]>("/restaurants/restaurant/?owner=me");
    const { data: a } = useApi<Analytics>(`/orders/analytics/${qs({ days, restaurant })}`, { refreshInterval: 30000 });
    const { data: reviews, mutate: mutateReviews } = useApi<Review[]>("/restaurants/reviews/?mine=1");

    if (restaurants && restaurants.length === 0) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
                <EmptyState
                    icon={<Storefront size={26} />}
                    title={`Welcome, ${user?.first_name || "partner"}`}
                    body="Add your first restaurant and menu. It takes about five minutes, and you can start taking orders straight away."
                    action={<LinkButton href="/dashboard/restaurants/new" icon={<Plus size={18} weight="bold" />}>Add your restaurant</LinkButton>}
                />
            </div>
        );
    }

    const series = a?.series ?? [];
    const peak = a ? a.busiest_hours.reduce((best, h) => (h.orders > best.orders ? h : best), a.busiest_hours[0]) : null;
    const hourLabel = (h: number) => `${h % 12 || 12}${h < 12 ? "a" : "p"}`;
    const mixTotal = a ? Object.values(a.delivery_mix).reduce((s, n) => s + n, 0) : 0;

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold sm:text-4xl">Overview</h1>
                    <p className="mt-1 text-muted">How your kitchens are doing.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {restaurants && restaurants.length > 1 && (
                        <Select value={restaurant} onChange={(e) => setRestaurant(e.target.value)} className="w-auto py-2 text-sm" aria-label="Restaurant">
                            <option value="">All restaurants</option>
                            {restaurants.map((r) => (
                                <option key={r.id} value={r.id}>
                                    {r.name}
                                </option>
                            ))}
                        </Select>
                    )}
                    <Segmented value={days} onChange={setDays} options={[{ value: "7", label: "7 days" }, { value: "30", label: "30 days" }, { value: "90", label: "90 days" }]} />
                </div>
            </div>

            {a && a.kpis.active_orders > 0 && (
                <Link href="/dashboard/orders" className="mt-6 flex items-center justify-between gap-4 rounded-3xl bg-brand p-5 text-brand-ink transition hover:bg-brand-strong">
                    <span className="flex items-center gap-3">
                        <BellRinging size={26} weight="fill" className="animate-pulse" />
                        <span className="text-lg font-bold">
                            {a.kpis.active_orders} active {a.kpis.active_orders === 1 ? "order" : "orders"} in the kitchen
                        </span>
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold">
                        Open board <ArrowRight size={18} weight="bold" />
                    </span>
                </Link>
            )}

            {!a ? (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-28 rounded-3xl" />
                    ))}
                </div>
            ) : (
                <>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <KpiTile label="Revenue (food)" value={money(a.kpis.revenue)} sub={`+ ${money(a.kpis.tips)} tips to riders`} />
                        <KpiTile label="Orders" value={String(a.kpis.orders)} sub={`${a.kpis.customers} customers`} />
                        <KpiTile label="Average order" value={money(a.kpis.avg_order_value)} />
                        <KpiTile
                            label="Rating"
                            value={a.kpis.avg_rating ? a.kpis.avg_rating.toFixed(2) : "None yet"}
                            sub={`${a.kpis.review_count} reviews`}
                            tone={a.kpis.avg_rating && a.kpis.avg_rating >= 4.3 ? "ok" : undefined}
                        />
                        <KpiTile label="Repeat customers" value={`${a.kpis.repeat_customer_rate}%`} sub="ordered more than once" tone={a.kpis.repeat_customer_rate >= 30 ? "ok" : undefined} />
                        <KpiTile label="Cancellation rate" value={`${a.kpis.cancel_rate}%`} tone={a.kpis.cancel_rate > 8 ? "danger" : a.kpis.cancel_rate > 4 ? "warn" : "ok"} sub={a.kpis.cancel_rate > 8 ? "Worth a look" : "Healthy"} />
                        <KpiTile label="Busiest hour" value={peak && peak.orders ? hourLabel(peak.hour) : "n/a"} sub={peak && peak.orders ? `${peak.orders} orders` : undefined} />
                        <KpiTile label="Chose Wait & Save" value={`${mixTotal ? Math.round(((a.delivery_mix.eco ?? 0) / mixTotal) * 100) : 0}%`} sub="batched, lower-emission trips" tone="ok" />
                    </div>

                    <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
                        <Card>
                            <h2 className="font-bold">Daily revenue</h2>
                            <p className="mb-5 text-sm text-muted">Food subtotal from non-cancelled orders{Number(days) > 30 ? ", last 30 days shown" : ""}</p>
                            <BarChart
                                ariaLabel="Daily revenue"
                                data={series.map((d) => ({
                                    key: d.date,
                                    label: new Date(d.date + "T00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" }),
                                    value: d.revenue,
                                    detail: `${d.orders} ${d.orders === 1 ? "order" : "orders"}`,
                                }))}
                                format={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : Math.round(v)}`}
                                labelEvery={Math.ceil(series.length / 6)}
                            />
                        </Card>
                        <Card>
                            <h2 className="font-bold">Top dishes</h2>
                            <p className="mb-4 text-sm text-muted">By portions sold</p>
                            {a.top_items.length === 0 ? (
                                <p className="text-sm text-muted">No orders in this period.</p>
                            ) : (
                                <ol className="space-y-3">
                                    {a.top_items.map((t) => (
                                        <li key={t.name}>
                                            <div className="flex justify-between gap-3 text-sm">
                                                <span className="truncate font-medium">{t.name}</span>
                                                <span className="tabular text-muted">{t.quantity}</span>
                                            </div>
                                            <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2">
                                                <div className="h-full rounded-r-[4px] bg-brand" style={{ width: `${(t.quantity / a.top_items[0].quantity) * 100}%` }} />
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                            )}
                            <h3 className="mt-6 mb-3 text-sm font-bold">Delivery choices</h3>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                {([["priority", "Priority", Lightning], ["standard", "Standard", Moped], ["eco", "Wait & Save", Leaf]] as const).map(([k, label, Icon]) => (
                                    <div key={k} className="rounded-2xl bg-surface-2 p-3">
                                        <Icon size={18} className="mx-auto text-muted" />
                                        <p className="tabular mt-1 font-bold">{a.delivery_mix[k] ?? 0}</p>
                                        <p className="text-xs text-muted">{label}</p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_1fr]">
                        <Card>
                            <h2 className="font-bold">When people order</h2>
                            <p className="mb-5 text-sm text-muted">Orders by hour of day (UTC). Staff up before the peak.</p>
                            <BarChart
                                ariaLabel="Orders by hour of day"
                                height={150}
                                data={a.busiest_hours.map((h) => ({ key: String(h.hour), label: hourLabel(h.hour), value: h.orders }))}
                                format={(v) => String(Math.round(v))}
                                labelEvery={4}
                            />
                        </Card>
                        <Card>
                            <div className="flex items-baseline justify-between">
                                <h2 className="font-bold">Latest reviews</h2>
                                <span className="text-sm text-muted">Replies are public</span>
                            </div>
                            <div className="mt-4">
                                <ReviewReplyList reviews={(reviews ?? []).slice(0, 4)} onReplied={() => mutateReviews()} />
                            </div>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}
