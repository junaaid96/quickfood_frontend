"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ordersApi } from "@/lib/api";
import { Order } from "@/lib/types";
import { useAuth } from "@/providers/auth-provider";

export default function OrderTrackingPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user, isRestaurantOwner } = useAuth();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        async function fetchOrder() {
            try {
                const orderData = await ordersApi.getById(id as string);
                setOrder(orderData);
            } catch (error) {
                console.error("Error fetching order:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchOrder();
    }, [id]);

    const updateOrderStatus = async (status: string) => {
        if (!order) return;

        setUpdating(true);
        try {
            const updatedOrder = await ordersApi.updateStatus(
                id as string,
                status
            );
            setOrder(updatedOrder);
        } catch (error) {
            console.error("Error updating order status:", error);
            alert("Failed to update order status. Please try again.");
        } finally {
            setUpdating(false);
        }
    };

    const getStatusStep = (status: string) => {
        switch (status) {
            case "pending":
                return 1;
            case "preparing":
                return 2;
            case "out_for_delivery":
                return 3;
            case "delivered":
                return 4;
            default:
                return 1;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                Loading order details...
            </div>
        );
    }

    if (!order) {
        return <div className="text-center py-10">Order not found</div>;
    }

    const statusStep = getStatusStep(order.status);

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">
                    Order #{order.id}
                </h1>
                <span className="text-sm text-gray-500">
                    {new Date(order.created_at || "").toLocaleString()}
                </span>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Order Status
                        </h2>
                        <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                                order.status === "delivered"
                                    ? "bg-green-100 text-green-800"
                                    : order.status === "out_for_delivery"
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
                                order.status.replace("_", " ").slice(1)}
                        </span>
                    </div>

                    <div className="relative pt-8">
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                            <div
                                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-orange-500"
                                style={{ width: `${(statusStep / 4) * 100}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between">
                            <div className="text-center">
                                <div
                                    className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${
                                        statusStep >= 1
                                            ? "bg-orange-500 text-white"
                                            : "bg-gray-200"
                                    }`}
                                >
                                    1
                                </div>
                                <div className="text-xs mt-1">Pending</div>
                            </div>
                            <div className="text-center">
                                <div
                                    className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${
                                        statusStep >= 2
                                            ? "bg-orange-500 text-white"
                                            : "bg-gray-200"
                                    }`}
                                >
                                    2
                                </div>
                                <div className="text-xs mt-1">Preparing</div>
                            </div>
                            <div className="text-center">
                                <div
                                    className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${
                                        statusStep >= 3
                                            ? "bg-orange-500 text-white"
                                            : "bg-gray-200"
                                    }`}
                                >
                                    3
                                </div>
                                <div className="text-xs mt-1">
                                    Out for Delivery
                                </div>
                            </div>
                            <div className="text-center">
                                <div
                                    className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${
                                        statusStep >= 4
                                            ? "bg-orange-500 text-white"
                                            : "bg-gray-200"
                                    }`}
                                >
                                    4
                                </div>
                                <div className="text-xs mt-1">Delivered</div>
                            </div>
                        </div>
                    </div>

                    {isRestaurantOwner && order.status !== "delivered" && (
                        <div className="mt-6 border-t border-gray-200 pt-4">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Update Order Status
                            </h3>
                            <div className="flex space-x-2">
                                {order.status === "pending" && (
                                    <button
                                        onClick={() =>
                                            updateOrderStatus("preparing")
                                        }
                                        disabled={updating}
                                        className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50"
                                    >
                                        Start Preparing
                                    </button>
                                )}
                                {order.status === "preparing" && (
                                    <button
                                        onClick={() =>
                                            updateOrderStatus(
                                                "out_for_delivery"
                                            )
                                        }
                                        disabled={updating}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                                    >
                                        Out for Delivery
                                    </button>
                                )}
                                {order.status === "out_for_delivery" && (
                                    <button
                                        onClick={() =>
                                            updateOrderStatus("delivered")
                                        }
                                        disabled={updating}
                                        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
                                    >
                                        Mark as Delivered
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        Order Details
                    </h2>

                    <div className="mb-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Restaurant
                        </h3>
                        <p className="text-gray-600">{order.restaurant}</p>
                    </div>

                    <div className="mb-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Delivery Address
                        </h3>
                        <p className="text-gray-600">
                            {order.delivery_address}
                        </p>
                    </div>

                    <div className="mb-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Contact
                        </h3>
                        <p className="text-gray-600">
                            {order.user_details?.phone_number ||
                                "No phone number provided"}
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Items
                        </h3>
                        <div className="border-t border-gray-200">
                            {order.items?.map((item, index) => (
                                <div
                                    key={index}
                                    className="py-3 flex justify-between border-b border-gray-200"
                                >
                                    <div>
                                        <span className="font-medium">
                                            {item.quantity}x{" "}
                                        </span>
                                        <span>
                                            {item.menu_item_details?.name}
                                        </span>
                                    </div>
                                    <span className="text-gray-900">
                                        $ ${Number(item.price) * item.quantity}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="py-3 flex justify-between font-bold">
                            <span>Total</span>
                            <span>${order.total_price}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={() => router.push("/orders")}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                    Back to Orders
                </button>
            </div>
        </div>
    );
}
