import React from "react";

export default function Loading() {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
            <span className="ml-4 text-xl font-medium text-gray-700">
                Loading...
            </span>
        </div>
    );
}
