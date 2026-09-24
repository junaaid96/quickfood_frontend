"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    ArrowLeft,
    ArrowRight,
    Clock,
    Leaf,
    MagnifyingGlass,
    MapPin,
    Moped,
    PencilSimple,
    Phone,
    Receipt,
    ShoppingBag,
    Wallet,
} from "@phosphor-icons/react";
import { useApi } from "@/lib/hooks";
import { request } from "@/lib/api";
import { cn, hoursLabel, money, num, priceLevel } from "@/lib/format";
import { planToLines, toCartRestaurant } from "@/lib/plan";
import type { MealPlan, RestaurantDetail } from "@/lib/types";
import { useCart } from "@/providers/cart-provider";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { Badge, EmptyState, Rating, Skeleton, Stepper } from "@/components/ui/Bits";
import { Button, LinkButton } from "@/components/ui/Button";
import { CoverImage } from "@/components/ui/CoverImage";
import { Modal } from "@/components/ui/Overlay";
import { FavoriteButton } from "@/components/restaurant/FavoriteButton";
import { MenuItemCard } from "@/components/restaurant/MenuItemCard";
import { ReviewsSection } from "@/components/restaurant/Reviews";
import { PlanCard } from "@/components/restaurant/PlanCard";

const DIET_FILTERS = [
    { key: "veg", label: "Vegetarian" },
    { key: "vegan", label: "Vegan" },
    { key: "gf", label: "Gluten free" },
    { key: "mild", label: "No spice" },
] as const;

