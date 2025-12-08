import { useState, useRef, useEffect } from 'react';
import { ClientInfo } from '../types';
import { Download, ChevronDown, FileText, FileSpreadsheet } from 'lucide-react';

interface ClientHeaderProps {
    clientInfo: ClientInfo;
    onClientInfoChange: (info: ClientInfo) => void;
    onExportPDF: () => void;
    onExportExcel: () => void;
}

const PREFERENCE_OPTIONS = [
    "Vegetarian",
    "Non-Vegetarian",
    "Eggetarian",
    "Vegan",
    "Mixed: Veg & Non-Veg",
    "Other"
];

export const ClientHeader: React.FC<ClientHeaderProps> = ({
    clientInfo,
    onClientInfoChange,
    onExportPDF,
    onExportExcel
}) => {
    const [isExportOpen, setIsExportOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsExportOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleChange = (field: keyof ClientInfo, value: string) => {
        onClientInfoChange({
            ...clientInfo,
            [field]: value
        });
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase() || 'CLI';
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">

                {/* Profile Section */}
                <div className="flex items-start gap-5 flex-1 w-full max-w-2xl">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-full bg-[#e9edc9] flex items-center justify-center text-[#1b4332] font-bold text-xl border-4 border-white shadow-sm ring-1 ring-[#ccd5ae] shrink-0">
                        {getInitials(clientInfo.name)}
                    </div>

                    <div className="flex flex-col gap-3 flex-1">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Client Name</label>
                            <input
                                type="text"
                                value={clientInfo.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                className="text-2xl font-bold text-slate-800 border-b border-transparent hover:border-slate-300 focus:border-[#2d6a4f] focus:outline-none bg-transparent transition-colors w-full placeholder-slate-300"
                                placeholder="Enter Client Name"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Preferences</label>
                            <div className="relative">
                                <select
                                    value={clientInfo.preferences}
                                    onChange={(e) => handleChange('preferences', e.target.value)}
                                    className="text-sm text-slate-600 border-b border-transparent hover:border-slate-300 focus:border-[#2d6a4f] focus:outline-none bg-transparent transition-colors w-full placeholder-slate-300 appearance-none cursor-pointer py-1"
                                >
                                    <option value="" disabled>Select dietary preference</option>
                                    {PREFERENCE_OPTIONS.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions Section */}
                <div className="flex flex-wrap items-center gap-3">


                    {/* Export Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsExportOpen(!isExportOpen)}
                            className="px-4 py-2 text-sm font-medium text-[#1b4332] bg-[#e9edc9] border border-[#ccd5ae] rounded-lg hover:bg-[#d4e09b] transition-colors flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Export
                            <ChevronDown className="w-4 h-4" />
                        </button>

                        {isExportOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-100 py-1 z-20 animate-in fade-in zoom-in-95 duration-150">
                                <button
                                    onClick={() => { onExportPDF(); setIsExportOpen(false); }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                    <FileText className="w-4 h-4 text-red-500" />
                                    Export to PDF
                                </button>
                                <button
                                    onClick={() => { onExportExcel(); setIsExportOpen(false); }}
                                    className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                    <FileSpreadsheet className="w-4 h-4 text-green-600" />
                                    Export to Excel
                                </button>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
