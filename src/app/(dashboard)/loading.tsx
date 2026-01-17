
import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
    return (
        <div className="flex h-full w-full items-center justify-center min-h-[50vh]">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
                <p className="text-slate-500 font-medium animate-pulse">Loading...</p>
            </div>
        </div>
    );
}
