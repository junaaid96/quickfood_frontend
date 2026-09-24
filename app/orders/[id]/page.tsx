"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
    ArrowClockwise,
    ArrowLeft,
    CalendarCheck,
    ChatCircleDots,
    Confetti,
    Leaf,
    MapPin,
    Phone,
    Receipt,
    Star,
} from "@phosphor-icons/react";
import { useApi } from "@/lib/hooks";
import { request } from "@/lib/api";
import { STATUS_COPY, isActive, orderProgress } from "@/lib/orders";
import { clock, cn, dateTime, money, num } from "@/lib/format";
import type { Order } from "@/lib/types";
import { useReorder } from "@/lib/useReorder";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card, EmptyState, Skeleton, StarInput } from "@/components/ui/Bits";
import { Textarea } from "@/components/ui/Field";
import { CoverImage } from "@/components/ui/CoverImage";
import { Modal } from "@/components/ui/Overlay";
import { StatusTimeline } from "@/components/orders/StatusTimeline";
import { RouteMap } from "@/components/orders/RouteMap";
import { OrderChat } from "@/components/orders/OrderChat";
import { SplitBill } from "@/components/orders/SplitBill";

export default function OrderPage() {
    return (
        <Suspense>
            <OrderDetail />
        </Suspense>
    );
}

