"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { authApi } from "@/lib/api";

export default function ProfilePage() {
    const router = useRouter();
    const { isAuthenticated, logout, isLoading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [profile, setProfile] = useState({
        username: "",
        email: "",
        first_name: "",
        last_name: "",
        phone_number: "",
        address: "",
        role: "",
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        if (authLoading) return;

        if (!isAuthenticated) {
            router.push("/login?redirect=/profile");
            return;
        }

        async function fetchProfile() {
            try {
                const profileData = await authApi.getProfile();
                setProfile({
                    username: profileData.username || "",
                    email: profileData.email || "",
                    first_name: profileData.first_name || "",
                    last_name: profileData.last_name || "",
                    phone_number: profileData.phone_number || "",
                    address: profileData.address || "",
                    role: profileData.role,
                });
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchProfile();
    }, [isAuthenticated, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfile((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setUpdating(true);

        try {
            await authApi.updateProfile(profile);
            setSuccess("Profile updated successfully");
        } catch (err: any) {
            setError(
                err.message || "Failed to update profile. Please try again."
            );
        } finally {
            setUpdating(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
                <span className="ml-4 text-xl font-medium text-gray-700">
                    Checking authentication...
                </span>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                Loading profile...
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
                My Profile
            </h1>

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

            {success && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg
                                className="h-5 w-5 text-green-500"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-green-700">{success}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="username"
                                    className="block text-sm font-medium text-gray-800 mb-1"
                                >
                                    Username *
                                </label>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                                    value={profile.username}
                                    disabled
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium text-gray-800 mb-1"
                                >
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                                    value={profile.email}
                                    disabled
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="first_name"
                                    className="block text-sm font-medium text-gray-800 mb-1"
                                >
                                    First Name *
                                </label>
                                <input
                                    type="text"
                                    id="first_name"
                                    name="first_name"
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-md text-gray-600"
                                    value={profile.first_name}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="last_name"
                                    className="block text-sm font-medium text-gray-800 mb-1"
                                >
                                    Last Name *
                                </label>
                                <input
                                    type="text"
                                    id="last_name"
                                    name="last_name"
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-md text-gray-600"
                                    value={profile.last_name}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="phone_number"
                                    className="block text-sm font-medium text-gray-800 mb-1"
                                >
                                    Phone Number
                                </label>
                                <input
                                    type="number"
                                    id="phone_number"
                                    name="phone_number"
                                    className="w-full p-2 border border-gray-300 rounded-md text-gray-600"
                                    value={profile.phone_number}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="address"
                                    className="block text-sm font-medium text-gray-800 mb-1"
                                >
                                    Address
                                </label>
                                <input
                                    type="text"
                                    id="address"
                                    name="address"
                                    className="w-full p-2 border border-gray-300 rounded-md text-gray-600"
                                    value={profile.address}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        <div>
                            <label
                                htmlFor="role"
                                className="block text-sm font-medium text-gray-800 mb-1"
                            >
                                Role
                            </label>
                            <input
                                type="text"
                                id="role"
                                name="role"
                                required
                                className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                                value={profile.role}
                                disabled
                            />
                        </div>

                        <div className="flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={logout}
                                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Logout
                            </button>
                            <button
                                type="submit"
                                disabled={updating}
                                className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
                            >
                                {updating ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