export default function RestaurantPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { user, isRestaurantOwner } = useAuth();
    const cart = useCart();
    const toast = useToast();
    const { data: r, error, isLoading } = useApi<RestaurantDetail>(`/restaurants/restaurant/${id}/`);
    const [query, setQuery] = useState("");
    const [diet, setDiet] = useState<string[]>([]);
    const [activeCat, setActiveCat] = useState<string>("");
    const [plannerOpen, setPlannerOpen] = useState(false);
    const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

    const items = useMemo(() => {
        if (!r) return [];
        const q = query.trim().toLowerCase();
        return r.menu_items.filter((i) => {
            if (q && !`${i.name} ${i.description}`.toLowerCase().includes(q)) return false;
            if (diet.includes("veg") && !i.is_vegetarian) return false;
            if (diet.includes("vegan") && !i.is_vegan) return false;
            if (diet.includes("gf") && !i.is_gluten_free) return false;
            if (diet.includes("mild") && i.spice_level > 0) return false;
            return true;
        });
    }, [r, query, diet]);

    const grouped = useMemo(() => {
        const map = new Map<string, typeof items>();
        (r?.categories ?? []).forEach((c) => map.set(c, []));
        items.forEach((i) => map.set(i.category, [...(map.get(i.category) ?? []), i]));
        return [...map.entries()].filter(([, list]) => list.length > 0);
    }, [items, r]);

    // Scrollspy for the category bar.
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible[0]) setActiveCat(visible[0].target.getAttribute("data-cat") ?? "");
            },
            { rootMargin: "-140px 0px -60% 0px" },
        );
        Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
        return () => observer.disconnect();
    }, [grouped]);

    if (error) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-16">
                <EmptyState icon={<MagnifyingGlass size={26} />} title="Restaurant not found" body="It may have closed its doors." action={<LinkButton href="/restaurants">Browse others</LinkButton>} />
            </div>
        );
    }
    if (isLoading || !r) return <RestaurantSkeleton />;

    const isOwner = user?.id === r.owner.id;
    const inThisCart = cart.restaurant?.id === r.id;
    const canOrder = !isRestaurantOwner && r.is_accepting_orders;
    const hours = hoursLabel(r.opens_at, r.closes_at);
    const cartRestaurant = toCartRestaurant(r);
    const add = (itemId: number) => {
        const item = r.menu_items.find((i) => i.id === itemId);
        if (!item) return;
        cart.add(cartRestaurant, item);
    };
    const qty = (itemId: number) => (inThisCart ? cart.quantityOf(itemId) : 0);

    return (
        <div className="mx-auto max-w-7xl px-4 pt-4 pb-10 sm:px-6">
            <button onClick={() => router.back()} className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
                <ArrowLeft size={16} /> Back
            </button>

            {/* Hero */}
            <section className="relative overflow-hidden rounded-[28px]">
                <CoverImage src={r.cover_image} alt={r.name} cuisine={r.cuisine} priority iconSize={80} className="h-56 w-full sm:h-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <FavoriteButton restaurantId={r.id} initial={r.is_favorite} className="absolute top-4 right-4" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="custom" className={r.is_open ? "bg-ok text-white" : "bg-white/90 text-black"}>
                            {r.is_open ? "Open now" : r.is_accepting_orders ? "Closed, schedule ahead" : "Not taking orders"}
                        </Badge>
                        {r.tag_list.map((t) => (
                            <Badge key={t} tone="custom" className="bg-white/15 text-white capitalize backdrop-blur">
                                {t}
                            </Badge>
                        ))}
                    </div>
                    <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">{r.name}</h1>
                    <p className="mt-2 max-w-2xl text-white/85">{r.description}</p>
                </div>
            </section>

            {/* Facts */}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Fact label="Rating" value={<a href="#reviews"><Rating value={r.rating} count={r.review_count} className="text-base" /></a>} />
                <Fact label="Delivery time" value={<span className="inline-flex items-center gap-1.5"><Clock size={18} />{r.eta_range[0]}-{r.eta_range[1]} min</span>} />
                <Fact label="Delivery fee" value={<span className="inline-flex items-center gap-1.5"><Moped size={18} />{num(r.delivery_fee) === 0 ? "Free" : money(r.delivery_fee)}</span>} />
                <Fact label="Minimum order" value={num(r.min_order) ? money(r.min_order) : "None"} />
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
                <span className="inline-flex items-center gap-1.5"><MapPin size={16} />{r.address}</span>
                <a href={`tel:${r.phone_number}`} className="inline-flex items-center gap-1.5 hover:text-ink"><Phone size={16} />{r.phone_number}</a>
                <span>{r.cuisine_label} · {priceLevel(r.price_level)}</span>
                {hours && <span className="inline-flex items-center gap-1.5"><Clock size={16} />{hours}</span>}
            </div>

            {isOwner && (
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand/30 bg-brand-soft p-4">
                    <p className="text-sm">This is your restaurant. Customers see only available dishes.</p>
                    <LinkButton href={`/dashboard/restaurants/${r.id}`} size="sm" icon={<PencilSimple size={16} />}>
                        Manage
                    </LinkButton>
                </div>
            )}

            <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_340px]">
                <div className="min-w-0">
                    {/* Menu tools */}
                    <div className="sticky top-16 z-20 -mx-4 bg-bg px-4 pt-2 pb-3 sm:mx-0 sm:px-0">
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <label className="flex h-11 flex-1 items-center gap-2 rounded-2xl border border-line bg-surface px-4 focus-within:border-brand">
                                <MagnifyingGlass size={18} className="text-muted" />
                                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${r.name}`} aria-label="Search this menu" className="w-full bg-transparent focus:outline-none" />
                            </label>
                            <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
                                {DIET_FILTERS.map((d) => {
                                    const on = diet.includes(d.key);
                                    return (
                                        <button
                                            key={d.key}
                                            aria-pressed={on}
                                            onClick={() => setDiet((prev) => (on ? prev.filter((x) => x !== d.key) : [...prev, d.key]))}
                                            className={cn(
                                                "inline-flex shrink-0 items-center gap-1 rounded-full border px-3 text-sm font-medium transition",
                                                on ? "border-ok bg-ok text-white" : "border-line bg-surface hover:border-ink/30",
                                            )}
                                        >
                                            {d.key !== "mild" && <Leaf size={14} />} {d.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <nav className="no-scrollbar mt-3 flex gap-1 overflow-x-auto" aria-label="Menu categories">
                            {grouped.map(([cat]) => (
                                <button
                                    key={cat}
                                    onClick={() => sectionRefs.current[cat]?.scrollIntoView({ behavior: "smooth", block: "start" })}
                                    className={cn(
                                        "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition",
                                        activeCat === cat ? "bg-ink text-bg" : "text-muted hover:text-ink",
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {grouped.length === 0 ? (
                        <div className="mt-6">
                            <EmptyState icon={<MagnifyingGlass size={26} />} title="No dishes match" body="Try a different search or dietary filter." />
                        </div>
                    ) : (
                        grouped.map(([cat, list]) => (
                            <section key={cat} data-cat={cat} ref={(el) => { sectionRefs.current[cat] = el; }} className="scroll-mt-44 pt-6">
                                <h2 className="mb-4 text-xl font-bold">{cat}</h2>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {list.map((item) => (
                                        <MenuItemCard
                                            key={item.id}
                                            item={item}
                                            cuisine={r.cuisine}
                                            popular={r.popular_item_ids.includes(item.id)}
                                            quantity={qty(item.id)}
                                            disabled={!canOrder || !item.is_available}
                                            onAdd={() => add(item.id)}
                                            onQuantity={(q) => cart.setQuantity(item.id, q)}
                                        />
                                    ))}
                                </div>
                            </section>
                        ))
                    )}

                    <div className="mt-16">
                        <ReviewsSection restaurantId={r.id} rating={r.rating} count={r.review_count} breakdown={r.rating_breakdown} />
                    </div>
                </div>

                {/* Sidebar */}
                <aside className="hidden lg:block">
                    <div className="sticky top-24 space-y-4">
                        <div className="rounded-3xl border border-line bg-surface p-5 shadow-card">
                            <h2 className="flex items-center gap-2 text-lg font-bold">
                                <ShoppingBag size={20} /> Your basket
                            </h2>
                            {inThisCart && cart.lines.length ? (
                                <>
                                    <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto">
                                        {cart.lines.map((l) => (
                                            <li key={l.item.id} className="flex items-center justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold">{l.item.name}</p>
                                                    <p className="tabular text-sm text-muted">{money(num(l.item.price) * l.quantity)}</p>
                                                </div>
                                                <Stepper size="sm" label={l.item.name} value={l.quantity} onChange={(q) => cart.setQuantity(l.item.id, q)} />
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="mt-4 flex justify-between border-t border-line pt-4">
                                        <span className="text-muted">Subtotal</span>
                                        <span className="tabular font-bold">{money(cart.subtotal)}</span>
                                    </div>
                                    <Button className="mt-4 w-full" onClick={cart.open}>
                                        Review and checkout <ArrowRight size={16} weight="bold" />
                                    </Button>
                                </>
                            ) : (
                                <p className="mt-3 text-sm text-muted">
                                    {isRestaurantOwner ? "Partner accounts can't place orders." : "Add dishes and they'll show up here."}
                                </p>
                            )}
                        </div>
                        {canOrder && (
                            <button onClick={() => setPlannerOpen(true)} className="flex w-full items-center gap-3 rounded-3xl border border-line bg-surface-2 p-5 text-left transition hover:border-brand/40">
                                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand text-brand-ink">
                                    <Wallet size={22} weight="fill" />
                                </span>
                                <span>
                                    <span className="block font-bold">Can&apos;t decide?</span>
                                    <span className="block text-sm text-muted">Give us a budget and we&apos;ll build your order here.</span>
                                </span>
                            </button>
                        )}
                    </div>
                </aside>
            </div>

            {/* Mobile basket bar */}
            {inThisCart && cart.count > 0 && (
                <div className="fixed inset-x-0 bottom-[68px] z-30 px-4 pb-2 lg:hidden">
                    <button onClick={cart.open} className="flex w-full animate-rise items-center justify-between rounded-full bg-brand px-5 py-3.5 font-semibold text-brand-ink shadow-card">
                        <span className="inline-flex items-center gap-2">
                            <span className="tabular grid size-7 place-items-center rounded-full bg-black/15 text-sm">{cart.count}</span>
                            View basket
                        </span>
                        <span className="tabular">{money(cart.subtotal)}</span>
                    </button>
                </div>
            )}
            {canOrder && !(inThisCart && cart.count > 0) && (
                <div className="fixed right-4 bottom-[76px] z-30 lg:hidden">
                    <button onClick={() => setPlannerOpen(true)} aria-label="Plan a meal on a budget" className="grid size-14 place-items-center rounded-full bg-ink text-bg shadow-card">
                        <Wallet size={24} weight="fill" />
                    </button>
                </div>
            )}

            <RestaurantPlanner
                open={plannerOpen}
                onClose={() => setPlannerOpen(false)}
                restaurantId={r.id}
                onPick={(plan) => {
                    cart.replace(cartRestaurant, planToLines(plan));
                    setPlannerOpen(false);
                    toast(`${plan.item_count} items added for about ${money(plan.estimated_total)}`, "success", { label: "View", onClick: cart.open });
                }}
            />
        </div>
    );
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-line bg-surface px-4 py-3">
            <p className="text-xs text-muted">{label}</p>
            <div className="tabular mt-0.5 font-bold">{value}</div>
        </div>
    );
}

function RestaurantPlanner({ open, onClose, restaurantId, onPick }: { open: boolean; onClose: () => void; restaurantId: number; onPick: (p: MealPlan) => void }) {
    const [budget, setBudget] = useState(25);
    const [people, setPeople] = useState(2);
    const [plans, setPlans] = useState<MealPlan[] | null>(null);
    const [loading, setLoading] = useState(false);

    const run = async () => {
        setLoading(true);
        try {
            const res = await request<{ plans: MealPlan[] }>(`/restaurants/meal-planner/?restaurant=${restaurantId}&budget=${budget}&people=${people}`, { auth: false });
            setPlans(res.plans);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose} title="Feed me for..." className="sm:max-w-2xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <label className="flex-1">
                    <span className="flex justify-between text-sm font-semibold">
                        Budget <span className="tabular text-brand">${budget}</span>
                    </span>
                    <input type="range" min={8} max={150} value={budget} onChange={(e) => setBudget(+e.target.value)} className="mt-2 w-full accent-[var(--brand)]" />
                </label>
                <label className="text-sm font-semibold">
                    People
                    <select value={people} onChange={(e) => setPeople(+e.target.value)} className="mt-1 block rounded-xl border border-line bg-surface px-3 py-2">
                        {[1, 2, 3, 4, 5, 6, 8].map((n) => (
                            <option key={n}>{n}</option>
                        ))}
                    </select>
                </label>
                <Button onClick={run} loading={loading} icon={<Receipt size={18} />}>
                    Build it
                </Button>
            </div>
            {plans && (
                <div className="mt-6">
                    {plans.length === 0 ? (
                        <p className="rounded-2xl bg-surface-2 p-5 text-center text-muted">That budget is a bit tight here. Try a little more or fewer people.</p>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {plans.map((p) => (
                                <PlanCard key={p.strategy} plan={p} showRestaurant={false} onAdd={() => onPick(p)} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
}

function RestaurantSkeleton() {
    return (
        <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
            <Skeleton className="h-56 rounded-[28px] sm:h-80" />
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-2xl" />
                ))}
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-36 rounded-3xl" />
                ))}
            </div>
        </div>
    );
}
