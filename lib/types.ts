export type Role = "user" | "restaurant_owner";

export interface User {
    id: number;
    username: string;
    email: string;
    role: Role;
    first_name?: string;
    last_name?: string;
    phone_number?: string | null;
    address?: string | null;
    loyalty_points: number;
    loyalty_tier: string;
    next_tier: { name: string; points_needed: number; threshold: number } | null;
    date_joined?: string;
}

export interface Address {
    id: number;
    label: string;
    line: string;
    instructions: string;
    is_default: boolean;
}

export interface MenuItem {
    id: number;
    restaurant: number;
    name: string;
    description: string;
    price: string;
    image: string | null;
    image_url: string;
    cover_image: string | null;
    is_available: boolean;
    category: string;
    is_vegetarian: boolean;
    is_vegan: boolean;
    is_gluten_free: boolean;
    spice_level: number;
    calories: number | null;
}

export interface RestaurantSummary {
    id: number;
    name: string;
    description: string;
    address: string;
    phone_number: string;
    image: string | null;
    cover_image: string | null;
    cuisine: string;
    prep_time_minutes: number;
    delivery_fee: string;
    owner: { id: number; username: string };
}

export interface Restaurant extends RestaurantSummary {
    image_url: string;
    cuisine_label: string;
    tags: string;
    tag_list: string[];
    price_level: 1 | 2 | 3;
    min_order: string;
    eta_range: [number, number];
    opens_at: string | null;
    closes_at: string | null;
    is_accepting_orders: boolean;
    is_open: boolean;
    rating: number | null;
    review_count: number;
    order_count: number;
    is_favorite: boolean;
    matching_dishes: string[];
    created_at: string;
}

export interface RestaurantDetail extends Restaurant {
    menu_items: MenuItem[];
    categories: string[];
    popular_item_ids: number[];
    rating_breakdown: Record<string, number>;
}

export interface Cuisine {
    value: string;
    label: string;
    count: number;
}

export interface Review {
    id: number;
    order: number;
    user: string;
    restaurant: number;
    restaurant_name: string;
    rating: number;
    comment: string;
    owner_reply: string;
    items: string[];
    created_at: string;
}

export type OrderStatus = "pending" | "confirmed" | "preparing" | "out_for_delivery" | "delivered" | "cancelled";
export type DeliveryOption = "priority" | "standard" | "eco";

export interface OrderItem {
    id: number;
    menu_item: number;
    menu_item_details: MenuItem;
    quantity: number;
    price: string;
    note: string;
}

export interface OrderEvent {
    status: OrderStatus;
    status_label: string;
    note: string;
    created_at: string;
}

export interface Order {
    id: number;
    user: number;
    user_details: { id: number; username: string; email: string; phone_number: string | null; first_name: string; last_name: string };
    restaurant: number;
    restaurant_details: RestaurantSummary;
    status: OrderStatus;
    status_label: string;
    subtotal: string;
    delivery_fee: string;
    service_fee: string;
    discount: string;
    points_discount: string;
    tip: string;
    total_price: string;
    delivery_address: string;
    delivery_option: DeliveryOption;
    delivery_option_label: string;
    payment_method: "cash" | "card";
    contact_phone: string;
    notes: string;
    promo_code: string | null;
    points_redeemed: number;
    points_earned: number;
    scheduled_for: string | null;
    estimated_delivery_at: string | null;
    delivered_at: string | null;
    items: OrderItem[];
    events: OrderEvent[];
    review: { id: number; rating: number; comment: string; owner_reply: string } | null;
    can_cancel: boolean;
    created_at: string;
    updated_at: string;
}

export interface DeliveryOptionQuote {
    value: DeliveryOption;
    label: string;
    description: string;
    fee: string;
    eta_minutes: number;
}

export interface Quote {
    subtotal: string;
    delivery_fee: string;
    service_fee: string;
    discount: string;
    points_discount: string;
    points_redeemed: number;
    points_available: number;
    points_to_earn: number;
    tip: string;
    total: string;
    promo_code: string | null;
    promo_description: string | null;
    promo_error: string | null;
    delivery_option: DeliveryOption;
    eta_minutes: number;
    estimated_delivery_at: string;
    below_min_order: boolean;
    min_order: string;
    restaurant: number;
    restaurant_open: boolean;
    delivery_options: DeliveryOptionQuote[];
}

export interface OrderMessage {
    id: number;
    body: string;
    sender_name: string;
    sender_role: "customer" | "restaurant";
    is_mine: boolean;
    created_at: string;
}

export interface Promo {
    code: string;
    description: string;
    discount_type: "percent" | "flat" | "free_delivery";
    value: string;
    min_subtotal: string;
    first_order_only: boolean;
    restaurant: number | null;
    restaurant_name: string | null;
}

export interface MealPlan {
    strategy: "popular" | "value" | "treat";
    label: string;
    items: { menu_item_id: number; name: string; price: string; quantity: number; category: string }[];
    subtotal: string;
    delivery_fee: string;
    service_fee: string;
    estimated_total: string;
    leftover: string;
    budget_used: number;
    item_count: number;
    restaurant: Restaurant;
}

export interface Analytics {
    days: number;
    kpis: {
        revenue: number;
        orders: number;
        avg_order_value: number;
        tips: number;
        cancel_rate: number;
        repeat_customer_rate: number;
        customers: number;
        avg_rating: number | null;
        review_count: number;
        active_orders: number;
    };
    series: { date: string; revenue: number; orders: number }[];
    status_breakdown: Record<string, number>;
    delivery_mix: Record<string, number>;
    top_items: { name: string; quantity: number; revenue: number }[];
    busiest_hours: { hour: number; orders: number }[];
}

export interface Paginated<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}
