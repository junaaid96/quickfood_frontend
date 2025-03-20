import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { getSession } from './auth';

const API_URL = 'http://localhost:8000/api';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export async function fetchApi<T>(
    endpoint: string,
    method: RequestMethod = 'GET',
    data?: any,
    requireAuth: boolean = true
): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (requireAuth) {
        const session = await getSession();
        if (session?.token) {
            headers['Authorization'] = `Bearer ${session.token}`;
        }
    }

    const config: AxiosRequestConfig = {
        method,
        url,
        headers,
        data: method !== 'GET' ? data : undefined,
        params: method === 'GET' ? data : undefined,
    };

    try {
        const response: AxiosResponse<T> = await axios(config);
        return response.data;
    } catch (error: any) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            const errorData = error.response.data;
            const customError = new Error(errorData.detail || 'An error occurred');
            (customError as any).detail = errorData.detail;
            (customError as any).status = error.response.status;
            throw customError;
        } else if (error.request) {
            // The request was made but no response was received
            throw new Error('No response received from server');
        } else {
            // Something happened in setting up the request
            throw new Error('Error setting up request: ' + error.message);
        }
    }
}

// Auth API
export const authApi = {
    login: (credentials: { username: string; password: string }) =>
        fetchApi<{ access: string; refresh: string }>('/accounts/token/', 'POST', credentials, false),

    register: (userData: { 
        username: string; 
        email: string; 
        password: string; 
        role: string;
        first_name: string;
        last_name: string;
    }) =>
        fetchApi<{ id: number; username: string; email: string }>(
            '/accounts/register/', 
            'POST', 
            userData, 
            false
        ),

    refreshToken: (refreshToken: string) =>
        fetchApi<{ access: string }>('/accounts/token/refresh/', 'POST', { refresh: refreshToken }, false),

    getProfile: () =>
        fetchApi<any>('/accounts/profile/', 'GET'),

    updateProfile: (profileData: any) =>
        fetchApi<any>('/accounts/profile/', 'PATCH', profileData),
};

// Restaurant API
export const restaurantApi = {
    getAll: (params?: URLSearchParams) => {
        const queryString = params ? `?${params.toString()}` : '';
        return fetchApi<any[]>(`/restaurants/restaurant/${queryString}`, 'GET', undefined, false);
    },

    getById: (id: string) =>
        fetchApi<any>(`/restaurants/restaurant/${id}/`, 'GET', undefined, false),

    create: (restaurantData: any) =>
        fetchApi<any>('/restaurants/restaurant/', 'POST', restaurantData),

    update: (id: string, restaurantData: any) =>
        fetchApi<any>(`/restaurants/restaurant/${id}/`, 'PATCH', restaurantData),

    delete: (id: string) =>
        fetchApi<void>(`/restaurants/restaurant/${id}/`, 'DELETE'),
};

// Menu Items API
export const menuItemsApi = {
    getAll: (restaurantId?: string) => {
        const params = restaurantId ? `?restaurant=${restaurantId}` : '';
        return fetchApi<any[]>(`/restaurants/menu-items/${params}`, 'GET', undefined, false);
    },

    getById: (id: string) =>
        fetchApi<any>(`/restaurants/menu-items/${id}/`, 'GET', undefined, false),

    create: (menuItemData: any) =>
        fetchApi<any>('/restaurants/menu-items/', 'POST', menuItemData),

    update: (id: string, menuItemData: any) =>
        fetchApi<any>(`/restaurants/menu-items/${id}/`, 'PATCH', menuItemData),

    delete: (id: string) =>
        fetchApi<void>(`/restaurants/menu-items/${id}/`, 'DELETE'),
};

// Orders API
export const ordersApi = {
    getAll: () =>
        fetchApi<any[]>('/orders/', 'GET'),

    getById: (id: string) =>
        fetchApi<any>(`/orders/${id}/`, 'GET'),

    create: (orderData: any) =>
        fetchApi<any>('/orders/', 'POST', orderData),

    updateStatus: (id: string, status: string) =>
        fetchApi<any>(`/orders/${id}/`, 'PATCH', { status }),
};