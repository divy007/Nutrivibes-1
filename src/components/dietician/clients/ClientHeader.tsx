import { useState, useRef, useEffect } from 'react';
import { ClientInfo } from '@/types';
import {
    Download,
    ChevronDown,
    FileText,
    FileSpreadsheet,
    Pencil,
    Plus,
    Clock,
    Trash2,
    ExternalLink,
    Phone
} from 'lucide-react';

interface ClientHeaderProps {
    clientInfo: ClientInfo;
    onClientInfoChange: (info: ClientInfo) => void;
}

export const ClientHeader: React.FC<ClientHeaderProps> = ({
    clientInfo,
    onClientInfoChange
}) => {

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase() || 'CLI';
    };

    const DetailItem = ({ label, value, icon: Icon, editable = true }: { label: string, value: string | number | undefined, icon?: any, editable?: boolean }) => (
        <div className="flex flex-col px-4 border-r border-slate-200 last:border-r-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">{label}</span>
            <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-700">{value || 'N/A'}</span>
                {editable && (
                    <button className="text-orange-500 hover:text-orange-600">
                        <Pencil size={12} strokeWidth={3} />
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col">
            {/* Top Bar: Basic Info + Detailed Metrics */}
            <div className="p-4 flex items-center gap-6">
                {/* Profile Summary */}
                <div className="flex items-center gap-3 pr-6 border-r border-slate-200">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg border-2 border-white shadow-sm ring-1 ring-orange-200 shrink-0">
                        {getInitials(clientInfo.name)}
                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-lg font-bold text-slate-800 leading-tight">{clientInfo.name}</h2>
                        <span className="text-xs text-slate-400">{clientInfo.email}</span>
                    </div>
                </div>

                {/* Metrics Horizontal Scroll/Grid */}
                <div className="flex-1 flex items-center overflow-x-auto py-1 custom-scrollbar">
                    <DetailItem label="Id" value={clientInfo.id} editable={false} />
                    <DetailItem label="Age" value={clientInfo.age} />
                    <DetailItem label="Gender" value={clientInfo.gender} />
                    <DetailItem label="Height" value={clientInfo.height ? `${clientInfo.height}cm` : undefined} />
                    <DetailItem label="Weight" value={clientInfo.weight ? `${clientInfo.weight}kg` : undefined} />
                    <div className="flex flex-col px-4 border-r border-slate-200 last:border-r-0">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">BMI</span>
                        <div className="flex items-center gap-1.5">
                            <span className={`text-sm font-bold ${clientInfo.height && clientInfo.weight ? 'text-orange-600' : 'text-slate-400'}`}>
                                {(() => {
                                    if (clientInfo.height && clientInfo.weight) {
                                        const h = clientInfo.height / 100;
                                        return (clientInfo.weight / (h * h)).toFixed(1);
                                    }
                                    return 'N/A';
                                })()}
                            </span>
                        </div>
                    </div>
                    <DetailItem label="Phone" value={clientInfo.phone} />

                    <div className="flex flex-col px-4 border-r border-slate-200 last:border-r-0">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Status</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase self-start">
                            {clientInfo.status || 'ACTIVE'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Sub Bar: Filters / Info */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-400">Diet Preference:</span>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">
                            {clientInfo.preferences}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
