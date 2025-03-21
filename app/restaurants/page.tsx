"use client";

import { useState, useEffect } from "react";
import { restaurantApi } from "@/lib/api";
import { Restaurant } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";

export default function RestaurantsPage() {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        async function fetchRestaurants() {
            try {
                const data = await restaurantApi.getAll();
                setRestaurants(data);
            } catch (error) {
                console.error("Error fetching restaurants:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchRestaurants();
    }, []);

    const filteredRestaurants = restaurants.filter(
        (restaurant) =>
            restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            restaurant.address.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64 text-gray-600">
                Loading restaurants...
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Restaurants
                </h1>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search restaurants by name or location..."
                        className="w-full p-3 border border-gray-300 rounded-lg text-gray-600"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>
                </div>
            </div>

            {filteredRestaurants.length === 0 ? (
                <div className="text-center py-10">
                    <p className="text-gray-500">
                        No restaurants found matching your search.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRestaurants.map((restaurant) => (
                        <Link
                            href={`/restaurants/${restaurant.id}`}
                            key={restaurant.id}
                        >
                            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                                <div className="relative h-48 w-full">
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
                                            <span className="text-gray-400">
                                                No image
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        {restaurant.name}
                                    </h2>
                                    <p className="text-gray-500 mt-1">
                                        {restaurant.address}
                                    </p>
                                    <p className="text-gray-600 mt-2 line-clamp-2">
                                        {restaurant.description}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
