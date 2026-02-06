import React, { useState, useMemo } from 'react';
import { FileText, CheckCircle, AlertCircle, Download, Search, XCircle, Edit2, Trash2, Check, X, Tag } from 'lucide-react';
import { updateInvoice, deleteInvoice } from '../api';

export function InvoiceTable({ invoices, availableLabels = [], onUpdateInvoice, onDeleteInvoice }) {
    const [filterText, setFilterText] = useState("");
    const [filterStatus, setFilterStatus] = useState("all"); // all, processed, pending
    const [filterLabel, setFilterLabel] = useState("all");

    // Editing State
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    // Filter Logic
    const filteredInvoices = useMemo(() => {
        if (!invoices) return [];
        return invoices.filter(inv => {
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

            return matchesText && matchesStatus && matchesLabel;
        });
    }, [invoices, filterText, filterStatus, filterLabel]);


    // Actions
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
            // Optimistic Update handled by parent if prop provided
            if (onUpdateInvoice) onUpdateInvoice(updatedInv);

            setEditingId(null);

            // API Call
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

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 w-full sm:w-auto relative">
                    <Search size={18} className="absolute left-3 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Filter by vendor or subject..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-60"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-slate-700 font-medium text-sm"
                    >
                        <option value="all">All Status</option>
                        <option value="processed">Processed</option>
                        <option value="pending">Pending</option>
                        <option value="cancelled">Cancelled</option>
                    </select>

                    <select
                        value={filterLabel}
                        onChange={(e) => setFilterLabel(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-slate-700 font-medium text-sm"
                    >
                        <option value="all">All Tags</option>
                        {availableLabels.map(l => (
                            <option key={l} value={l}>{l}</option>
                        ))}
                    </select>

                    <button
                        onClick={downloadCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-md font-medium transition-colors ml-auto sm:ml-0 text-sm"
                    >
                        <Download size={16} />
                        Export
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 w-32">Status</th>
                                <th className="px-6 py-3 w-32">Date</th>
                                <th className="px-6 py-3">Vendor</th>
                                <th className="px-6 py-3">Subject</th>
                                <th className="px-6 py-3 text-right">Amount</th>
                                <th className="px-6 py-3 text-right">VAT</th>
                                <th className="px-6 py-3">Tags</th>
                                <th className="px-6 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredInvoices.length > 0 ? (
                                filteredInvoices.map((inv) => {
                                    const isEditing = editingId === inv.id;
                                    return (
                                        <tr key={inv.id} className={`hover:bg-slate-50 transition-colors ${isEditing ? 'bg-blue-50/50' : ''}`}>
                                            <td className="px-6 py-3">
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
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                                                    ${inv.status === 'Processed' ? 'text-green-700 bg-green-50 border-green-100' :
                                                            inv.status === 'Cancelled' ? 'text-red-700 bg-red-50 border-red-100' :
                                                                'text-amber-700 bg-amber-50 border-amber-100'}`}>
                                                        {inv.status === 'Processed' ? <CheckCircle size={12} /> :
                                                            inv.status === 'Cancelled' ? <XCircle size={12} /> :
                                                                <AlertCircle size={12} />}
                                                        {inv.status}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3 text-slate-600">
                                                {isEditing ? (
                                                    <input
                                                        type="date"
                                                        value={editForm.invoice_date || ""}
                                                        onChange={e => setEditForm({ ...editForm, invoice_date: e.target.value || null })}
                                                        className="border border-slate-300 rounded px-2 py-1 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                    />
                                                ) : (
                                                    <span className="font-mono text-xs whitespace-nowrap">
                                                        {inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString('en-GB') : '-'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3 font-medium text-slate-900">
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={editForm.vendor_name || ""}
                                                        onChange={e => setEditForm({ ...editForm, vendor_name: e.target.value })}
                                                        className="border border-slate-300 rounded px-2 py-1 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                    />
                                                ) : inv.vendor_name}
                                            </td>
                                            <td className="px-6 py-3 text-slate-500 max-w-xs truncate" title={inv.subject}>{inv.subject}</td>
                                            <td className="px-6 py-3 text-right font-medium text-slate-900">
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

                                            <td className="px-6 py-3 text-right text-slate-500">
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
                                            <td className="px-6 py-3">
                                                {isEditing ? (
                                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
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
                                                                    className={`cursor-pointer px-2 py-0.5 rounded text-[10px] border select-none ${isSelected
                                                                        ? 'bg-blue-100 text-blue-700 border-blue-200'
                                                                        : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                                                                        }`}
                                                                >
                                                                    {label}
                                                                </span>
                                                            )
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-wrap gap-1">
                                                        {(inv.labels && inv.labels.length > 0) ? (
                                                            inv.labels.map(l => (
                                                                <span key={l} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] border border-blue-100">
                                                                    {l}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-slate-300 text-xs italic">No tags</span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-1 justify-end">
                                                    {isEditing ? (
                                                        <>
                                                            <button onClick={() => saveEdit(inv)} className="text-green-600 hover:bg-green-100 p-1.5 rounded-md transition-colors" title="Save"><Check size={16} /></button>
                                                            <button onClick={cancelEdit} className="text-red-500 hover:bg-red-100 p-1.5 rounded-md transition-colors" title="Cancel"><X size={16} /></button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button onClick={() => startEdit(inv)} className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-md transition-colors" title="Edit"><Edit2 size={16} /></button>

                                                            {onDeleteInvoice && (
                                                                <button onClick={() => handleDelete(inv)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors" title="Delete"><Trash2 size={16} /></button>
                                                            )}

                                                            {inv.download_url && (
                                                                <a
                                                                    href={inv.download_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-md transition-colors"
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
                                    <td colSpan="7" className="px-6 py-8 text-center text-slate-400 italic">
                                        No matching invoices found.
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
