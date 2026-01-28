import Link from 'next/link';

export default function AccountDeletionPage() {
    return (
        <div className="min-h-screen bg-white flex flex-col">
            <header className="border-b border-gray-100 py-4 px-6">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <Link href="/" className="font-bold text-xl text-[#1B4332]">
                        DateWithDiet
                    </Link>
                </div>
            </header>

            <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Request Account Deletion</h1>

                <div className="prose prose-slate max-w-none">
                    <p className="text-lg text-gray-600 mb-8">
                        We value your privacy. If you wish to delete your DateWithDiet account and associated data, you can do so directly within our mobile application or by contacting support.
                    </p>

                    <div className="bg-gray-50 rounded-2xl p-8 mb-8 border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Option 1: Delete via Mobile App (Recommended)</h2>
                        <ol className="list-decimal list-inside space-y-3 text-gray-700 marker:font-bold marker:text-[#1B4332]">
                            <li>Open the DateWithDiet app on your device.</li>
                            <li>Log in to your account.</li>
                            <li>Tap on your Profile avatar in the top right corner of the dashboard.</li>
                            <li>Select <strong>"Delete Account"</strong> from the dropdown menu.</li>
                            <li>Confirm your choice in the dialog that appears.</li>
                        </ol>
                        <p className="mt-4 text-sm text-gray-500 bg-white p-3 rounded-lg border border-gray-200 inline-block">
                            <strong>Note:</strong> This action will immediately deactivate your account and you will be logged out.
                        </p>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Option 2: Manual Request</h2>
                        <p className="text-gray-700 mb-4">
                            If you cannot access the app, you may request account deletion by emailing our support team. Please use the email address associated with your account.
                        </p>
                        <p className="font-bold text-[#1B4332]">
                            datewithdiet.fit@gmail.com
                        </p>
                    </div>

                    <div className="mt-12 border-t border-gray-100 pt-8">
                        <h3 className="font-bold text-gray-900 mb-2">What happens to my data?</h3>
                        <p className="text-gray-600 text-sm">
                            Upon deletion, your account status is set to 'Deleted'. Your personal data (health logs, diet plans, etc.) will be retained for a limited period to allow for accidental deletion recovery, after which it may be permanently removed from our active databases. Dieticians retain the ability to recover accounts upon specific request.
                        </p>
                    </div>
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
