export async function getSession() {
    if (typeof window === 'undefined') {
        return null;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        return null;
    }

    return {
        token,
    };
}

export function isAuthenticated() {
    if (typeof window === 'undefined') {
        return false;
    }

    return !!localStorage.getItem('token');
}

export function useAuthStatus() {
    if (typeof window === 'undefined') {
        return { isAuthenticated: false, isLoading: true };
    }

    // Check if still in the process of loading auth state
    const authLoading = localStorage.getItem('authLoading') === 'true';
    const token = localStorage.getItem('token');
    
    return {
        isAuthenticated: !!token,
        isLoading: authLoading
    };
}

export function setAuthLoading(isLoading: boolean) {
    if (typeof window === 'undefined') {
        return;
    }
    
    if (isLoading) {
        localStorage.setItem('authLoading', 'true');
    } else {
        localStorage.removeItem('authLoading');
    }
}