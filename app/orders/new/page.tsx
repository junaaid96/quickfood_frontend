"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ordersApi, restaurantApi } from "@/lib/api";
import { Order, Restaurant } from "@/lib/types";

export default function OrderConfirmationPage() {
    const router = useRouter();
    const [pendingOrder, setPendingOrder] = useState<Partial<Order> | null>(
        null
    );
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [address, setAddress] = useState("");
    const [phone, setPhone] = useState("");
    const [notes, setNotes] = useState("");

    useEffect(() => {
        const storedOrder = localStorage.getItem("pendingOrder");
        if (!storedOrder) {
            router.push("/restaurants");
            return;
        }

        const orderData = JSON.parse(storedOrder);
        setPendingOrder(orderData);

        async function fetchRestaurant() {
            try {
                const restaurantData = await restaurantApi.getById(
                    orderData.restaurant.toString()
                );
                setRestaurant(restaurantData);
            } catch (error) {
                console.error("Error fetching restaurant:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchRestaurant();
    }, [router]);

    const handleSubmitOrder = async () => {
        if (!pendingOrder) return;

        setSubmitting(true);
        try {
            const orderData = {
                restaurant: pendingOrder.restaurant,
                delivery_address: address,
                order_items:
                    pendingOrder.items?.map((item) => ({
                        menu_item: item.menu_item,
                        quantity: item.quantity,
                    })) || [],
            };

            const response = await ordersApi.create(orderData);
            localStorage.removeItem("pendingOrder");
            router.push(`/orders/${response.id}`);
        } catch (error) {
            console.error("Error creating order:", error);
            alert("Failed to create order. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                Loading order details...
            </div>
        );
    }

    if (!pendingOrder || !restaurant) {
        return <div className="text-center py-10">No pending order found</div>;
    }

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
                Order Confirmation
            </h1>

            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Order Summary
                    </h2>
                    <p className="text-gray-600 mt-2">
                        Restaurant: {restaurant.name}
                    </p>

                    <div className="mt-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Items
                        </h3>
                        <div className="border-t border-gray-200">
                            {pendingOrder.items?.map((item, index) => {
                                const menuItem = restaurant?.menu_items.find(mi => mi.id === item.menu_item);
                                
                                return (
                                    <div
                                        key={index}
                                        className="py-3 flex justify-between border-b border-gray-200"
                                    >
                                        <div>
                                            <span className="font-medium">
                                                {item.quantity}x{" "}
                                            </span>
                                            <span>
                                                {menuItem?.name || `Item #${item.menu_item}`}
                                            </span>
                                        </div>
                                        <span className="text-gray-900">
                                            ${Number(item.price) * item.quantity}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="py-3 flex justify-between font-bold">
                            <span>Total</span>
                            <span>${pendingOrder.total_price}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        Delivery Information
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label
                                htmlFor="address"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Delivery Address *
                            </label>
                            <input
                                type="text"
                                id="address"
                                className="w-full p-2 border border-gray-300 rounded-md"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="phone"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Phone Number *
                            </label>
                            <input
                                type="number"
                                id="phone"
                                className="w-full p-2 border border-gray-300 rounded-md"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                            />
                        </div>
                        
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleSubmitOrder}
                    disabled={submitting || !address || !phone}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-md disabled:opacity-50"
                >
                    {submitting ? "Placing Order..." : "Place Order"}
                </button>
            </div>
        </div>
    );
}
