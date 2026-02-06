import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { DateInput } from './DateInput';

export function ScanForm({ onScan, isLoading, startDate, endDate, setStartDate, setEndDate }) {

    const handleSubmit = (e) => {
        e.preventDefault();
        onScan(startDate, endDate);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                <DateInput
                    value={startDate}
                    onChange={setStartDate}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                />
            </div>
            <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                <DateInput
                    value={endDate}
                    onChange={setEndDate}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                />
            </div>
            <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {isLoading ? (
                    <span>Scanning...</span>
                ) : (
                    <>
                        <Search size={18} />
                        Scan Invoices
                    </>
                )}
            </button>
        </form>
    );
}
