import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-white text-gray-800 p-8 md:p-12 font-sans">
            <div className="max-w-4xl mx-auto">
                <Link href="/" className="text-brand-forest hover:underline mb-8 inline-block">&larr; Back to Home</Link>

                <h1 className="text-4xl font-black text-brand-forest mb-6">Privacy Policy</h1>
                <p className="mb-4 text-sm text-gray-500">Last Updated: {new Date().toLocaleDateString()}</p>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 text-gray-900">1. Introduction</h2>
                    <p className="mb-4 leading-relaxed">
                        Welcome to <strong>DateWithDiet</strong> ("we," "our," or "us"). We are committed to protecting your privacy and ensuring your personal health information is secure. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application and website.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 text-gray-900">2. Information We Collect</h2>
                    <p className="mb-4 leading-relaxed">
                        To provide personalized diet and wellness plans, we collect the following types of information:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mb-4">
                        <li><strong>Personal Information:</strong> Name, email address, phone number, and age.</li>
                        <li><strong>Health Data:</strong> Weight, height, dietary preferences, allergies, medical conditions, and lifestyle habits (sleep, water intake, etc.).</li>
                        <li><strong>Usage Data:</strong> Information about how you interact with our app, such as features used and time spent.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 text-gray-900">3. How We Use Your Information</h2>
                    <p className="mb-4 leading-relaxed">
                        We use the collected information for the following purposes:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mb-4">
                        <li><strong>Service Delivery:</strong> To create and deliver personalized diet plans and health assessments.</li>
                        <li><strong>Communication:</strong> To send you updates, reminders, and support messages related to your diet plan.</li>
                        <li><strong>Improvement:</strong> To analyze usage trends and improve the functionality of our application.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 text-gray-900">4. Data Security</h2>
                    <p className="mb-4 leading-relaxed">
                        We implement industry-standard security measures to protect your data. Your personal health information is accessible only to your assigned dietician and authorized support staff. We do not sell your personal data to third parties.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 text-gray-900">5. Your Rights</h2>
                    <p className="mb-4 leading-relaxed">
                        You have the right to access, correct, or delete your personal information. If you wish to exercise these rights, please contact us using the information below.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 text-gray-900">6. Contact Us</h2>
                    <p className="mb-4 leading-relaxed">
                        If you have any questions about this Privacy Policy, please contact us at:
                    </p>
                    <p className="font-medium text-brand-forest">
                        Dt. Mansi Anajwala<br />
                        Email: mansianajwala2000@gmail.com
                    </p>
                </section>
            </div>
        </div>
    );
}
