import React from "react";

export default function OrdersLoading() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">My Orders</h1>

            <div className="space-y-4">
                {Array(3)
                    .fill(0)
                    .map((_, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                                    <div className="h-6 bg-gray-200 rounded w-1/6"></div>
                                </div>
                                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                                <div className="flex justify-between items-center">
                                    <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                                </div>
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
}
