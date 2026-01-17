import Link from 'next/link';
import Image from 'next/image';
import { Download, ArrowRight, CheckCircle, Smartphone, Activity, Heart, Shield } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center">
                            <div className="relative w-10 h-10 mr-3">
                                <Image
                                    src="/brand-logo.png"
                                    alt="NutriVibes Logo"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <span className="text-2xl font-black text-brand-forest tracking-tight">
                                NutriVibes
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link
                                href="/login"
                                className="text-sm font-semibold text-gray-600 hover:text-brand-forest transition-colors"
                            >
                                Dietician Login
                            </Link>
                            <a
                                href="#download"
                                className="hidden sm:inline-flex items-center px-5 py-2.5 rounded-full bg-brand-forest text-white text-sm font-bold shadow-lg shadow-brand-forest/20 hover:bg-brand-dark transition-all transform hover:-translate-y-0.5"
                            >
                                Download App
                            </a>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative overflow-hidden pt-16 pb-20 lg:pt-32 lg:pb-28">
                <div className="absolute top-0 right-0 -mr-20 -mt-20">
                    <div className="w-96 h-96 bg-brand-sage/10 rounded-full blur-3xl opacity-50" />
                </div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20">
                    <div className="w-96 h-96 bg-brand-forest/5 rounded-full blur-3xl opacity-50" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
                        <div className="lg:col-span-6 text-center lg:text-left mb-12 lg:mb-0">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-sage/10 text-brand-forest text-sm font-bold mb-8">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-forest opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-forest"></span>
                                </span>
                                Now Available for Android
                            </div>
                            <h1 className="text-5xl lg:text-6xl font-black text-gray-900 leading-tight mb-6 tracking-tight">
                                Your Personal <br />
                                <span className="text-brand-forest">Wellness Journey</span>
                                <br /> Starts Here.
                            </h1>
                            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                                Connect directly with Dt. Mansi Anajwala. Get personalized diet plans,
                                track your progress, and achieve your health goals with NutriVibes.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <a
                                    href="#download"
                                    className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-brand-forest rounded-2xl shadow-xl shadow-brand-forest/20 hover:bg-brand-dark transition-all transform hover:-translate-y-1"
                                >
                                    <Download className="w-5 h-5 mr-2" />
                                    Download for Android
                                </a>
                                <Link
                                    href="/login"
                                    className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-gray-700 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all"
                                >
                                    Staff Login
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Link>
                            </div>
                            <div className="mt-10 flex items-center justify-center lg:justify-start gap-8 opacity-80">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-brand-sage" />
                                    <span className="text-sm font-medium text-gray-600">Secure Data</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Smartphone className="w-5 h-5 text-brand-sage" />
                                    <span className="text-sm font-medium text-gray-600">Mobile First</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Heart className="w-5 h-5 text-brand-sage" />
                                    <span className="text-sm font-medium text-gray-600">Personal Care</span>
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-6 relative">
                            <div className="relative mx-auto w-full max-w-[340px] aspect-[9/19] bg-gray-900 rounded-[3rem] border-8 border-gray-900 shadow-2xl overflow-hidden">
                                {/* Mockup Content - Using a gradient placeholder if screenshot not available, or replace with actual screenshot */}
                                <div className="absolute inset-0 bg-white">
                                    <div className="h-full w-full bg-gradient-to-br from-brand-forest/80 to-brand-sage/50 p-6 flex flex-col justify-end">
                                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 mb-4 border border-white/20">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                                                    <Activity size={20} />
                                                </div>
                                                <div>
                                                    <div className="text-white text-sm font-bold">Daily Goal</div>
                                                    <div className="text-white/80 text-xs">Keep it up!</div>
                                                </div>
                                            </div>
                                            <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                                                <div className="h-full w-3/4 bg-white rounded-full"></div>
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-2xl p-4 shadow-lg">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="font-bold text-gray-900">Next Meal</div>
                                                <span className="text-xs font-bold text-brand-forest bg-brand-forest/10 px-2 py-1 rounded-full">12:30 PM</span>
                                            </div>
                                            <div className="text-sm text-gray-600">Quinoa Salad with Avocado</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Decorative elements behind phone */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-brand-forest/5 rounded-full blur-3xl -z-10"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-base font-bold text-brand-forest uppercase tracking-widest mb-2">Why NutriVibes?</h2>
                        <h3 className="text-3xl lg:text-4xl font-black text-gray-900">Everything you need to succeed</h3>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                                <Activity className="w-7 h-7 text-green-600" />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 mb-3">Health Tracking</h4>
                            <p className="text-gray-600 leading-relaxed">
                                Log your weight, water intake, and measurements effortlessly. Visualize your progress with interactive charts.
                            </p>
                        </div>
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                                <Smartphone className="w-7 h-7 text-blue-600" />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 mb-3">Personalized Plans</h4>
                            <p className="text-gray-600 leading-relaxed">
                                Access your custom diet plans anytime, anywhere. Receive meal reminders and suggestions tailored to you.
                            </p>
                        </div>
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                                <Heart className="w-7 h-7 text-purple-600" />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 mb-3">Expert Guidance</h4>
                            <p className="text-gray-600 leading-relaxed">
                                Direct connection with your dietician. Get feedback, updates, and motivation throughout your journey.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-24 bg-white overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="lg:grid lg:grid-cols-2 gap-16 items-center">
                        <div className="mb-12 lg:mb-0">
                            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-6">
                                Getting started is simple.
                            </h2>
                            <div className="space-y-8">
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-forest text-white flex items-center justify-center font-bold text-lg">1</div>
                                    <div>
                                        <h4 className="text-xl font-bold text-gray-900 mb-2">Download the App</h4>
                                        <p className="text-gray-600">Get the latest version of NutriVibes directly from this page.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-forest text-white flex items-center justify-center font-bold text-lg">2</div>
                                    <div>
                                        <h4 className="text-xl font-bold text-gray-900 mb-2">Sign In</h4>
                                        <p className="text-gray-600">Use the credentials provided by your dietician to access your account.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-forest text-white flex items-center justify-center font-bold text-lg">3</div>
                                    <div>
                                        <h4 className="text-xl font-bold text-gray-900 mb-2">Start Your Journey</h4>
                                        <p className="text-gray-600">Complete your profile, view your diet plan, and start tracking!</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="aspect-square bg-gray-50 rounded-[3rem] p-8 flex items-center justify-center">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white p-6 rounded-2xl shadow-lg transform translate-y-8">
                                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600 font-bold">65kg</div>
                                        <div className="font-bold text-gray-900">Weight Goal</div>
                                        <div className="text-xs text-gray-500">Track progress</div>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600 font-bold">2.5L</div>
                                        <div className="font-bold text-gray-900">Water Intake</div>
                                        <div className="text-xs text-gray-500">Daily hydration</div>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl shadow-lg col-span-2 transform -translate-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-brand-forest rounded-xl flex items-center justify-center text-white">
                                                <CheckCircle />
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">Diet Plan Active</div>
                                                <div className="text-xs text-gray-500">Week 4 • Weight Loss</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Download Section */}
            <section id="download" className="py-24 bg-brand-forest relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <h2 className="text-3xl lg:text-4xl font-black text-white mb-6">Ready to transform your health?</h2>
                    <p className="text-xl text-brand-sage/90 mb-10 max-w-2xl mx-auto">
                        Download the official NutriVibes app now. Compatible with Android devices running Android 6.0 and above.
                    </p>
                    <div className="bg-white/10 backdrop-blur-sm p-8 rounded-3xl border border-white/20 max-w-lg mx-auto">
                        <div className="text-white font-bold mb-4 flex items-center justify-center gap-2">
                            <Smartphone className="w-5 h-5" />
                            <span>Android Application Package (APK)</span>
                        </div>
                        <a
                            href="/application-a095a3c3-ad58-482d-a7aa-93015c732704.apk"
                            download
                            className="w-full block bg-white text-brand-forest font-black text-lg py-4 px-8 rounded-xl hover:bg-brand-sage transition-colors shadow-lg"
                        >
                            Download Now
                        </a>
                        <p className="text-white/60 text-xs mt-4">
                            Version 1.0.0 • Size: ~30MB • Secure Download
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-8 mb-8 border-b border-gray-800 pb-8">
                        <div className="col-span-1 md:col-span-1">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="relative w-8 h-8">
                                    <Image
                                        src="/brand-logo.png"
                                        alt="NutriVibes Logo"
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                                <span className="text-xl font-bold text-white">NutriVibes</span>
                            </div>
                            <p className="text-sm leading-relaxed">
                                Empowering your wellness journey through personalized nutrition and expert guidance.
                            </p>
                        </div>
                        <div>
                            <h5 className="text-white font-bold mb-4">Contact</h5>
                            <ul className="space-y-2 text-sm">
                                <li>Dt. Mansi Anajwala</li>
                                <li>Support: +91 98765 43210</li>
                                <li>Email: contact@nutrivibes.com</li>
                            </ul>
                        </div>
                        <div>
                            <h5 className="text-white font-bold mb-4">Legal</h5>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                            </ul>
                        </div>
                        <div>
                            <h5 className="text-white font-bold mb-4">Admin</h5>
                            <Link
                                href="/login"
                                className="inline-block bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors"
                            >
                                Dietician Dashboard
                            </Link>
                        </div>
                    </div>
                    <div className="text-center text-xs text-gray-600">
                        &copy; {new Date().getFullYear()} NutriVibes. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
