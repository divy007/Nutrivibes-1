import Link from 'next/link';
import Image from 'next/image';
import { Download, ArrowRight, CheckCircle, Smartphone, Activity, Heart, Shield } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white font-sans selection:bg-brand-forest/20 selection:text-brand-forest">
            {/* Navigation */}
            <nav className="fixed w-full border-b border-gray-100 bg-white/80 backdrop-blur-xl z-50 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-3 group cursor-pointer">
                            <div className="relative w-40 h-12 transition-transform group-hover:scale-105 duration-300">
                                <Image
                                    src="/brand-logo.png"
                                    alt="DateWithDiet Logo"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <Link
                                href="/login"
                                className="text-sm font-bold text-gray-600 hover:text-brand-forest transition-colors hidden sm:block"
                            >
                                Dietician Login
                            </Link>
                            <a
                                href="#download"
                                className="hidden sm:inline-flex items-center px-6 py-2.5 rounded-full bg-brand-forest text-white text-sm font-bold shadow-lg shadow-brand-forest/30 hover:bg-brand-dark hover:shadow-brand-forest/40 hover:-translate-y-0.5 transition-all duration-300"
                            >
                                Get the App
                            </a>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32 bg-gradient-to-b from-white to-gray-50/50">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 user-select-none pointer-events-none">
                    <div className="w-[500px] h-[500px] bg-brand-sage/20 rounded-full blur-[100px] opacity-60 mix-blend-multiply" />
                </div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 user-select-none pointer-events-none">
                    <div className="w-[500px] h-[500px] bg-brand-forest/10 rounded-full blur-[100px] opacity-60 mix-blend-multiply" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="lg:grid lg:grid-cols-12 lg:gap-20 items-center">
                        <div className="lg:col-span-6 text-center lg:text-left mb-16 lg:mb-0">
                            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white border border-brand-sage/20 shadow-sm text-brand-forest text-sm font-bold mb-10 hover:shadow-md transition-shadow cursor-default">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-forest opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-forest"></span>
                                </span>
                                Now Available for Android
                            </div>
                            <h1 className="text-5xl lg:text-7xl font-black text-gray-900 leading-[1.1] mb-8 tracking-tight">
                                Your Personal <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-forest to-brand-sage">Wellness Journey</span>
                                <br /> Starts Here.
                            </h1>
                            <p className="text-xl text-gray-600 mb-12 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
                                Connect directly with Dt. Mansi Anajwala. Get personalized diet plans,
                                track your progress, and achieve your health goals with DateWithDiet.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start">
                                <a
                                    href="#download"
                                    className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-brand-forest rounded-2xl shadow-xl shadow-brand-forest/30 hover:bg-brand-dark hover:shadow-brand-forest/40 transition-all transform hover:-translate-y-1 active:scale-95"
                                >
                                    <Download className="w-5 h-5 mr-2.5" />
                                    Download for Android
                                </a>
                                <Link
                                    href="/login"
                                    className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-gray-700 bg-white border-2 border-gray-100 rounded-2xl hover:border-gray-200 hover:bg-gray-50 transition-all active:scale-95"
                                >
                                    Staff Login
                                    <ArrowRight className="w-5 h-5 ml-2.5" />
                                </Link>
                            </div>
                            <div className="mt-12 flex items-center justify-center lg:justify-start gap-8 opacity-80 pt-8 border-t border-gray-100">
                                <div className="flex items-center gap-2 group">
                                    <div className="p-2 rounded-lg bg-brand-sage/10 text-brand-forest group-hover:scale-110 transition-transform">
                                        <Shield className="w-5 h-5" />
                                    </div>
                                    <span className="text-sm font-bold text-gray-600">Secure Data</span>
                                </div>
                                <div className="flex items-center gap-2 group">
                                    <div className="p-2 rounded-lg bg-brand-sage/10 text-brand-forest group-hover:scale-110 transition-transform">
                                        <Smartphone className="w-5 h-5" />
                                    </div>
                                    <span className="text-sm font-bold text-gray-600">Mobile First</span>
                                </div>
                                <div className="flex items-center gap-2 group">
                                    <div className="p-2 rounded-lg bg-brand-sage/10 text-brand-forest group-hover:scale-110 transition-transform">
                                        <Heart className="w-5 h-5" />
                                    </div>
                                    <span className="text-sm font-bold text-gray-600">Personal Care</span>
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-6 relative perspective-1000">
                            <div className="relative mx-auto w-full max-w-[360px] aspect-[9/19] bg-gray-900 rounded-[3rem] border-8 border-gray-900 shadow-2xl shadow-brand-forest/20 overflow-hidden transform hover:scale-[1.02] transition-transform duration-500">
                                {/* Status Bar Mock */}
                                <div className="absolute top-0 left-0 right-0 h-8 bg-black z-20 flex justify-between px-6 items-center">
                                    <div className="text-white text-[10px] font-medium">9:41</div>
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 bg-white/20 rounded-full"></div>
                                        <div className="w-3 h-3 bg-white/20 rounded-full"></div>
                                        <div className="w-3 h-3 bg-white/20 rounded-full"></div>
                                    </div>
                                </div>
                                {/* App Screen Image */}
                                <div className="absolute inset-0 bg-white">
                                    <Image
                                        src="/app-login-screen.png"
                                        alt="DateWithDiet App Screen"
                                        fill
                                        className="object-cover"
                                        priority
                                    />
                                </div>
                                {/* Home Indicator */}
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full z-20 backdrop-blur-sm"></div>
                            </div>
                            {/* Decorative elements behind phone */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-gradient-radial from-brand-forest/10 to-transparent opacity-60 -z-10 blur-3xl"></div>
                            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-brand-sage/20 rounded-full blur-2xl animate-pulse"></div>
                            <div className="absolute -top-12 -left-12 w-40 h-40 bg-brand-forest/10 rounded-full blur-2xl animate-pulse delay-700"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 bg-white relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-sm font-bold text-brand-forest uppercase tracking-[0.2em] mb-3">Why DateWithDiet?</h2>
                        <h3 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">Everything you need to <br /><span className="relative inline-block">succeed<span className="absolute bottom-2 left-0 w-full h-3 bg-brand-sage/30 -z-10 rounded-sm"></span></span></h3>
                    </div>

                    <div className="grid md:grid-cols-3 gap-10">
                        <div className="group bg-gray-50 p-8 rounded-[2rem] hover:bg-white border border-transparent hover:border-gray-100 hover:shadow-xl hover:shadow-brand-forest/5 transition-all duration-300">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                <Activity className="w-8 h-8 text-brand-forest" />
                            </div>
                            <h4 className="text-2xl font-bold text-gray-900 mb-4">Health Tracking</h4>
                            <p className="text-gray-600 leading-relaxed font-medium">
                                Log your weight, water intake, and measurements effortlessly. Visualize your progress with interactive charts.
                            </p>
                        </div>
                        <div className="group bg-gray-50 p-8 rounded-[2rem] hover:bg-white border border-transparent hover:border-gray-100 hover:shadow-xl hover:shadow-brand-forest/5 transition-all duration-300">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                <Smartphone className="w-8 h-8 text-brand-forest" />
                            </div>
                            <h4 className="text-2xl font-bold text-gray-900 mb-4">Personalized Plans</h4>
                            <p className="text-gray-600 leading-relaxed font-medium">
                                Access your custom diet plans anytime, anywhere. Receive meal reminders and suggestions tailored to you.
                            </p>
                        </div>
                        <div className="group bg-gray-50 p-8 rounded-[2rem] hover:bg-white border border-transparent hover:border-gray-100 hover:shadow-xl hover:shadow-brand-forest/5 transition-all duration-300">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                <Heart className="w-8 h-8 text-brand-forest" />
                            </div>
                            <h4 className="text-2xl font-bold text-gray-900 mb-4">Expert Guidance</h4>
                            <p className="text-gray-600 leading-relaxed font-medium">
                                Direct connection with your dietician. Get feedback, updates, and motivation throughout your journey.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-32 bg-gray-900 overflow-hidden relative text-white">
                <div className="absolute inset-0 bg-brand-forest/10 opacity-20"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="lg:grid lg:grid-cols-2 gap-20 items-center">
                        <div className="mb-16 lg:mb-0">
                            <h2 className="text-4xl lg:text-5xl font-black text-white mb-8 tracking-tight">
                                Getting started is <br /> simple.
                            </h2>
                            <div className="space-y-12">
                                <div className="flex gap-6 group">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-brand-forest text-white flex items-center justify-center font-black text-xl shadow-lg shadow-brand-forest/20 group-hover:scale-110 transition-transform">1</div>
                                    <div>
                                        <h4 className="text-2xl font-bold text-white mb-2">Download the App</h4>
                                        <p className="text-gray-400 text-lg leading-relaxed">Get the latest version of DateWithDiet directly from this page.</p>
                                    </div>
                                </div>
                                <div className="flex gap-6 group">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-brand-forest text-white flex items-center justify-center font-black text-xl shadow-lg shadow-brand-forest/20 group-hover:scale-110 transition-transform">2</div>
                                    <div>
                                        <h4 className="text-2xl font-bold text-white mb-2">Sign In</h4>
                                        <p className="text-gray-400 text-lg leading-relaxed">Use the credentials provided by your dietician to access your account.</p>
                                    </div>
                                </div>
                                <div className="flex gap-6 group">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-brand-forest text-white flex items-center justify-center font-black text-xl shadow-lg shadow-brand-forest/20 group-hover:scale-110 transition-transform">3</div>
                                    <div>
                                        <h4 className="text-2xl font-bold text-white mb-2">Start Your Journey</h4>
                                        <p className="text-gray-400 text-lg leading-relaxed">Complete your profile, view your diet plan, and start tracking!</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="aspect-square bg-gray-800/50 backdrop-blur-3xl rounded-[3rem] p-10 flex items-center justify-center border border-white/5 shadow-2xl">
                                <div className="grid grid-cols-2 gap-6 w-full">
                                    <div className="bg-gray-800 p-8 rounded-3xl shadow-xl transform translate-y-8 border border-white/5 hover:-translate-y-2 transition-transform duration-500">
                                        <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mb-4 text-red-500 font-black">65<span className="text-xs ml-0.5">kg</span></div>
                                        <div className="font-bold text-white text-lg">Weight Goal</div>
                                        <div className="text-sm text-gray-500">Track progress</div>
                                    </div>
                                    <div className="bg-gray-800 p-8 rounded-3xl shadow-xl border border-white/5 hover:-translate-y-2 transition-transform duration-500 delay-100">
                                        <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4 text-blue-500 font-black">2.5<span className="text-xs ml-0.5">L</span></div>
                                        <div className="font-bold text-white text-lg">Water Intake</div>
                                        <div className="text-sm text-gray-500">Daily hydration</div>
                                    </div>
                                    <div className="bg-gray-800 p-8 rounded-3xl shadow-xl col-span-2 transform -translate-y-4 border border-white/5 hover:-translate-y-6 transition-transform duration-500 delay-200">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 bg-brand-forest rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-forest/30">
                                                <CheckCircle className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-white text-lg">Diet Plan Active</div>
                                                <div className="text-sm text-gray-500 mt-1">Week 4 • Weight Loss • On Track</div>
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
            <section id="download" className="py-32 bg-white relative overflow-hidden">
                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <h2 className="text-4xl lg:text-6xl font-black text-gray-900 mb-8 tracking-tight">Ready to transform?</h2>
                    <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
                        Download the official DateWithDiet app now. Compatible with Android devices running Android 6.0 and above.
                    </p>
                    <div className="bg-brand-forest p-10 rounded-[3rem] shadow-2xl shadow-brand-forest/30 max-w-2xl mx-auto relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity duration-700 group-hover:opacity-75"></div>
                        <div className="absolute bottom-0 left-0 p-32 bg-black/10 rounded-full blur-3xl -ml-16 -mb-16 transition-opacity duration-700 group-hover:opacity-75"></div>

                        <div className="relative z-10">
                            <div className="text-white/90 font-bold mb-8 flex items-center justify-center gap-3">
                                <div className="p-2 bg-white/10 rounded-lg">
                                    <Smartphone className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-lg">Android Application Package (APK)</span>
                            </div>
                            <a
                                href="https://github.com/divy007/Nutrivibes-1/releases/download/v1.0/DateWithDiet.apk"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-3 bg-white text-brand-forest font-black text-xl py-6 px-10 rounded-2xl hover:bg-gray-50 transition-all transform hover:-translate-y-1 shadow-xl"
                            >
                                <Download className="w-6 h-6" />
                                Download Now
                            </a>
                            <p className="text-white/60 text-sm mt-6 font-medium">
                                Version 1.0.0 • Size: ~30MB • Secure Download
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white pt-20 pb-10 border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-12 mb-16">
                        <div className="col-span-1 md:col-span-1">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="relative w-32 h-10">
                                    <Image
                                        src="/brand-logo.png"
                                        alt="DateWithDiet Logo"
                                        fill
                                        className="object-contain object-left"
                                    />
                                </div>
                            </div>
                            <p className="text-gray-500 text-sm leading-relaxed mb-6">
                                Empowering your wellness journey through personalized nutrition and expert guidance.
                            </p>
                        </div>
                        <div>
                            <h5 className="text-gray-900 font-bold mb-6">Contact</h5>
                            <ul className="space-y-4 text-sm text-gray-600">
                                <li className="font-medium">Dt. Mansi Anajwala</li>
                                <li>+91 98765 43210</li>
                                <li>Email: mansianajwala2000@gmail.com</li>
                            </ul>
                        </div>
                        <div>
                            <h5 className="text-gray-900 font-bold mb-6">Legal</h5>
                            <ul className="space-y-4 text-sm text-gray-600">
                                <li><Link href="/privacy-policy" className="hover:text-brand-forest transition-colors">Privacy Policy</Link></li>
                                <li><a href="#" className="hover:text-brand-forest transition-colors">Terms of Service</a></li>
                            </ul>
                        </div>
                        <div>
                            <h5 className="text-gray-900 font-bold mb-6">Admin</h5>
                            <Link
                                href="/login"
                                className="inline-block bg-gray-50 text-gray-600 font-bold px-6 py-3 rounded-xl text-sm hover:bg-gray-100 hover:text-brand-forest transition-all"
                            >
                                Dietician Dashboard
                            </Link>
                        </div>
                    </div>
                    <div className="text-center text-xs text-gray-400 border-t border-gray-50 pt-8">
                        &copy; {new Date().getFullYear()} DateWithDiet. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
