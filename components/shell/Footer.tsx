import Link from "next/link";
import { Logo } from "./Logo";

export default function Footer() {
    return (
        <footer className="mt-24 border-t border-line pb-24 md:pb-0">
            <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
                <div>
                    <Logo />
                    <p className="mt-3 max-w-xs text-sm text-muted">
                        Local kitchens, honest prices and delivery you can actually track.
                    </p>
                </div>
                <FooterCol title="Eat" links={[["/restaurants", "Discover"], ["/planner", "Budget Bites"], ["/favorites", "Favourites"]]} />
                <FooterCol title="Account" links={[["/orders", "Orders"], ["/profile", "Rewards"], ["/login", "Log in"]]} />
                <FooterCol title="Partners" links={[["/register?role=restaurant_owner", "Add your restaurant"], ["/dashboard", "Partner dashboard"]]} />
            </div>
            <div className="border-t border-line py-5 text-xs text-muted">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-center sm:px-6 md:flex-row md:text-left">
                    <p>&copy; {new Date().getFullYear()} QuickFood. Made for hungry people.</p>
                    <a
                        href="https://junaidul.pro.bd/codejborg"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Developed by CodeJBorg — visit developer website"
                        className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-line bg-surface/60 py-1.5 pr-3 pl-1.5 font-mono text-[11px] tracking-wide text-muted transition-colors duration-300 hover:border-muted hover:bg-surface hover:text-ink"
                    >
                        <span className="flex size-6 items-center justify-center rounded-full bg-brand text-brand-ink">
                            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m18 16 4-4-4-4" /><path d="m6 8-4 4 4 4" /><path d="m14.5 4-5 16" /></svg>
                        </span>
                        <span>Developed by</span>
                        <span className="font-semibold text-ink">
                            <span className="text-brand">&lt;</span>CodeJBorg<span className="text-brand"> /&gt;</span>
                        </span>
                        <span aria-hidden="true" className="inline-block h-3.5 w-[2px] bg-brand motion-safe:animate-pulse" />
                        <svg className="size-3.5 opacity-40 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 7h10v10" /><path d="M7 17 17 7" /></svg>
                    </a>
                </div>
            </div>
        </footer>
    );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
    return (
        <div>
            <h3 className="mb-3 text-sm font-semibold">{title}</h3>
            <ul className="space-y-2 text-sm text-muted">
                {links.map(([href, label]) => (
                    <li key={href}>
                        <Link href={href} className="hover:text-ink">
                            {label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
