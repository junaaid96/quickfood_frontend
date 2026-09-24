"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ForkKnife, Storefront } from "@phosphor-icons/react";
import { useAuth, type RegisterInput } from "@/providers/auth-provider";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/format";
import type { Role } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";

export default function RegisterPage() {
    return (
        <Suspense>
            <RegisterForm />
        </Suspense>
    );
}

function strength(pw: string) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
    return score;
}

function RegisterForm() {
    const { register, login } = useAuth();
    const params = useSearchParams();
    const [role, setRole] = useState<Role>(params.get("role") === "restaurant_owner" ? "restaurant_owner" : "user");
    const [form, setForm] = useState({ first_name: "", last_name: "", username: "", email: "", phone_number: "", password: "" });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });
    const pw = strength(form.password);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setError("");
        setLoading(true);
        try {
            const payload: RegisterInput = { ...form, role };
            await register(payload);
            await login(form.username, form.password, role === "restaurant_owner" ? "/dashboard/restaurants/new" : params.get("redirect"));
        } catch (err) {
            if (err instanceof ApiError && Object.keys(err.fieldErrors).length) setErrors(err.fieldErrors);
            else setError((err as Error).message);
            setLoading(false);
        }
    };

    return (
        <div className="animate-rise">
            <h1 className="text-4xl font-extrabold">Create your account</h1>
            <p className="mt-2 text-muted">It takes less than a minute.</p>

            <div className="mt-8 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Account type">
                {[
                    { value: "user" as Role, label: "I want to order", icon: ForkKnife },
                    { value: "restaurant_owner" as Role, label: "I run a restaurant", icon: Storefront },
                ].map(({ value, label, icon: Icon }) => (
                    <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={role === value}
                        onClick={() => setRole(value)}
                        className={cn(
                            "flex flex-col items-start gap-3 rounded-2xl border-2 p-4 text-left transition",
                            role === value ? "border-brand bg-brand-soft" : "border-line bg-surface hover:border-ink/30",
                        )}
                    >
                        <Icon size={26} weight={role === value ? "fill" : "regular"} className={role === value ? "text-brand" : "text-muted"} />
                        <span className="font-semibold">{label}</span>
                    </button>
                ))}
            </div>

            <form className="mt-6 space-y-4" onSubmit={submit}>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="First name" error={errors.first_name}>
                        <Input required autoComplete="given-name" value={form.first_name} onChange={set("first_name")} />
                    </Field>
                    <Field label="Last name" error={errors.last_name}>
                        <Input required autoComplete="family-name" value={form.last_name} onChange={set("last_name")} />
                    </Field>
                </div>
                <Field label="Username" error={errors.username}>
                    <Input required autoComplete="username" value={form.username} onChange={set("username")} />
                </Field>
                <Field label="Email" error={errors.email}>
                    <Input required type="email" autoComplete="email" value={form.email} onChange={set("email")} />
                </Field>
                <Field label="Phone (optional)" error={errors.phone_number} hint="So the rider or kitchen can reach you.">
                    <Input type="tel" autoComplete="tel" value={form.phone_number} onChange={set("phone_number")} maxLength={15} />
                </Field>
                <Field label="Password" error={errors.password}>
                    <Input required type="password" autoComplete="new-password" value={form.password} onChange={set("password")} />
                    {form.password && (
                        <span className="mt-2 flex items-center gap-2">
                            <span className="flex flex-1 gap-1">
                                {[0, 1, 2, 3].map((i) => (
                                    <span key={i} className={cn("h-1.5 flex-1 rounded-full", i < pw ? (pw >= 3 ? "bg-ok" : pw === 2 ? "bg-warn" : "bg-danger") : "bg-line")} />
                                ))}
                            </span>
                            <span className="text-xs text-muted">{["Too short", "Weak", "Okay", "Strong", "Great"][pw]}</span>
                        </span>
                    )}
                </Field>
                {error && <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>}
                <Button type="submit" size="lg" loading={loading} className="w-full">
                    {role === "restaurant_owner" ? "Create partner account" : "Create account"}
                </Button>
            </form>
            <p className="mt-8 text-center text-muted">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-brand hover:underline">
                    Log in
                </Link>
            </p>
        </div>
    );
}
