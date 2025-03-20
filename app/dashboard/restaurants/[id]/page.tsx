"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { restaurantApi, menuItemsApi } from "@/lib/api";
import { Restaurant, MenuItem } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";

export default function RestaurantManagementPage() {
    const { id } = useParams();
    const router = useRouter();
    const { isAuthenticated, isRestaurantOwner } = useAuth();
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isAuthenticated || !isRestaurantOwner) {
            router.push("/login?redirect=/dashboard");
            return;
        }

        async function fetchData() {
            try {
                const [restaurantData, menuData] = await Promise.all([
                    restaurantApi.getById(id as string),
                    menuItemsApi.getAll(id as string),
                ]);

                setRestaurant(restaurantData);
                setMenuItems(menuData);
            } catch (error) {
                console.error("Error fetching restaurant data:", error);
                setError("Failed to load restaurant data");
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [id, isAuthenticated, isRestaurantOwner, router]);

    const handleDeleteMenuItem = async (menuItemId: number) => {
        if (!confirm("Are you sure you want to delete this menu item?")) {
            return;
        }

        try {
            await menuItemsApi.delete(menuItemId.toString());
            setMenuItems((prev) =>
                prev.filter((item) => item.id !== menuItemId)
            );
        } catch (error) {
            console.error("Error deleting menu item:", error);
            alert("Failed to delete menu item");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                Loading restaurant data...
            </div>
        );
    }

    if (error) {
        return <div className="text-center py-10 text-red-500">{error}</div>;
    }

    if (!restaurant) {
        return <div className="text-center py-10">Restaurant not found</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">
                    Manage Restaurant
                </h1>
                <div className="flex space-x-4">
                    <Link href={`/dashboard/restaurants/${id}/edit`}>
                        <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                            Edit Restaurant
                        </button>
                    </Link>
                    <Link href={`/restaurants/${id}`} target="_blank">
                        <button className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600">
                            View Restaurant
                        </button>
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
                <div className="relative h-64 w-full">
                    {restaurant.image ? (
                        <Image
                            src={`http://localhost:8000${restaurant.image}`}
                            alt={restaurant.name}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="bg-gray-200 h-full w-full flex items-center justify-center">
                            <span className="text-gray-400">No image</span>
                        </div>
                    )}
                </div>
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {restaurant.name}
                    </h2>
                    <p className="text-gray-500 mt-2">{restaurant.address}</p>
                    <p className="text-gray-700 mt-4">
                        {restaurant.description}
                    </p>
                </div>
            </div>

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Menu Items</h2>
                <Link href={`/dashboard/restaurants/${id}/menu/new`}>
                    <button className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600">
                        Add Menu Item
                    </button>
                </Link>
            </div>

            {menuItems.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <h3 className="text-xl text-gray-600 mb-4">
                        No menu items yet
                    </h3>
                    <Link href={`/dashboard/restaurants/${id}/menu/new`}>
                        <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md">
                            Add Your First Menu Item
                        </button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {menuItems.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white rounded-lg shadow-md overflow-hidden"
                        >
                            <div className="flex">
                                <div className="relative h-32 w-32 flex-shrink-0">
                                    {item.image ? (
                                        <Image
                                            src={`http://localhost:8000${item.image}`}
                                            alt={item.name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="bg-gray-200 h-full w-full flex items-center justify-center">
                                            <span className="text-gray-400 text-xs">
                                                No image
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 flex-grow">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        {item.name}
                                    </h3>
                                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                                        {item.description}
                                    </p>
                                    <p className="text-gray-900 font-medium mt-2">
                                        ${item.price}
                                    </p>
                                    <div className="flex space-x-2 mt-4">
                                        <Link
                                            href={`/dashboard/restaurants/${id}/menu/${item.id}/edit`}
                                        >
                                            <button className="text-sm px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                                                Edit
                                            </button>
                                        </Link>
                                        <button
                                            onClick={() =>
                                                handleDeleteMenuItem(item.id)
                                            }
                                            className="text-sm px-3 py-1 border border-red-300 rounded-md text-red-700 hover:bg-red-50"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
