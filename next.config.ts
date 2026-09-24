import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async redirects() {
        return [
            // Routes from the previous version of the app.
            { source: "/orders/new", destination: "/checkout", permanent: true },
            { source: "/dashboard/restaurants/:id/edit", destination: "/dashboard/restaurants/:id?tab=details", permanent: true },
            { source: "/dashboard/restaurants/:id/menu/:rest*", destination: "/dashboard/restaurants/:id?tab=menu", permanent: true },
        ];
    },
};

export default nextConfig;
