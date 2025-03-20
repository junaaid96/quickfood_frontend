export interface User {
    id: number;
    username: string;
    email: string;
    role: string;
    phone_number?: string;
    address?: string;
    first_name?: string;
    last_name?: string;
    is_restaurant_owner?: boolean;
}

export interface Restaurant {
    id: number;
    name: string;
    description: string;
    address: string;
    phone_number: string;
    image: string | null;
    menu_items: MenuItem[];
    owner: {
        id: number;
        username: string;
    };
    created_at?: string;
    updated_at?: string;
}

export interface MenuItem {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string | null;
    restaurant: number;
    is_available: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface OrderItem {
    id?: number;
    menu_item: number;
    menu_item_details?: {
        id: number;
        name: string;
        description: string;
        price: string;
        image: string | null;
        is_available: boolean;
    };
    quantity: number;
    price: number | string;
}

export interface Order {
    id?: number;
    user?: number;
    user_details?: {
        id?: number;
        phone_number?: string;
        username?: string;
        email?: string;
    };
    restaurant: number;
    restaurant_details?: {
        id: number;
        name: string;
        description: string;
        address: string;
        phone_number: string;
        image: string | null;
        menu_items: any[];
        created_at: string;
        owner: {
            id: number;
            username: string;
        };
    };
    items: OrderItem[];
    total_price: number | string;
    status: 'pending' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
    delivery_address: string;
    created_at?: string;
    updated_at?: string;
}