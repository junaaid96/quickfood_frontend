"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, House, MapPin, Plus, Star, Trash } from "@phosphor-icons/react";
import { request, ApiError } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import type { Address, User } from "@/lib/types";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { Badge, Card, Skeleton } from "@/components/ui/Bits";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";

const TIER_MIN: Record<string, number> = { Bronze: 0, Silver: 500, Gold: 1500, Platinum: 4000 };

const TIER_STYLE: Record<string, string> = {
    Bronze: "from-[#b87333] to-[#7a4a22]",
    Silver: "from-[#8e9aa6] to-[#566270]",
    Gold: "from-[#d4a534] to-[#9a6f12]",
    Platinum: "from-[#5b6b7c] to-[#1f2a36]",
};

export default function ProfilePage() {
    const { user, isLoading, isRestaurantOwner, refreshUser } = useAuth();
    const router = useRouter();
    const toast = useToast();
    const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone_number: "" });
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) router.replace("/login?redirect=/profile");
        if (user) setForm({ first_name: user.first_name ?? "", last_name: user.last_name ?? "", email: user.email, phone_number: user.phone_number ?? "" });
    }, [isLoading, user, router]);

    if (!user) {
        return (
            <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
                <Skeleton className="h-48 rounded-3xl" />
                <Skeleton className="h-72 rounded-3xl" />
            </div>
        );
    }

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            await request<User>("/accounts/profile/", { method: "PATCH", body: password ? { ...form, password } : form });
            await refreshUser();
            setPassword("");
            toast("Profile saved");
        } catch (err) {
            if (err instanceof ApiError) setErrors(err.fieldErrors);
            toast((err as Error).message, "error");
        } finally {
            setSaving(false);
        }
    };

    const next = user.next_tier;
    const tierFloor = TIER_MIN[user.loyalty_tier] ?? 0;
    const progress = next ? ((user.loyalty_points - tierFloor) / (next.threshold - tierFloor)) * 100 : 100;

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
            <h1 className="text-3xl font-extrabold sm:text-4xl">Hi, {user.first_name || user.username}</h1>
            <p className="mt-1 text-muted">{isRestaurantOwner ? "Restaurant partner account" : "Manage your details, addresses and rewards."}</p>

            {!isRestaurantOwner && (
                <div className={`mt-8 overflow-hidden rounded-3xl bg-gradient-to-br ${TIER_STYLE[user.loyalty_tier] ?? TIER_STYLE.Bronze} p-6 text-white shadow-card sm:p-8`}>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="inline-flex items-center gap-2 text-sm font-semibold text-white/80">
                                <Crown size={18} weight="fill" /> QuickFood Rewards
                            </p>
                            <p className="mt-1 font-display text-4xl font-extrabold">{user.loyalty_tier}</p>
                        </div>
                        <div className="text-right">
                            <p className="tabular font-display text-4xl font-extrabold">{user.loyalty_points}</p>
                            <p className="text-sm text-white/80">points · worth ${(Math.floor(user.loyalty_points / 100)).toFixed(2)}</p>
                        </div>
                    </div>
                    {next ? (
                        <div className="mt-6">
                            <div className="h-2 overflow-hidden rounded-full bg-white/25">
                                <div className="h-full rounded-full bg-white" style={{ width: `${Math.min(100, Math.max(3, progress))}%` }} />
                            </div>
                            <p className="mt-2 text-sm text-white/85">
                                {next.points_needed} points to {next.name}. You earn 1 point for every $1 of food.
                            </p>
                        </div>
                    ) : (
                        <p className="mt-6 text-sm text-white/85">You&apos;re at the top tier. Thanks for being a regular.</p>
                    )}
                </div>
            )}

            <div className="mt-8 grid items-start gap-6 md:grid-cols-2">
                <Card>
                    <h2 className="text-lg font-bold">Your details</h2>
                    <form onSubmit={save} className="mt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="First name" error={errors.first_name}>
                                <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
                            </Field>
                            <Field label="Last name" error={errors.last_name}>
                                <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
                            </Field>
                        </div>
                        <Field label="Email" error={errors.email}>
                            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                        </Field>
                        <Field label="Phone" error={errors.phone_number}>
                            <Input type="tel" maxLength={15} value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
                        </Field>
                        <Field label="New password" error={errors.password} hint="Leave empty to keep your current password.">
                            <Input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                        </Field>
                        <div className="flex items-center justify-between">
                            <Badge>@{user.username}</Badge>
                            <Button type="submit" loading={saving}>
                                Save changes
                            </Button>
                        </div>
                    </form>
                </Card>
                {!isRestaurantOwner && <Addresses />}
            </div>
        </div>
    );
}

function Addresses() {
    const toast = useToast();
    const { data, mutate } = useApi<Address[]>("/accounts/addresses/");
    const [adding, setAdding] = useState(false);
    const [label, setLabel] = useState("Home");
    const [line, setLine] = useState("");
    const [instructions, setInstructions] = useState("");

    const add = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await request("/accounts/addresses/", { method: "POST", body: { label, line, instructions } });
            setAdding(false);
            setLine("");
            setInstructions("");
            mutate();
        } catch (err) {
            toast((err as Error).message, "error");
        }
    };
    const makeDefault = async (a: Address) => {
        await request(`/accounts/addresses/${a.id}/`, { method: "PATCH", body: { is_default: true } });
        mutate();
    };
    const remove = async (a: Address) => {
        await request(`/accounts/addresses/${a.id}/`, { method: "DELETE" });
        mutate();
    };

    return (
        <Card>
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Saved addresses</h2>
                {!adding && (
                    <Button size="sm" variant="outline" onClick={() => setAdding(true)} icon={<Plus size={16} />}>
                        Add
                    </Button>
                )}
            </div>
            <ul className="mt-4 space-y-3">
                {data?.length === 0 && !adding && <li className="text-sm text-muted">No saved addresses yet. They make checkout one tap.</li>}
                {data?.map((a) => (
                    <li key={a.id} className="flex items-start gap-3 rounded-2xl border border-line p-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-muted">{a.label.toLowerCase() === "home" ? <House size={18} /> : <MapPin size={18} />}</span>
                        <div className="min-w-0 flex-1">
                            <p className="flex items-center gap-2 font-semibold">
                                {a.label} {a.is_default && <Badge tone="brand">Default</Badge>}
                            </p>
                            <p className="text-sm text-muted">{a.line}</p>
                            {a.instructions && <p className="text-xs text-muted">{a.instructions}</p>}
                        </div>
                        <div className="flex gap-1">
                            {!a.is_default && (
                                <button onClick={() => makeDefault(a)} aria-label={`Make ${a.label} default`} className="rounded-full p-2 text-muted hover:bg-surface-2 hover:text-ink">
                                    <Star size={16} />
                                </button>
                            )}
                            <button onClick={() => remove(a)} aria-label={`Delete ${a.label}`} className="rounded-full p-2 text-muted hover:bg-danger-soft hover:text-danger">
                                <Trash size={16} />
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
            {adding && (
                <form onSubmit={add} className="mt-4 space-y-3 rounded-2xl bg-surface-2 p-4">
                    <Field label="Label">
                        <Input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={40} />
                    </Field>
                    <Field label="Address">
                        <Input required value={line} onChange={(e) => setLine(e.target.value)} />
                    </Field>
                    <Field label="Instructions (optional)">
                        <Input value={instructions} onChange={(e) => setInstructions(e.target.value)} maxLength={200} placeholder="Gate code, floor" />
                    </Field>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" size="sm">
                            Save address
                        </Button>
                    </div>
                </form>
            )}
        </Card>
    );
}
