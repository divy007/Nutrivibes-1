import Image from 'next/image';
import Link from 'next/link';
import { Globe, Smartphone, Download, ArrowRight, Activity, Heart } from 'lucide-react';

export const metadata = {
    title: 'Links | DateWithDiet',
    description: 'Download the DateWithDiet app and start your wellness journey today.',
};

export default function LinksPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-brand-sage/10 to-white font-sans selection:bg-brand-forest/20 selection:text-brand-forest flex flex-col items-center py-16 px-4 sm:px-6">
            <div className="w-full max-w-md mx-auto space-y-8">

                {/* Profile Section */}
                <div className="text-center space-y-4">
                    <div className="relative w-32 h-32 mx-auto bg-white rounded-full p-4 shadow-xl shadow-brand-forest/10 border border-gray-100">
                        <Image
                            src="/brand-logo.png"
                            alt="DateWithDiet Logo"
                            fill
                            className="object-contain p-4"
                            priority
                        />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">DateWithDiet</h1>
                        <p className="text-gray-600 font-medium">Your Personal Wellness Journey Starts Here</p>
                    </div>

                    <div className="flex justify-center gap-4 mt-6">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-brand-forest bg-brand-forest/5 px-3 py-1.5 rounded-full">
                            <Activity className="w-3.5 h-3.5" />
                            Health Tracking
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-brand-forest bg-brand-forest/5 px-3 py-1.5 rounded-full">
                            <Heart className="w-3.5 h-3.5" />
                            Expert Guidance
                        </div>
                    </div>
                </div>

                {/* Links Section */}
                <div className="space-y-4 w-full mt-10">

                    <Link
                        href="/"
                        className="flex items-center justify-between w-full p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg hover:border-brand-sage/50 transition-all transform hover:-translate-y-1 active:scale-95 group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600 group-hover:bg-brand-sage/20 group-hover:text-brand-forest transition-colors">
                                <Globe className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <span className="block font-bold text-gray-900 text-lg">Visit Website</span>
                                <span className="block text-sm text-gray-500 mt-0.5">Learn more about our plans</span>
                            </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-brand-forest transition-colors translate-x-0 group-hover:translate-x-1" />
                    </Link>

                    <a
                        href="https://play.google.com/store/apps/details?id=com.nutrivibes.mobile"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between w-full p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg hover:border-brand-sage/50 transition-all transform hover:-translate-y-1 active:scale-95 group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600 group-hover:bg-brand-sage/20 group-hover:text-brand-forest transition-colors">
                                <Download className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <span className="block font-bold text-gray-900 text-lg">Android App</span>
                                <span className="block text-sm text-gray-500 mt-0.5">Download on Google Play</span>
                            </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-brand-forest transition-colors translate-x-0 group-hover:translate-x-1" />
                    </a>

                    <a
                        href="https://apps.apple.com/us/app/datewithdiet/id6759826984"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between w-full p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg hover:border-brand-sage/50 transition-all transform hover:-translate-y-1 active:scale-95 group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600 group-hover:bg-brand-sage/20 group-hover:text-brand-forest transition-colors">
                                <Smartphone className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <span className="block font-bold text-gray-900 text-lg">iOS App</span>
                                <span className="block text-sm text-gray-500 mt-0.5">Download on the App Store</span>
                            </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-brand-forest transition-colors translate-x-0 group-hover:translate-x-1" />
                    </a>

                </div>

            </div>

            {/* Footer */}
            <div className="mt-auto pt-16 text-center">
                <p className="text-sm font-medium text-gray-400">
                    &copy; {new Date().getFullYear()} DateWithDiet
                </p>
            </div>
        </div>
    );
}
