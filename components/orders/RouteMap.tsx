"use client";

import { useEffect, useRef, useState } from "react";
import { House, Moped, Storefront } from "@phosphor-icons/react";

const PATH = "M 70 250 C 120 250, 130 170, 190 160 S 270 190, 300 130 S 360 70, 430 70";

/**
 * A stylised street map. The rider sits at the restaurant until pickup, then travels along the route
 * in proportion to the ETA. It's an honest illustration, not GPS: we say so in the caption.
 */
export function RouteMap({ progress, active }: { progress: number; active: boolean }) {
    const pathRef = useRef<SVGPathElement>(null);
    const [point, setPoint] = useState({ x: 70, y: 250 });
    const [length, setLength] = useState(0);

    useEffect(() => {
        const path = pathRef.current;
        if (!path) return;
        const total = path.getTotalLength();
        setLength(total);
        const travel = Math.max(0, (progress - 0.4) / 0.6);
        const p = path.getPointAtLength(total * Math.min(1, travel));
        setPoint({ x: p.x, y: p.y });
    }, [progress]);

    const travelled = Math.max(0, (progress - 0.4) / 0.6);

    return (
        <div className="relative overflow-hidden rounded-3xl border border-line bg-surface-2">
            <svg viewBox="0 0 500 320" className="block h-auto w-full" role="img" aria-label="Illustrated route from the restaurant to your address">
                <defs>
                    <pattern id="blocks" width="60" height="60" patternUnits="userSpaceOnUse">
                        <rect x="6" y="6" width="48" height="48" rx="8" fill="var(--surface)" opacity="0.8" />
                    </pattern>
                </defs>
                <rect width="500" height="320" fill="var(--line)" opacity="0.45" />
                <rect width="500" height="320" fill="url(#blocks)" />
                <path d="M 0 212 C 140 190, 300 250, 500 205" stroke="var(--ok)" strokeOpacity="0.18" strokeWidth="26" fill="none" />
                <path d={PATH} stroke="var(--muted)" strokeOpacity="0.35" strokeWidth="7" strokeLinecap="round" strokeDasharray="1 14" fill="none" />
                <path
                    ref={pathRef}
                    d={PATH}
                    stroke="var(--brand)"
                    strokeWidth="7"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={length || 1}
                    strokeDashoffset={length ? length * (1 - Math.min(1, travelled)) : 0}
                    style={{ transition: "stroke-dashoffset 1.2s ease" }}
                />
            </svg>
            <Pin style={{ left: "14%", top: "78%" }} label={active && progress < 0.4 ? "Cooking" : "Restaurant"} tone="ink" pulse={active && progress < 0.4}>
                <Storefront size={18} weight="fill" />
            </Pin>
            <Pin style={{ left: "86%", top: "22%" }} label="You" tone="brand">
                <House size={18} weight="fill" />
            </Pin>
            {active && progress >= 0.4 && (
                <div
                    className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-[1200ms] ease-out"
                    style={{ left: `${(point.x / 500) * 100}%`, top: `${(point.y / 320) * 100}%` }}
                >
                    <span className="absolute inset-0 animate-ping rounded-full bg-brand/40" />
                    <span className="relative grid size-10 place-items-center rounded-full border-2 border-surface bg-brand text-brand-ink shadow-card">
                        <Moped size={20} weight="fill" />
                    </span>
                </div>
            )}
            <p className="absolute bottom-2 left-3 text-[11px] text-muted">Illustrative route</p>
        </div>
    );
}

function Pin({ children, style, label, tone, pulse }: { children: React.ReactNode; style: React.CSSProperties; label: string; tone: "ink" | "brand"; pulse?: boolean }) {
    return (
        <div className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1" style={style}>
            <span className="relative">
                {pulse && <span className="absolute inset-0 animate-ping rounded-2xl bg-brand/40" />}
                <span className={`relative grid size-9 place-items-center rounded-2xl shadow-card ${tone === "brand" ? "bg-brand text-brand-ink" : "bg-ink text-bg"}`}>{children}</span>
            </span>
            <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold shadow-sm">{label}</span>
        </div>
    );
}
