"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
    ArrowRight,
    ArrowUpRight,
    ChatCircleDots,
    Crown,
    Leaf,
    MagnifyingGlass,
    Users,
    Wallet,
} from "@phosphor-icons/react";
import { useApi } from "@/lib/hooks";
import { qs } from "@/lib/api";
import { MOODS, cuisineMeta } from "@/lib/cuisine";
import type { Restaurant } from "@/lib/types";
import { Button, LinkButton } from "@/components/ui/Button";
import { CoverImage } from "@/components/ui/CoverImage";
import { RestaurantCard, RestaurantCardSkeleton } from "@/components/restaurant/RestaurantCard";
import { useAuth } from "@/providers/auth-provider";

export default function HomePage() {
    const router = useRouter();
    const { user } = useAuth();
    const [query, setQuery] = useState("");
    const { data: topRated } = useApi<Restaurant[]>(`/restaurants/restaurant/?ordering=rating`);
    const { data: fastest } = useApi<Restaurant[]>(`/restaurants/restaurant/?ordering=fastest&open_now=1`);
    const collage = (topRated ?? []).slice(0, 3);

    return (
        <div className="overflow-x-clip">
            {/* Hero */}
            <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 pt-10 pb-16 sm:px-6 md:grid-cols-[1.1fr_1fr] md:pt-16 lg:gap-16">
                <div className="animate-rise">
                    <h1 className="text-[2.6rem] leading-[1.02] font-extrabold sm:text-6xl lg:text-7xl">
                        {user?.first_name ? `Hungry, ${user.first_name}?` : "Dinner, sorted"}
                        <span className="block text-brand">before you are hungry.</span>
                    </h1>
                    <p className="mt-5 max-w-md text-lg text-muted">
                        Local kitchens, honest prices, and live tracking from the pan to your door.
                    </p>
                    <form
                        role="search"
                        className="mt-8 flex max-w-lg items-center gap-2 rounded-full border border-line bg-surface p-1.5 pl-5 shadow-card focus-within:border-brand"
                        onSubmit={(e) => {
                            e.preventDefault();
                            router.push(`/restaurants${qs({ search: query.trim() })}`);
                        }}
                    >
                        <MagnifyingGlass size={20} className="shrink-0 text-muted" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Biryani, ramen, tacos..."
                            aria-label="Search dishes or restaurants"
                            className="min-w-0 flex-1 bg-transparent py-2 text-base placeholder:text-muted/70 focus:outline-none"
                        />
                        <Button type="submit" className="shrink-0">
                            Find food
                        </Button>
                    </form>
                    <Link href="/planner" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-brand">
                        <Wallet size={18} /> Or tell us your budget and we will plan the meal
                        <ArrowRight size={14} weight="bold" />
                    </Link>
                </div>

                <div className="relative mx-auto grid h-[340px] w-full max-w-md grid-cols-6 grid-rows-6 gap-3 sm:h-[440px] md:max-w-none">
                    {[0, 1, 2].map((i) => {
                        const r = collage[i];
                        const pos = [
                            "col-span-4 row-span-4 col-start-1 row-start-1",
                            "col-span-2 row-span-3 col-start-5 row-start-2",
                            "col-span-3 row-span-2 col-start-3 row-start-5",
                        ][i];
                        return (
                            <div key={i} className={`${pos} animate-rise overflow-hidden rounded-3xl shadow-card`} style={{ animationDelay: `${i * 90}ms` }}>
                                {r ? (
                                    <Link href={`/restaurants/${r.id}`} aria-label={r.name}>
                                        <CoverImage src={r.cover_image} alt={r.name} cuisine={r.cuisine} priority className="size-full" iconSize={i === 0 ? 64 : 36} />
                                    </Link>
                                ) : (
                                    <div className="skeleton size-full" />
                                )}
                            </div>
                        );
                    })}
                    {collage[0] && (
                        <div className="absolute bottom-[34%] left-3 animate-rise rounded-2xl bg-surface/95 px-4 py-3 shadow-card backdrop-blur [animation-delay:300ms]">
                            <p className="text-xs font-medium text-muted">Tonight&apos;s top rated</p>
                            <p className="font-bold">{collage[0].name}</p>
                            <p className="text-sm text-muted">
                                {collage[0].rating?.toFixed(1) ?? "New"} stars <span aria-hidden>·</span> {collage[0].eta_range[0]}-{collage[0].eta_range[1]} min
                            </p>
                        </div>
                    )}
                </div>
            </section>

            {/* Moods */}
            <section className="mx-auto max-w-7xl px-4 sm:px-6">
                <h2 className="text-2xl font-bold sm:text-3xl">What are you in the mood for?</h2>
                <div className="no-scrollbar -mx-4 mt-5 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-6">
                    {MOODS.map((m, i) => {
                        const { icon: Icon, hue } = cuisineMeta(m.query.cuisine?.split(",")[0] ?? (m.query.dietary ? "healthy" : "other"));
                        return (
                            <Link
                                key={m.label}
                                href={`/restaurants${qs(m.query)}`}
                                className="group flex w-40 shrink-0 snap-start flex-col justify-between rounded-3xl border border-line bg-surface p-4 transition hover:-translate-y-0.5 hover:border-brand/40 sm:w-auto"
                                style={{ animationDelay: `${i * 40}ms` }}
                            >
                                <span className="grid size-11 place-items-center rounded-2xl" style={{ background: `hsl(${hue} 70% 55% / 0.14)`, color: `hsl(${hue} 60% 42%)` }}>
                                    <Icon size={24} weight="duotone" />
                                </span>
                                <span className="mt-6">
                                    <span className="block font-bold group-hover:text-brand">{m.label}</span>
                                    <span className="block text-sm text-muted">{m.hint}</span>
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </section>

            <Rail title="Loved by regulars" subtitle="Highest rated by people who actually ordered" href="/restaurants?ordering=rating" restaurants={topRated} />

            {/* Budget Bites band */}
            <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
                <BudgetBand />
            </section>

            <Rail title="Fastest right now" subtitle="Open kitchens with the shortest wait" href="/restaurants?ordering=fastest&open_now=1" restaurants={fastest} />

            {/* Why QuickFood: asymmetric bento */}
            <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
                <h2 className="max-w-xl text-2xl font-bold sm:text-3xl">Built around what actually annoys you about delivery</h2>
                <div className="mt-8 grid gap-4 md:grid-cols-3 md:grid-rows-2">
                    <div className="relative overflow-hidden rounded-3xl bg-ink p-7 text-bg md:col-span-2 md:row-span-2">
                        <ChatCircleDots size={34} weight="duotone" className="text-brand" />
                        <h3 className="mt-4 text-2xl font-bold sm:text-3xl">Know exactly where your food is</h3>
                        <p className="mt-2 max-w-md text-bg/70">
                            Every order gets a live timeline, a real ETA countdown and a direct chat with the kitchen. Forgot to say no
                            peanuts? Just message them.
                        </p>
                        <div className="mt-8 flex max-w-md flex-col gap-2">
                            {["Order placed", "Kitchen confirmed", "Being prepared", "On the way"].map((s, i) => (
                                <div key={s} className="flex items-center gap-3">
                                    <span className={`size-2.5 rounded-full ${i < 3 ? "bg-brand" : "bg-bg/25"}`} />
                                    <span className={i < 3 ? "text-bg" : "text-bg/50"}>{s}</span>
                                    {i === 2 && <span className="ml-auto text-sm text-brand">now</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="rounded-3xl border border-line bg-ok-soft p-6">
                        <Leaf size={30} weight="duotone" className="text-ok" />
                        <h3 className="mt-3 text-lg font-bold">Wait & Save</h3>
                        <p className="mt-1 text-sm text-muted">Not in a rush? Share the rider with nearby orders. Cheaper for you, fewer trips for the city.</p>
                    </div>
                    <div className="rounded-3xl border border-line bg-surface p-6">
                        <Crown size={30} weight="duotone" className="text-warn" />
                        <h3 className="mt-3 text-lg font-bold">Rewards that add up</h3>
                        <p className="mt-1 text-sm text-muted">1 point for every dollar. Spend 100 points as $1 off, and climb from Bronze to Platinum.</p>
                    </div>
                </div>
            </section>

            {/* Partner CTA */}
            <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
                <div className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-line bg-surface-2 p-7 sm:p-10 md:flex-row md:items-center">
                    <div>
                        <h2 className="text-2xl font-bold sm:text-3xl">Run a kitchen?</h2>
                        <p className="mt-2 max-w-lg text-muted">
                            Get a live order board, menu tools, reviews and revenue analytics. Pause orders with one tap when it gets busy.
                        </p>
                    </div>
                    <LinkButton href="/register?role=restaurant_owner" variant="secondary" size="lg">
                        Become a partner <ArrowUpRight size={18} weight="bold" />
                    </LinkButton>
                </div>
            </section>
        </div>
    );
}

function Rail({ title, subtitle, href, restaurants }: { title: string; subtitle: string; href: string; restaurants?: Restaurant[] }) {
    return (
        <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
            <div className="flex items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
                    <p className="mt-1 text-muted">{subtitle}</p>
                </div>
                <Link href={href} className="hidden shrink-0 items-center gap-1 font-semibold text-brand hover:underline sm:inline-flex">
                    See all <ArrowRight size={16} weight="bold" />
                </Link>
            </div>
            <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {restaurants
                    ? restaurants.slice(0, 3).map((r) => <RestaurantCard key={r.id} restaurant={r} />)
                    : Array.from({ length: 3 }).map((_, i) => <RestaurantCardSkeleton key={i} />)}
            </div>
        </section>
    );
}

function BudgetBand() {
    const router = useRouter();
    const [budget, setBudget] = useState(25);
    const [people, setPeople] = useState(2);
    return (
        <div className="grid overflow-hidden rounded-3xl bg-brand text-brand-ink md:grid-cols-[1.2fr_1fr]">
            <div className="p-7 sm:p-10">
                <p className="inline-flex items-center gap-2 rounded-full bg-black/10 px-3 py-1 text-sm font-semibold">
                    <Wallet size={16} weight="fill" /> Budget Bites
                </p>
                <h2 className="mt-4 text-3xl leading-tight font-extrabold sm:text-4xl">Name a number. We build the whole meal.</h2>
                <p className="mt-3 max-w-md opacity-85">
                    Mains for everyone, sides, drinks and dessert, planned across every open kitchen. Fees included, no surprises.
                </p>
            </div>
            <form
                className="m-3 flex flex-col justify-center gap-6 rounded-[20px] bg-surface p-6 text-ink sm:m-4 sm:p-8"
                onSubmit={(e) => {
                    e.preventDefault();
                    router.push(`/planner${qs({ budget, people })}`);
                }}
            >
                <label className="block">
                    <span className="flex items-baseline justify-between">
                        <span className="font-semibold">Total budget</span>
                        <span className="tabular font-display text-3xl font-extrabold text-brand">${budget}</span>
                    </span>
                    <input type="range" min={8} max={120} step={1} value={budget} onChange={(e) => setBudget(+e.target.value)} className="mt-3 w-full accent-[var(--brand)]" />
                </label>
                <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 font-semibold">
                        <Users size={20} /> People
                    </span>
                    <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 6].map((n) => (
                            <button
                                type="button"
                                key={n}
                                onClick={() => setPeople(n)}
                                aria-pressed={people === n}
                                className={`size-10 rounded-full text-sm font-bold transition ${people === n ? "bg-ink text-bg" : "bg-surface-2 hover:bg-line"}`}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                </div>
                <Button type="submit" size="lg">
                    Plan my meal <ArrowRight size={18} weight="bold" />
                </Button>
            </form>
        </div>
    );
}
