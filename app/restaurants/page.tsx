"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MagnifyingGlass, SlidersHorizontal, X } from "@phosphor-icons/react";
import { useApi } from "@/lib/hooks";
import { qs } from "@/lib/api";
import { cn } from "@/lib/format";
import type { Cuisine, Restaurant } from "@/lib/types";
import { EmptyState } from "@/components/ui/Bits";
import { Button } from "@/components/ui/Button";
import { RestaurantCard, RestaurantCardSkeleton } from "@/components/restaurant/RestaurantCard";

const SORTS = [
    { value: "recommended", label: "Recommended" },
    { value: "rating", label: "Top rated" },
    { value: "fastest", label: "Fastest" },
    { value: "delivery_fee", label: "Lowest delivery fee" },
    { value: "popular", label: "Most ordered" },
    { value: "price_low", label: "Cheapest" },
    { value: "newest", label: "Newest" },
];

const TOGGLES = [
    { key: "open_now", label: "Open now", value: "1" },
    { key: "free_delivery", label: "Free delivery", value: "1" },
    { key: "min_rating", label: "Rated 4.5+", value: "4.5" },
    { key: "max_eta", label: "Under 45 min", value: "45" },
    { key: "dietary", label: "Vegetarian", value: "vegetarian" },
    { key: "dietary", label: "Vegan", value: "vegan" },
    { key: "dietary", label: "Gluten free", value: "gluten_free" },
];

const FILTER_KEYS = ["search", "cuisine", "ordering", "open_now", "free_delivery", "min_rating", "max_eta", "dietary", "price_level"];

export default function DiscoverPage() {
    return (
        <Suspense>
            <Discover />
        </Suspense>
    );
}

function Discover() {
    const params = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const [search, setSearch] = useState(params.get("search") ?? "");
    const pushed = useRef(params.get("search") ?? "");

    const current = useMemo(() => {
        const o: Record<string, string> = {};
        FILTER_KEYS.forEach((k) => {
            const v = params.get(k);
            if (v) o[k] = v;
        });
        return o;
    }, [params]);

    const update = (patch: Record<string, string | undefined>) => {
        const next = { ...current, ...patch };
        router.replace(`${pathname}${qs(next)}`, { scroll: false });
    };

    // Debounce the search box into the URL.
    useEffect(() => {
        if (pushed.current === search.trim()) return;
        const t = setTimeout(() => {
            pushed.current = search.trim();
            update({ search: search.trim() || undefined });
        }, 300);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    // Follow outside navigation (e.g. the navbar search) without clobbering what is being typed.
    useEffect(() => {
        const fromUrl = params.get("search") ?? "";
        if (fromUrl !== pushed.current) {
            pushed.current = fromUrl;
            setSearch(fromUrl);
        }
    }, [params]);

    const { data: restaurants, isLoading, error } = useApi<Restaurant[]>(`/restaurants/restaurant/${qs(current)}`, { keepPreviousData: true });
    const { data: cuisines } = useApi<Cuisine[]>(`/restaurants/restaurant/cuisines/`);

    const selectedCuisines = (current.cuisine ?? "").split(",").filter(Boolean);
    const toggleCuisine = (value: string) => {
        const next = selectedCuisines.includes(value) ? selectedCuisines.filter((c) => c !== value) : [...selectedCuisines, value];
        update({ cuisine: next.join(",") || undefined });
    };
    const activeCount = Object.keys(current).filter((k) => k !== "ordering").length;

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold sm:text-4xl">
                        {current.search ? <>Results for &ldquo;{current.search}&rdquo;</> : "Discover"}
                    </h1>
                    <p className="mt-1 text-muted">
                        {restaurants ? `${restaurants.length} ${restaurants.length === 1 ? "kitchen" : "kitchens"}` : "Finding kitchens"}
                        {current.search && " serving what you searched, dishes included"}
                    </p>
                </div>
                <label className="flex items-center gap-2 text-sm">
                    <span className="text-muted">Sort by</span>
                    <select
                        value={current.ordering ?? "recommended"}
                        onChange={(e) => update({ ordering: e.target.value === "recommended" ? undefined : e.target.value })}
                        className="rounded-full border border-line bg-surface px-3 py-2 font-semibold focus:border-brand focus:outline-none"
                    >
                        {SORTS.map((s) => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <div className="sticky top-16 z-20 -mx-4 mt-6 border-b border-line/60 bg-bg/90 px-4 pt-2 pb-3 backdrop-blur-md sm:mx-0 sm:rounded-b-2xl sm:px-0">
                <label className="flex h-12 items-center gap-3 rounded-2xl border border-line bg-surface px-4 focus-within:border-brand">
                    <MagnifyingGlass size={20} className="text-muted" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search restaurants, cuisines or dishes"
                        aria-label="Search restaurants, cuisines or dishes"
                        className="w-full bg-transparent placeholder:text-muted/70 focus:outline-none"
                    />
                    {search && (
                        <button onClick={() => setSearch("")} aria-label="Clear search" className="text-muted hover:text-ink">
                            <X size={18} />
                        </button>
                    )}
                </label>

                <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
                    <span className="inline-flex shrink-0 items-center gap-1.5 pr-1 text-sm text-muted">
                        <SlidersHorizontal size={16} />
                        {activeCount > 0 && <span className="tabular font-semibold text-ink">{activeCount}</span>}
                    </span>
                    {TOGGLES.map((t) => {
                        const on = current[t.key] === t.value;
                        return (
                            <Chip key={t.label} on={on} onClick={() => update({ [t.key]: on ? undefined : t.value })}>
                                {t.label}
                            </Chip>
                        );
                    })}
                    <span className="mx-1 w-px shrink-0 bg-line" />
                    {cuisines?.map((c) => (
                        <Chip key={c.value} on={selectedCuisines.includes(c.value)} onClick={() => toggleCuisine(c.value)}>
                            {c.label}
                        </Chip>
                    ))}
                </div>
            </div>

            <div className="mt-8">
                {error ? (
                    <EmptyState icon={<X size={26} />} title="Could not load restaurants" body={error.message} />
                ) : isLoading && !restaurants ? (
                    <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <RestaurantCardSkeleton key={i} />
                        ))}
                    </div>
                ) : restaurants && restaurants.length === 0 ? (
                    <EmptyState
                        icon={<MagnifyingGlass size={26} />}
                        title="Nothing matches that combo"
                        body="Try removing a filter or searching for a dish instead of a restaurant."
                        action={
                            <Button variant="outline" onClick={() => router.replace(pathname)}>
                                Clear all filters
                            </Button>
                        }
                    />
                ) : (
                    <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                        {restaurants?.map((r, i) => (
                            <div key={r.id} className="animate-rise" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                                <RestaurantCard restaurant={r} priority={i < 3} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            aria-pressed={on}
            className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition",
                on ? "border-ink bg-ink text-bg" : "border-line bg-surface text-ink hover:border-ink/40",
            )}
        >
            {children}
        </button>
    );
}
