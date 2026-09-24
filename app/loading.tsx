export default function Loading() {
    return (
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
            <div className="skeleton h-9 w-64 rounded-xl" />
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skeleton h-64 rounded-3xl" />
                ))}
            </div>
        </div>
    );
}
