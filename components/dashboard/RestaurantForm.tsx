"use client";

import { useState } from "react";
import { ApiError, request } from "@/lib/api";
import type { Cuisine, RestaurantDetail } from "@/lib/types";
import { useToast } from "@/providers/toast-provider";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea, Toggle } from "@/components/ui/Field";
import { ImagePicker } from "./ImagePicker";
import { toFormData } from "./forms";

const CUISINES: Cuisine[] = [
    ["american", "American"], ["bangladeshi", "Bangladeshi"], ["cafe", "Cafe"], ["chinese", "Chinese"], ["desserts", "Desserts"],
    ["healthy", "Healthy"], ["indian", "Indian"], ["italian", "Italian"], ["japanese", "Japanese"], ["korean", "Korean"],
    ["mexican", "Mexican"], ["middle_eastern", "Middle Eastern"], ["thai", "Thai"], ["other", "Other"],
].map(([value, label]) => ({ value, label, count: 0 }));

export function RestaurantForm({ restaurant, onSaved }: { restaurant?: RestaurantDetail; onSaved: (r: RestaurantDetail) => void }) {
    const toast = useToast();
    const [v, setV] = useState({
        name: restaurant?.name ?? "",
        description: restaurant?.description ?? "",
        cuisine: restaurant?.cuisine ?? "other",
        tags: restaurant?.tags ?? "",
        price_level: restaurant?.price_level ?? 2,
        address: restaurant?.address ?? "",
        phone_number: restaurant?.phone_number ?? "",
        delivery_fee: restaurant?.delivery_fee ?? "1.99",
        min_order: restaurant?.min_order ?? "0",
        prep_time_minutes: restaurant?.prep_time_minutes ?? 20,
        opens_at: restaurant?.opens_at?.slice(0, 5) ?? "",
        closes_at: restaurant?.closes_at?.slice(0, 5) ?? "",
        is_accepting_orders: restaurant?.is_accepting_orders ?? true,
        image_url: restaurant?.image_url ?? "",
    });
    const [file, setFile] = useState<File | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const set = <K extends keyof typeof v>(k: K, value: (typeof v)[K]) => setV((prev) => ({ ...prev, [k]: value }));

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            const body = toFormData({ ...v, opens_at: v.opens_at || null, closes_at: v.closes_at || null, ...(file ? { image: file } : {}) });
            const saved = await request<RestaurantDetail>(restaurant ? `/restaurants/restaurant/${restaurant.id}/` : "/restaurants/restaurant/", {
                method: restaurant ? "PATCH" : "POST",
                body,
            });
            toast(restaurant ? "Changes saved" : "Restaurant created");
            onSaved(saved);
        } catch (err) {
            if (err instanceof ApiError) setErrors(err.fieldErrors);
            toast((err as Error).message, "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
                <Field label="Restaurant name" error={errors.name}>
                    <Input required maxLength={100} value={v.name} onChange={(e) => set("name", e.target.value)} />
                </Field>
                <Field label="Description" error={errors.description} hint="One or two sentences on what makes you worth ordering from.">
                    <Textarea required value={v.description} onChange={(e) => set("description", e.target.value)} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Cuisine" error={errors.cuisine}>
                        <Select value={v.cuisine} onChange={(e) => set("cuisine", e.target.value)}>
                            {CUISINES.map((c) => (
                                <option key={c.value} value={c.value}>
                                    {c.label}
                                </option>
                            ))}
                        </Select>
                    </Field>
                    <Field label="Price level">
                        <Select value={v.price_level} onChange={(e) => set("price_level", Number(e.target.value) as 1 | 2 | 3)}>
                            <option value={1}>$ Budget</option>
                            <option value={2}>$$ Moderate</option>
                            <option value={3}>$$$ Premium</option>
                        </Select>
                    </Field>
                    <Field label="Tags" error={errors.tags} hint="Comma separated">
                        <Input value={v.tags} onChange={(e) => set("tags", e.target.value)} placeholder="burgers, late night" />
                    </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Address" error={errors.address}>
                        <Input required value={v.address} onChange={(e) => set("address", e.target.value)} />
                    </Field>
                    <Field label="Phone" error={errors.phone_number}>
                        <Input required type="tel" maxLength={15} value={v.phone_number} onChange={(e) => set("phone_number", e.target.value)} />
                    </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Delivery fee" error={errors.delivery_fee} hint="0 for free delivery">
                        <Input type="number" step="0.01" min="0" value={v.delivery_fee} onChange={(e) => set("delivery_fee", e.target.value)} />
                    </Field>
                    <Field label="Minimum order" error={errors.min_order}>
                        <Input type="number" step="0.01" min="0" value={v.min_order} onChange={(e) => set("min_order", e.target.value)} />
                    </Field>
                    <Field label="Prep time (min)" error={errors.prep_time_minutes}>
                        <Input type="number" min={1} max={180} value={v.prep_time_minutes} onChange={(e) => set("prep_time_minutes", Number(e.target.value))} />
                    </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Opens at" error={errors.opens_at} hint="Leave both empty to be open whenever you're accepting orders">
                        <Input type="time" value={v.opens_at} onChange={(e) => set("opens_at", e.target.value)} />
                    </Field>
                    <Field label="Closes at" error={errors.closes_at}>
                        <Input type="time" value={v.closes_at} onChange={(e) => set("closes_at", e.target.value)} />
                    </Field>
                </div>
                <div className="rounded-2xl border border-line p-4">
                    <Toggle checked={v.is_accepting_orders} onChange={(x) => set("is_accepting_orders", x)} label="Accepting orders" description="Switch off to pause new orders when the kitchen is slammed." />
                </div>
            </div>
            <div className="space-y-4">
                <ImagePicker current={restaurant?.cover_image ?? null} file={file} onFile={setFile} url={v.image_url} onUrl={(u) => set("image_url", u)} cuisine={v.cuisine} />
                {errors.image && <p className="text-sm text-danger">{errors.image}</p>}
                <Button type="submit" size="lg" loading={saving} className="w-full">
                    {restaurant ? "Save changes" : "Create restaurant"}
                </Button>
            </div>
        </form>
    );
}
