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