"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
    CalendarBlank,
    Clock,
    Coins,
    CreditCard,
    Leaf,
    Lightning,
    MapPin,
    Money,
    Moped,
    PencilSimple,
    Plus,
    ShoppingBag,
    Tag,
    X,
} from "@phosphor-icons/react";
import { ApiError, request } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import { clock, cn, money, num } from "@/lib/format";
import type { Address, DeliveryOption, Order, Promo, Quote } from "@/lib/types";
import { useAuth } from "@/providers/auth-provider";
import { useCart } from "@/providers/cart-provider";
import { useToast } from "@/providers/toast-provider";
import { Button, LinkButton } from "@/components/ui/Button";
import { EmptyState, Skeleton } from "@/components/ui/Bits";
import { Field, Input, Textarea, Toggle } from "@/components/ui/Field";
import { CoverImage } from "@/components/ui/CoverImage";

const SPEED_ICON: Record<DeliveryOption, typeof Moped> = { priority: Lightning, standard: Moped, eco: Leaf };
const TIP_PERCENTS = [0, 10, 15, 20];

function scheduleSlots() {
    const slots: Date[] = [];
    const start = new Date(Date.now() + 45 * 60 * 1000);
    start.setMinutes(Math.ceil(start.getMinutes() / 30) * 30, 0, 0);
    for (let i = 0; i < 16; i++) slots.push(new Date(start.getTime() + i * 30 * 60 * 1000));
    return slots;
}

