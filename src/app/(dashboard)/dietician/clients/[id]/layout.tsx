'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { ClientHeader } from '@/components/dietician/clients/ClientHeader';
import { ClientSidebar } from '@/components/dietician/clients/ClientSidebar';
import { ClientDataProvider, useClientData } from '@/context/ClientDataContext';
import { Loader2 } from 'lucide-react';

function LayoutContent({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const id = params.id as string;
    const { clientInfo, loading } = useClientData();

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    if (!clientInfo) {
        return (
            <div className="p-8 text-center text-slate-500">
                Client not found.
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
            {/* Top Premium Header - Fixed at top of client area */}
            <div className="p-4 bg-white border-b border-slate-200">
                <ClientHeader
                    clientInfo={clientInfo}
                    onClientInfoChange={() => { }}
                />
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Client Side Navigation */}
                <ClientSidebar clientId={id} />

                {/* Main Client Content */}
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default function ClientDetailLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const params = useParams();
    const id = params.id as string;

    return (
        <ClientDataProvider id={id}>
            <LayoutContent>{children}</LayoutContent>
        </ClientDataProvider>
    );
}
