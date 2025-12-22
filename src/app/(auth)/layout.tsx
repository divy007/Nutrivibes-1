import { ReactNode } from 'react';

interface AuthLayoutProps {
    children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#1b4332] to-[#ccd5ae] p-4">
            <div className="w-full max-w-md">
                {children}
            </div>
        </div>
    );
}
