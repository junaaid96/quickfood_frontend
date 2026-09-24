import {
    BowlFood,
    BowlSteam,
    Cake,
    Coffee,
    CookingPot,
    Fish,
    ForkKnife,
    Hamburger,
    Leaf,
    Pepper,
    Pizza,
    type Icon,
} from "@phosphor-icons/react";

type CuisineMeta = { icon: Icon; hue: number };

const META: Record<string, CuisineMeta> = {
    american: { icon: Hamburger, hue: 28 },
    bangladeshi: { icon: CookingPot, hue: 18 },
    chinese: { icon: BowlSteam, hue: 4 },
    desserts: { icon: Cake, hue: 340 },
    healthy: { icon: Leaf, hue: 140 },
    indian: { icon: CookingPot, hue: 36 },
    italian: { icon: Pizza, hue: 12 },
    japanese: { icon: Fish, hue: 200 },
    korean: { icon: BowlFood, hue: 356 },
    mexican: { icon: Pepper, hue: 48 },
    middle_eastern: { icon: BowlFood, hue: 30 },
    thai: { icon: BowlSteam, hue: 90 },
    cafe: { icon: Coffee, hue: 26 },
    other: { icon: ForkKnife, hue: 20 },
};

export function cuisineMeta(cuisine?: string): CuisineMeta {
    return META[cuisine ?? "other"] ?? META.other;
}

/** Mood shortcuts on the home page map to real API filters. */
export const MOODS: { label: string; hint: string; query: Record<string, string> }[] = [
    { label: "Comfort food", hint: "Biryani, burgers, curry", query: { cuisine: "bangladeshi,american,indian" } },
    { label: "Something light", hint: "Bowls and fresh rolls", query: { cuisine: "healthy,japanese" } },
    { label: "Turn up the heat", hint: "Spicy and bold", query: { cuisine: "thai,mexican", ordering: "rating" } },
    { label: "Plant powered", hint: "Vegan picks", query: { dietary: "vegan" } },
    { label: "In a hurry", hint: "Fastest kitchens", query: { ordering: "fastest", open_now: "1" } },
    { label: "Sweet tooth", hint: "Cakes and coffee", query: { cuisine: "desserts,cafe" } },
];
