"use client";

import { ChatCircleText, Star } from "@phosphor-icons/react";
import { useApi } from "@/lib/hooks";
import type { Review } from "@/lib/types";
import { timeAgo } from "@/lib/format";
import { Rating } from "@/components/ui/Bits";

export function ReviewsSection({ restaurantId, rating, count, breakdown }: { restaurantId: number; rating: number | null; count: number; breakdown: Record<string, number> }) {
    const { data: reviews } = useApi<Review[]>(`/restaurants/reviews/?restaurant=${restaurantId}`);
    const max = Math.max(1, ...Object.values(breakdown));

    return (
        <section id="reviews" className="scroll-mt-24">
            <h2 className="text-2xl font-bold">Reviews</h2>
            <p className="mt-1 text-sm text-muted">Only customers who received an order can leave one.</p>
            {count === 0 ? (
                <p className="mt-6 rounded-3xl border border-dashed border-line p-8 text-center text-muted">No reviews yet. Be the first after your order arrives.</p>
            ) : (
                <div className="mt-6 grid gap-8 lg:grid-cols-[240px_1fr]">
                    <div>
                        <p className="font-display text-6xl font-extrabold">{rating?.toFixed(1)}</p>
                        <div className="mt-1 flex">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <Star key={n} size={18} weight={rating && n <= Math.round(rating) ? "fill" : "regular"} className="text-warn" />
                            ))}
                        </div>
                        <p className="mt-1 text-sm text-muted">{count} verified reviews</p>
                        <div className="mt-5 space-y-1.5">
                            {[5, 4, 3, 2, 1].map((n) => (
                                <div key={n} className="flex items-center gap-2 text-sm">
                                    <span className="tabular w-3 text-muted">{n}</span>
                                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                                        <div className="h-full rounded-full bg-warn" style={{ width: `${((breakdown[n] ?? 0) / max) * 100}%` }} />
                                    </div>
                                    <span className="tabular w-6 text-right text-muted">{breakdown[n] ?? 0}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <ul className="space-y-4">
                        {reviews?.slice(0, 8).map((r) => (
                            <li key={r.id} className="rounded-3xl border border-line bg-surface p-5">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <span className="grid size-9 place-items-center rounded-full bg-surface-2 text-sm font-bold">{r.user[0]}</span>
                                        <div>
                                            <p className="font-semibold">{r.user}</p>
                                            <p className="text-xs text-muted">{timeAgo(r.created_at)}</p>
                                        </div>
                                    </div>
                                    <Rating value={r.rating} />
                                </div>
                                {r.comment && <p className="mt-3">{r.comment}</p>}
                                {r.items.length > 0 && <p className="mt-2 text-xs text-muted">Ordered: {r.items.join(", ")}</p>}
                                {r.owner_reply && (
                                    <div className="mt-3 flex gap-2 rounded-2xl bg-surface-2 p-3 text-sm">
                                        <ChatCircleText size={18} className="shrink-0 text-brand" />
                                        <p>
                                            <span className="font-semibold">Reply from the kitchen: </span>
                                            {r.owner_reply}
                                        </p>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    );
}
