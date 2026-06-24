import { useState, useRef, useEffect } from 'react';
import { ClientInfo } from '@/types';
import { parseToLocalDate } from '@/lib/date-utils';
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
    Phone,
    User,
    Ruler,
    Scale,
    Activity,
    Hash,
    Sparkles
} from 'lucide-react';
import { DietPreferenceModal } from './DietPreferenceModal';

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

    const DetailItem = ({ label, value, icon: Icon, bgClass = 'bg-slate-50', textClass = 'text-slate-600' }: { label: string, value: string | number | undefined, icon?: any, bgClass?: string, textClass?: string }) => (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all shadow-sm shrink-0">
            {Icon && (
                <div className={`p-1.5 rounded-lg ${bgClass} ${textClass}`}>
                    <Icon size={12} />
                </div>
            )}
            <div className="flex flex-col">
                <span className="text-[8px] uppercase font-extrabold text-slate-400 tracking-wider leading-none mb-1">{label}</span>
                <span className="text-xs font-black text-slate-700 leading-none">{value || 'N/A'}</span>
            </div>
        </div>
    );

    const [isPreferenceModalOpen, setIsPreferenceModalOpen] = useState(false);

    return (
        <>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col">
                {/* Top Bar: Basic Info + Detailed Metrics */}
                <div className="p-4 flex items-center gap-6">
                    {/* Profile Summary */}
                    <div className="flex items-center gap-3 pr-6 border-r border-slate-200">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-lg border-2 border-white shadow-sm ring-1 ring-emerald-200 shrink-0">
                            {getInitials(clientInfo.name)}
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-lg font-bold text-slate-800 leading-tight">{clientInfo.name}</h2>
                            <span className="text-xs text-slate-400">{clientInfo.email}</span>
                        </div>
                    </div>

                    {/* Metrics Horizontal Scroll/Grid */}
                    <div className="flex-1 flex items-center gap-3 overflow-x-auto py-1.5 custom-scrollbar">
                        <DetailItem label="Id" value={clientInfo.id} icon={Hash} bgClass="bg-slate-100" textClass="text-slate-500" />
                        <DetailItem label="Age" value={clientInfo.age} icon={User} bgClass="bg-indigo-50" textClass="text-indigo-500" />
                        <DetailItem label="Gender" value={clientInfo.gender} icon={User} bgClass="bg-pink-50" textClass="text-pink-500" />
                        <DetailItem label="Height" value={clientInfo.height ? `${clientInfo.height}cm` : undefined} icon={Ruler} bgClass="bg-blue-50" textClass="text-blue-500" />
                        <DetailItem label="Weight" value={clientInfo.weight ? `${clientInfo.weight}kg` : undefined} icon={Scale} bgClass="bg-teal-50" textClass="text-teal-500" />
                        
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all shadow-sm shrink-0">
                            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-500">
                                <Activity size={12} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[8px] uppercase font-extrabold text-slate-400 tracking-wider leading-none mb-1">BMI</span>
                                <span className={`text-xs font-black leading-none ${clientInfo.height && clientInfo.weight ? 'text-emerald-600' : 'text-slate-400'}`}>
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

                        <DetailItem label="Phone" value={clientInfo.phone} icon={Phone} bgClass="bg-violet-50" textClass="text-violet-500" />

                        {/* Status badge with correct type-based styling */}
                        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all shadow-sm shrink-0">
                            <div className={`p-1.5 rounded-lg ${
                                clientInfo.status === 'PAUSED' ? 'bg-amber-100 text-amber-500' :
                                clientInfo.status === 'DELETED' ? 'bg-rose-100 text-rose-500' :
                                clientInfo.status === 'NEW' ? 'bg-blue-100 text-blue-500' :
                                'bg-emerald-100 text-emerald-500'
                            }`}>
                                <Sparkles size={12} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[8px] uppercase font-extrabold text-slate-400 tracking-wider leading-none mb-1">Status</span>
                                <span className={`text-xs font-black uppercase leading-none ${
                                    clientInfo.status === 'PAUSED' ? 'text-amber-700' :
                                    clientInfo.status === 'DELETED' ? 'text-rose-700' :
                                    clientInfo.status === 'NEW' ? 'text-blue-700' :
                                    'text-emerald-700'
                                }`}>
                                    {clientInfo.status || 'ACTIVE'}
                                </span>
                                {clientInfo.status === 'PAUSED' && clientInfo.pausedUntil && (
                                    <span className="text-[8px] font-bold text-amber-500 mt-0.5">
                                        Until {parseToLocalDate(clientInfo.pausedUntil).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sub Bar: Filters / Info */}
                <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-400">Diet Persona:</span>
                            <button
                                onClick={() => setIsPreferenceModalOpen(true)}
                                className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200 transition-colors flex items-center gap-1.5"
                            >
                                {clientInfo.preferences || 'Not Set'}
                                <ChevronDown size={12} strokeWidth={3} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <DietPreferenceModal
                isOpen={isPreferenceModalOpen}
                onClose={() => setIsPreferenceModalOpen(false)}
                clientInfo={clientInfo}
                onUpdate={(newPref: string) => {

                    onClientInfoChange({ ...clientInfo, preferences: newPref });
                }}
            />
        </>
    );
};
