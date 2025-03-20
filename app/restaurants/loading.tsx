import React from "react";

export default function RestaurantsLoading() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
                Restaurants
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array(6)
                    .fill(0)
                    .map((_, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse"
                        >
                            <div className="h-48 bg-gray-200"></div>
                            <div className="p-4">
                                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                                <div className="h-4 bg-gray-200 rounded w-full"></div>
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
}
