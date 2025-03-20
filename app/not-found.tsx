import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full text-center">
                <h1 className="text-9xl font-extrabold text-orange-500">404</h1>
                <h2 className="mt-6 text-3xl font-bold text-gray-900">
                    Page Not Found
                </h2>
                <p className="mt-2 text-lg text-gray-600">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <div className="mt-6">
                    <Link href="/">
                        <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-md font-medium">
                            Go Back Home
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
