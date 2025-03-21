"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { restaurantApi } from "@/lib/api";
import { Restaurant } from "@/lib/types";
import Image from "next/image";

export default function EditRestaurantPage() {
    const { id } = useParams();
    const router = useRouter();
    const { isAuthenticated, isRestaurantOwner } = useAuth();
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        phone_number: "",
        address: "",
    });
    const [image, setImage] = useState<File | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (!isAuthenticated || !isRestaurantOwner) {
            router.push("/login?redirect=/dashboard");
            return;
        }

        async function fetchRestaurant() {
            try {
                const data = await restaurantApi.getById(id as string);
                setRestaurant(data);
                setFormData({
                    name: data.name,
                    description: data.description,
                    phone_number: data.phone_number,
                    address: data.address,
                });
            } catch (error) {
                console.error("Error fetching restaurant:", error);
                setError("Failed to load restaurant data");
            } finally {
                setLoading(false);
            }
        }

        fetchRestaurant();
    }, [id, isAuthenticated, isRestaurantOwner, router]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImage(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!formData.name || !formData.address) {
            setError("Name and address are required");
            return;
        }

        setUpdating(true);

        try {
            const formDataObj = new FormData();
            formDataObj.append("name", formData.name);
            formDataObj.append("description", formData.description);
            formDataObj.append("phone_number", formData.phone_number);
            formDataObj.append("address", formData.address);

            if (image) {
                formDataObj.append("image", image);
            }

            const response = await fetch(
                `https://quickfood-backend-hoi3.onrender.com/api/restaurants/restaurant/${id}/`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                    body: formDataObj,
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.detail || "Failed to update restaurant"
                );
            }

            router.push(`/dashboard/restaurants/${id}`);
        } catch (err: any) {
            setError(
                err.message || "Failed to update restaurant. Please try again."
            );
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64 text-gray-600">
                Loading restaurant data...
            </div>
        );
    }

    if (!restaurant) {
        return <div className="text-center py-10">Restaurant not found</div>;
    }

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
                Edit Restaurant
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

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                    {restaurant.image && (
                        <div className="mb-6">
                            <p className="block text-sm font-medium text-gray-700 mb-2">
                                Current Image
                            </p>
                            <div className="relative h-48 w-full max-w-md">
                                <Image
                                    src={restaurant.image}
                                    alt={restaurant.name}
                                    fill
                                    className="object-cover rounded-md"
                                    unoptimized={true}
                                />
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label
                                htmlFor="name"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Restaurant Name *
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                required
                                className="w-full p-2 border border-gray-300 rounded-md"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="address"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Address *
                            </label>
                            <input
                                type="text"
                                id="address"
                                name="address"
                                required
                                className="w-full p-2 border border-gray-300 rounded-md"
                                value={formData.address}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="description"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Description *
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                required
                                rows={4}
                                className="w-full p-2 border border-gray-300 rounded-md"
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="phone_number"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Phone Number *
                            </label>
                            <input
                                type="number"
                                id="phone_number"
                                name="phone_number"
                                required
                                className="w-full p-2 border border-gray-300 rounded-md"
                                value={formData.phone_number}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="image"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                New Image (Optional)
                            </label>
                            <input
                                type="file"
                                id="image"
                                name="image"
                                accept="image/*"
                                className="w-full p-2 border border-gray-300 rounded-md"
                                onChange={handleImageChange}
                            />
                            {image && (
                                <p className="mt-2 text-sm text-gray-500">
                                    Selected file: {image.name}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={() =>
                                    router.push(`/dashboard/restaurants/${id}`)
                                }
                                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={updating}
                                className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
                            >
                                {updating ? "Updating..." : "Update Restaurant"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
