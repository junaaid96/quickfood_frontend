import { AuthAside } from "./AuthAside";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-[1fr_1fr] md:py-16 lg:gap-16">
            <div className="w-full max-w-md md:justify-self-end">{children}</div>
            <AuthAside />
        </div>
    );
}
