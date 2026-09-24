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
            <div className="border-t border-line py-5 text-center text-xs text-muted">
                &copy; {new Date().getFullYear()} QuickFood. Made for hungry people.
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
