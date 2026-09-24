"use client";

import Link from "next/link";
import { ShoppingBag } from "@phosphor-icons/react";
import type { MealPlan } from "@/lib/types";
import { money } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { CoverImage } from "@/components/ui/CoverImage";
import { Rating } from "@/components/ui/Bits";

export function PlanCard({ plan, onAdd, showRestaurant = true }: { plan: MealPlan; onAdd: () => void; showRestaurant?: boolean }) {
    const r = plan.restaurant;
    return (
        <article className="flex flex-col overflow-hidden rounded-3xl border border-line bg-surface">
            {showRestaurant && (
                <Link href={`/restaurants/${r.id}`} className="flex items-center gap-3 border-b border-line p-4 hover:bg-surface-2">
                    <CoverImage src={r.cover_image} alt="" cuisine={r.cuisine} iconSize={20} className="size-12 shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1">
                        <p className="truncate font-bold">{r.name}</p>
                        <p className="text-sm text-muted">
                            {r.cuisine_label} <span aria-hidden>·</span> <span className="whitespace-nowrap">{r.eta_range[0]}-{r.eta_range[1]} min</span>
                        </p>
                    </div>
                    <Rating value={r.rating} />
                </Link>
            )}
            <div className="flex flex-1 flex-col p-4">
                <p className="text-xs font-bold tracking-wide text-brand uppercase">{plan.label}</p>
                <ul className="mt-2 flex-1 space-y-1.5 text-sm">
                    {plan.items.map((i) => (
                        <li key={i.menu_item_id} className="flex justify-between gap-3">
                            <span>
                                <span className="tabular font-semibold">{i.quantity}x</span> {i.name}
                            </span>
                            <span className="tabular text-muted">{money(Number(i.price) * i.quantity)}</span>
                        </li>
                    ))}
                </ul>
                <div className="mt-4 border-t border-dashed border-line pt-3 text-sm">
                    <div className="flex justify-between text-muted">
                        <span>Food</span>
                        <span className="tabular">{money(plan.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-muted">
                        <span>Delivery and service</span>
                        <span className="tabular">{money(Number(plan.delivery_fee) + Number(plan.service_fee))}</span>
                    </div>
                    <div className="mt-1 flex items-baseline justify-between">
                        <span className="font-semibold">Estimated total</span>
                        <span className="tabular font-display text-xl font-extrabold">{money(plan.estimated_total)}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2" aria-label={`${plan.budget_used}% of budget`}>
                        <div className="h-full rounded-full bg-ok" style={{ width: `${plan.budget_used}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-muted">{money(plan.leftover)} left of your budget</p>
                </div>
                <Button className="mt-4 w-full" onClick={onAdd}>
                    <ShoppingBag size={18} /> Add all to basket
                </Button>
            </div>
        </article>
    );
}
