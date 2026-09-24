"use client";

import { Fire, Plus } from "@phosphor-icons/react";
import type { MenuItem } from "@/lib/types";
import { money } from "@/lib/format";
import { Stepper } from "@/components/ui/Bits";
import { CoverImage } from "@/components/ui/CoverImage";
import { DietaryTags } from "./Dietary";

export function MenuItemCard({
    item,
    cuisine,
    quantity,
    popular,
    disabled,
    onAdd,
    onQuantity,
}: {
    item: MenuItem;
    cuisine: string;
    quantity: number;
    popular: boolean;
    disabled?: boolean;
    onAdd: () => void;
    onQuantity: (q: number) => void;
}) {
    return (
        <article className="group flex gap-4 rounded-3xl border border-line bg-surface p-4 transition hover:border-ink/20">
            <div className="flex min-w-0 flex-1 flex-col">
                {popular && (
                    <span className="mb-1 inline-flex w-fit items-center gap-1 text-xs font-bold text-brand">
                        <Fire size={14} weight="fill" /> Most ordered
                    </span>
                )}
                <h3 className="leading-snug font-bold">{item.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{item.description}</p>
                <div className="mt-2">
                    <DietaryTags item={item} />
                </div>
                <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                    <span className="tabular font-bold">
                        {money(item.price)}
                        {item.calories ? <span className="ml-2 text-xs font-normal text-muted">{item.calories} kcal</span> : null}
                    </span>
                    {!item.cover_image &&
                        (quantity > 0 ? (
                            <Stepper size="sm" label={item.name} value={quantity} onChange={onQuantity} />
                        ) : (
                            <AddButton onClick={onAdd} disabled={disabled} label={item.name} />
                        ))}
                </div>
            </div>
            {item.cover_image && (
                <div className="relative w-28 shrink-0 sm:w-32">
                    <CoverImage src={item.cover_image} alt={item.name} cuisine={cuisine} iconSize={24} className="aspect-square w-full rounded-2xl" />
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                        {quantity > 0 ? (
                            <Stepper size="sm" label={item.name} value={quantity} onChange={onQuantity} />
                        ) : (
                            <AddButton onClick={onAdd} disabled={disabled} label={item.name} />
                        )}
                    </div>
                </div>
            )}
        </article>
    );
}

function AddButton({ onClick, disabled, label }: { onClick: () => void; disabled?: boolean; label: string }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            aria-label={`Add ${label} to basket`}
            className="inline-flex h-9 items-center gap-1 rounded-full bg-surface px-3 text-sm font-bold text-ink shadow-card ring-1 ring-line transition hover:bg-brand hover:text-brand-ink hover:ring-brand disabled:opacity-40"
        >
            <Plus size={15} weight="bold" /> Add
        </button>
    );
}
