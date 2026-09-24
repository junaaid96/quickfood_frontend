import { LinkButton } from "@/components/ui/Button";

export default function NotFound() {
    return (
        <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
            <p className="font-display text-7xl font-extrabold text-brand">404</p>
            <h1 className="mt-4 text-2xl font-bold">This plate is empty</h1>
            <p className="mt-2 text-muted">The page you are looking for was moved, eaten, or never existed.</p>
            <LinkButton href="/restaurants" className="mt-8">
                Browse restaurants
            </LinkButton>
        </div>
    );
}
