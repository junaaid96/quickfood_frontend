import Link from "next/link";
import { Clock, MagnifyingGlass, Moped } from "@phosphor-icons/react";
import type { Restaurant } from "@/lib/types";
import { money, num, priceLevel } from "@/lib/format";
import { Badge, Rating } from "@/components/ui/Bits";
import { CoverImage } from "@/components/ui/CoverImage";
import { FavoriteButton } from "./FavoriteButton";

export function RestaurantCard({ restaurant: r, priority }: { restaurant: Restaurant; priority?: boolean }) {
    const freeDelivery = num(r.delivery_fee) === 0;
    return (
        <Link href={`/restaurants/${r.id}`} className="group block">
            <div className="relative overflow-hidden rounded-3xl">
                <CoverImage
                    src={r.cover_image}
                    alt={r.name}
                    cuisine={r.cuisine}
                    priority={priority}
                    className="aspect-[16/10] w-full transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <div className="absolute top-3 left-3 flex gap-1.5">
                    {freeDelivery && <Badge tone="custom" className="bg-ok text-white">Free delivery</Badge>}
                    {r.order_count >= 15 && <Badge tone="custom" className="bg-surface/90 text-ink backdrop-blur">Popular</Badge>}
                </div>
                <FavoriteButton restaurantId={r.id} initial={r.is_favorite} className="absolute top-3 right-3" />
                {!r.is_open && (
                    <div className="absolute inset-0 grid place-items-center bg-black/45">
                        <span className="rounded-full bg-surface px-3 py-1 text-sm font-semibold text-ink">
                            {r.is_accepting_orders ? "Closed now, order ahead" : "Paused, back soon"}
                        </span>
                    </div>
                )}
            </div>
            <div className="mt-3 px-1">
                <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg leading-tight font-bold group-hover:text-brand">{r.name}</h3>
                    <Rating value={r.rating} count={r.review_count} className="shrink-0" />
                </div>
                <p className="mt-0.5 text-sm text-muted">
                    {r.cuisine_label} <span aria-hidden>·</span> {priceLevel(r.price_level)}
                    {r.tag_list.length > 0 && (
                        <>
                            {" "}
                            <span aria-hidden>·</span> {r.tag_list.slice(0, 2).join(", ")}
                        </>
                    )}
                </p>
                <div className="mt-2 flex items-center gap-4 text-sm">
                    <span className="inline-flex items-center gap-1.5">
                        <Clock size={16} className="text-muted" />
                        <span className="tabular">{r.eta_range[0]}-{r.eta_range[1]} min</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <Moped size={16} className="text-muted" />
                        {freeDelivery ? <span className="font-semibold text-ok">Free</span> : <span className="tabular">{money(r.delivery_fee)}</span>}
                    </span>
                </div>
                {r.matching_dishes.length > 0 && (
                    <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand">
                        <MagnifyingGlass size={13} weight="bold" /> {r.matching_dishes.join(", ")}
                    </p>
                )}
            </div>
        </Link>
    );
}

export function RestaurantCardSkeleton() {
    return (
        <div>
            <div className="skeleton aspect-[16/10] rounded-3xl" />
            <div className="skeleton mt-3 h-5 w-2/3 rounded-lg" />
            <div className="skeleton mt-2 h-4 w-1/2 rounded-lg" />
        </div>
    );
}
