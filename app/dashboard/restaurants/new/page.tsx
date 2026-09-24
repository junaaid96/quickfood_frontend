"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";
import { RestaurantForm } from "@/components/dashboard/RestaurantForm";

export default function NewRestaurant() {
    const router = useRouter();
    return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
            <Link href="/dashboard/restaurants" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
                <ArrowLeft size={16} /> Your restaurants
            </Link>
            <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Add a restaurant</h1>
            <p className="mt-1 mb-8 text-muted">You can add dishes right after this step.</p>
            <RestaurantForm onSaved={(r) => router.push(`/dashboard/restaurants/${r.id}?tab=menu`)} />
        </div>
    );
}
