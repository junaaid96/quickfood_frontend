"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ordersApi } from "@/lib/api";
import { Order } from "@/lib/types";
import { useAuth } from "@/providers/auth-provider";
import Link from "next/link";

export default function OrdersPage() {
    const router = useRouter();
    const { isAuthenticated, isRestaurantOwner } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login?redirect=/orders");
            return;
        }

        if (isRestaurantOwner) {
            router.push("/dashboard");
            return;
        }

        async function fetchOrders() {
            try {
                const data = await ordersApi.getAll();
                setOrders(data);
            } catch (error) {
                console.error("Error fetching orders:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchOrders();
    }, [isAuthenticated, router]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64 text-gray-600">
                Loading...
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">
                    My Orders
                </h1>
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <h2 className="text-xl text-gray-600 mb-4">
                        You haven't placed any orders yet
                    </h2>
                    <Link href="/restaurants">
                        <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md">
                            Browse Restaurants
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">My Orders</h1>

            <div className="flex flex-col gap-3">
                {orders.map((order) => (
                    <Link href={`/orders/${order.id}`} key={order.id}>
                        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        Order #{order.id}
                                    </h2>
                                    <span
                                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                                            order.status === "delivered"
                                                ? "bg-green-100 text-green-800"
                                                : order.status ===
                                                  "out_for_delivery"
                                                ? "bg-blue-100 text-blue-800"
                                                : order.status === "preparing"
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

                                <p className="text-gray-600 mb-2">
                                    Restaurant: {order.restaurant}
                                </p>

                                <p className="text-gray-500 text-sm mb-4">
                                    {new Date(
                                        order.created_at || ""
                                    ).toLocaleString()}
                                </p>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">
                                        {order.items?.length || 0}{" "}
                                        {(order.items?.length || 0) === 1
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
            </div>
        </div>
    );
}
