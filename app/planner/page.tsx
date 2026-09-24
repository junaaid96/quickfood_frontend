"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Leaf, Pepper, Users, Wallet } from "@phosphor-icons/react";
import { useApi } from "@/lib/hooks";
import { qs } from "@/lib/api";
import { cn, money } from "@/lib/format";
import { planToLines, toCartRestaurant } from "@/lib/plan";
import type { Cuisine, MealPlan } from "@/lib/types";
import { useCart } from "@/providers/cart-provider";
import { useToast } from "@/providers/toast-provider";
import { EmptyState, Skeleton } from "@/components/ui/Bits";
import { PlanCard } from "@/components/restaurant/PlanCard";

const DIETS = [
    { value: "", label: "Anything" },
    { value: "vegetarian", label: "Vegetarian" },
    { value: "vegan", label: "Vegan" },
    { value: "gluten_free", label: "Gluten free" },
];

export default function PlannerPage() {
    return (
        <Suspense>
            <Planner />
        </Suspense>
    );
}

function Planner() {
    const params = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const cart = useCart();
    const toast = useToast();
    const [budget, setBudget] = useState(Number(params.get("budget")) || 25);
    const [people, setPeople] = useState(Number(params.get("people")) || 2);
    const [dietary, setDietary] = useState(params.get("dietary") ?? "");
    const [cuisine, setCuisine] = useState(params.get("cuisine") ?? "");
    const [noSpice, setNoSpice] = useState(params.get("max_spice") === "0");
    const [debounced, setDebounced] = useState({ budget, people });

    useEffect(() => {
        const t = setTimeout(() => setDebounced({ budget, people }), 350);
        return () => clearTimeout(t);
    }, [budget, people]);

    const query = qs({ budget: debounced.budget, people: debounced.people, dietary, cuisine, max_spice: noSpice ? 0 : undefined });
    useEffect(() => {
        router.replace(`${pathname}${query}`, { scroll: false });
    }, [query, pathname, router]);

    const { data, isLoading } = useApi<{ plans: MealPlan[] }>(`/restaurants/meal-planner/${query}`, { keepPreviousData: true });
    const { data: cuisines } = useApi<Cuisine[]>(`/restaurants/restaurant/cuisines/`);
    const perHead = budget / people;

    const pick = (plan: MealPlan) => {
        cart.replace(toCartRestaurant(plan.restaurant), planToLines(plan));
        toast(`${plan.item_count} items from ${plan.restaurant.name} in your basket`, "success", { label: "Review", onClick: cart.open });
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
            <div className="grid items-start gap-8 lg:grid-cols-[360px_1fr]">
                <aside className="rounded-3xl bg-ink p-6 text-bg lg:sticky lg:top-24">
                    <p className="inline-flex items-center gap-2 rounded-full bg-bg/10 px-3 py-1 text-sm font-semibold text-brand">
                        <Wallet size={16} weight="fill" /> Budget Bites
                    </p>
                    <h1 className="mt-4 text-3xl leading-tight font-extrabold">What can we get you for ${budget}?</h1>
                    <p className="mt-2 text-sm text-bg/65">Everything counted: food, delivery and service fee. Tip is up to you.</p>

                    <label className="mt-6 block">
                        <span className="flex items-baseline justify-between text-sm font-semibold">
                            Total budget <span className="tabular font-display text-3xl font-extrabold text-brand">${budget}</span>
                        </span>
                        <input type="range" min={8} max={200} value={budget} onChange={(e) => setBudget(+e.target.value)} className="mt-3 w-full accent-[var(--brand)]" aria-label="Budget" />
                    </label>

                    <div className="mt-6">
                        <span className="flex items-center justify-between text-sm font-semibold">
                            <span className="inline-flex items-center gap-2">
                                <Users size={18} /> People
                            </span>
                            <span className="tabular text-bg/60">{money(perHead)} each</span>
                        </span>
                        <div className="mt-2 grid grid-cols-6 gap-1.5">
                            {[1, 2, 3, 4, 6, 8].map((n) => (
                                <button key={n} onClick={() => setPeople(n)} aria-pressed={people === n} className={cn("h-10 rounded-xl text-sm font-bold transition", people === n ? "bg-brand text-brand-ink" : "bg-bg/10 hover:bg-bg/20")}>
                                    {n}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6">
                        <span className="inline-flex items-center gap-2 text-sm font-semibold">
                            <Leaf size={18} /> Diet
                        </span>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {DIETS.map((d) => (
                                <button key={d.value} onClick={() => setDietary(d.value)} aria-pressed={dietary === d.value} className={cn("rounded-full px-3 py-1.5 text-sm font-medium transition", dietary === d.value ? "bg-bg text-ink" : "bg-bg/10 hover:bg-bg/20")}>
                                    {d.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button onClick={() => setNoSpice(!noSpice)} aria-pressed={noSpice} className={cn("mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition", noSpice ? "bg-bg text-ink" : "bg-bg/10 hover:bg-bg/20")}>
                        <Pepper size={16} /> No spicy food
                    </button>

                    {cuisines && (
                        <label className="mt-6 block text-sm font-semibold">
                            Cuisine
                            <select value={cuisine} onChange={(e) => setCuisine(e.target.value)} className="mt-2 block w-full rounded-xl bg-bg/10 px-3 py-2.5 font-normal text-bg focus:outline-none [&>option]:text-ink">
                                <option value="">Surprise me</option>
                                {cuisines.map((c) => (
                                    <option key={c.value} value={c.value}>
                                        {c.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}
                </aside>

                <section aria-live="polite">
                    <div className="flex items-baseline justify-between">
                        <h2 className="text-xl font-bold">{data ? `${data.plans.length} meal ${data.plans.length === 1 ? "plan" : "plans"} that fit` : "Planning..."}</h2>
                        {isLoading && <span className="text-sm text-muted">Updating</span>}
                    </div>
                    {!data ? (
                        <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <Skeleton key={i} className="h-96 rounded-3xl" />
                            ))}
                        </div>
                    ) : data.plans.length === 0 ? (
                        <div className="mt-5">
                            <EmptyState icon={<Wallet size={26} />} title="That's a tight budget" body={`We couldn't fit a full meal for ${people} under $${budget} at any open kitchen. Try nudging the budget up or loosening a filter.`} />
                        </div>
                    ) : (
                        <div className={cn("mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3 transition-opacity", isLoading && "opacity-60")}>
                            {data.plans.map((p) => (
                                <PlanCard key={`${p.restaurant.id}-${p.strategy}`} plan={p} onAdd={() => pick(p)} />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
