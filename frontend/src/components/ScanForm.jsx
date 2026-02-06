import React, { useState } from 'react';
import { Search, Calendar, ArrowRight } from 'lucide-react';
import { DateInput } from './DateInput';

export function ScanForm({ onScan, isLoading, startDate, endDate, setStartDate, setEndDate, t = (s) => s }) {

    const handleSubmit = (e) => {
        onScan(e);
    };

    return (
        <div className="bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Search className="opacity-80" size={20} />
                    {t('scan.title')}
                </h3>
                <p className="text-blue-100 text-sm mt-1">{t('scan.subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col md:flex-row gap-6 items-end">
                <div className="flex-1 space-y-1.5 w-full">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar size={14} /> {t('scan.start_date')}
                    </label>
                    <DateInput
                        value={startDate}
                        onChange={setStartDate}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-medium text-slate-700"
                        required
                    />
                </div>

                <div className="hidden md:flex pb-3 text-slate-300 transform rtl:rotate-180">
                    <ArrowRight size={24} />
                </div>

                <div className="flex-1 space-y-1.5 w-full">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar size={14} /> {t('scan.end_date')}
                    </label>
                    <DateInput
                        value={endDate}
                        onChange={setEndDate}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-medium text-slate-700"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white px-8 py-2.5 rounded-lg font-semibold shadow-lg shadow-slate-900/20 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            <span>{t('scan.scanning')}</span>
                        </>
                    ) : (
                        <>
                            {t('scan.button')}
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
