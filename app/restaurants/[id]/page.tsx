"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { restaurantApi, menuItemsApi } from "@/lib/api";
import { Restaurant, MenuItem } from "@/lib/types";
import Image from "next/image";
import { useAuth } from "@/providers/auth-provider";

export default function RestaurantDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { isAuthenticated, user } = useAuth();
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState<{ [key: number]: number }>({});

    useEffect(() => {
        async function fetchData() {
            try {
                const restaurantData = await restaurantApi.getById(
                    id as string
                );
                setRestaurant(restaurantData);

                const menuData = await menuItemsApi.getAll(id as string);
                setMenuItems(menuData);
            } catch (error) {
                console.error("Error fetching restaurant data:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [id]);

    const addToCart = (itemId: number) => {
        setCart((prev) => ({
            ...prev,
            [itemId]: (prev[itemId] || 0) + 1,
        }));
    };

    const removeFromCart = (itemId: number) => {
        setCart((prev) => {
            const newCart = { ...prev };
            if (newCart[itemId] > 1) {
                newCart[itemId] -= 1;
            } else {
                delete newCart[itemId];
            }
            return newCart;
        });
    };

    const getTotalItems = () => {
        return Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
    };

    const getTotalPrice = () => {
        return menuItems.reduce((sum, item) => {
            const quantity = cart[item.id] || 0;
            return sum + item.price * quantity;
        }, 0);
    };

    const handleCheckout = () => {
        if (!isAuthenticated) {
            router.push(
                "/login?redirect=" + encodeURIComponent(`/restaurants/${id}`)
            );
            return;
        }

        const orderItems = Object.entries(cart).map(([itemId, quantity]) => {
            const menuItem = menuItems.find(
                (item) => item.id === parseInt(itemId)
            );
            return {
                menu_item: parseInt(itemId),
                quantity,
                price: menuItem?.price || 0,
            };
        });

        localStorage.setItem(
            "pendingOrder",
            JSON.stringify({
                restaurant: restaurant?.id,
                items: orderItems,
                total_price: getTotalPrice(),
            })
        );

        router.push("/orders/new");
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64 text-gray-600">
                Loading restaurant details...
            </div>
        );
    }

    if (!restaurant) {
        return <div className="text-center py-10">Restaurant not found</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
                <div className="relative h-64 w-full">
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
                            <span className="text-gray-400">No image</span>
                        </div>
                    )}
                </div>
                <div className="p-6">
                    <h1 className="text-3xl font-bold text-gray-900">
                        {restaurant.name}
                    </h1>
                    <p className="text-gray-500 mt-2">{restaurant.address}</p>
                    <p className="text-gray-700 mt-4">
                        {restaurant.description}
                    </p>
                </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">Menu</h2>

            {menuItems.length === 0 ? (
                <div className="text-center py-10">
                    <p className="text-gray-500">
                        No menu items available for this restaurant.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {menuItems.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white rounded-lg shadow-sm p-4 flex"
                        >
                            <div className="relative h-24 w-24 flex-shrink-0">
                                {item.image ? (
                                    <Image
                                        src={`http://localhost:8000${item.image}`}
                                        alt={item.name}
                                        fill
                                        className="object-cover rounded-md"
                                    />
                                ) : (
                                    <div className="bg-gray-200 h-full w-full flex items-center justify-center rounded-md">
                                        <span className="text-gray-400 text-xs">
                                            No image
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="ml-4 flex-grow">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {item.name}
                                </h3>
                                <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                                    {item.description}
                                </p>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-gray-900 font-medium">
                                        {item.price}
                                    </span>
                                    <div className="flex items-center">
                                        {cart[item.id] ? (
                                            <>
                                                <button
                                                    onClick={() =>
                                                        removeFromCart(item.id)
                                                    }
                                                    className="text-white bg-orange-500 rounded-full w-6 h-6 flex items-center justify-center"
                                                >
                                                    -
                                                </button>
                                                <span className="mx-2">
                                                    {cart[item.id]}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        addToCart(item.id)
                                                    }
                                                    className="text-white bg-orange-500 rounded-full w-6 h-6 flex items-center justify-center"
                                                >
                                                    +
                                                </button>
                                            </>
                                        ) : (
                                            user?.role !==
                                                "restaurant_owner" && (
                                                <button
                                                    onClick={() =>
                                                        addToCart(item.id)
                                                    }
                                                    className="text-white bg-orange-500 hover:bg-orange-600 px-3 py-1 rounded-md text-sm"
                                                >
                                                    Add to cart
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {getTotalItems() > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white shadow-md p-4 border-t border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                        <div>
                            <span className="text-gray-700">
                                {getTotalItems()}{" "}
                                {getTotalItems() === 1 ? "item" : "items"} |
                            </span>
                            <span className="ml-2 text-gray-900 font-bold">
                                ${getTotalPrice().toFixed(2)}
                            </span>
                        </div>
                        <button
                            onClick={handleCheckout}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md"
                        >
                            Checkout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
