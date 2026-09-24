"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowClockwise, ArrowRight, Receipt, Star } from "@phosphor-icons/react";
import { useApi } from "@/lib/hooks";
import { STATUS_COPY, isActive, orderProgress } from "@/lib/orders";
import { clock, dateTime, money } from "@/lib/format";
import type { Order } from "@/lib/types";
import { useReorder } from "@/lib/useReorder";
import { useAuth } from "@/providers/auth-provider";
import { Badge, EmptyState, Segmented, Skeleton } from "@/components/ui/Bits";
import { Button, LinkButton } from "@/components/ui/Button";
import { CoverImage } from "@/components/ui/CoverImage";

export default function OrdersPage() {
    const { user, isLoading, isRestaurantOwner } = useAuth();
    const router = useRouter();
    const [tab, setTab] = useState<"all" | "delivered" | "cancelled">("all");
    const { data: orders } = useApi<Order[]>(user ? "/orders/" : null, { refreshInterval: 15000 });
    const { reorder, busy } = useReorder();

    useEffect(() => {
        if (!isLoading && !user) router.replace("/login?redirect=/orders");
        if (isRestaurantOwner) router.replace("/dashboard/orders");
    }, [isLoading, user, isRestaurantOwner, router]);

    const active = orders?.filter((o) => isActive(o.status)) ?? [];
    const past = (orders?.filter((o) => !isActive(o.status)) ?? []).filter((o) => tab === "all" || o.status === tab);

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
            <h1 className="text-3xl font-extrabold sm:text-4xl">Your orders</h1>

            {!orders ? (
                <div className="mt-8 space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-28 rounded-3xl" />
                    ))}
                </div>
            ) : orders.length === 0 ? (
                <div className="mt-8">
                    <EmptyState icon={<Receipt size={26} />} title="No orders yet" body="Your first one is a few taps away." action={<LinkButton href="/restaurants">Find food</LinkButton>} />
                </div>
            ) : (
                <>
                    {active.length > 0 && (
                        <section className="mt-8">
                            <h2 className="text-sm font-bold tracking-wide text-muted uppercase">In progress</h2>
                            <div className="mt-3 space-y-3">
                                {active.map((o) => (
                                    <Link key={o.id} href={`/orders/${o.id}`} className="block rounded-3xl border-2 border-brand/30 bg-surface p-5 transition hover:border-brand">
                                        <div className="flex items-center gap-4">
                                            <CoverImage src={o.restaurant_details.cover_image} alt="" cuisine={o.restaurant_details.cuisine} iconSize={22} className="size-14 shrink-0 rounded-2xl" />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-bold">{o.restaurant_details.name}</p>
                                                <p className="text-sm text-brand">{STATUS_COPY[o.status].title}</p>
                                            </div>
                                            <div className="text-right">
                                                {o.estimated_delivery_at && <p className="tabular font-bold">{clock(o.estimated_delivery_at)}</p>}
                                                <p className="text-xs text-muted">{o.scheduled_for ? "scheduled" : "estimated"}</p>
                                            </div>
                                            <ArrowRight size={18} className="text-muted" />
                                        </div>
                                        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-2">
                                            <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(5, orderProgress(o) * 100)}%` }} />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    <section className="mt-10">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h2 className="text-sm font-bold tracking-wide text-muted uppercase">History</h2>
                            <Segmented
                                value={tab}
                                onChange={setTab}
                                options={[
                                    { value: "all", label: "All" },
                                    { value: "delivered", label: "Delivered" },
                                    { value: "cancelled", label: "Cancelled" },
                                ]}
                            />
                        </div>
                        <ul className="mt-3 divide-y divide-line rounded-3xl border border-line bg-surface">
                            {past.length === 0 && <li className="p-6 text-center text-muted">Nothing here.</li>}
                            {past.map((o) => (
                                <li key={o.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
                                    <Link href={`/orders/${o.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                                        <CoverImage src={o.restaurant_details.cover_image} alt="" cuisine={o.restaurant_details.cuisine} iconSize={20} className="size-12 shrink-0 rounded-xl" />
                                        <div className="min-w-0">
                                            <p className="truncate font-semibold">{o.restaurant_details.name}</p>
                                            <p className="truncate text-sm text-muted">
                                                {dateTime(o.created_at)} · {o.items.reduce((s, i) => s + i.quantity, 0)} items · {money(o.total_price)}
                                            </p>
                                        </div>
                                    </Link>
                                    <div className="flex items-center gap-2">
                                        {o.status === "cancelled" ? (
                                            <Badge tone="danger">Cancelled</Badge>
                                        ) : o.review ? (
                                            <Badge tone="warn">
                                                <Star size={12} weight="fill" /> {o.review.rating}
                                            </Badge>
                                        ) : (
                                            <LinkButton href={`/orders/${o.id}`} variant="ghost" size="sm">
                                                Rate
                                            </LinkButton>
                                        )}
                                        <Button variant="outline" size="sm" loading={busy === o.id} onClick={() => reorder(o.id)} icon={<ArrowClockwise size={16} />}>
                                            Reorder
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section>
                </>
            )}
        </div>
    );
}
