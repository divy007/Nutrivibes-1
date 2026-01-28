import Link from 'next/link';

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-white flex flex-col">
            <header className="border-b border-gray-100 py-4 px-6">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <Link href="/" className="font-bold text-xl text-[#1B4332]">
                        DateWithDiet
                    </Link>
                </div>
            </header>

            <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
                <p className="text-gray-500 mb-8 text-sm">Last Updated: {new Date().getFullYear()}</p>

                <div className="prose prose-slate max-w-none text-gray-700 space-y-8">

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
                        <p>
                            By accessing or using the DateWithDiet mobile application and website, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">2. User Responsibilities</h2>
                        <ul className="list-disc list-inside space-y-2">
                            <li>You are responsible for providing accurate health information (e.g., allergies, medical conditions) to your dietician.</li>
                            <li>You agree to keep your login credentials confidential and secure.</li>
                            <li>You must be at least 18 years old to use this service, or have parental consent.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">3. Services & Payments</h2>
                        <p>
                            DateWithDiet provides personalized diet counselling and meal planning.
                            Services are provided on a subscription or per-consultation basis.
                            All payments are non-refundable once the service period has commenced or a diet plan has been delivered, except where required by law.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">4. Intellectual Property</h2>
                        <p>
                            All content, including but not limited to text, graphics, logos, and diet plans provided through the app, is the property of DateWithDiet and protected by copyright laws. You may clearly use these plans for your personal health journey, but you may not reproduce, distribute, or sell them.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">5. Account Termination</h2>
                        <p>
                            We reserve the right to terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">6. Limitation of Liability</h2>
                        <p>
                            In no event shall DateWithDiet, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">7. Contact Us</h2>
                        <p>
                            If you have any questions about these Terms, please contact us at:
                        </p>
                        <p className="font-bold text-[#1B4332] mt-2">
                            datewithdiet.fit@gmail.com
                        </p>
                    </section>

                </div>
            </main>

            <footer className="bg-gray-50 py-8 px-6 border-t border-gray-100 mt-auto">
                <div className="max-w-4xl mx-auto text-center text-gray-400 text-sm">
                    &copy; {new Date().getFullYear()} DateWithDiet. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
