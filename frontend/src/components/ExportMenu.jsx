import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, Archive, FileSpreadsheet, ChevronDown, Loader2 } from 'lucide-react';

export function ExportMenu({ onExportPDF, onExportZIP, onExportCSV, disabled }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAction = async (action) => {
        if (loading) return;
        setIsOpen(false);
        setLoading(true);
        try {
            await action();
        } catch (error) {
            console.error("Export failed:", error);
            alert("Export failed. See console for details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled || loading}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 dark:bg-blue-600 text-white rounded-md hover:bg-slate-900 dark:hover:bg-blue-700 text-sm font-medium whitespace-nowrap transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                Export
                <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <button
                        onClick={() => handleAction(onExportCSV)}
                        className="w-full px-4 py-2 text-sm text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                        <FileSpreadsheet size={16} className="text-green-600 dark:text-green-400" />
                        <span>Export as CSV</span>
                    </button>
                    <button
                        onClick={() => handleAction(onExportPDF)}
                        className="w-full px-4 py-2 text-sm text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                        <FileText size={16} className="text-red-500 dark:text-red-400" />
                        <span>Export Report (PDF)</span>
                    </button>
                    <button
                        onClick={() => handleAction(onExportZIP)}
                        className="w-full px-4 py-2 text-sm text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 border-t border-slate-100 dark:border-slate-700/50 mt-1 pt-2"
                    >
                        <Archive size={16} className="text-amber-500 dark:text-amber-400" />
                        <span>Export All (ZIP)</span>
                    </button>
                </div>
            )}
        </div>
    );
}
