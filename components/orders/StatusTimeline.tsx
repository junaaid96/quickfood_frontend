import { Check, X } from "@phosphor-icons/react";
import type { Order } from "@/lib/types";
import { FLOW, STATUS_COPY, stepIndex } from "@/lib/orders";
import { clock, cn } from "@/lib/format";

export function StatusTimeline({ order }: { order: Order }) {
    const current = stepIndex(order.status);
    const at = (status: string) => order.events.find((e) => e.status === status)?.created_at;

    if (order.status === "cancelled") {
        const ev = order.events.find((e) => e.status === "cancelled");
        return (
            <div className="flex items-start gap-3 rounded-2xl bg-danger-soft p-4 text-danger">
                <X size={22} weight="bold" className="mt-0.5 shrink-0" />
                <div>
                    <p className="font-semibold">Cancelled {ev && `at ${clock(ev.created_at)}`}</p>
                    {ev?.note && <p className="text-sm opacity-80">{ev.note}</p>}
                </div>
            </div>
        );
    }

    return (
        <ol className="relative">
            {FLOW.map((s, i) => {
                const done = i < current || order.status === "delivered";
                const now = i === current && order.status !== "delivered";
                const time = at(s);
                return (
                    <li key={s} className="relative flex gap-4 pb-6 last:pb-0">
                        {i < FLOW.length - 1 && (
                            <span className={cn("absolute top-7 left-[13px] h-[calc(100%-22px)] w-0.5", done ? "bg-brand" : "bg-line")} aria-hidden />
                        )}
                        <span
                            className={cn(
                                "relative z-10 grid size-7 shrink-0 place-items-center rounded-full border-2",
                                done && "border-brand bg-brand text-brand-ink",
                                now && "border-brand bg-surface",
                                !done && !now && "border-line bg-surface",
                            )}
                        >
                            {done ? <Check size={14} weight="bold" /> : now ? <span className="size-2.5 animate-ping rounded-full bg-brand" /> : null}
                        </span>
                        <div className="-mt-0.5 flex-1">
                            <p className={cn("font-semibold", !done && !now && "text-muted")}>{STATUS_COPY[s].short}</p>
                            {now && <p className="text-sm text-muted">{STATUS_COPY[s].body}</p>}
                        </div>
                        {time && <span className="tabular text-sm text-muted">{clock(time)}</span>}
                    </li>
                );
            })}
        </ol>
    );
}
