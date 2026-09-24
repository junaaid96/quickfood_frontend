import { Leaf, Pepper, Plant, Grains } from "@phosphor-icons/react";
import type { MenuItem } from "@/lib/types";

export function DietaryTags({ item, compact }: { item: Pick<MenuItem, "is_vegan" | "is_vegetarian" | "is_gluten_free" | "spice_level">; compact?: boolean }) {
    const tags: { label: string; icon: React.ReactNode; cls: string }[] = [];
    if (item.is_vegan) tags.push({ label: "Vegan", icon: <Plant size={13} weight="fill" />, cls: "text-ok bg-ok-soft" });
    else if (item.is_vegetarian) tags.push({ label: "Vegetarian", icon: <Leaf size={13} weight="fill" />, cls: "text-ok bg-ok-soft" });
    if (item.is_gluten_free) tags.push({ label: "Gluten free", icon: <Grains size={13} weight="fill" />, cls: "text-warn bg-warn-soft" });
    if (item.spice_level > 0)
        tags.push({
            label: ["", "Mild", "Medium", "Hot"][item.spice_level],
            icon: (
                <span className="inline-flex">
                    {Array.from({ length: item.spice_level }).map((_, i) => (
                        <Pepper key={i} size={12} weight="fill" />
                    ))}
                </span>
            ),
            cls: "text-danger bg-danger-soft",
        });
    if (!tags.length) return null;
    return (
        <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
                <span key={t.label} title={t.label} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${t.cls}`}>
                    {t.icon}
                    {!compact && t.label}
                </span>
            ))}
        </div>
    );
}
