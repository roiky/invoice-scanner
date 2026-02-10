import React, { useState, useMemo } from 'react';
import { FileText, CheckCircle, AlertCircle, TriangleAlert, Download, Search, XCircle, Edit2, Trash2, Check, X, ArrowUp, ArrowDown, ArrowUpDown, Calendar, Tag, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import { updateInvoice, deleteInvoice, uploadInvoiceFile } from '../api';
import { DateInput } from './DateInput';
import { DateRangePicker } from './DateRangePicker';
import { getLabelColor } from '../utils/colors';

export function InvoiceTable({ invoices, availableLabels = [], onUpdateInvoice, onDeleteInvoice, onBulkDelete, onBulkStatusChange, onBulkAddLabel, t = (s) => s, dir = 'ltr' }) {
    const [filterText, setFilterText] = useState("");
    const [filterStatus, setFilterStatus] = useState([]); // Array of strings
    const [filterLabel, setFilterLabel] = useState([]); // Array of strings
    const [dateRange, setDateRange] = useState({ start: "", end: "" });

    // Sorting State
    const [sortConfig, setSortConfig] = useState({ key: 'invoice_date', direction: 'desc' });

    // Selection State
    const [selectedIds, setSelectedIds] = useState(new Set());

    // Editing State
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    // Bulk Label State
    const [isBulkLabelOpen, setIsBulkLabelOpen] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    // Filter Logic
    const filteredInvoices = useMemo(() => {
        if (!invoices) return [];
        let result = invoices.filter(inv => {
            const matchesText =
                (inv.vendor_name?.toLowerCase() || "").includes(filterText.toLowerCase()) ||
                (inv.subject?.toLowerCase() || "").includes(filterText.toLowerCase());

            const matchesStatus =
                filterStatus.length === 0 ? true :
                    filterStatus.map(s => s.toLowerCase()).includes(inv.status.toLowerCase());

            const matchesLabel =
                filterLabel.length === 0 ? true :
                    (inv.labels && inv.labels.some(l => filterLabel.includes(l)));

            // Date Range Filter
            let matchesDate = true;
            if (dateRange.start) {
                matchesDate = matchesDate && (inv.invoice_date >= dateRange.start);
            }
            if (dateRange.end) {
                matchesDate = matchesDate && (inv.invoice_date <= dateRange.end);
            }

            return matchesText && matchesStatus && matchesLabel && matchesDate;
        });

        // Sorting Logic
        if (sortConfig.key) {
            result.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Handle nulls
                if (aValue === null || aValue === undefined) aValue = "";
                if (bValue === null || bValue === undefined) bValue = "";

                // Special handling for numeric
                if (sortConfig.key === 'total_amount' || sortConfig.key === 'vat_amount') {
                    aValue = Number(aValue || 0);
                    bValue = Number(bValue || 0);
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [invoices, filterText, filterStatus, filterLabel, dateRange, sortConfig]);

    // Reset pagination when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [filterText, filterStatus, filterLabel, dateRange]);


    // Handlers
    const handleSort = (key) => {
        setSortConfig(current => {
            if (current.key === key) {
                return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'asc' };
        });
    };

    const toggleSelection = (id) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredInvoices.length && filteredInvoices.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredInvoices.map(inv => inv.id)));
        }
    };

    // Bulk Actions
    const handleBulkDelete = async () => {
        if (onBulkDelete) {
            onBulkDelete(Array.from(selectedIds));
            setSelectedIds(new Set());
            return;
        }
    };

    const handleBulkStatusChange = async (newStatus) => {
        if (onBulkStatusChange) {
            onBulkStatusChange(Array.from(selectedIds), newStatus);
            // setSelectedIds(new Set()); // Keep selection active as per user request
        }
    };

    // Actions (Single)
    const startEdit = (inv) => {
        setEditingId(inv.id);
        setEditForm({
            vendor_name: inv.vendor_name,
            invoice_date: inv.invoice_date,
            total_amount: inv.total_amount,
            vat_amount: inv.vat_amount,
            currency: inv.currency,
            status: inv.status,
            status: inv.status,
            labels: inv.labels || [],
            comments: inv.comments || ""
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const saveEdit = async (inv) => {
        let updatedInv = { ...inv, ...editForm };

        // Handle File Upload if present
        if (editForm.file) {
            try {
                const uploadResult = await uploadInvoiceFile(inv.id, editForm.file);
                // Update the invoice data with the new url/filename from the upload result
                updatedInv = { ...updatedInv, ...uploadResult };
                // Also clear the file from the form so it doesn't get sent to updateInvoice (though it would be ignored)
                delete updatedInv.file;
            } catch (e) {
                console.error("Failed to upload file:", e);
                alert("Failed to upload file");
                return; // Stop saving if upload fails
            }
        }

        if (onUpdateInvoice) await onUpdateInvoice(updatedInv);
        setEditingId(null);
    };

    const handleDelete = async (inv) => {
        if (onDeleteInvoice) onDeleteInvoice(inv.id);
    };

    // CSV Export Logic
    const downloadCSV = () => {
        if (!filteredInvoices.length) return;

        const headers = ["ID", "Date", "Vendor", "Subject", "Amount", "Currency", "VAT", "Status", "Labels", "Comments"];

        const escapeCSV = (str) => {
            if (str === null || str === undefined) return '';
            const stringValue = String(str);
            // Replace newlines with space to avoid breaking rows
            const sanitized = stringValue.replace(/\n/g, ' ').replace(/\r/g, ' ');
            // Escape double quotes by doubling them
            return `"${sanitized.replace(/"/g, '""')}"`;
        };

        const csvRows = [headers.join(",")];

        for (const inv of filteredInvoices) {
            const row = [
                inv.id,
                inv.invoice_date,
                escapeCSV(inv.vendor_name),
                escapeCSV(inv.subject),
                inv.total_amount,
                inv.currency,
                inv.vat_amount,
                inv.status,
                escapeCSV((inv.labels || []).join(', ')),
                escapeCSV(inv.comments)
            ];
            csvRows.push(row.join(","));
        }

        // Use CRLF for Excel compatibility
        const csvString = csvRows.join("\r\n");
        // Add BOM for Excel UTF-8 recognition
        const blob = new Blob(["\uFEFF" + csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "invoices_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!invoices || invoices.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                <FileText size={48} className="mx-auto mb-3 opacity-20" />
                <p>{t('table.no_invoices')}</p>
            </div>
        );
    }

    const SortIcon = ({ column }) => {
        if (sortConfig.key !== column) return <ArrowUpDown size={14} className="opacity-20 mx-1 inline" />;
        return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="mx-1 inline" /> : <ArrowDown size={14} className="mx-1 inline" />;
    };

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] space-y-4">
                {/* Top Row: General Filters */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="flex items-center gap-2 w-full sm:w-auto relative group">
                        <Search size={18} className="absolute inset-inline-start-3 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                        <input
                            type="text"
                            placeholder={t('filters.search_placeholder')}
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            className="ps-10 pe-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none w-full sm:w-72 text-sm font-medium text-slate-700 dark:text-slate-200 placeholder:font-normal"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
                        {/* Status Multi-Select */}
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                            {['Processed', 'Pending', 'Warning', 'Cancelled'].map(status => {
                                const isSelected = filterStatus.includes(status);
                                return (
                                    <button
                                        key={status}
                                        onClick={() => {
                                            if (isSelected) setFilterStatus(prev => prev.filter(s => s !== status));
                                            else setFilterStatus(prev => [...prev, status]);
                                        }}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${isSelected
                                            ? (status === 'Processed' ? 'bg-white dark:bg-slate-700 text-green-700 dark:text-green-400 shadow-sm ring-1 ring-green-200 dark:ring-green-900/50' :
                                                status === 'Pending' ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-400 shadow-sm ring-1 ring-amber-200 dark:ring-amber-900/50' :
                                                    status === 'Warning' ? 'bg-white dark:bg-slate-700 text-orange-700 dark:text-orange-400 shadow-sm ring-1 ring-orange-200 dark:ring-orange-900/50' :
                                                        'bg-white dark:bg-slate-700 text-red-700 dark:text-red-400 shadow-sm ring-1 ring-red-200 dark:ring-red-900/50')
                                            : (status === 'Processed' ? 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-green-700 dark:hover:text-green-400 hover:shadow-sm hover:ring-1 hover:ring-green-200 dark:hover:ring-green-900/50' :
                                                status === 'Pending' ? 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-amber-700 dark:hover:text-amber-400 hover:shadow-sm hover:ring-1 hover:ring-amber-200 dark:hover:ring-amber-900/50' :
                                                    status === 'Warning' ? 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-orange-700 dark:hover:text-orange-400 hover:shadow-sm hover:ring-1 hover:ring-orange-200 dark:hover:ring-orange-900/50' :
                                                        'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-red-700 dark:hover:text-red-400 hover:shadow-sm hover:ring-1 hover:ring-red-200 dark:hover:ring-red-900/50')
                                            }`}
                                    >
                                        {t(`status.${status.toLowerCase()}`)}
                                    </button>
                                );
                            })}
                            {filterStatus.length > 0 && (
                                <button
                                    onClick={() => setFilterStatus([])}
                                    className="px-2 py-1.5 text-xs text-slate-400 hover:text-slate-600 border-l border-slate-200 ml-1 pl-2"
                                    title="Clear Status Filter"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>

                        {/* Labels Multi-select Dropdown */}
                        <div className="relative group">
                            <div className="flex items-center gap-1">
                                <button className={`flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium transition-all ${filterLabel.length > 0 ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                                    <span>{filterLabel.length === 0 ? t('filters.all_labels') : `${filterLabel.length} ${t('table.labels')}`}</span>
                                    <ArrowDown size={14} className="opacity-50" />
                                </button>
                                {filterLabel.length > 0 && (
                                    <button
                                        onClick={() => setFilterLabel([])}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title={t('actions.clear_filters')}
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            {/* Dropdown with padding-top to bridge the gap */}
                            <div className="absolute top-full inset-inline-start-0 pt-2 hidden group-hover:block z-20 w-48">
                                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-2">
                                    {availableLabels.length === 0 ? (
                                        <p className="text-xs text-slate-400 p-2 text-center">No labels available</p>
                                    ) : (
                                        availableLabels.map(l => {
                                            const color = getLabelColor(l);
                                            return (
                                                <label key={l} className="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={filterLabel.includes(l)}
                                                        onChange={() => {
                                                            if (filterLabel.includes(l)) setFilterLabel(prev => prev.filter(x => x !== l));
                                                            else setFilterLabel(prev => [...prev, l]);
                                                        }}
                                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                                                    />
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${color.bg} ${color.text} ${color.border}`}>
                                                        {l}
                                                    </span>
                                                </label>
                                            );
                                        })
                                    )}
                                    {filterLabel.length > 0 && (
                                        <button
                                            onClick={() => setFilterLabel([])}
                                            className="w-full text-center text-xs text-red-500 font-medium p-2 border-t border-slate-50 mt-1 hover:bg-red-50 rounded"
                                        >
                                            Clear Filter
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Export CSV Button - Moved outside of Labels group */}
                        <button
                            onClick={downloadCSV}
                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg active:scale-95 ml-auto sm:ml-0 text-sm"
                        >
                            <Download size={16} />
                            {t('history.export_csv')}
                        </button>
                    </div>
                </div>

                {/* Bottom Row: Date Filter & Bulk Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-3 w-full sm:w-auto pb-1 sm:pb-0">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
                            <Calendar size={14} /> {t('table.date')}:
                        </span>
                        <DateRangePicker
                            startDate={dateRange.start}
                            endDate={dateRange.end}
                            onChange={(range) => setDateRange({ start: range.start, end: range.end })}
                            className="w-full sm:w-72"
                            t={t}
                            dir={dir}
                        />


                    </div>
                </div>
            </div>

            {/* Sticky Bulk Actions Toolbar */}
            {selectedIds.size > 0 && (
                <div className="sticky top-24 z-40 animate-in fade-in slide-in-from-top-2 duration-300 flex justify-end">
                    <div className="bg-blue-50/95 backdrop-blur-md px-3 py-2 rounded-xl border border-blue-100 shadow-xl flex items-center gap-3 w-auto mx-4 sm:mx-0">
                        <div className="flex items-center gap-3">
                            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[1.5rem] flex items-center justify-center shadow-sm">
                                {selectedIds.size}
                            </span>
                            <span className="text-sm font-bold text-blue-900 whitespace-nowrap">
                                {t('actions.selected')}
                            </span>

                            {/* Clear Selection X Button - Moved here */}
                            <button
                                onClick={() => setSelectedIds(new Set())}
                                className="h-6 w-6 flex items-center justify-center text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-all ml-1"
                                title="Clear Selection"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Add Label Bulk Action */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsBulkLabelOpen(!isBulkLabelOpen)}
                                    className="h-8 px-3 text-xs font-medium bg-white text-blue-700 border border-blue-200 hover:border-blue-300 hover:text-blue-800 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                                >
                                    <Tag size={12} />
                                    {t('actions.add_label')}
                                </button>
                                {isBulkLabelOpen && (
                                    <div className="absolute top-full mt-2 left-0 bg-white rounded-xl shadow-xl border border-slate-100 p-2 w-56 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Select Label to Add</div>
                                        {availableLabels.length === 0 ? (
                                            <p className="text-xs text-slate-400 p-2 text-center">No labels available</p>
                                        ) : (
                                            <div className="max-h-48 overflow-y-auto space-y-1">
                                                {availableLabels.map(l => {
                                                    const color = getLabelColor(l);
                                                    return (
                                                        <button
                                                            key={l}
                                                            onClick={() => {
                                                                if (onBulkAddLabel) onBulkAddLabel(Array.from(selectedIds), l);
                                                                setIsBulkLabelOpen(false);
                                                            }}
                                                            className="w-full text-start px-2 py-1.5 hover:bg-slate-50 rounded-lg group transition-colors"
                                                        >
                                                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${color.bg} ${color.text} ${color.border} group-hover:shadow-sm`}>
                                                                {l}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="w-px h-4 bg-blue-200 mx-1"></div>

                            <button onClick={() => handleBulkStatusChange("Processed")} className="h-8 px-3 text-xs font-medium bg-white text-green-700 border border-green-200 hover:bg-green-600 hover:text-white hover:border-green-600 rounded-lg shadow-sm transition-all">{t('actions.mark_processed')}</button>
                            <button onClick={() => handleBulkStatusChange("Pending")} className="h-8 px-3 text-xs font-medium bg-white text-amber-700 border border-amber-200 hover:bg-amber-600 hover:text-white hover:border-amber-600 rounded-lg shadow-sm transition-all">{t('actions.mark_pending')}</button>
                            <button onClick={() => handleBulkStatusChange("Warning")} className="h-8 px-3 text-xs font-medium bg-white text-orange-700 border border-orange-200 hover:bg-orange-600 hover:text-white hover:border-orange-600 rounded-lg shadow-sm transition-all">{t('actions.mark_warning')}</button>
                            <button onClick={() => handleBulkStatusChange("Cancelled")} className="h-8 px-3 text-xs font-medium bg-white text-red-700 border border-red-200 hover:bg-red-600 hover:text-white hover:border-red-600 rounded-lg shadow-sm transition-all">{t('actions.mark_cancelled')}</button>

                            <div className="h-6 w-px bg-blue-200 mx-1"></div>

                            <button onClick={handleBulkDelete} className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-all" title={t('actions.delete_selected')}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col">
                <div className="overflow-x-auto min-h-[400px] flex-grow">
                    <table className="w-full text-sm text-start text-slate-600 dark:text-slate-300">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800 select-none uppercase text-xs tracking-wider">
                            <tr>
                                <th className="px-4 py-4 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        checked={filteredInvoices.length > 0 && selectedIds.size === filteredInvoices.length}
                                        onChange={toggleSelectAll}
                                        className="rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer w-4 h-4"
                                    />
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:text-blue-600 transition-colors group text-start" onClick={() => handleSort('status')}>
                                    <div className="flex items-center gap-1">{t('table.status')} <SortIcon column="status" /></div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:text-blue-600 transition-colors group text-start" onClick={() => handleSort('invoice_date')}>
                                    <div className="flex items-center gap-1">{t('table.date')} <SortIcon column="invoice_date" /></div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:text-blue-600 transition-colors group text-start" onClick={() => handleSort('vendor_name')}>
                                    <div className="flex items-center gap-1">{t('table.vendor')} <SortIcon column="vendor_name" /></div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:text-blue-600 transition-colors group text-start" onClick={() => handleSort('subject')}>
                                    <div className="flex items-center gap-1">{t('table.subject')} <SortIcon column="subject" /></div>
                                </th>
                                <th className="px-6 py-4 text-end cursor-pointer hover:text-blue-600 transition-colors group" onClick={() => handleSort('total_amount')}>
                                    <div className="flex items-center justify-end gap-1">{t('table.amount')} <SortIcon column="total_amount" /></div>
                                </th>
                                <th className="px-6 py-4 text-end cursor-pointer hover:text-blue-600 transition-colors group" onClick={() => handleSort('vat_amount')}>
                                    <div className="flex items-center justify-end gap-1">VAT <SortIcon column="vat_amount" /></div>
                                </th>
                                {/* <th className="px-6 py-4 text-start cursor-pointer hover:text-blue-600 transition-colors group" onClick={() => handleSort('comments')}>
                                    <div className="flex items-center gap-1">{t('table.comments')} <SortIcon column="comments" /></div>
                                </th> */}
                                <th className="px-6 py-4 w-24 text-center">{t('table.labels')}</th>
                                <th className="px-6 py-4 w-20 text-center">{t('table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            {filteredInvoices.length > 0 ? (
                                filteredInvoices
                                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                    .map((inv) => {
                                        const isEditing = editingId === inv.id;
                                        const isSelected = selectedIds.has(inv.id);

                                        return (
                                            <tr
                                                key={inv.id}
                                                className={`group transition-all duration-200 
                                                ${isSelected ? 'bg-blue-50/40 dark:bg-blue-900/20 hover:bg-blue-50/60 dark:hover:bg-blue-900/30' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'} 
                                                ${isEditing ? 'bg-blue-50/60 dark:bg-blue-900/40' : ''}
                                            `}
                                            >
                                                <td className="px-4 py-4 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(inv.id)}
                                                        onChange={() => toggleSelection(inv.id)}
                                                        className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer w-4 h-4 bg-white dark:bg-slate-800"
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    {isEditing ? (
                                                        <div className="flex flex-col gap-1">
                                                            <button
                                                                onClick={() => setEditForm({ ...editForm, status: "Processed" })}
                                                                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all flex items-center justify-center gap-1
                                                            ${editForm.status === 'Processed'
                                                                        ? 'bg-green-100 text-green-700 border-green-300 shadow-sm'
                                                                        : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-green-300 hover:text-green-600'}`}
                                                            >
                                                                <CheckCircle size={10} /> Processed
                                                            </button>
                                                            <button
                                                                onClick={() => setEditForm({ ...editForm, status: "Pending" })}
                                                                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all flex items-center justify-center gap-1
                                                            ${editForm.status === 'Pending'
                                                                        ? 'bg-amber-100 text-amber-700 border-amber-300 shadow-sm'
                                                                        : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-amber-300 hover:text-amber-600'}`}
                                                            >
                                                                <AlertCircle size={10} /> Pending
                                                            </button>
                                                            <button
                                                                onClick={() => setEditForm({ ...editForm, status: "Warning" })}
                                                                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all flex items-center justify-center gap-1
                                                            ${editForm.status === 'Warning'
                                                                        ? 'bg-orange-100 text-orange-700 border-orange-300 shadow-sm'
                                                                        : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-orange-300 hover:text-orange-600'}`}
                                                            >
                                                                <TriangleAlert size={10} /> Warning
                                                            </button>
                                                            <button
                                                                onClick={() => setEditForm({ ...editForm, status: "Cancelled" })}
                                                                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all flex items-center justify-center gap-1
                                                            ${editForm.status === 'Cancelled'
                                                                        ? 'bg-red-100 text-red-700 border-red-300 shadow-sm'
                                                                        : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-red-300 hover:text-red-600'}`}
                                                            >
                                                                <XCircle size={10} /> Cancelled
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className={`inline-flex items-center gap-1.5 pl-2 pr-3 py-1 rounded-full text-xs font-semibold border shadow-sm
                                                        ${inv.status === 'Processed'
                                                                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/30'
                                                                : inv.status === 'Pending'
                                                                    ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30'
                                                                    : inv.status === 'Warning'
                                                                        ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/30'
                                                                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/30'
                                                            }`}>
                                                            {inv.status === 'Processed' && <CheckCircle size={12} />}
                                                            {inv.status === 'Pending' && <AlertCircle size={12} />}
                                                            {inv.status === 'Warning' && <TriangleAlert size={12} />}
                                                            {inv.status === 'Cancelled' && <XCircle size={12} />}
                                                            {t(`status.${(inv.status || 'pending').toLowerCase()}`)}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                                    {isEditing ? (
                                                        <DateInput
                                                            value={editForm.invoice_date || ""}
                                                            onChange={val => setEditForm({ ...editForm, invoice_date: val })}
                                                            className="border border-slate-300 dark:border-slate-600 rounded px-2 py-1 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                                        />
                                                    ) : (
                                                        <span className="font-mono text-xs whitespace-nowrap text-slate-500 dark:text-slate-400 bg-slate-100/50 dark:bg-slate-800/50 px-2 py-1 rounded">
                                                            {inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString('en-GB') : '-'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={editForm.vendor_name || ""}
                                                            onChange={e => setEditForm({ ...editForm, vendor_name: e.target.value })}
                                                            className="border border-slate-300 dark:border-slate-600 rounded px-2 py-1 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                                        />
                                                    ) : inv.vendor_name}
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 max-w-xs truncate text-[13px]" title={inv.subject}>{inv.subject}</td>
                                                <td className="px-6 py-4 text-end font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                                                    {isEditing ? (
                                                        <div className="flex items-center gap-1 justify-end">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={editForm.total_amount || ""}
                                                                onChange={e => {
                                                                    const val = e.target.value ? parseFloat(e.target.value) : null;
                                                                    let vat = editForm.vat_amount;
                                                                    if (val !== null) {
                                                                        // Auto calc VAT 18%
                                                                        vat = parseFloat((val - (val / 1.18)).toFixed(2));
                                                                    }
                                                                    setEditForm({ ...editForm, total_amount: val, vat_amount: vat });
                                                                }}
                                                                className="border border-slate-300 dark:border-slate-600 rounded px-1 py-1 w-20 text-right focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                                            />
                                                            <select
                                                                value={editForm.currency}
                                                                onChange={e => setEditForm({ ...editForm, currency: e.target.value })}
                                                                className="border border-slate-300 dark:border-slate-600 rounded px-0 py-1 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-slate-800 w-12 text-slate-900 dark:text-slate-100"
                                                            >
                                                                <option value="ILS">ILS</option>
                                                                <option value="USD">USD</option>
                                                                <option value="EUR">EUR</option>
                                                            </select>
                                                        </div>
                                                    ) : (
                                                        `${Number(inv.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${inv.currency}`
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 text-end text-slate-500 dark:text-slate-400 tabular-nums text-[13px]">
                                                    {isEditing ? (
                                                        <div className="flex items-center gap-1 justify-end">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={editForm.vat_amount || ""}
                                                                onChange={e => setEditForm({ ...editForm, vat_amount: e.target.value ? parseFloat(e.target.value) : null })}
                                                                className="border border-slate-300 dark:border-slate-600 rounded px-1 py-1 w-16 text-right focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                                            />
                                                            <span className="text-xs text-slate-400">{editForm.currency}</span>
                                                        </div>
                                                    ) : (
                                                        `${Number(inv.vat_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${inv.currency}`
                                                    )}
                                                </td>

                                                {/* <td className="px-6 py-4 text-slate-500 max-w-xs truncate text-[13px]">
                                                {isEditing ? (
                                                    <textarea
                                                        value={editForm.comments || ""}
                                                        onChange={e => setEditForm({ ...editForm, comments: e.target.value })}
                                                        className="border border-slate-300 rounded px-2 py-1 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                                                        rows={1}
                                                    />
                                                ) : (
                                                    <span title={inv.comments} className="truncate block max-w-[150px]">{inv.comments}</span>
                                                )}
                                            </td> */}

                                                {/* TAGS COLUMN */}
                                                <td className="px-6 py-4 text-center">
                                                    {isEditing ? (
                                                        <div className="flex flex-wrap justify-center gap-1 min-w-[180px] mx-auto">
                                                            {availableLabels.map(label => {
                                                                const isSelected = (editForm.labels || []).includes(label);
                                                                const color = getLabelColor(label);
                                                                return (
                                                                    <button
                                                                        key={label}
                                                                        onClick={() => {
                                                                            const currentLabels = editForm.labels || [];
                                                                            const newLabels = isSelected
                                                                                ? currentLabels.filter(l => l !== label)
                                                                                : [...currentLabels, label];
                                                                            setEditForm({ ...editForm, labels: newLabels });
                                                                        }}
                                                                        className={`px-2 py-0.5 rounded text-[9px] border transition-all truncate text-center max-w-[80px] ${isSelected
                                                                            ? `${color.bg} ${color.text} ${color.border} font-bold shadow-sm`
                                                                            : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                                                                            }`}
                                                                        title={label}
                                                                    >
                                                                        {label}
                                                                    </button>
                                                                )
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-wrap justify-center gap-1 min-w-[180px] mx-auto">
                                                            {(inv.labels && inv.labels.length > 0) ? (
                                                                inv.labels.map(l => {
                                                                    const color = getLabelColor(l);
                                                                    return (
                                                                        <span key={l} title={l} className={`px-2 py-0.5 ${color.bg} ${color.text} rounded text-[9px] font-medium border ${color.border} shadow-sm truncate text-center block max-w-[80px]`}>
                                                                            {l}
                                                                        </span>
                                                                    )
                                                                })
                                                            ) : (
                                                                <span className="col-span-3 text-slate-300 dark:text-slate-600 text-xs italic tracking-wide text-center">-</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                        {isEditing ? (
                                                            <>
                                                                <button onClick={() => saveEdit(inv)} className="text-green-600 hover:bg-green-100 p-2 rounded-lg transition-colors" title={t('actions.save')}><Check size={16} /></button>
                                                                <button onClick={cancelEdit} className="text-red-500 hover:bg-red-100 p-2 rounded-lg transition-colors" title={t('actions.cancel')}><X size={16} /></button>

                                                                {/* File Upload Button (Hidden Input + Trigger) */}
                                                                <label className="cursor-pointer text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition-colors relative" title="Replace File">
                                                                    <Upload size={16} />
                                                                    <input
                                                                        type="file"
                                                                        className="hidden"
                                                                        accept=".pdf,image/*"
                                                                        onChange={(e) => {
                                                                            if (e.target.files?.[0]) {
                                                                                setEditForm(prev => ({ ...prev, file: e.target.files[0] }));
                                                                            }
                                                                        }}
                                                                    />
                                                                    {editForm.file && (
                                                                        <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full border border-white"></span>
                                                                    )}
                                                                </label>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button onClick={() => startEdit(inv)} className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors" title={t('actions.edit')}><Edit2 size={16} /></button>

                                                                {onDeleteInvoice && (
                                                                    <button onClick={() => handleDelete(inv)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors" title={t('actions.delete')}><Trash2 size={16} /></button>
                                                                )}

                                                                {inv.download_url && (
                                                                    <a
                                                                        href={inv.download_url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                                                                        title={t('common.full_preview')}
                                                                    >
                                                                        <FileText size={16} />
                                                                    </a>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                            ) : (
                                <tr>
                                    <td colSpan="9" className="px-6 py-12 text-center text-slate-400 italic">
                                        <div className="flex flex-col items-center gap-2">
                                            <Search className="opacity-20 inline-block mb-1" size={32} />
                                            <span>{t('table.no_invoices')}</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                {filteredInvoices.length > 0 && (
                    <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-3 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <span>{t ? t('pagination.rows_per_page') : "Rows per page"}:</span>
                            <select
                                value={itemsPerPage}
                                onChange={e => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                                {t ? t('pagination.page_x_of_y')
                                    .replace('{current}', currentPage)
                                    .replace('{total}', Math.ceil(filteredInvoices.length / itemsPerPage))
                                    : `Page ${currentPage} of ${Math.ceil(filteredInvoices.length / itemsPerPage)}`
                                }
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-transparent transition-colors text-slate-600 dark:text-slate-400"
                                    title={t ? t('pagination.previous') : "Previous"}
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(Math.min(Math.ceil(filteredInvoices.length / itemsPerPage), currentPage + 1))}
                                    disabled={currentPage === Math.ceil(filteredInvoices.length / itemsPerPage)}
                                    className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-transparent transition-colors text-slate-600 dark:text-slate-400"
                                    title={t ? t('pagination.next') : "Next"}
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}
