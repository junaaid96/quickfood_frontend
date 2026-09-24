"use client";

import { useState } from "react";
import { cn } from "@/lib/format";

type Datum = { key: string; label: string; value: number; detail?: string };

/**
 * Single-series vertical bar chart: thin bars, 4px rounded data-ends on the baseline,
 * 2px gaps, recessive gridlines, and a hover/focus tooltip on every bar.
 */
export function BarChart({
    data,
    format,
    height = 200,
    labelEvery = 1,
    ariaLabel,
}: {
    data: Datum[];
    format: (v: number) => string;
    height?: number;
    labelEvery?: number;
    ariaLabel: string;
}) {
    const [hover, setHover] = useState<number | null>(null);
    const max = Math.max(...data.map((d) => d.value), 0);
    const niceMax = max <= 0 ? 1 : niceCeil(max);
    const ticks = [niceMax, niceMax / 2, 0];

    return (
        <figure aria-label={ariaLabel}>
            <div className="flex gap-2">
                <div className="tabular flex flex-col justify-between py-0 text-right text-[11px] text-muted" style={{ height }}>
                    {ticks.map((t) => (
                        <span key={t} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">
                            {format(t)}
                        </span>
                    ))}
                </div>
                <div className="relative flex-1">
                    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between" style={{ height }}>
                        {ticks.map((t) => (
                            <div key={t} className={cn("border-t", t === 0 ? "border-muted/50" : "border-dashed border-line")} />
                        ))}
                    </div>
                    <div className="relative flex items-end gap-[2px]" style={{ height }} onMouseLeave={() => setHover(null)}>
                        {data.map((d, i) => {
                            const h = (d.value / niceMax) * 100;
                            const on = hover === i;
                            return (
                                <button
                                    key={d.key}
                                    type="button"
                                    className="group relative flex h-full flex-1 items-end focus:outline-none"
                                    onMouseEnter={() => setHover(i)}
                                    onFocus={() => setHover(i)}
                                    onBlur={() => setHover(null)}
                                    aria-label={`${d.label}: ${format(d.value)}${d.detail ? `, ${d.detail}` : ""}`}
                                >
                                    <span
                                        className={cn("block w-full rounded-t-[4px] bg-brand transition-opacity", hover !== null && !on && "opacity-45")}
                                        style={{ height: d.value > 0 ? `max(${h}%, 3px)` : 0 }}
                                    />
                                    {on && (
                                        <span
                                            className={cn(
                                                "pointer-events-none absolute z-10 rounded-xl bg-ink px-3 py-2 text-left text-xs whitespace-nowrap text-bg shadow-card",
                                                i > data.length * 0.66 ? "right-0" : i < data.length * 0.33 ? "left-0" : "left-1/2 -translate-x-1/2",
                                            )}
                                            style={{ bottom: `calc(${Math.min(h, 70)}% + 8px)` }}
                                        >
                                            <span className="block text-bg/70">{d.label}</span>
                                            <span className="tabular block text-sm font-bold">{format(d.value)}</span>
                                            {d.detail && <span className="block text-bg/70">{d.detail}</span>}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    <div className="mt-2 flex gap-[2px] text-[11px] text-muted">
                        {data.map((d, i) => (
                            <span key={d.key} className="relative h-4 flex-1">
                                {i % labelEvery === 0 && <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap">{d.label}</span>}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </figure>
    );
}

function niceCeil(v: number) {
    const exp = Math.pow(10, Math.floor(Math.log10(v)));
    const n = v / exp;
    const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
    return step * exp;
}

export function KpiTile({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "ok" | "warn" | "danger" }) {
    return (
        <div className="rounded-3xl border border-line bg-surface p-5">
            <p className="text-sm text-muted">{label}</p>
            <p className="tabular mt-1 font-display text-3xl font-extrabold">{value}</p>
            {sub && <p className={cn("mt-1 text-sm", tone === "ok" ? "text-ok" : tone === "warn" ? "text-warn" : tone === "danger" ? "text-danger" : "text-muted")}>{sub}</p>}
        </div>
    );
}
