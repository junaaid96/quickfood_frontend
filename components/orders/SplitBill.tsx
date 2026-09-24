"use client";

import { useState } from "react";
import { Copy, UsersThree } from "@phosphor-icons/react";
import { money, num } from "@/lib/format";
import type { Order } from "@/lib/types";
import { Stepper } from "@/components/ui/Bits";
import { useToast } from "@/providers/toast-provider";

/** Even split of the full bill (fees and tip included), with a shareable summary. */
export function SplitBill({ order }: { order: Order }) {
    const [people, setPeople] = useState(2);
    const toast = useToast();
    const total = num(order.total_price);
    const each = Math.ceil((total / people) * 100) / 100;

    const copy = async () => {
        const text = `QuickFood order #${order.id} from ${order.restaurant_details.name}: ${money(total)} total, ${money(each)} each for ${people} people.`;
        try {
            await navigator.clipboard.writeText(text);
            toast("Copied. Paste it in your group chat.", "info");
        } catch {
            toast("Couldn't copy", "error");
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 font-semibold">
                    <UsersThree size={20} className="text-brand" /> Split between
                </span>
                <Stepper value={people} onChange={(v) => setPeople(Math.max(2, Math.min(20, v)))} min={2} size="sm" label="people" />
            </div>
            <div className="mt-4 flex items-end justify-between rounded-2xl bg-surface-2 p-4">
                <div>
                    <p className="text-sm text-muted">Each person pays</p>
                    <p className="tabular font-display text-3xl font-extrabold">{money(each)}</p>
                </div>
                <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-2 text-sm font-semibold shadow-sm hover:text-brand">
                    <Copy size={16} /> Copy
                </button>
            </div>
        </div>
    );
}
