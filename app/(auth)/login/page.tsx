"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeSlash } from "@phosphor-icons/react";
import { useAuth } from "@/providers/auth-provider";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";

const SHOW_DEMO = process.env.NEXT_PUBLIC_DEMO_LOGINS !== "false";

export default function LoginPage() {
    return (
        <Suspense>
            <LoginForm />
        </Suspense>
    );
}

function LoginForm() {
    const { login } = useAuth();
    const params = useSearchParams();
    const redirect = params.get("redirect");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [show, setShow] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async (u = username, p = password) => {
        setError("");
        setLoading(true);
        try {
            await login(u, p, redirect);
        } catch (e) {
            setError(e instanceof ApiError && e.status === 401 ? "That username and password don't match." : (e as Error).message);
            setLoading(false);
        }
    };

    return (
        <div className="animate-rise">
            <h1 className="text-4xl font-extrabold">Welcome back</h1>
            <p className="mt-2 text-muted">
                {redirect === "/checkout" ? "Log in to finish your order. Your basket is saved." : "Log in to order, track and earn rewards."}
            </p>

            <form
                className="mt-8 space-y-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    submit();
                }}
            >
                <Field label="Username">
                    <Input autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} />
                </Field>
                <Field label="Password">
                    <div className="relative">
                        <Input type={show ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="pr-11" />
                        <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute inset-y-0 right-3 text-muted hover:text-ink">
                            {show ? <EyeSlash size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </Field>
                {error && <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>}
                <Button type="submit" size="lg" loading={loading} className="w-full">
                    Log in
                </Button>
            </form>

            {SHOW_DEMO && (
                <div className="mt-6 rounded-2xl border border-dashed border-line p-4">
                    <p className="text-sm font-semibold">Just looking around?</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" disabled={loading} onClick={() => submit("demo_customer", "quickfood123")}>
                            Demo customer
                        </Button>
                        <Button variant="outline" size="sm" disabled={loading} onClick={() => submit("demo_owner", "quickfood123")}>
                            Demo restaurant
                        </Button>
                    </div>
                </div>
            )}

            <p className="mt-8 text-center text-muted">
                New here?{" "}
                <Link href={`/register${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`} className="font-semibold text-brand hover:underline">
                    Create an account
                </Link>
            </p>
        </div>
    );
}
