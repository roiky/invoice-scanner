import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Calendar as CalendarIcon, Loader2, FileSpreadsheet, FileImage, FileText, ChevronDown } from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { getAnalytics } from '../api';
import { DateRangePicker } from './DateRangePicker';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

export function AnalyticsTab({ t, dir }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isExportOpen, setIsExportOpen] = useState(false);

    // Default to current year
    const [startDate, setStartDate] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-01-01`;
    });
    const [endDate, setEndDate] = useState(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });

    const chartsRef = useRef(null);
    const exportMenuRef = useRef(null);

    useEffect(() => {
        fetchAnalytics();
    }, [startDate, endDate]);

    useEffect(() => {
        // Close export menu on click outside
        function handleClickOutside(event) {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
                setIsExportOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    const fetchAnalytics = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getAnalytics(startDate, endDate);
            setData(result);
        } catch (err) {
            console.error("Failed to fetch analytics:", err);
            setError("Failed to load analytics data");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (format) => {
        setIsExportOpen(false);

        if (format === 'excel') {
            if (!data) return;
            const wb = XLSX.utils.book_new();

            // Monthly Sheet
            const wsMonthly = XLSX.utils.json_to_sheet(data.monthly_breakdown);
            XLSX.utils.book_append_sheet(wb, wsMonthly, "Monthly Expenses");

            // Categories Sheet
            const wsCategories = XLSX.utils.json_to_sheet(data.label_breakdown);
            XLSX.utils.book_append_sheet(wb, wsCategories, "Categories");

            // Summary Sheet
            const wsSummary = XLSX.utils.json_to_sheet([{
                "Total Amount": data.total_amount,
                "Total Invoices": data.total_count,
                "Start Date": startDate,
                "End Date": endDate
            }]);
            XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

            XLSX.writeFile(wb, `analytics_export_${startDate}_${endDate}.xlsx`);
            return;
        }

        if (!chartsRef.current) return;

        try {
            // Use html-to-image to capture the node
            // It supports modern CSS features better than html2canvas
            const dataUrl = await toPng(chartsRef.current, {
                cacheBust: true,
                backgroundColor: '#ffffff', // Force white background
                pixelRatio: 2, // Higher quality
                skipFonts: true, // Avoid font parsing errors
                style: {
                    color: '#000000', // Attempt to force black text if dark mode issues persist
                }
            });

            if (format === 'image') {
                const link = document.createElement('a');
                link.download = `analytics_report_${new Date().toISOString().slice(0, 10)}.png`;
                link.href = dataUrl;
                link.click();
            } else if (format === 'pdf') {
                const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();

                const imgProps = pdf.getImageProperties(dataUrl);
                const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

                if (imgHeight > pdfHeight) {
                    const scaledWidth = (imgProps.width * pdfHeight) / imgProps.height;
                    pdf.addImage(dataUrl, 'PNG', (pdfWidth - scaledWidth) / 2, 0, scaledWidth, pdfHeight);
                } else {
                    pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, imgHeight);
                }

                pdf.save(`analytics_report_${new Date().toISOString().slice(0, 10)}.pdf`);
            }
        } catch (err) {
            console.error("Export failed", err);
            alert("Failed to export charts: " + err.message);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-display">
                        {t('analytics.title') || "Analytics Dashboard"}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {t('analytics.subtitle') || "Overview of expenses and trends"}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <DateRangePicker
                        startDate={startDate}
                        endDate={endDate}
                        onChange={({ start, end }) => {
                            if (start) setStartDate(start);
                            if (end) setEndDate(end);
                        }}
                        t={t}
                        dir={dir}
                    />

                    {/* Export Dropdown */}
                    <div className="relative" ref={exportMenuRef}>
                        <button
                            onClick={() => setIsExportOpen(!isExportOpen)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm w-full justify-center sm:w-auto"
                        >
                            <Download size={16} />
                            {t('analytics.export_title') || "Export"}
                            <ChevronDown size={14} className={`transition-transform ${isExportOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isExportOpen && (
                            <div className={`absolute top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1 z-50 animate-in fade-in zoom-in-95 duration-200 ${dir === 'rtl' ? 'left-0' : 'right-0'}`}>
                                <button
                                    onClick={() => handleExport('image')}
                                    className="w-full px-4 py-2 text-start text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                                >
                                    <FileImage size={16} className="text-blue-500" />
                                    {t('analytics.export_png') || "Image (PNG)"}
                                </button>
                                <button
                                    onClick={() => handleExport('pdf')}
                                    className="w-full px-4 py-2 text-start text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                                >
                                    <FileText size={16} className="text-red-500" />
                                    {t('analytics.export_pdf') || "Report (PDF)"}
                                </button>
                                <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                                <button
                                    onClick={() => handleExport('excel')}
                                    className="w-full px-4 py-2 text-start text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                                >
                                    <FileSpreadsheet size={16} className="text-green-600" />
                                    {t('analytics.export_excel') || "Excel (XLSX)"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="animate-spin text-blue-600" size={48} />
                </div>
            ) : error ? (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-center">
                    {error}
                </div>
            ) : data ? (
                <div id="analytics-capture-area" ref={chartsRef} className="space-y-6 bg-slate-50 dark:bg-slate-950 p-2">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {t('analytics.total_expenses') || "Total Expenses"}
                            </h3>
                            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                                ₪{data.total_amount?.toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {t('analytics.total_invoices') || "Total Invoices"}
                            </h3>
                            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                                {data.total_count}
                            </p>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Monthly Bar Chart */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm h-[400px] flex flex-col">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">
                                {t('analytics.monthly_expenses') || "Monthly Expenses"}
                            </h3>
                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.monthly_breakdown} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                        <XAxis
                                            dataKey="month"
                                            stroke="#64748b"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            stroke="#64748b"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `₪${value}`}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#f1f5f9' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            formatter={(value) => [`₪${value}`, t('table.amount') || 'Amount']}
                                        />
                                        <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} name={t('table.amount') || 'Amount'} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Labels Pie Chart */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm h-[400px] flex flex-col">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">
                                {t('analytics.expenses_by_category') || "Expenses by Category"}
                            </h3>
                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data.label_breakdown}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                            nameKey="name"
                                        >
                                            {data.label_breakdown.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => [`₪${value}`, t('table.amount') || 'Amount']} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
