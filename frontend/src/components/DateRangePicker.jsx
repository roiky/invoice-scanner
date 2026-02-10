
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears, isValid, parse, isAfter, isBefore } from 'date-fns';
import { Calendar as CalendarIcon, X, ChevronDown, Check } from 'lucide-react';
import 'react-day-picker/style.css';

export function DateRangePicker({
    startDate,
    endDate,
    onChange,
    className = "",
    align = "left",
    t,
    dir = 'ltr'
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [month, setMonth] = useState(() => {
        if (startDate && isValid(new Date(startDate))) {
            return new Date(startDate);
        }
        return new Date();
    });

    // Internal state for manual inputs to allow typing freely
    const [startInput, setStartInput] = useState("");
    const [endInput, setEndInput] = useState("");

    const containerRef = useRef(null);

    // Sync props to internal inputs when props change (and not typing)
    useEffect(() => {
        if (startDate) {
            const date = new Date(startDate);
            if (isValid(date)) setStartInput(format(date, 'dd/MM/yyyy'));
        } else {
            setStartInput("");
        }

        if (endDate) {
            const date = new Date(endDate);
            if (isValid(date)) setEndInput(format(date, 'dd/MM/yyyy'));
        } else {
            setEndInput("");
        }
    }, [startDate, endDate, isOpen]);

    // Handle clicks outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);

    const handleDaySelect = (range) => {
        if (!range) {
            // If cleared?
            onChange({ start: null, end: null });
            return;
        }

        let { from, to } = range;

        // If same day clicked twice or range is just one day
        if (!to && from) to = from;

        if (from && to) {
            onChange({
                start: format(from, 'yyyy-MM-dd'),
                end: format(to, 'yyyy-MM-dd')
            });
        } else if (from) {
            onChange({
                start: format(from, 'yyyy-MM-dd'),
                end: null
            });
        }
    };

    const handleManualInputChange = (type, value) => {
        // Update input display
        if (type === 'start') setStartInput(value);
        else setEndInput(value);

        // Validate and update if valid format
        // validation regex: DD/MM/YYYY
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
            const parsedDate = parse(value, 'dd/MM/yyyy', new Date());
            if (isValid(parsedDate)) {
                const isoDate = format(parsedDate, 'yyyy-MM-dd');

                if (type === 'start') {
                    onChange({ start: isoDate, end: endDate });
                    setMonth(parsedDate); // Jump calendar to date
                } else {
                    onChange({ start: startDate, end: isoDate });
                }
            }
        } else if (value === "") {
            if (type === 'start') onChange({ start: null, end: endDate });
            else onChange({ start: startDate, end: null });
        }
    };

    const applyShortcut = (shortcut) => {
        const now = new Date();
        let start, end;

        switch (shortcut) {
            case 'thisMonth':
                start = startOfMonth(now);
                end = endOfMonth(now);
                break;
            case 'lastMonth':
                const lastMonth = subMonths(now, 1);
                start = startOfMonth(lastMonth);
                end = endOfMonth(lastMonth);
                break;
            case 'thisYear':
                start = startOfYear(now);
                end = endOfYear(now);
                break;
            case 'lastYear':
                const lastYear = subYears(now, 1);
                start = startOfYear(lastYear);
                end = endOfYear(lastYear);
                break;
            default:
                return;
        }

        onChange({
            start: format(start, 'yyyy-MM-dd'),
            end: format(end, 'yyyy-MM-dd')
        });
        setMonth(start);
    };

    // Prepare range for DayPicker
    const selectedRange = {
        from: startDate && isValid(new Date(startDate)) ? new Date(startDate) : undefined,
        to: endDate && isValid(new Date(endDate)) ? new Date(endDate) : undefined
    };

    const displayText = useMemo(() => {
        if (!startDate && !endDate) return t ? (t('scan.date_range') || "Select date range") : "Select date range";

        const startStr = startDate ? format(new Date(startDate), 'dd/MM/yyyy') : '...';
        const endStr = endDate ? format(new Date(endDate), 'dd/MM/yyyy') : '...';

        return `${startStr} - ${endStr}`;
    }, [startDate, endDate, t]);

    return (
        <div className={`relative ${className}`} ref={containerRef} dir={dir}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-all w-full md:w-auto justify-between md:justify-start ${isOpen ? 'ring-2 ring-blue-500/10 border-blue-500' : ''}`}
            >
                <div className="flex items-center gap-2 text-slate-700 text-sm">
                    <CalendarIcon size={16} className="text-slate-400" />
                    <span className="font-medium">{displayText}</span>
                </div>
                <div className="flex items-center gap-1">
                    {(startDate || endDate) && (
                        <div
                            role="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange({ start: null, end: null });
                            }}
                            className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-red-500 transition-colors"
                            title={t ? t('scan.clear_selection') : 'Clear Selection'}
                        >
                            <X size={14} />
                        </div>
                    )}
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {isOpen && (
                <div className={`absolute top-full mt-2 z-50 bg-white rounded-xl shadow-xl border border-slate-100 p-3 w-[340px] sm:w-[580px] animate-in fade-in zoom-in-95 duration-200 ${align === 'right' ? 'right-0' : (dir === 'rtl' ? 'right-0' : 'left-0')}`}>
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Sidebar / Shortcuts */}
                        <div className="w-full sm:w-36 flex flex-col gap-1.5 shrink-0">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t ? t('scan.quick_select') : 'Quick Select'}</div>
                            <button type="button" onClick={() => applyShortcut('thisMonth')} className="text-left px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-md transition-colors flex items-center justify-between group">
                                {t ? t('scan.shortcuts.this_month') : 'This Month'}
                            </button>
                            <button type="button" onClick={() => applyShortcut('lastMonth')} className="text-left px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-md transition-colors">
                                {t ? t('scan.shortcuts.last_month') : 'Last Month'}
                            </button>
                            <button type="button" onClick={() => applyShortcut('thisYear')} className="text-left px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-md transition-colors">
                                {t ? t('scan.shortcuts.this_year') : 'This Year'}
                            </button>
                            <button type="button" onClick={() => applyShortcut('lastYear')} className="text-left px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-md transition-colors">
                                {t ? t('scan.shortcuts.last_year') : 'Last Year'}
                            </button>

                            <div className="h-px bg-slate-100 my-1"></div>

                            <div className="space-y-2">
                                <div className="space-y-0.5">
                                    <label className="text-[10px] font-semibold text-slate-500">{t ? t('scan.start_date') : 'Start Date'}</label>
                                    <input
                                        type="text"
                                        placeholder="DD/MM/YYYY"
                                        value={startInput}
                                        onChange={(e) => handleManualInputChange('start', e.target.value)}
                                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-0.5">
                                    <label className="text-[10px] font-semibold text-slate-500">{t ? t('scan.end_date') : 'End Date'}</label>
                                    <input
                                        type="text"
                                        placeholder="DD/MM/YYYY"
                                        value={endInput}
                                        onChange={(e) => handleManualInputChange('end', e.target.value)}
                                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Calendar */}
                        <div className={`flex-1 border-slate-50 pt-2 sm:pt-0 ${dir === 'rtl' ? 'sm:border-r sm:pr-4' : 'sm:border-l sm:pl-4'}`}>
                            <DayPicker
                                mode="range"
                                selected={selectedRange}
                                onSelect={handleDaySelect}
                                month={month}
                                onMonthChange={setMonth}
                                showOutsideDays
                                dir={dir}
                                className="border-0 p-0 m-0"
                                styles={{
                                    day: { width: '32px', height: '32px', fontSize: '0.8rem' },
                                    caption: { fontSize: '0.9rem', marginBottom: '0.5rem' },
                                    head_cell: { width: '32px', fontSize: '0.75rem' }
                                }}
                                classNames={{
                                    selected: "bg-blue-50 text-slate-900 font-semibold hover:bg-blue-100 hover:text-slate-900",
                                    range_start: dir === 'rtl' ? "rounded-r-lg !bg-blue-600 !text-white hover:!bg-blue-700 hover:!text-white" : "rounded-l-lg !bg-blue-600 !text-white hover:!bg-blue-700 hover:!text-white",
                                    range_end: dir === 'rtl' ? "rounded-l-lg !bg-blue-600 !text-white hover:!bg-blue-700 hover:!text-white" : "rounded-r-lg !bg-blue-600 !text-white hover:!bg-blue-700 hover:!text-white",
                                    today: "font-bold text-blue-600",
                                    months: "justify-center",
                                }}
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-50">
                        <button
                            onClick={() => onChange({ start: null, end: null })}
                            className="text-xs text-slate-400 hover:text-red-500 transition-colors font-medium"
                        >
                            {t ? t('scan.clear_selection') : 'Clear Selection'}
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm"
                        >
                            {t ? t('scan.done') : 'Done'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper to check if dates are valid range for "Scan Now" button logic elsewhere
export const isValidDateRange = (start, end) => {
    if (!start || !end) return false;
    const s = new Date(start);
    const e = new Date(end);
    return isValid(s) && isValid(e) && !isBefore(e, s);
};
