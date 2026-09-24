"use client";

import { Minus, Plus, Star, Trash } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/format";

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "brand" | "ok" | "warn" | "danger" | "custom"; className?: string }) {
    const tones = {
        neutral: "bg-surface-2 text-muted",
        brand: "bg-brand-soft text-brand",
        ok: "bg-ok-soft text-ok",
        warn: "bg-warn-soft text-warn",
        danger: "bg-danger-soft text-danger",
        custom: "",
    };
    return (
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)}>
            {children}
        </span>
    );
}

export function Skeleton({ className }: { className?: string }) {
    return <div className={cn("skeleton rounded-xl", className)} />;
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn("rounded-3xl border border-line bg-surface p-5 shadow-card sm:p-6", className)}>{children}</div>;
}

export function Stepper({
    value,
    onChange,
    min = 0,
    size = "md",
    label,
}: {
    value: number;
    onChange: (v: number) => void;
    min?: number;
    size?: "sm" | "md";
    label: string;
}) {
    const btn = size === "sm" ? "size-7" : "size-9";
    return (
        <div className="inline-flex items-center gap-1 rounded-full bg-surface-2 p-1" aria-label={`Quantity of ${label}`}>
            <button
                type="button"
                aria-label={value <= 1 && min === 0 ? `Remove ${label}` : `Decrease ${label}`}
                onClick={() => onChange(Math.max(min, value - 1))}
                className={cn(btn, "grid place-items-center rounded-full bg-surface text-ink shadow-sm transition hover:text-brand")}
            >
                {value <= 1 && min === 0 ? <Trash size={15} /> : <Minus size={15} weight="bold" />}
            </button>
            <span className="tabular min-w-7 text-center text-sm font-bold">{value}</span>
            <button
                type="button"
                aria-label={`Increase ${label}`}
                onClick={() => onChange(Math.min(50, value + 1))}
                className={cn(btn, "grid place-items-center rounded-full bg-brand text-brand-ink shadow-sm transition hover:bg-brand-strong")}
            >
                <Plus size={15} weight="bold" />
            </button>
        </div>
    );
}

export function Rating({ value, count, className }: { value: number | null; count?: number; className?: string }) {
    if (value === null) return <span className={cn("text-sm text-muted", className)}>New</span>;
    return (
        <span className={cn("inline-flex items-center gap-1 text-sm font-semibold", className)}>
            <Star size={15} weight="fill" className="text-warn" />
            <span className="tabular">{value.toFixed(1)}</span>
            {count !== undefined && <span className="font-normal text-muted">({count})</span>}
        </span>
    );
}

export function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    return (
        <div className="flex gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
                <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={value === n}
                    aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    onClick={() => onChange(n)}
                    className="transition-transform hover:scale-110"
                >
                    <Star size={34} weight={n <= value ? "fill" : "regular"} className={n <= value ? "text-warn" : "text-line"} />
                </button>
            ))}
        </div>
    );
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body?: string; action?: ReactNode }) {
    return (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-line px-6 py-14 text-center">
            <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand">{icon}</div>
            <h3 className="text-lg font-bold">{title}</h3>
            {body && <p className="mt-1 max-w-sm text-muted">{body}</p>}
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}

export function Segmented<T extends string>({
    value,
    onChange,
    options,
    className,
}: {
    value: T;
    onChange: (v: T) => void;
    options: { value: T; label: ReactNode }[];
    className?: string;
}) {
    return (
        <div className={cn("inline-flex rounded-full bg-surface-2 p-1", className)} role="tablist">
            {options.map((o) => (
                <button
                    key={o.value}
                    role="tab"
                    aria-selected={value === o.value}
                    onClick={() => onChange(o.value)}
                    className={cn(
                        "rounded-full px-4 py-1.5 text-sm font-semibold transition",
                        value === o.value ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink",
                    )}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}
