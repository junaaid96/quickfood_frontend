const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "$";

export function money(value: string | number | null | undefined): string {
    const n = typeof value === "string" ? parseFloat(value) : value ?? 0;
    return `${CURRENCY}${(Number.isFinite(n) ? n : 0).toFixed(2)}`;
}

export function num(value: string | number | null | undefined): number {
    const n = typeof value === "string" ? parseFloat(value) : value ?? 0;
    return Number.isFinite(n) ? n : 0;
}

export function priceLevel(level: number): string {
    return CURRENCY.repeat(level);
}

export function timeAgo(iso: string): string {
    const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
    if (seconds < 45) return "just now";
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} h ago`;
    const days = Math.round(hours / 24);
    if (days < 7) return `${days} d ago`;
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function clock(iso: string | number | Date): string {
    return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function dateTime(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

export function hoursLabel(opens: string | null, closes: string | null): string | null {
    if (!opens || !closes) return null;
    const fmt = (t: string) => {
        const [h, m] = t.split(":").map(Number);
        const d = new Date();
        d.setHours(h, m, 0, 0);
        return d.toLocaleTimeString(undefined, { hour: "numeric", minute: m ? "2-digit" : undefined });
    };
    return `${fmt(opens)} - ${fmt(closes)}`;
}

export function initials(name: string): string {
    return name
        .split(/\s+/)
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

export function cn(...classes: (string | false | null | undefined)[]): string {
    return classes.filter(Boolean).join(" ");
}
