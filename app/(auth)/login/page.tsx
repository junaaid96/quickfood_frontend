"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login, isLoading } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const redirectPath = searchParams.get("redirect") || "/restaurants";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            await login(username, password);
            router.push(redirectPath);
        } catch (err: any) {
            if (err.detail) {
                setError(err.detail);
            } else {
                setError(err.message || "Failed to login. Please check your credentials.");
            }
            
            if (err.status === 401) {
                setError("No active account found with the given credentials");
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Sign in to your account
                    </h2>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg
                                    className="h-5 w-5 text-red-500"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="username" className="sr-only">
                                Username
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                autoComplete="username"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                        >
                            {isLoading ? "Loading..." : "Sign in"}
                        </button>
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-gray-600">
                            Don't have an account?{" "}
                            <Link
                                href="/register"
                                className="font-medium text-orange-500 hover:text-orange-400"
                            >
                                Sign up
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
