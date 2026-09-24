"use client";

import Link from "next/link";
import { ArrowSquareOut, Plus, Storefront } from "@phosphor-icons/react";
import { useApi } from "@/lib/hooks";
import { money } from "@/lib/format";
import type { Restaurant } from "@/lib/types";
import { Badge, EmptyState, Rating, Skeleton } from "@/components/ui/Bits";
import { LinkButton } from "@/components/ui/Button";
import { CoverImage } from "@/components/ui/CoverImage";

export default function MyRestaurants() {
    const { data } = useApi<Restaurant[]>("/restaurants/restaurant/?owner=me");
    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold sm:text-4xl">Your restaurants</h1>
                    <p className="mt-1 text-muted">Menus, hours, fees and photos.</p>
                </div>
                <LinkButton href="/dashboard/restaurants/new" icon={<Plus size={18} weight="bold" />}>
                    New restaurant
                </LinkButton>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {!data && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-3xl" />)}
                {data?.map((r) => (
                    <div key={r.id} className="overflow-hidden rounded-3xl border border-line bg-surface">
                        <Link href={`/dashboard/restaurants/${r.id}`}>
                            <CoverImage src={r.cover_image} alt={r.name} cuisine={r.cuisine} className="aspect-[16/9] w-full" />
                        </Link>
                        <div className="p-5">
                            <div className="flex items-start justify-between gap-3">
                                <Link href={`/dashboard/restaurants/${r.id}`} className="text-lg font-bold hover:text-brand">
                                    {r.name}
                                </Link>
                                <Rating value={r.rating} count={r.review_count} />
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <Badge tone={r.is_open ? "ok" : "warn"}>{r.is_open ? "Open" : r.is_accepting_orders ? "Outside hours" : "Paused"}</Badge>
                                <Badge>{r.cuisine_label}</Badge>
                                <Badge>{r.order_count} orders</Badge>
                                <Badge>Fee {money(r.delivery_fee)}</Badge>
                            </div>
                            <div className="mt-4 flex gap-2">
                                <LinkButton href={`/dashboard/restaurants/${r.id}`} size="sm" className="flex-1">
                                    Manage
                                </LinkButton>
                                <LinkButton href={`/restaurants/${r.id}`} size="sm" variant="outline" icon={<ArrowSquareOut size={16} />}>
                                    View
                                </LinkButton>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {data?.length === 0 && (
                <EmptyState icon={<Storefront size={26} />} title="No restaurants yet" body="Create your first one to start taking orders." action={<LinkButton href="/dashboard/restaurants/new">Create restaurant</LinkButton>} />
            )}
        </div>
    );
}
