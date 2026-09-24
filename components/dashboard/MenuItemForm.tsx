"use client";

import { useState } from "react";
import { ApiError, request } from "@/lib/api";
import { cn } from "@/lib/format";
import type { MenuItem } from "@/lib/types";
import { useToast } from "@/providers/toast-provider";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea, Toggle } from "@/components/ui/Field";
import { ImagePicker } from "./ImagePicker";
import { toFormData } from "./forms";

export function MenuItemForm({
    restaurantId,
    cuisine,
    item,
    categories,
    onSaved,
}: {
    restaurantId: number;
    cuisine: string;
    item?: MenuItem;
    categories: string[];
    onSaved: () => void;
}) {
    const toast = useToast();
    const [v, setV] = useState({
        name: item?.name ?? "",
        description: item?.description ?? "",
        price: item?.price ?? "",
        category: item?.category ?? categories[0] ?? "Mains",
        is_available: item?.is_available ?? true,
        is_vegetarian: item?.is_vegetarian ?? false,
        is_vegan: item?.is_vegan ?? false,
        is_gluten_free: item?.is_gluten_free ?? false,
        spice_level: item?.spice_level ?? 0,
        calories: item?.calories?.toString() ?? "",
        image_url: item?.image_url ?? "",
    });
    const [file, setFile] = useState<File | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const set = <K extends keyof typeof v>(k: K, value: (typeof v)[K]) => setV((p) => ({ ...p, [k]: value }));

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            const body = toFormData({ ...v, calories: v.calories || null, restaurant: restaurantId, ...(file ? { image: file } : {}) });
            await request(item ? `/restaurants/menu-items/${item.id}/` : "/restaurants/menu-items/", { method: item ? "PATCH" : "POST", body });
            toast(item ? "Dish updated" : "Dish added");
            onSaved();
        } catch (err) {
            if (err instanceof ApiError) setErrors(err.fieldErrors);
            toast((err as Error).message, "error");
        } finally {
            setSaving(false);
        }
    };

    const diet: [keyof typeof v, string][] = [
        ["is_vegetarian", "Vegetarian"],
        ["is_vegan", "Vegan"],
        ["is_gluten_free", "Gluten free"],
    ];

    return (
        <form onSubmit={submit} className="space-y-4">
            <ImagePicker current={item?.cover_image ?? null} file={file} onFile={setFile} url={v.image_url} onUrl={(u) => set("image_url", u)} cuisine={cuisine} aspect="aspect-[2/1]" />
            <Field label="Dish name" error={errors.name}>
                <Input required maxLength={100} value={v.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Description" error={errors.description}>
                <Textarea required value={v.description} onChange={(e) => set("description", e.target.value)} className="min-h-20" />
            </Field>
            <div className="grid grid-cols-3 gap-3">
                <Field label="Price" error={errors.price}>
                    <Input required type="number" step="0.01" min="0.01" value={v.price} onChange={(e) => set("price", e.target.value)} />
                </Field>
                <Field label="Category" error={errors.category}>
                    <Input required list="menu-categories" value={v.category} onChange={(e) => set("category", e.target.value)} />
                    <datalist id="menu-categories">
                        {categories.map((c) => (
                            <option key={c} value={c} />
                        ))}
                    </datalist>
                </Field>
                <Field label="Calories" error={errors.calories}>
                    <Input type="number" min={0} value={v.calories} onChange={(e) => set("calories", e.target.value)} />
                </Field>
            </div>
            <div>
                <span className="mb-1.5 block text-sm font-medium">Dietary</span>
                <div className="flex flex-wrap gap-2">
                    {diet.map(([k, label]) => (
                        <button
                            key={k}
                            type="button"
                            aria-pressed={!!v[k]}
                            onClick={() => set(k, !v[k] as never)}
                            className={cn("rounded-full border px-3 py-1.5 text-sm font-medium", v[k] ? "border-ok bg-ok text-white" : "border-line hover:border-ink/30")}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <span className="mb-1.5 block text-sm font-medium">Spice level</span>
                <div className="flex gap-2">
                    {["None", "Mild", "Medium", "Hot"].map((label, i) => (
                        <button
                            key={label}
                            type="button"
                            aria-pressed={v.spice_level === i}
                            onClick={() => set("spice_level", i)}
                            className={cn("flex-1 rounded-xl border py-2 text-sm font-medium", v.spice_level === i ? "border-danger bg-danger-soft text-danger" : "border-line")}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="rounded-2xl border border-line p-3">
                <Toggle checked={v.is_available} onChange={(x) => set("is_available", x)} label="Available today" description="Hidden from customers when off." />
            </div>
            <Button type="submit" loading={saving} className="w-full">
                {item ? "Save dish" : "Add dish"}
            </Button>
        </form>
    );
}
