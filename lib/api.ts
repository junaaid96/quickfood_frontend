const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://quickfood-backend-bice.vercel.app/api").replace(/\/$/, "");

const TOKEN_KEY = "token";
const REFRESH_KEY = "refreshToken";

export class ApiError extends Error {
    status: number;
    data: unknown;
    fieldErrors: Record<string, string>;

    constructor(message: string, status: number, data: unknown, fieldErrors: Record<string, string> = {}) {
        super(message);
        this.status = status;
        this.data = data;
        this.fieldErrors = fieldErrors;
    }
}

export const tokens = {
    get access() {
        return typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY);
    },
    get refresh() {
        return typeof window === "undefined" ? null : localStorage.getItem(REFRESH_KEY);
    },
    set(access: string, refresh?: string) {
        localStorage.setItem(TOKEN_KEY, access);
        if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
    },
    clear() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_KEY);
    },
};

/* ---- Slow request tracking: the free API host sleeps, so tell people when it is waking up. ---- */
type SlowListener = (slow: boolean) => void;
const slowListeners = new Set<SlowListener>();
let slowCount = 0;
export function onSlowNetwork(listener: SlowListener) {
    slowListeners.add(listener);
    return () => {
        slowListeners.delete(listener);
    };
}
function markSlow(delta: number) {
    slowCount = Math.max(0, slowCount + delta);
    slowListeners.forEach((l) => l(slowCount > 0));
}

/* ---- Session expiry: auth provider subscribes to log the user out. ---- */
const expiredListeners = new Set<() => void>();
export function onSessionExpired(listener: () => void) {
    expiredListeners.add(listener);
    return () => {
        expiredListeners.delete(listener);
    };
}

function flattenErrors(data: unknown): { message: string; fields: Record<string, string> } {
    if (!data || typeof data !== "object") return { message: "Something went wrong.", fields: {} };
    const fields: Record<string, string> = {};
    const messages: string[] = [];
    const visit = (value: unknown, key?: string) => {
        if (typeof value === "string") {
            if (key && key !== "detail" && key !== "non_field_errors") fields[key] = fields[key] || value;
            messages.push(value);
        } else if (Array.isArray(value)) {
            value.forEach((v) => visit(v, key));
        } else if (value && typeof value === "object") {
            Object.entries(value).forEach(([k, v]) => visit(v, key ?? k));
        }
    };
    visit(data);
    return { message: messages[0] || "Something went wrong.", fields };
}

let refreshing: Promise<boolean> | null = null;
async function refreshAccess(): Promise<boolean> {
    const refresh = tokens.refresh;
    if (!refresh) return false;
    refreshing ??= fetch(`${API_URL}/accounts/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
    })
        .then(async (res) => {
            if (!res.ok) return false;
            const data = await res.json();
            tokens.set(data.access);
            return true;
        })
        .catch(() => false)
        .finally(() => {
            refreshing = null;
        });
    return refreshing;
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export async function request<T>(
    path: string,
    { method = "GET", body, auth = true }: { method?: Method; body?: unknown; auth?: boolean } = {},
    retried = false,
): Promise<T> {
    const headers: Record<string, string> = {};
    const isForm = typeof FormData !== "undefined" && body instanceof FormData;
    if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";
    const access = tokens.access;
    if (auth && access) headers["Authorization"] = `Bearer ${access}`;

    let flaggedSlow = false;
    const slowTimer = setTimeout(() => {
        flaggedSlow = true;
        markSlow(1);
    }, 3500);
    let res: Response;
    try {
        res = await fetch(`${API_URL}${path}`, {
            method,
            headers,
            body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
        });
    } catch {
        throw new ApiError("Can't reach QuickFood right now. Check your connection and try again.", 0, null);
    } finally {
        clearTimeout(slowTimer);
        if (flaggedSlow) markSlow(-1);
    }

    if (res.status === 401 && auth && access && !retried) {
        if (await refreshAccess()) return request<T>(path, { method, body, auth }, true);
        tokens.clear();
        expiredListeners.forEach((l) => l());
    }

    if (res.status === 204) return undefined as T;
    const text = await res.text();
    const data = text ? safeJson(text) : null;
    if (!res.ok) {
        const { message, fields } = flattenErrors(data);
        throw new ApiError(message, res.status, data, fields);
    }
    return data as T;
}

function safeJson(text: string) {
    try {
        return JSON.parse(text);
    } catch {
        return { detail: text.slice(0, 200) };
    }
}

export const fetcher = <T,>(path: string) => request<T>(path);

export function qs(params: Record<string, string | number | boolean | undefined | null>): string {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "" && v !== false) search.set(k, String(v));
    });
    const s = search.toString();
    return s ? `?${s}` : "";
}
