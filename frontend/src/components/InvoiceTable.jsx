import React, { useState, useMemo } from 'react';
import { FileText, CheckCircle, AlertCircle, Download, Search, XCircle, Edit2, Trash2, Check, X, ArrowUp, ArrowDown, ArrowUpDown, Calendar } from 'lucide-react';
import { updateInvoice, deleteInvoice } from '../api';
import { DateInput } from './DateInput';

export function InvoiceTable({ invoices, availableLabels = [], onUpdateInvoice, onDeleteInvoice }) {
    const [filterText, setFilterText] = useState("");
    const [filterStatus, setFilterStatus] = useState("all"); // all, processed, pending
    const [filterLabel, setFilterLabel] = useState("all");
    const [dateRange, setDateRange] = useState({ start: "", end: "" });

    // Sorting State
    const [sortConfig, setSortConfig] = useState({ key: 'invoice_date', direction: 'desc' });

    // Selection State
    const [selectedIds, setSelectedIds] = useState(new Set());

    // Editing State
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    // Filter Logic
    const filteredInvoices = useMemo(() => {
        if (!invoices) return [];
        let result = invoices.filter(inv => {
            const matchesText =
                (inv.vendor_name?.toLowerCase() || "").includes(filterText.toLowerCase()) ||
                (inv.subject?.toLowerCase() || "").includes(filterText.toLowerCase());

            const matchesStatus =
                filterStatus === 'all' ? true :
                    filterStatus === 'processed' ? inv.status === 'Processed' :
                        filterStatus === 'cancelled' ? inv.status === 'Cancelled' :
                            inv.status === 'Pending';

            const matchesLabel =
                filterLabel === 'all' ? true :
                    (inv.labels || []).includes(filterLabel);

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
        if (!window.confirm(`Delete ${selectedIds.size} selected invoices?`)) return;

        const idsToProcess = Array.from(selectedIds);
        setSelectedIds(new Set()); // Clear selection immediately

        for (const id of idsToProcess) {
            try {
                await deleteInvoice(id);
                if (onDeleteInvoice) onDeleteInvoice(id);
            } catch (err) {
                console.error(`Failed to delete invoice ${id}`, err);
            }
        }
    };

    const handleBulkStatusChange = async (newStatus) => {
        const idsToProcess = Array.from(selectedIds);
        setSelectedIds(new Set()); // Clear selection

        for (const id of idsToProcess) {
            const inv = invoices.find(i => i.id === id);
            if (!inv) continue;

            try {
                const updatedInv = { ...inv, status: newStatus };
                await updateInvoice(id, updatedInv);
                if (onUpdateInvoice) onUpdateInvoice(updatedInv);
            } catch (err) {
                console.error(`Failed to update status for ${id}`, err);
            }
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
            labels: inv.labels || []
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const saveEdit = async (inv) => {
        try {
            const updatedInv = { ...inv, ...editForm };
            if (onUpdateInvoice) onUpdateInvoice(updatedInv);
            setEditingId(null);
            await updateInvoice(inv.id, updatedInv);
        } catch (err) {
            console.error("Failed to save", err);
            alert("Failed to save changes");
        }
    };

    const handleDelete = async (inv) => {
        if (window.confirm("Are you sure you want to delete this invoice?")) {
            try {
                if (onDeleteInvoice) onDeleteInvoice(inv.id);
                await deleteInvoice(inv.id);
            } catch (err) {
                console.error("Failed to delete", err);
                alert("Failed to delete invoice");
            }
        }
    };

    // CSV Export Logic
    const downloadCSV = () => {
        if (!filteredInvoices.length) return;

        const headers = ["ID", "Date", "Vendor", "Subject", "Amount", "Currency", "VAT", "Status", "Labels"];
        const csvRows = [headers.join(",")];

        for (const inv of filteredInvoices) {
            const row = [
                inv.id,
                inv.invoice_date,
                `"${inv.vendor_name || ''}"`, // Quote to handle commas
                `"${inv.subject || ''}"`,
                inv.total_amount,
                inv.currency,
                inv.vat_amount,
                inv.status,
                `"${(inv.labels || []).join(', ')}"`
            ];
            csvRows.push(row.join(","));
        }

        const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "invoices_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!invoices || invoices.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500 bg-white rounded-lg border border-dashed border-slate-300">
                <FileText size={48} className="mx-auto mb-3 opacity-20" />
                <p>No invoices found. Try running a scan.</p>
            </div>
        );
    }

    const SortIcon = ({ column }) => {
        if (sortConfig.key !== column) return <ArrowUpDown size={14} className="opacity-20 ml-1 inline" />;
        return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1 inline" /> : <ArrowDown size={14} className="ml-1 inline" />;
    };

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] space-y-4">
                {/* Top Row: General Filters */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="flex items-center gap-2 w-full sm:w-auto relative group">
                        <Search size={18} className="absolute left-3 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Filter by vendor or subject..."
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none w-full sm:w-72 text-sm font-medium text-slate-700 placeholder:font-normal"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-700 font-medium text-sm transition-all cursor-pointer hover:bg-slate-100"
                        >
                            <option value="all">All Status</option>
                            <option value="processed">Processed</option>
                            <option value="pending">Pending</option>
                            <option value="cancelled">Cancelled</option>
                        </select>

                        <select
                            value={filterLabel}
                            onChange={(e) => setFilterLabel(e.target.value)}
                            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-700 font-medium text-sm transition-all cursor-pointer hover:bg-slate-100"
                        >
                            <option value="all">All Tags</option>
                            {availableLabels.map(l => (
                                <option key={l} value={l}>{l}</option>
                            ))}
                        </select>

                        <button
                            onClick={downloadCSV}
                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg active:scale-95 ml-auto sm:ml-0 text-sm"
                        >
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>

                {/* Bottom Row: Date Filter & Bulk Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
                            <Calendar size={14} /> Date Range:
                        </span>
                        <DateInput
                            value={dateRange.start}
                            onChange={(val) => setDateRange(prev => ({ ...prev, start: val }))}
                            placeholder="Start Date"
                            className="w-32 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                        />
                        <span className="text-slate-300">/</span>
                        <DateInput
                            value={dateRange.end}
                            onChange={(val) => setDateRange(prev => ({ ...prev, end: val }))}
                            placeholder="End Date"
                            className="w-32 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                        />
                    </div>

                    {selectedIds.size > 0 && (
                        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 bg-blue-50/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-blue-100/50 w-full sm:w-auto justify-between sm:justify-start shadow-sm">
                            <span className="text-sm font-bold text-blue-900 flex items-center gap-2">
                                <span className="bg-blue-600 text-white text-[10px] px-1.5 rounded-full h-5 min-w-[1.25rem] flex items-center justify-center">
                                    {selectedIds.size}
                                </span>
                                Selected
                            </span>
                            <div className="h-4 w-px bg-blue-200/50 mx-1"></div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleBulkStatusChange("Processed")} className="px-3 py-1.5 text-xs font-medium bg-white text-green-700 border border-green-200/50 hover:bg-green-50 hover:border-green-300 hover:text-green-800 rounded-md shadow-sm transition-all">Mark Processed</button>
                                <button onClick={() => handleBulkStatusChange("Pending")} className="px-3 py-1.5 text-xs font-medium bg-white text-amber-700 border border-amber-200/50 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800 rounded-md shadow-sm transition-all">Mark Pending</button>
                                <button onClick={() => handleBulkStatusChange("Cancelled")} className="px-3 py-1.5 text-xs font-medium bg-white text-red-700 border border-red-200/50 hover:bg-red-50 hover:border-red-300 hover:text-red-800 rounded-md shadow-sm transition-all">Mark Cancelled</button>
                                <div className="w-px h-4 bg-blue-200 mx-1"></div>
                                <button onClick={handleBulkDelete} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete Selected">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-100 select-none uppercase text-xs tracking-wider">
                            <tr>
                                <th className="px-4 py-4 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        checked={filteredInvoices.length > 0 && selectedIds.size === filteredInvoices.length}
                                        onChange={toggleSelectAll}
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
                                    />
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:text-blue-600 transition-colors group" onClick={() => handleSort('status')}>
                                    <div className="flex items-center gap-1">Status <SortIcon column="status" /></div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:text-blue-600 transition-colors group" onClick={() => handleSort('invoice_date')}>
                                    <div className="flex items-center gap-1">Date <SortIcon column="invoice_date" /></div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:text-blue-600 transition-colors group" onClick={() => handleSort('vendor_name')}>
                                    <div className="flex items-center gap-1">Vendor <SortIcon column="vendor_name" /></div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:text-blue-600 transition-colors group" onClick={() => handleSort('subject')}>
                                    <div className="flex items-center gap-1">Subject <SortIcon column="subject" /></div>
                                </th>
                                <th className="px-6 py-4 text-right cursor-pointer hover:text-blue-600 transition-colors group" onClick={() => handleSort('total_amount')}>
                                    <div className="flex items-center justify-end gap-1">Amount <SortIcon column="total_amount" /></div>
                                </th>
                                <th className="px-6 py-4 text-right cursor-pointer hover:text-blue-600 transition-colors group" onClick={() => handleSort('vat_amount')}>
                                    <div className="flex items-center justify-end gap-1">VAT <SortIcon column="vat_amount" /></div>
                                </th>
                                <th className="px-6 py-4">Tags</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredInvoices.length > 0 ? (
                                filteredInvoices.map((inv) => {
                                    const isEditing = editingId === inv.id;
                                    const isSelected = selectedIds.has(inv.id);

                                    return (
                                        <tr
                                            key={inv.id}
                                            className={`group transition-all duration-200 
                                                ${isSelected ? 'bg-blue-50/40 hover:bg-blue-50/60' : 'hover:bg-slate-50/80'} 
                                                ${isEditing ? 'bg-blue-50/60' : ''}
                                            `}
                                        >
                                            <td className="px-4 py-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(inv.id)}
                                                    onChange={() => toggleSelection(inv.id)}
                                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                {isEditing ? (
                                                    <select
                                                        value={editForm.status || "Pending"}
                                                        onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                                                        className="border border-slate-300 rounded px-2 py-1 text-xs w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                    >
                                                        <option value="Pending">Pending</option>
                                                        <option value="Processed">Processed</option>
                                                        <option value="Cancelled">Cancelled</option>
                                                    </select>
                                                ) : (
                                                    <span className={`inline-flex items-center gap-1.5 pl-2 pr-3 py-1 rounded-full text-xs font-semibold border shadow-sm
                                                    ${inv.status === 'Processed' ? 'text-green-700 bg-green-50 border-green-200/60' :
                                                            inv.status === 'Cancelled' ? 'text-red-700 bg-red-50 border-red-200/60' :
                                                                'text-amber-700 bg-amber-50 border-amber-200/60'}`}>
                                                        {inv.status === 'Processed' ? <CheckCircle size={12} className="stroke-[2.5]" /> :
                                                            inv.status === 'Cancelled' ? <XCircle size={12} className="stroke-[2.5]" /> :
                                                                <AlertCircle size={12} className="stroke-[2.5]" />}
                                                        {inv.status}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {isEditing ? (
                                                    <DateInput
                                                        value={editForm.invoice_date || ""}
                                                        onChange={val => setEditForm({ ...editForm, invoice_date: val })}
                                                        className="border border-slate-300 rounded px-2 py-1 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                                                    />
                                                ) : (
                                                    <span className="font-mono text-xs whitespace-nowrap text-slate-500 bg-slate-100/50 px-2 py-1 rounded">
                                                        {inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString('en-GB') : '-'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-800">
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={editForm.vendor_name || ""}
                                                        onChange={e => setEditForm({ ...editForm, vendor_name: e.target.value })}
                                                        className="border border-slate-300 rounded px-2 py-1 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                    />
                                                ) : inv.vendor_name}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 max-w-xs truncate text-[13px]" title={inv.subject}>{inv.subject}</td>
                                            <td className="px-6 py-4 text-right font-medium text-slate-900 tabular-nums">
                                                {isEditing ? (
                                                    <div className="flex items-center gap-1 justify-end">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={editForm.total_amount || ""}
                                                            onChange={e => setEditForm({ ...editForm, total_amount: e.target.value ? parseFloat(e.target.value) : null })}
                                                            className="border border-slate-300 rounded px-1 py-1 w-20 text-right focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                                                        />
                                                        <span className="text-xs text-slate-400">{inv.currency}</span>
                                                    </div>
                                                ) : (
                                                    `${Number(inv.total_amount || 0).toFixed(2)} ${inv.currency}`
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-right text-slate-500 tabular-nums text-[13px]">
                                                {isEditing ? (
                                                    <div className="flex items-center gap-1 justify-end">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={editForm.vat_amount || ""}
                                                            onChange={e => setEditForm({ ...editForm, vat_amount: e.target.value ? parseFloat(e.target.value) : null })}
                                                            className="border border-slate-300 rounded px-1 py-1 w-16 text-right focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                                                        />
                                                        <span className="text-xs text-slate-400">{inv.currency}</span>
                                                    </div>
                                                ) : (
                                                    `${Number(inv.vat_amount || 0).toFixed(2)} ${inv.currency}`
                                                )}
                                            </td>

                                            {/* TAGS COLUMN */}
                                            <td className="px-6 py-4">
                                                {isEditing ? (
                                                    <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                                                        {availableLabels.map(label => {
                                                            const isSelected = (editForm.labels || []).includes(label);
                                                            return (
                                                                <span
                                                                    key={label}
                                                                    onClick={() => {
                                                                        const currentLabels = editForm.labels || [];
                                                                        const newLabels = isSelected
                                                                            ? currentLabels.filter(l => l !== label)
                                                                            : [...currentLabels, label];
                                                                        setEditForm({ ...editForm, labels: newLabels });
                                                                    }}
                                                                    className={`cursor-pointer px-2 py-0.5 rounded text-[10px] border select-none transition-all ${isSelected
                                                                        ? 'bg-blue-100 text-blue-700 border-blue-200 font-medium'
                                                                        : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'
                                                                        }`}
                                                                >
                                                                    {label}
                                                                </span>
                                                            )
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {(inv.labels && inv.labels.length > 0) ? (
                                                            inv.labels.map(l => (
                                                                <span key={l} className="px-2 py-0.5 bg-blue-50/50 text-blue-600 rounded text-[10px] font-medium border border-blue-100">
                                                                    {l}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-slate-300 text-xs italic tracking-wide">No tags</span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                    {isEditing ? (
                                                        <>
                                                            <button onClick={() => saveEdit(inv)} className="text-green-600 hover:bg-green-100 p-2 rounded-lg transition-colors" title="Save"><Check size={16} /></button>
                                                            <button onClick={cancelEdit} className="text-red-500 hover:bg-red-100 p-2 rounded-lg transition-colors" title="Cancel"><X size={16} /></button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button onClick={() => startEdit(inv)} className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors" title="Edit"><Edit2 size={16} /></button>

                                                            {onDeleteInvoice && (
                                                                <button onClick={() => handleDelete(inv)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Delete"><Trash2 size={16} /></button>
                                                            )}

                                                            {inv.download_url && (
                                                                <a
                                                                    href={inv.download_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                                                                    title="View PDF"
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
                                            <span>No invoices found matching your filters.</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
