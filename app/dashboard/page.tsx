"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { restaurantApi, ordersApi } from "@/lib/api";
import Link from "next/link";
import Image from "next/image";
import { Restaurant, Order } from "@/lib/types";

export default function DashboardPage() {
    const router = useRouter();
    const { user, isAuthenticated, isRestaurantOwner, isLoading: authLoading } = useAuth();
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        if (!isAuthenticated) {
            router.push("/login?redirect=/dashboard");
            return;
        }

        if (!isRestaurantOwner) {
            router.push("/restaurants");
            return;
        }

        async function fetchData() {
            try {
                const [restaurantsData, ordersData] = await Promise.all([
                    restaurantApi.getAll(),
                    ordersApi.getAll(),
                ]);

                // Filter restaurants owned by the current user
                const ownedRestaurants = restaurantsData.filter(
                    (restaurant) => restaurant.owner.id === user?.id
                );

                // Filter orders for the user's restaurants
                const restaurantIds = ownedRestaurants.map(
                    (restaurant) => restaurant.id
                );
                const filteredOrders = ordersData.filter((order) =>
                    restaurantIds.includes(order.restaurant)
                );

                // Sort orders by creation date (newest first)
                const sortedOrders = filteredOrders.sort(
                    (a, b) =>
                        new Date(b.created_at || "").getTime() -
                        new Date(a.created_at || "").getTime()
                );

                setRestaurants(ownedRestaurants);
                setOrders(sortedOrders);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [isAuthenticated, isRestaurantOwner, router, user, authLoading]);

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
                Loading dashboard...
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
                Restaurant Owner Dashboard
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-900">
                            My Restaurants
                        </h2>
                        <Link href="/dashboard/restaurants/new">
                            <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md">
                                Add Restaurant
                            </button>
                        </Link>
                    </div>

                    {restaurants.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-md p-8 text-center">
                            <h3 className="text-xl text-gray-600 mb-4">
                                You don't have any restaurants yet
                            </h3>
                            <Link href="/dashboard/restaurants/new">
                                <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md">
                                    Add Your First Restaurant
                                </button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {restaurants.map((restaurant) => (
                                <Link
                                    href={`/dashboard/restaurants/${restaurant.id}`}
                                    key={restaurant.id}
                                >
                                    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                                        <div className="flex">
                                            <div className="relative h-32 w-32 flex-shrink-0">
                                                {restaurant.image ? (
                                                    <Image
                                                        src={restaurant.image}
                                                        alt={restaurant.name}
                                                        fill
                                                        className="object-cover"
                                                        unoptimized={true}
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
                                                    {restaurant.name}
                                                </h3>
                                                <p className="text-gray-500 text-sm mt-1">
                                                    {restaurant.address}
                                                </p>
                                                <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                                                    {restaurant.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        Recent Orders
                    </h2>

                    {orders.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-md p-8 text-center">
                            <h3 className="text-xl text-gray-600">
                                No orders yet
                            </h3>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.slice(0, 5).map((order) => (
                                <Link
                                    href={`/orders/${order.id}`}
                                    key={order.id}
                                >
                                    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                                        <div className="p-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <h3 className="text-lg font-medium text-gray-900">
                                                    Order #{order.id}
                                                </h3>
                                                <span
                                                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                        order.status ===
                                                        "delivered"
                                                            ? "bg-green-100 text-green-800"
                                                            : order.status ===
                                                              "out_for_delivery"
                                                            ? "bg-blue-100 text-blue-800"
                                                            : order.status ===
                                                              "preparing"
                                                            ? "bg-yellow-100 text-yellow-800"
                                                            : "bg-gray-100 text-gray-800"
                                                    }`}
                                                >
                                                    {order.status
                                                        .replace("_", " ")
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                        order.status
                                                            .replace("_", " ")
                                                            .slice(1)}
                                                </span>
                                            </div>

                                            <p className="text-gray-500 text-sm mb-2">
                                                {new Date(
                                                    order.created_at || ""
                                                ).toLocaleString()}
                                            </p>

                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">
                                                    {order.items?.length || 0}{" "}
                                                    {(order.items?.length ||
                                                        0) === 1
                                                        ? "item"
                                                        : "items"}
                                                </span>
                                                <span className="text-gray-900 font-bold">
                                                    ${order.total_price}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}

                            {orders.length > 5 && (
                                <div className="text-center mt-4">
                                    <Link href="/orders">
                                        <button className="text-orange-500 hover:text-orange-600">
                                            View All Orders
                                        </button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
