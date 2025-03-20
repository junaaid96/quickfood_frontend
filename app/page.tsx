import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
    return (
        <div>
            {/* Hero Section */}
            <div className="relative bg-orange-500 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col md:flex-row items-center">
                    <div className="md:w-1/2 mb-10 md:mb-0">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            Food delivery made simple
                        </h1>
                        <p className="text-xl mb-8">
                            Order food from your favorite restaurants and get it
                            delivered to your doorstep.
                        </p>
                        <Link href="/restaurants">
                            <button className="bg-white text-orange-500 px-8 py-3 rounded-md font-medium text-lg hover:bg-gray-100 transition-colors">
                                Order Now
                            </button>
                        </Link>
                    </div>
                    <div className="md:w-1/2 relative h-64 md:h-96 w-full">
                        <Image
                            src="banner.svg"
                            alt="Delicious food"
                            fill
                            className="object-cover rounded-lg"
                            priority
                        />
                    </div>
                </div>
            </div>

            {/* How It Works Section */}
            <div className="py-16 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
                        How It Works
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white p-6 rounded-lg shadow-md text-center">
                            <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                1
                            </div>
                            <h3 className="text-xl font-semibold mb-2">
                                Choose a Restaurant
                            </h3>
                            <p className="text-gray-600">
                                Browse through our selection of restaurants and
                                find your favorite.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md text-center">
                            <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                2
                            </div>
                            <h3 className="text-xl font-semibold mb-2">
                                Select Your Meal
                            </h3>
                            <p className="text-gray-600">
                                Choose from a variety of delicious meals and add
                                them to your cart.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md text-center">
                            <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                3
                            </div>
                            <h3 className="text-xl font-semibold mb-2">
                                Enjoy Your Delivery
                            </h3>
                            <p className="text-gray-600">
                                Track your order in real-time and enjoy your
                                meal when it arrives.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
