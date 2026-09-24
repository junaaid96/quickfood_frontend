"use client";

import { useState } from "react";
import { ChatCircleText } from "@phosphor-icons/react";
import { request } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import type { Review } from "@/lib/types";
import { useToast } from "@/providers/toast-provider";
import { Rating } from "@/components/ui/Bits";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

export function ReviewReplyList({ reviews, onReplied }: { reviews: Review[]; onReplied: () => void }) {
    if (!reviews.length) return <p className="text-sm text-muted">No reviews yet. They appear after customers receive their orders.</p>;
    return (
        <ul className="space-y-4">
            {reviews.map((r) => (
                <ReviewRow key={r.id} review={r} onReplied={onReplied} />
            ))}
        </ul>
    );
}

function ReviewRow({ review: r, onReplied }: { review: Review; onReplied: () => void }) {
    const toast = useToast();
    const [open, setOpen] = useState(false);
    const [text, setText] = useState("");
    const [saving, setSaving] = useState(false);

    const send = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await request(`/restaurants/reviews/${r.id}/reply/`, { method: "POST", body: { reply: text } });
            toast("Reply posted");
            setOpen(false);
            onReplied();
        } catch (err) {
            toast((err as Error).message, "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <li className="rounded-2xl border border-line p-4">
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm">
                    <span className="font-semibold">{r.user}</span> <span className="text-muted">· {r.restaurant_name} · {timeAgo(r.created_at)}</span>
                </p>
                <Rating value={r.rating} />
            </div>
            {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
            {r.owner_reply ? (
                <p className="mt-2 flex gap-2 rounded-xl bg-surface-2 p-2.5 text-sm">
                    <ChatCircleText size={16} className="mt-0.5 shrink-0 text-brand" /> {r.owner_reply}
                </p>
            ) : open ? (
                <form onSubmit={send} className="mt-3 flex gap-2">
                    <Input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Thank them or explain what you'll fix" className="py-2 text-sm" />
                    <Button type="submit" size="sm" loading={saving} disabled={!text.trim()}>
                        Reply
                    </Button>
                </form>
            ) : (
                <button onClick={() => setOpen(true)} className="mt-2 text-sm font-semibold text-brand hover:underline">
                    Reply
                </button>
            )}
        </li>
    );
}
