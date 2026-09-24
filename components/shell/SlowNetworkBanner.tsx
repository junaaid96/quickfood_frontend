"use client";

import { useEffect, useState } from "react";
import { CookingPot } from "@phosphor-icons/react";
import { onSlowNetwork } from "@/lib/api";

/** The API sleeps when idle; the first request can take a while. Say so instead of looking frozen. */
export default function SlowNetworkBanner() {
    const [slow, setSlow] = useState(false);
    useEffect(() => {
        const off = onSlowNetwork(setSlow);
        return () => {
            off();
        };
    }, []);
    if (!slow) return null;
    return (
        <div role="status" className="fixed inset-x-0 top-16 z-30 flex justify-center px-4 pt-3">
            <div className="flex animate-rise items-center gap-3 rounded-full border border-line bg-surface px-4 py-2 text-sm shadow-card">
                <CookingPot size={18} className="animate-bounce text-brand" />
                Warming up the kitchen. The first load can take up to a minute.
            </div>
        </div>
    );
}
