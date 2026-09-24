import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
    return (
        <Link href={href} className="group inline-flex items-center gap-2" aria-label="QuickFood home">
            <span className="grid size-8 place-items-center rounded-[10px] bg-brand text-brand-ink transition-transform group-hover:-rotate-6">
                <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
                    <path d="M5 13a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                    <path d="M3 13h18M12 6V4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                    <path d="M7 17h10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
            </span>
            <span className="font-display text-xl font-extrabold tracking-tight">
                Quick<span className="text-brand">Food</span>
            </span>
        </Link>
    );
}
