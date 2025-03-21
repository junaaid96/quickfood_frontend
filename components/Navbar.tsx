"use client";

import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";

export default function Navbar() {
    const { isAuthenticated, logout, user } = useAuth();

    return (
        <header className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <Link
                                href="/"
                                className="text-2xl font-bold text-orange-500"
                            >
                                QuickFood
                            </Link>
                        </div>
                        <nav className="ml-6 flex space-x-8">
                            <Link
                                href="/restaurants"
                                className="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-orange-500"
                            >
                                Restaurants
                            </Link>
                            {isAuthenticated &&
                                user?.role !== "restaurant_owner" && (
                                    <Link
                                        href="/orders"
                                        className="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-orange-500"
                                    >
                                        My Orders
                                    </Link>
                                )}
                            {user?.role === "restaurant_owner" && (
                                <Link
                                    href="/dashboard"
                                    className="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-orange-500"
                                >
                                    Manage Restaurant
                                </Link>
                            )}
                        </nav>
                    </div>
                    <div className="flex items-center">
                        {isAuthenticated ? (
                            <>
                                <Link
                                    href="/profile"
                                    className="text-gray-900 hover:text-orange-500 mr-4"
                                >
                                    Profile
                                </Link>
                                <button
                                    onClick={logout}
                                    className="text-gray-900 hover:text-orange-500"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="text-gray-900 hover:text-orange-500 mr-4"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/register"
                                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md"
                                >
                                    Register
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