function OrderDetail() {
    const { id } = useParams<{ id: string }>();
    const placed = useSearchParams().get("placed") === "1";
    const { user, isRestaurantOwner } = useAuth();
    const toast = useToast();
    const { reorder, busy } = useReorder();
    const [now, setNow] = useState(() => Date.now());
    const [cancelOpen, setCancelOpen] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    const { data: order, error, mutate } = useApi<Order>(user ? `/orders/${id}/` : null, {
        refreshInterval: (o) => (o && isActive(o.status) ? 8000 : 0),
    });

    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 15000);
        return () => clearInterval(t);
    }, []);

    if (error) {
        return (
            <div className="mx-auto max-w-lg px-4 py-16">
                <EmptyState icon={<Receipt size={26} />} title="Order not found" body="It may belong to a different account." action={<LinkButton href="/orders">My orders</LinkButton>} />
            </div>
        );
    }
    if (!order) return <OrderSkeleton />;

    const active = isActive(order.status);
    const copy = STATUS_COPY[order.status];
    const progress = orderProgress(order, now);
    const eta = order.estimated_delivery_at ? new Date(order.estimated_delivery_at).getTime() : null;
    const minsLeft = eta ? Math.round((eta - now) / 60000) : null;
    const chatOpen = active || (order.delivered_at ? now - new Date(order.delivered_at).getTime() < 2 * 3600 * 1000 : false);
    const r = order.restaurant_details;

    const cancel = async () => {
        setCancelling(true);
        try {
            const updated = await request<Order>(`/orders/${order.id}/cancel/`, { method: "POST", body: { reason: "Cancelled by customer" } });
            mutate(updated, { revalidate: false });
            toast("Order cancelled");
            setCancelOpen(false);
        } catch (e) {
            toast((e as Error).message, "error");
        } finally {
            setCancelling(false);
        }
    };

    return (
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
            <Link href={isRestaurantOwner ? "/dashboard/orders" : "/orders"} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
                <ArrowLeft size={16} /> {isRestaurantOwner ? "Kitchen board" : "All orders"}
            </Link>

            {placed && active && (
                <div className="mt-4 flex animate-rise items-center gap-3 rounded-2xl bg-ok-soft p-4 text-ok">
                    <Confetti size={26} weight="duotone" />
                    <p className="font-semibold">Order placed! We&apos;ll keep this page updated, no need to refresh.</p>
                </div>
            )}

            <div className="mt-4 grid items-start gap-6 lg:grid-cols-[1.3fr_1fr]">
                <div className="space-y-6">
                    {/* Status hero */}
                    <Card className="overflow-hidden p-0 sm:p-0">
                        <div className="p-5 sm:p-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm text-muted">
                                        Order #{order.id} · {dateTime(order.created_at)}
                                    </p>
                                    <h1 className="mt-1 text-3xl font-extrabold">{copy.title}</h1>
                                    <p className="mt-1 text-muted">{copy.body}</p>
                                </div>
                                {active && eta && (
                                    <div className="rounded-2xl bg-brand-soft px-4 py-3 text-right">
                                        <p className="text-xs font-semibold text-brand">{order.scheduled_for ? "Scheduled for" : "Arriving"}</p>
                                        <p className="tabular font-display text-2xl font-extrabold text-brand">
                                            {order.scheduled_for ? clock(order.scheduled_for) : minsLeft !== null && minsLeft > 1 ? `${minsLeft} min` : "Any minute"}
                                        </p>
                                        {!order.scheduled_for && <p className="tabular text-xs text-muted">by {clock(eta)}</p>}
                                    </div>
                                )}
                                {order.status === "delivered" && order.delivered_at && (
                                    <p className="rounded-2xl bg-ok-soft px-4 py-3 text-sm font-semibold text-ok">Delivered at {clock(order.delivered_at)}</p>
                                )}
                            </div>
                            {order.scheduled_for && active && (
                                <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-surface-2 px-3 py-1 text-sm">
                                    <CalendarCheck size={16} /> Scheduled delivery, {dateTime(order.scheduled_for)}
                                </p>
                            )}
                            {active && (
                                <div className="mt-5 h-2 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
                                    <div className="h-full rounded-full bg-brand transition-all duration-1000" style={{ width: `${Math.max(4, progress * 100)}%` }} />
                                </div>
                            )}
                        </div>
                        {order.status !== "cancelled" && (
                            <div className="border-t border-line p-3 sm:p-4">
                                <RouteMap progress={progress} active={active} />
                            </div>
                        )}
                    </Card>

                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <h2 className="mb-4 font-bold">Timeline</h2>
                            <StatusTimeline order={order} />
                            {order.can_cancel && (
                                <Button variant="danger" size="sm" className="mt-5 w-full" onClick={() => setCancelOpen(true)}>
                                    Cancel order
                                </Button>
                            )}
                        </Card>
                        <Card>
                            <h2 className="mb-3 flex items-center gap-2 font-bold">
                                <ChatCircleDots size={20} className="text-brand" /> {isRestaurantOwner ? "Chat with customer" : `Chat with ${r.name}`}
                            </h2>
                            <OrderChat orderId={order.id} open={chatOpen} asRestaurant={isRestaurantOwner} counterpart={isRestaurantOwner ? "the customer" : r.name} />
                        </Card>
                    </div>

                    {order.status === "delivered" && !isRestaurantOwner && <ReviewCard order={order} onDone={() => mutate()} />}
                </div>

                {/* Receipt */}
                <div className="space-y-6 lg:sticky lg:top-24">
                    <Card>
                        <Link href={`/restaurants/${r.id}`} className="flex items-center gap-3">
                            <CoverImage src={r.cover_image} alt="" cuisine={r.cuisine} iconSize={20} className="size-12 rounded-xl" />
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-bold hover:text-brand">{r.name}</p>
                                <p className="truncate text-sm text-muted">{r.address}</p>
                            </div>
                            <a href={`tel:${r.phone_number}`} onClick={(e) => e.stopPropagation()} aria-label="Call restaurant" className="grid size-10 place-items-center rounded-full bg-surface-2 hover:text-brand">
                                <Phone size={18} />
                            </a>
                        </Link>
                        <ul className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
                            {order.items.map((i) => (
                                <li key={i.id} className="flex justify-between gap-3">
                                    <span>
                                        <span className="tabular font-semibold">{i.quantity}x</span> {i.menu_item_details.name}
                                        {i.note && <span className="block text-xs text-muted">{i.note}</span>}
                                    </span>
                                    <span className="tabular">{money(num(i.price) * i.quantity)}</span>
                                </li>
                            ))}
                        </ul>
                        <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
                            <Row label="Subtotal" value={money(order.subtotal)} />
                            <Row label={`Delivery · ${order.delivery_option_label}`} value={num(order.delivery_fee) ? money(order.delivery_fee) : "Free"} />
                            <Row label="Service fee" value={money(order.service_fee)} />
                            {num(order.discount) > 0 && <Row label={`Promo ${order.promo_code ?? ""}`} value={`-${money(order.discount)}`} good />}
                            {num(order.points_discount) > 0 && <Row label={`${order.points_redeemed} points`} value={`-${money(order.points_discount)}`} good />}
                            {num(order.tip) > 0 && <Row label="Rider tip" value={money(order.tip)} />}
                            <div className="flex justify-between border-t border-line pt-3 text-base font-bold">
                                <dt>Total · {order.payment_method === "cash" ? "Cash" : "Card"}</dt>
                                <dd className="tabular">{money(order.total_price)}</dd>
                            </div>
                        </dl>
                        {order.delivery_option === "eco" && (
                            <p className="mt-4 flex items-center gap-2 rounded-2xl bg-ok-soft px-3 py-2 text-sm text-ok">
                                <Leaf size={16} weight="fill" /> Wait & Save: shared ride, fewer trips.
                            </p>
                        )}
                        {order.points_earned > 0 && (
                            <p className="mt-3 flex items-center gap-2 rounded-2xl bg-warn-soft px-3 py-2 text-sm text-warn">
                                <Star size={16} weight="fill" /> You earned {order.points_earned} points
                            </p>
                        )}
                        <div className="mt-4 flex items-start gap-2 text-sm text-muted">
                            <MapPin size={16} className="mt-0.5 shrink-0" />
                            <span>
                                {order.delivery_address}
                                {order.notes && <span className="block text-xs">{order.notes}</span>}
                            </span>
                        </div>
                        {isRestaurantOwner && (
                            <p className="mt-2 text-sm text-muted">
                                Customer: {order.user_details.first_name || order.user_details.username} {order.contact_phone && `· ${order.contact_phone}`}
                            </p>
                        )}
                        {!active && !isRestaurantOwner && (
                            <Button variant="outline" className="mt-5 w-full" loading={busy === order.id} onClick={() => reorder(order.id)} icon={<ArrowClockwise size={18} />}>
                                Order this again
                            </Button>
                        )}
                    </Card>
                    {!isRestaurantOwner && order.status !== "cancelled" && (
                        <Card>
                            <SplitBill order={order} />
                        </Card>
                    )}
                </div>
            </div>

            <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel this order?">
                <p className="text-muted">The kitchen hasn&apos;t started yet, so there&apos;s no charge. Any points you used go straight back to your balance.</p>
                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button variant="outline" onClick={() => setCancelOpen(false)}>
                        Keep my order
                    </Button>
                    <Button variant="danger" loading={cancelling} onClick={cancel}>
                        Yes, cancel
                    </Button>
                </div>
            </Modal>
        </div>
    );
}

