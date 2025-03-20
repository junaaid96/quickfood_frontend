"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";
import { authApi } from "@/lib/api";
import { useRouter } from "next/navigation";

type User = {
    id: number;
    username: string;
    email: string;
    role: string;
};

type AuthContextType = {
    user: User | null;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    register: (
        username: string,
        first_name: string,
        last_name: string,
        email: string,
        password: string,
        role: string,
    ) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    isRestaurantOwner: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check if user is logged in
        const checkAuth = async () => {
            try {
                const token = localStorage.getItem("token");
                if (token) {
                    // Get user profile
                    const profile = await authApi.getProfile();
                    setUser(profile);
                }
            } catch (error) {
                console.error("Authentication error:", error);
                localStorage.removeItem("token");
                localStorage.removeItem("refreshToken");
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (username: string, password: string) => {
        setIsLoading(true);
        try {
            const { access, refresh } = await authApi.login({
                username,
                password,
            });
            localStorage.setItem("token", access);
            localStorage.setItem("refreshToken", refresh);

            // Get user profile
            const profile = await authApi.getProfile();
            setUser(profile);

            router.push("/restaurants");
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (
        username: string, 
        email: string, 
        password: string, 
        role: string,
        first_name: string,
        last_name: string
    ) => {
        setIsLoading(true);
        try {
            await authApi.register({ 
                username, 
                email, 
                password, 
                role,
                first_name,
                last_name
            });
            router.push('/login');
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        setUser(null);
        router.push("/login");
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                login,
                register,
                logout,
                isAuthenticated: !!user,
                isRestaurantOwner: user?.role === "restaurant_owner",
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
