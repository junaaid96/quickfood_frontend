import type { CartLine, CartRestaurant } from "@/providers/cart-provider";
import type { MealPlan, Restaurant, RestaurantSummary } from "./types";

export function toCartRestaurant(r: Restaurant | RestaurantSummary): CartRestaurant {
    return {
        id: r.id,
        name: r.name,
        cover_image: r.cover_image,
        cuisine: r.cuisine,
        delivery_fee: r.delivery_fee,
        min_order: "min_order" in r ? r.min_order : undefined,
    };
}

export function planToLines(plan: MealPlan): CartLine[] {
    return plan.items.map((i) => ({
        item: { id: i.menu_item_id, name: i.name, price: i.price, cover_image: null, is_vegetarian: false, category: i.category },
        quantity: i.quantity,
        note: "",
    }));
}
