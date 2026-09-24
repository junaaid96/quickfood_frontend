"use client";

import { useEffect, useRef, useState } from "react";
import { ChatCircleDots, PaperPlaneRight } from "@phosphor-icons/react";
import { request } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import { clock, cn } from "@/lib/format";
import type { OrderMessage } from "@/lib/types";
import { useToast } from "@/providers/toast-provider";

const QUICK_CUSTOMER = ["Extra napkins please", "Please ring the bell", "Leave at the door", "Any update?"];
const QUICK_KITCHEN = ["Thanks for your order!", "Running 5 min behind, sorry!", "Rider is on the way", "We're out of that, can we swap?"];

export function OrderChat({ orderId, open, asRestaurant = false, counterpart }: { orderId: number; open: boolean; asRestaurant?: boolean; counterpart: string }) {
    const toast = useToast();
    const { data: messages, mutate } = useApi<OrderMessage[]>(`/orders/${orderId}/messages/`, { refreshInterval: open ? 5000 : 0 });
    const [body, setBody] = useState("");
    const [sending, setSending] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    }, [messages?.length]);

    const send = async (text: string) => {
        const t = text.trim();
        if (!t || sending) return;
        setSending(true);
        try {
            const next = await request<OrderMessage[]>(`/orders/${orderId}/messages/`, { method: "POST", body: { body: t } });
            mutate(next, { revalidate: false });
            setBody("");
        } catch (e) {
            toast((e as Error).message, "error");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex h-full flex-col">
            <div ref={listRef} className="max-h-80 min-h-40 flex-1 space-y-2 overflow-y-auto p-1">
                {!messages?.length ? (
                    <div className="flex h-full flex-col items-center justify-center py-6 text-center text-sm text-muted">
                        <ChatCircleDots size={28} className="mb-2 text-brand" />
                        Message {counterpart} about this order.
                    </div>
                ) : (
                    messages.map((m) => (
                        <div key={m.id} className={cn("flex flex-col", m.is_mine ? "items-end" : "items-start")}>
                            <div className={cn("max-w-[85%] rounded-2xl px-3.5 py-2 text-sm", m.is_mine ? "rounded-br-md bg-brand text-brand-ink" : "rounded-bl-md bg-surface-2")}>
                                {m.body}
                            </div>
                            <span className="mt-0.5 px-1 text-[11px] text-muted">
                                {m.is_mine ? "You" : m.sender_name} · {clock(m.created_at)}
                            </span>
                        </div>
                    ))
                )}
            </div>
            {open ? (
                <>
                    <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto">
                        {(asRestaurant ? QUICK_KITCHEN : QUICK_CUSTOMER).map((q) => (
                            <button key={q} onClick={() => send(q)} className="shrink-0 rounded-full border border-line px-3 py-1 text-xs font-medium hover:border-brand hover:text-brand">
                                {q}
                            </button>
                        ))}
                    </div>
                    <form
                        className="mt-2 flex gap-2"
                        onSubmit={(e) => {
                            e.preventDefault();
                            send(body);
                        }}
                    >
                        <input
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            maxLength={500}
                            placeholder="Write a message"
                            aria-label="Message"
                            className="h-11 flex-1 rounded-full border border-line bg-surface px-4 text-sm focus:border-brand focus:outline-none"
                        />
                        <button type="submit" disabled={!body.trim() || sending} aria-label="Send" className="grid size-11 place-items-center rounded-full bg-brand text-brand-ink disabled:opacity-40">
                            <PaperPlaneRight size={18} weight="fill" />
                        </button>
                    </form>
                </>
            ) : (
                <p className="mt-3 text-center text-xs text-muted">Chat is closed for this order.</p>
            )}
        </div>
    );
}
