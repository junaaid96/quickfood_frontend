"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bicycle, Camera, Car, Moped, PersonSimpleWalk, Star } from "@phosphor-icons/react";
import { request } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import { cn, money } from "@/lib/format";
import type { RiderProfile, Vehicle } from "@/lib/types";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { Card, Skeleton } from "@/components/ui/Bits";
import { Button } from "@/components/ui/Button";
import { Field, Input, Toggle } from "@/components/ui/Field";

const VEHICLES: { value: Vehicle; label: string; icon: typeof Moped }[] = [
    { value: "motorbike", label: "Motorbike", icon: Moped },
    { value: "scooter", label: "Scooter", icon: Moped },
    { value: "bicycle", label: "Bicycle", icon: Bicycle },
    { value: "car", label: "Car", icon: Car },
    { value: "on_foot", label: "On foot", icon: PersonSimpleWalk },
];

export default function RiderProfilePage() {
    return (
        <Suspense>
            <RiderProfileForm />
        </Suspense>
    );
}

function RiderProfileForm() {
    const { user, isLoading, isRider } = useAuth();
    const router = useRouter();
    const welcome = useSearchParams().get("welcome") === "1";
    const toast = useToast();
    const { data: profile, mutate } = useApi<RiderProfile>(isRider ? "/accounts/rider/" : null);
    const [form, setForm] = useState({ first_name: "", last_name: "", phone_number: "", vehicle: "motorbike" as Vehicle, vehicle_plate: "", is_available: false });
    const [photo, setPhoto] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) router.replace("/login?redirect=/rider/profile");
        else if (!isLoading && user && !isRider) router.replace("/profile");
    }, [isLoading, user, isRider, router]);

    useEffect(() => {
        if (profile)
            setForm({
                first_name: profile.first_name,
                last_name: profile.last_name,
                phone_number: profile.phone_number ?? "",
                vehicle: profile.vehicle,
                vehicle_plate: profile.vehicle_plate,
                is_available: profile.is_available,
            });
    }, [profile]);

    useEffect(() => {
        if (!photo) return setPreview(null);
        const u = URL.createObjectURL(photo);
        setPreview(u);
        return () => URL.revokeObjectURL(u);
    }, [photo]);

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const body = new FormData();
            Object.entries(form).forEach(([k, v]) => body.append(k, String(v)));
            if (photo) body.append("photo", photo);
            const updated = await request<RiderProfile>("/accounts/rider/", { method: "PATCH", body });
            mutate(updated, { revalidate: false });
            setPhoto(null);
            toast("Rider profile saved");
            if (welcome) router.push("/rider");
        } catch (err) {
            toast((err as Error).message, "error");
        } finally {
            setSaving(false);
        }
    };

    if (!profile) {
        return (
            <div className="mx-auto max-w-2xl space-y-4 px-4 py-10">
                <Skeleton className="h-32 rounded-3xl" />
                <Skeleton className="h-80 rounded-3xl" />
            </div>
        );
    }
    const s = profile.stats;
    const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

    return (
        <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
            <h1 className="text-3xl font-extrabold">{welcome ? "Set up your rider profile" : "Rider profile"}</h1>
            <p className="mt-1 text-muted">Customers see your name, photo, vehicle and rating while you deliver.</p>

            <Card className="mt-6 flex items-center gap-4">
                <label className="group relative cursor-pointer">
                    {preview || profile.photo_display ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={preview || profile.photo_display!} alt="Your photo" className="size-20 rounded-full object-cover" />
                    ) : (
                        <span className="grid size-20 place-items-center rounded-full bg-brand-soft text-brand">
                            <Moped size={34} weight="duotone" />
                        </span>
                    )}
                    <span className="absolute -right-1 -bottom-1 grid size-8 place-items-center rounded-full bg-ink text-bg shadow-card group-hover:bg-brand">
                        <Camera size={16} />
                    </span>
                    <input type="file" accept="image/*" className="sr-only" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} aria-label="Upload photo" />
                </label>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-xl font-bold">{profile.name}</p>
                    <p className="flex items-center gap-1 text-sm text-muted">
                        <Star size={14} weight="fill" className="text-warn" /> {s.rating ? `${s.rating.toFixed(1)} (${s.rating_count})` : "No ratings yet"} · {s.deliveries} deliveries · {money(s.earnings)} earned
                    </p>
                </div>
            </Card>

            <form onSubmit={save} className="mt-6 space-y-5">
                <Card className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="First name"><Input value={form.first_name} onChange={(e) => set("first_name", e.target.value)} required /></Field>
                        <Field label="Last name"><Input value={form.last_name} onChange={(e) => set("last_name", e.target.value)} required /></Field>
                    </div>
                    <Field label="Phone"><Input type="tel" inputMode="tel" value={form.phone_number} onChange={(e) => set("phone_number", e.target.value)} placeholder="+8801…" /></Field>
                </Card>
                <Card>
                    <p className="font-bold">Vehicle</p>
                    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5" role="radiogroup" aria-label="Vehicle">
                        {VEHICLES.map(({ value, label, icon: Icon }) => (
                            <button
                                type="button"
                                key={value}
                                role="radio"
                                aria-checked={form.vehicle === value}
                                onClick={() => set("vehicle", value)}
                                className={cn("flex flex-col items-center gap-1 rounded-2xl border p-3 text-sm font-semibold", form.vehicle === value ? "border-brand bg-brand-soft text-brand" : "border-line")}
                            >
                                <Icon size={24} weight={form.vehicle === value ? "fill" : "regular"} /> {label}
                            </button>
                        ))}
                    </div>
                    {form.vehicle !== "on_foot" && form.vehicle !== "bicycle" && (
                        <div className="mt-4">
                            <Field label="Number plate"><Input value={form.vehicle_plate} onChange={(e) => set("vehicle_plate", e.target.value.toUpperCase())} placeholder="DHA-METRO-11-2345" /></Field>
                        </div>
                    )}
                </Card>
                <Card>
                    <Toggle checked={form.is_available} onChange={(v) => set("is_available", v)} label="Available for deliveries" description={form.is_available ? "You'll see new pickups" : "Offline"} />
                </Card>
                <Button type="submit" size="lg" className="w-full" loading={saving}>
                    Save profile
                </Button>
            </form>
        </div>
    );
}