export default function CheckoutPage() {
    const router = useRouter();
    const toast = useToast();
    const cart = useCart();
    const { user, isLoading: authLoading, isRestaurantOwner, refreshUser } = useAuth();

    const { data: addresses, mutate: mutateAddresses } = useApi<Address[]>(user ? "/accounts/addresses/" : null);
    const { data: promos } = useApi<Promo[]>(cart.restaurant ? `/orders/promos/?restaurant=${cart.restaurant.id}` : null);

    const [addressId, setAddressId] = useState<number | "new" | null>(null);
    const [newAddress, setNewAddress] = useState("");
    const [newLabel, setNewLabel] = useState("Home");
    const [saveAddress, setSaveAddress] = useState(true);
    const [notes, setNotes] = useState("");
    const [phone, setPhone] = useState("");
    const [when, setWhen] = useState<"asap" | "later">("asap");
    const [slot, setSlot] = useState<string>("");
    const [speed, setSpeed] = useState<DeliveryOption>("standard");
    const [tipPct, setTipPct] = useState<number | "custom">(10);
    const [customTip, setCustomTip] = useState("");
    const [payment, setPayment] = useState<"cash" | "card">("cash");
    const [promoInput, setPromoInput] = useState("");
    const [promo, setPromo] = useState("");
    const [usePoints, setUsePoints] = useState(false);
    const [quote, setQuote] = useState<Quote | null>(null);
    const [quoteError, setQuoteError] = useState("");
    const [placing, setPlacing] = useState(false);
    const slots = useMemo(scheduleSlots, []);

    useEffect(() => {
        if (!authLoading && !user) router.replace("/login?redirect=/checkout");
    }, [authLoading, user, router]);

    useEffect(() => {
        if (user?.phone_number && !phone) setPhone(user.phone_number);
    }, [user, phone]);

    useEffect(() => {
        if (addressId !== null || !addresses) return;
        const preferred = addresses.find((a) => a.is_default) ?? addresses[0];
        if (preferred) setAddressId(preferred.id);
        else {
            setAddressId("new");
            if (user?.address) setNewAddress(user.address);
        }
    }, [addresses, addressId, user]);

    const tip = tipPct === "custom" ? Math.max(0, Math.min(100, num(customTip))) : Math.round(cart.subtotal * tipPct) / 100;
    const scheduledFor = when === "later" && slot ? slot : null;
    const orderItems = useMemo(() => cart.lines.map((l) => ({ menu_item: l.item.id, quantity: l.quantity, note: l.note })), [cart.lines]);

    // Live quote from the server, debounced.
    useEffect(() => {
        if (!user || !orderItems.length || isRestaurantOwner) return;
        const t = setTimeout(async () => {
            try {
                const q = await request<Quote>("/orders/quote/", {
                    method: "POST",
                    body: { order_items: orderItems, delivery_option: speed, promo_code: promo, use_points: usePoints, tip: tip.toFixed(2), scheduled_for: scheduledFor },
                });
                setQuote(q);
                setQuoteError("");
            } catch (e) {
                setQuoteError((e as Error).message);
            }
        }, 250);
        return () => clearTimeout(t);
    }, [user, orderItems, speed, promo, usePoints, tip, scheduledFor, isRestaurantOwner]);

    if (authLoading || !user) return <CheckoutSkeleton />;
    if (isRestaurantOwner) {
        return (
            <div className="mx-auto max-w-lg px-4 py-16">
                <EmptyState icon={<ShoppingBag size={26} />} title="Partner accounts can't order" body="Log in with a customer account to place orders." action={<LinkButton href="/dashboard">Go to dashboard</LinkButton>} />
            </div>
        );
    }
    if (!cart.restaurant || cart.lines.length === 0) {
        return (
            <div className="mx-auto max-w-lg px-4 py-16">
                <EmptyState icon={<ShoppingBag size={26} />} title="Your basket is empty" body="Pick a kitchen and add a few dishes first." action={<LinkButton href="/restaurants">Browse restaurants</LinkButton>} />
            </div>
        );
    }

    const selectedAddress = addresses?.find((a) => a.id === addressId);
    const deliveryAddress = addressId === "new" ? newAddress.trim() : selectedAddress?.line ?? "";
    const instructions = [selectedAddress?.instructions, notes].filter(Boolean).join(". ");
    const closedNeedsSchedule = quote && !quote.restaurant_open && !scheduledFor;
    const blocked = !deliveryAddress || !quote || quote.below_min_order || !!closedNeedsSchedule || (when === "later" && !slot);

    const place = async () => {
        if (blocked) return;
        setPlacing(true);
        try {
            if (addressId === "new" && saveAddress) {
                await request("/accounts/addresses/", { method: "POST", body: { label: newLabel || "Home", line: deliveryAddress } }).catch(() => null);
                mutateAddresses();
            }
            const order = await request<Order>("/orders/", {
                method: "POST",
                body: {
                    order_items: orderItems,
                    delivery_address: deliveryAddress,
                    delivery_option: speed,
                    payment_method: payment,
                    contact_phone: phone,
                    notes: instructions.slice(0, 300),
                    promo_code: promo,
                    use_points: usePoints,
                    tip: tip.toFixed(2),
                    scheduled_for: scheduledFor,
                },
            });
            cart.clear();
            refreshUser();
            router.push(`/orders/${order.id}?placed=1`);
        } catch (e) {
            const err = e as ApiError;
            if (err.fieldErrors?.promo_code) {
                setPromo("");
            }
            toast(err.message, "error");
            setPlacing(false);
        }
    };

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
            <h1 className="text-3xl font-extrabold sm:text-4xl">Checkout</h1>
            <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_380px]">
                <div className="space-y-6">
                    {/* Address */}
                    <Section title="Where to?" icon={<MapPin size={20} weight="fill" />}>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {addresses?.map((a) => (
                                <OptionCard key={a.id} selected={addressId === a.id} onClick={() => setAddressId(a.id)}>
                                    <span className="font-semibold">{a.label}</span>
                                    <span className="mt-0.5 line-clamp-2 block text-sm text-muted">{a.line}</span>
                                </OptionCard>
                            ))}
                            <OptionCard selected={addressId === "new"} onClick={() => setAddressId("new")}>
                                <span className="inline-flex items-center gap-2 font-semibold">
                                    <Plus size={16} weight="bold" /> New address
                                </span>
                            </OptionCard>
                        </div>
                        {addressId === "new" && (
                            <div className="mt-4 space-y-3">
                                <Field label="Address">
                                    <Textarea required value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder="House, road, area, city" className="min-h-20" />
                                </Field>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                    <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Label (Home, Work)" aria-label="Address label" className="sm:max-w-44" />
                                    <div className="flex-1">
                                        <Toggle checked={saveAddress} onChange={setSaveAddress} label="Save for next time" />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <Field label="Instructions for the rider">
                                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Gate code, floor, landmark" maxLength={200} />
                            </Field>
                            <Field label="Phone">
                                <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
                            </Field>
                        </div>
                    </Section>

                    {/* When */}
                    <Section title="When?" icon={<Clock size={20} weight="fill" />}>
                        <div className="grid grid-cols-2 gap-3">
                            <OptionCard selected={when === "asap"} onClick={() => setWhen("asap")}>
                                <span className="font-semibold">As soon as possible</span>
                                <span className="block text-sm text-muted">{quote ? `About ${quote.eta_minutes} min` : "Calculating"}</span>
                            </OptionCard>
                            <OptionCard selected={when === "later"} onClick={() => { setWhen("later"); if (!slot) setSlot(slots[0].toISOString()); }}>
                                <span className="inline-flex items-center gap-1.5 font-semibold">
                                    <CalendarBlank size={16} /> Schedule
                                </span>
                                <span className="block text-sm text-muted">Up to 7 days ahead</span>
                            </OptionCard>
                        </div>
                        {when === "later" && (
                            <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
                                {slots.map((s) => {
                                    const iso = s.toISOString();
                                    const today = s.toDateString() === new Date().toDateString();
                                    return (
                                        <button
                                            key={iso}
                                            onClick={() => setSlot(iso)}
                                            className={cn(
                                                "shrink-0 rounded-2xl border px-4 py-2 text-center text-sm transition",
                                                slot === iso ? "border-brand bg-brand-soft font-semibold text-brand" : "border-line bg-surface hover:border-ink/30",
                                            )}
                                        >
                                            <span className="block text-xs text-muted">{today ? "Today" : "Tomorrow"}</span>
                                            {clock(s)}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        {closedNeedsSchedule && (
                            <p className="mt-3 rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">
                                {cart.restaurant.name} is closed right now. Schedule the order for later.
                            </p>
                        )}
                    </Section>

                    {/* Speed */}
                    <Section title="Delivery speed" icon={<Moped size={20} weight="fill" />}>
                        <div className="grid gap-3 sm:grid-cols-3">
                            {(quote?.delivery_options ?? []).map((o) => {
                                const Icon = SPEED_ICON[o.value];
                                return (
                                    <OptionCard key={o.value} selected={speed === o.value} onClick={() => setSpeed(o.value)} className={o.value === "eco" ? "relative" : undefined}>
                                        {o.value === "eco" && <span className="absolute -top-2.5 right-3 rounded-full bg-ok px-2 py-0.5 text-[11px] font-bold text-white">Greener</span>}
                                        <span className="flex items-center justify-between">
                                            <Icon size={22} weight="duotone" className={o.value === "eco" ? "text-ok" : o.value === "priority" ? "text-warn" : "text-brand"} />
                                            <span className="tabular font-bold">{num(o.fee) === 0 ? "Free" : money(o.fee)}</span>
                                        </span>
                                        <span className="mt-2 block font-semibold">{o.label}</span>
                                        <span className="tabular block text-sm text-muted">~{o.eta_minutes} min</span>
                                        <span className="mt-1 block text-xs text-muted">{o.description}</span>
                                    </OptionCard>
                                );
                            })}
                            {!quote && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
                        </div>
                    </Section>

                    {/* Tip & payment */}
                    <Section title="Tip your rider" icon={<Coins size={20} weight="fill" />}>
                        <p className="-mt-2 mb-3 text-sm text-muted">100% goes to the person bringing your food.</p>
                        <div className="flex flex-wrap gap-2">
                            {TIP_PERCENTS.map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setTipPct(p)}
                                    className={cn(
                                        "rounded-full border px-4 py-2 text-sm font-semibold transition",
                                        tipPct === p ? "border-ink bg-ink text-bg" : "border-line bg-surface hover:border-ink/30",
                                    )}
                                >
                                    {p === 0 ? "No tip" : `${p}%`}
                                    {p > 0 && <span className="tabular ml-1 font-normal opacity-70">{money((cart.subtotal * p) / 100)}</span>}
                                </button>
                            ))}
                            <button
                                onClick={() => setTipPct("custom")}
                                className={cn("rounded-full border px-4 py-2 text-sm font-semibold", tipPct === "custom" ? "border-ink bg-ink text-bg" : "border-line bg-surface")}
                            >
                                Other
                            </button>
                            {tipPct === "custom" && (
                                <Input type="number" min={0} max={100} step="0.5" value={customTip} onChange={(e) => setCustomTip(e.target.value)} placeholder="0.00" aria-label="Custom tip" className="w-28" autoFocus />
                            )}
                        </div>
                    </Section>

                    <Section title="Payment" icon={<CreditCard size={20} weight="fill" />}>
                        <div className="grid grid-cols-2 gap-3">
                            <OptionCard selected={payment === "cash"} onClick={() => setPayment("cash")}>
                                <Money size={22} className="text-ok" />
                                <span className="mt-2 block font-semibold">Cash on delivery</span>
                            </OptionCard>
                            <OptionCard selected={payment === "card"} onClick={() => setPayment("card")}>
                                <CreditCard size={22} className="text-brand" />
                                <span className="mt-2 block font-semibold">Card on delivery</span>
                                <span className="block text-xs text-muted">Rider brings a card machine</span>
                            </OptionCard>
                        </div>
                    </Section>
                </div>

                {/* Summary */}
                <aside className="lg:sticky lg:top-24">
                    <div className="rounded-3xl border border-line bg-surface p-5 shadow-card">
                        <div className="flex items-center gap-3">
                            <CoverImage src={cart.restaurant.cover_image} alt="" cuisine={cart.restaurant.cuisine} iconSize={20} className="size-12 rounded-xl" />
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-bold">{cart.restaurant.name}</p>
                                <p className="text-sm text-muted">{cart.count} items</p>
                            </div>
                            <button onClick={cart.open} className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
                                <PencilSimple size={14} /> Edit
                            </button>
                        </div>
                        <ul className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
                            {cart.lines.map((l) => (
                                <li key={l.item.id} className="flex justify-between gap-3">
                                    <span className="min-w-0">
                                        <span className="tabular font-semibold">{l.quantity}x</span> {l.item.name}
                                        {l.note && <span className="block truncate text-xs text-muted">{l.note}</span>}
                                    </span>
                                    <span className="tabular text-muted">{money(num(l.item.price) * l.quantity)}</span>
                                </li>
                            ))}
                        </ul>

                        {/* Promo */}
                        <div className="mt-4 border-t border-line pt-4">
                            {promo && quote?.promo_code ? (
                                <div className="flex items-center justify-between rounded-2xl bg-ok-soft px-3 py-2.5 text-sm">
                                    <span className="inline-flex items-center gap-2 font-semibold text-ok">
                                        <Tag size={16} weight="fill" /> {quote.promo_code}
                                        <span className="font-normal">{quote.promo_description}</span>
                                    </span>
                                    <button onClick={() => { setPromo(""); setPromoInput(""); }} aria-label="Remove promo code" className="text-muted hover:text-ink">
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <form
                                        className="flex gap-2"
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            setPromo(promoInput.trim().toUpperCase());
                                        }}
                                    >
                                        <Input value={promoInput} onChange={(e) => setPromoInput(e.target.value)} placeholder="Promo code" aria-label="Promo code" className="uppercase" />
                                        <Button type="submit" variant="outline" disabled={!promoInput.trim()}>
                                            Apply
                                        </Button>
                                    </form>
                                    {promo && quote?.promo_error && <p className="mt-2 text-sm text-danger">{quote.promo_error}</p>}
                                    {promos && promos.length > 0 && (
                                        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
                                            {promos.map((p) => (
                                                <button
                                                    key={p.code}
                                                    onClick={() => { setPromoInput(p.code); setPromo(p.code); }}
                                                    title={p.description}
                                                    className="shrink-0 rounded-full border border-dashed border-brand/50 px-3 py-1 text-xs font-bold text-brand hover:bg-brand-soft"
                                                >
                                                    {p.code}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Points */}
                        {quote && quote.points_available >= 100 && (
                            <div className="mt-4 rounded-2xl bg-warn-soft p-3">
                                <Toggle
                                    checked={usePoints}
                                    onChange={setUsePoints}
                                    label={`Use points (${quote.points_available} available)`}
                                    description={usePoints && quote.points_redeemed ? `${quote.points_redeemed} pts for ${money(quote.points_discount)} off` : "100 points = $1 off"}
                                />
                            </div>
                        )}

                        {/* Breakdown */}
                        <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
                            {quote ? (
                                <>
                                    <Line label="Subtotal" value={money(quote.subtotal)} />
                                    <Line label={`Delivery (${quote.delivery_options.find((o) => o.value === quote.delivery_option)?.label})`} value={num(quote.delivery_fee) === 0 ? "Free" : money(quote.delivery_fee)} />
                                    <Line label="Service fee" value={money(quote.service_fee)} hint="Keeps the lights on: support, payments, tracking" />
                                    {num(quote.discount) > 0 && <Line label="Promo" value={`-${money(quote.discount)}`} positive />}
                                    {num(quote.points_discount) > 0 && <Line label="Points" value={`-${money(quote.points_discount)}`} positive />}
                                    {num(quote.tip) > 0 && <Line label="Rider tip" value={money(quote.tip)} />}
                                    <div className="flex items-baseline justify-between border-t border-line pt-3">
                                        <dt className="font-bold">Total</dt>
                                        <dd className="tabular font-display text-2xl font-extrabold">{money(quote.total)}</dd>
                                    </div>
                                    <p className="text-xs text-muted">
                                        You&apos;ll earn <span className="font-semibold text-warn">{quote.points_to_earn} points</span> when this arrives.
                                    </p>
                                </>
                            ) : quoteError ? (
                                <p className="text-danger">{quoteError}</p>
                            ) : (
                                <Skeleton className="h-32" />
                            )}
                        </dl>
                        {quote?.below_min_order && (
                            <p className="mt-3 rounded-xl bg-warn-soft px-3 py-2 text-sm text-warn">
                                Minimum order is {money(quote.min_order)}. <button onClick={cart.open} className="font-semibold underline">Add more</button>
                            </p>
                        )}
                        <Button size="lg" className="mt-5 w-full" disabled={blocked} loading={placing} onClick={place}>
                            {scheduledFor ? `Schedule for ${clock(scheduledFor)}` : "Place order"}
                            {quote && <span className="tabular opacity-80">{money(quote.total)}</span>}
                        </Button>
                        {!deliveryAddress && <p className="mt-2 text-center text-xs text-muted">Add a delivery address to continue.</p>}
                        <p className="mt-3 text-center text-xs text-muted">
                            You can cancel for free until the kitchen confirms. <Link href="/orders" className="underline">Your orders</Link>
                        </p>
                    </div>
                </aside>
            </div>
        </div>
    );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <section className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
                <span className="text-brand">{icon}</span> {title}
            </h2>
            {children}
        </section>
    );
}

function OptionCard({ selected, onClick, children, className }: { selected: boolean; onClick: () => void; children: React.ReactNode; className?: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={selected}
            className={cn(
                "rounded-2xl border-2 p-4 text-left transition",
                selected ? "border-brand bg-brand-soft/60" : "border-line bg-surface hover:border-ink/25",
                className,
            )}
        >
            {children}
        </button>
    );
}

function Line({ label, value, hint, positive }: { label: string; value: string; hint?: string; positive?: boolean }) {
    return (
        <div className="flex justify-between gap-3" title={hint}>
            <dt className="text-muted">{label}</dt>
            <dd className={cn("tabular", positive && "font-semibold text-ok")}>{value}</dd>
        </div>
    );
}

function CheckoutSkeleton() {
    return (
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_380px]">
            <div className="space-y-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-44 rounded-3xl" />
                ))}
            </div>
            <Skeleton className="h-[480px] rounded-3xl" />
        </div>
    );
}