function Row({ label, value, good }: { label: string; value: string; good?: boolean }) {
    return (
        <div className="flex justify-between gap-3">
            <dt className="text-muted">{label}</dt>
            <dd className={cn("tabular", good && "font-semibold text-ok")}>{value}</dd>
        </div>
    );
}

function ReviewCard({ order, onDone }: { order: Order; onDone: () => void }) {
    const toast = useToast();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [saving, setSaving] = useState(false);

    if (order.review) {
        return (
            <Card>
                <h2 className="font-bold">Your review</h2>
                <div className="mt-2 flex">
                    {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} size={20} weight={n <= order.review!.rating ? "fill" : "regular"} className="text-warn" />
                    ))}
                </div>
                {order.review.comment && <p className="mt-2">{order.review.comment}</p>}
                {order.review.owner_reply && (
                    <p className="mt-3 rounded-2xl bg-surface-2 p-3 text-sm">
                        <span className="font-semibold">{order.restaurant_details.name} replied: </span>
                        {order.review.owner_reply}
                    </p>
                )}
            </Card>
        );
    }

    const submit = async () => {
        setSaving(true);
        try {
            await request("/restaurants/reviews/", { method: "POST", body: { order: order.id, rating, comment } });
            toast("Thanks! Your review helps other hungry people.");
            onDone();
        } catch (e) {
            toast((e as Error).message, "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="border-brand/30">
            <h2 className="text-lg font-bold">How was it?</h2>
            <p className="text-sm text-muted">Your review is marked as a verified order.</p>
            <div className="mt-4">
                <StarInput value={rating} onChange={setRating} />
            </div>
            {rating > 0 && (
                <div className="mt-4 animate-rise space-y-3">
                    <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={rating >= 4 ? "What did you love?" : "What could be better?"} maxLength={1000} />
                    <Button onClick={submit} loading={saving}>
                        Post review
                    </Button>
                </div>
            )}
        </Card>
    );
}

function OrderSkeleton() {
    return (
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1.3fr_1fr]">
            <Skeleton className="h-[520px] rounded-3xl" />
            <Skeleton className="h-[420px] rounded-3xl" />
        </div>
    );
}
