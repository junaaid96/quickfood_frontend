import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/format";

export const inputClass =
    "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink placeholder:text-muted/70 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 disabled:opacity-60";

export function Field({
    label,
    error,
    hint,
    children,
    className,
}: {
    label: string;
    error?: string;
    hint?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <label className={cn("block", className)}>
            <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
            {children}
            {error ? (
                <span className="mt-1.5 block text-sm text-danger">{error}</span>
            ) : hint ? (
                <span className="mt-1.5 block text-sm text-muted">{hint}</span>
            ) : null}
        </label>
    );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
    return <input className={cn(inputClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
    return <textarea className={cn(inputClass, "min-h-24 resize-y", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
    return <select className={cn(inputClass, "appearance-none pr-9", className)} {...props} />;
}

export function Toggle({
    checked,
    onChange,
    label,
    description,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
    description?: string;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className="flex w-full items-center justify-between gap-4 text-left"
        >
            <span>
                <span className="block text-sm font-medium text-ink">{label}</span>
                {description && <span className="block text-sm text-muted">{description}</span>}
            </span>
            <span
                className={cn(
                    "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                    checked ? "bg-brand" : "bg-line",
                )}
            >
                <span
                    className={cn(
                        "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform",
                        checked && "translate-x-5",
                    )}
                />
            </span>
        </button>
    );
}
