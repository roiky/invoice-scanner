import React, { useState } from 'react';
import { Search, Calendar, ArrowRight } from 'lucide-react';
import { DateRangePicker, isValidDateRange } from './DateRangePicker';

export function ScanForm({ onScan, isLoading, startDate, endDate, setStartDate, setEndDate, t = (s) => s, dir = 'ltr' }) {

    const handleSubmit = (e) => {
        onScan(e);
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] dark:shadow-slate-950/50 border border-slate-100 dark:border-slate-800">
            <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white pb-6 pt-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Search className="opacity-80" size={20} />
                    {t('scan.title')}
                </h3>
                <p className="text-blue-100 text-sm mt-1">{t('scan.subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col md:flex-row gap-6 items-end">
                <div className="flex-1 w-full">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                        <Calendar size={14} /> {t('scan.date_range') || "Date Range"}
                    </label>
                    <DateRangePicker
                        startDate={startDate}
                        endDate={endDate}
                        onChange={(range) => {
                            setStartDate(range.start);
                            setEndDate(range.end);
                        }}
                        className="w-full"
                        t={t}
                        dir={dir}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading || !isValidDateRange(startDate, endDate)}
                    className="w-full md:w-auto bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white px-8 py-2.5 rounded-lg font-semibold shadow-lg shadow-slate-900/20 dark:shadow-blue-900/20 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2 h-[42px]"
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
        </div >
    );
}
