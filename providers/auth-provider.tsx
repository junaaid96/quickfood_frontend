"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { onSessionExpired, request, tokens } from "@/lib/api";
import type { Role, User } from "@/lib/types";

export type RegisterInput = {
    username: string;
    email: string;
    password: string;
    role: Role;
    first_name: string;
    last_name: string;
    phone_number?: string;
};

type AuthContextType = {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isRestaurantOwner: boolean;
    login: (username: string, password: string, redirectTo?: string | null) => Promise<User>;
    register: (data: RegisterInput) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const refreshUser = useCallback(async () => {
        if (!tokens.access) {
            setUser(null);
            return;
        }
        try {
            setUser(await request<User>("/accounts/profile/"));
        } catch {
            tokens.clear();
            setUser(null);
        }
    }, []);

    useEffect(() => {
        refreshUser().finally(() => setIsLoading(false));
        return onSessionExpired(() => setUser(null));
    }, [refreshUser]);

    const login = async (username: string, password: string, redirectTo?: string | null) => {
        const { access, refresh } = await request<{ access: string; refresh: string }>("/accounts/token/", {
            method: "POST",
            body: { username, password },
            auth: false,
        });
        tokens.set(access, refresh);
        const profile = await request<User>("/accounts/profile/");
        setUser(profile);
        // Clear any data cached for an anonymous visitor (favourites, etc).
        mutate(() => true, undefined, { revalidate: true });
        const fallback = profile.role === "restaurant_owner" ? "/dashboard" : "/restaurants";
        router.push(redirectTo && redirectTo.startsWith("/") ? redirectTo : fallback);
        return profile;
    };

    const register = async (data: RegisterInput) => {
        await request("/accounts/register/", { method: "POST", body: data, auth: false });
    };

    const logout = () => {
        tokens.clear();
        setUser(null);
        mutate(() => true, undefined, { revalidate: false });
        router.push("/");
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                isRestaurantOwner: user?.role === "restaurant_owner",
                login,
                register,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
