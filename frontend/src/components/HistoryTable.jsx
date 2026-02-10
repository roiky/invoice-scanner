import React, { useState, useEffect } from 'react';
import { Save, X, Edit2, Check, Download, AlertCircle, TriangleAlert, CheckCircle, XCircle, Search, Trash2 } from 'lucide-react';
import { getInvoices, updateInvoice, deleteInvoice } from '../api';

export function HistoryTable() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterText, setFilterText] = useState("");
    const [selectedStatuses, setSelectedStatuses] = useState(["Pending", "Warning", "Processed", "Cancelled"]);

    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    // Fetch Data
    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getInvoices();
            setInvoices(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Filter Logic
    const toggleStatusFilter = (status) => {
        if (selectedStatuses.includes(status)) {
            setSelectedStatuses(selectedStatuses.filter(s => s !== status));
        } else {
            setSelectedStatuses([...selectedStatuses, status]);
        }
    };

    const filteredInvoices = invoices.filter(inv => {
        const matchesText = (inv.vendor_name?.toLowerCase() || "").includes(filterText.toLowerCase()) ||
            (inv.subject?.toLowerCase() || "").includes(filterText.toLowerCase());
        const matchesStatus = selectedStatuses.includes(inv.status);
        return matchesText && matchesStatus;
    });

    // Edit Handlers
    const startEdit = (inv) => {
        setEditingId(inv.id);
        setEditForm({
            vendor_name: inv.vendor_name,
            invoice_date: inv.invoice_date,
            total_amount: inv.total_amount,
            vat_amount: inv.vat_amount,
            currency: inv.currency,
            status: inv.status
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const saveEdit = async (id) => {
        try {
            console.log("Saving edit for", id, editForm);

            // Construct full object
            const originalInv = invoices.find(i => i.id === id);
            const updatedInv = { ...originalInv, ...editForm };

            // Optimistic Update
            setInvoices(invoices.map(i => i.id === id ? updatedInv : i));
            setEditingId(null);

            // API Call
            await updateInvoice(id, updatedInv);
        } catch (err) {
            console.error("Failed to save", err);
            alert(`Failed to save: ${err.message}`);
            loadData(); // Revert
        }
    };

    // CSV Export
    const downloadCSV = () => {
        if (!filteredInvoices.length) return;
        const headers = ["ID", "Date", "Vendor", "Subject", "Amount", "Currency", "VAT", "Status"];
        const csvRows = [headers.join(",")];
        for (const inv of filteredInvoices) {
            const row = [
                inv.id,
                inv.invoice_date,
                `"${inv.vendor_name || ''}"`,
                `"${inv.subject || ''}"`,
                inv.total_amount,
                inv.currency,
                inv.vat_amount,
                inv.status
            ];
            csvRows.push(row.join(","));
        }
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join("\n");
        const link = document.createElement("a");
        link.href = encodeURI(csvContent);
        link.download = "invoices_history.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const StatusBadge = ({ status, onClick, selected }) => {
        const styles = {
            "Pending": "text-amber-600 bg-amber-50 border-amber-100",
            "Warning": "text-orange-600 bg-orange-50 border-orange-100",
            "Processed": "text-green-600 bg-green-50 border-green-100",
            "Cancelled": "text-red-600 bg-red-50 border-red-100"
        };
        const icons = {
            "Pending": <AlertCircle size={14} />,
            "Warning": <TriangleAlert size={14} />,
            "Processed": <CheckCircle size={14} />,
            "Cancelled": <XCircle size={14} />
        };

        const baseClass = `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-all select-none`;
        const activeClass = styles[status] || "text-slate-600 bg-slate-50";
        const inactiveClass = "text-slate-400 bg-slate-50 border-slate-100 opacity-60 grayscale";

        return (
            <div
                onClick={onClick}
                className={`${baseClass} ${selected ? activeClass : inactiveClass} ${selected ? 'ring-1 ring-offset-1 ring-white shadow-sm' : ''}`}
            >
                {icons[status] || null}
                {status}
            </div>
        );
    };

    if (loading) return <div className="text-center py-8">Loading history...</div>;

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">

                <div className="flex flex-col gap-3 w-full md:w-auto">
                    {/* Status Filters */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-slate-500 mr-2 font-medium">Filter Status:</span>
                        {["Pending", "Warning", "Processed", "Cancelled"].map(s => (
                            <StatusBadge
                                key={s}
                                status={s}
                                selected={selectedStatuses.includes(s)}
                                onClick={() => toggleStatusFilter(s)}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search history..."
                            value={filterText}
                            onChange={e => setFilterText(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-slate-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        />
                    </div>
                    <button onClick={downloadCSV} className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-900 text-sm font-medium whitespace-nowrap">
                        <Download size={16} /> Export
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-x-auto min-h-[400px]">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 w-32">Status</th>
                            <th className="px-6 py-3 w-32">Date</th>
                            <th className="px-6 py-3">Vendor</th>
                            <th className="px-6 py-3">Subject</th>
                            <th className="px-6 py-3 text-right">Amount</th>
                            <th className="px-6 py-3 text-right">VAT</th>
                            <th className="px-6 py-3 w-32 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredInvoices.length > 0 ? filteredInvoices.map(inv => {
                            const isEditing = editingId === inv.id;
                            return (
                                <tr key={inv.id} className={`hover:bg-slate-50 group ${isEditing ? 'bg-blue-50/50' : ''}`}>
                                    <td className="px-6 py-3">
                                        {isEditing ? (
                                            <select
                                                value={editForm.status || "Pending"}
                                                onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                                                className="border border-slate-300 rounded px-2 py-1 text-xs w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Warning">Warning</option>
                                                <option value="Processed">Processed</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                        ) : (
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                                                ${inv.status === 'Processed' ? 'text-green-700 bg-green-50 border-green-100' :
                                                    inv.status === 'Pending' ? 'text-amber-700 bg-amber-50 border-amber-100' :
                                                        inv.status === 'Warning' ? 'text-orange-700 bg-orange-50 border-orange-100' :
                                                            'text-red-700 bg-red-50 border-red-100'}`}>
                                                {inv.status === 'Processed' ? <CheckCircle size={12} /> :
                                                    inv.status === 'Pending' ? <AlertCircle size={12} /> :
                                                        inv.status === 'Warning' ? <TriangleAlert size={12} /> :
                                                            <XCircle size={12} />}
                                                {inv.status}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-3">
                                        {isEditing ? (
                                            <input
                                                type="date"
                                                lang="en-GB"
                                                value={editForm.invoice_date || ""}
                                                onChange={e => setEditForm({ ...editForm, invoice_date: e.target.value || null })}
                                                className="border border-slate-300 rounded px-2 py-1 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            />
                                        ) : (
                                            <span className="text-slate-600 font-mono text-xs whitespace-nowrap">
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
                                    <td className="px-6 py-3 text-slate-500 max-w-xs truncate" title={inv.subject}>
                                        {inv.subject}
                                    </td>
                                    <td className="px-6 py-3 text-right font-mono text-slate-700">
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={editForm.total_amount || ""}
                                                onChange={e => setEditForm({ ...editForm, total_amount: e.target.value === "" ? null : parseFloat(e.target.value) })}
                                                className="border border-slate-300 rounded px-2 py-1 w-24 text-right focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            />
                                        ) : `${inv.total_amount?.toFixed(2) || '0.00'} ${inv.currency}`}
                                    </td>
                                    <td className="px-6 py-3 text-right text-slate-500 font-mono">
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={editForm.vat_amount || ""}
                                                onChange={e => setEditForm({ ...editForm, vat_amount: e.target.value === "" ? null : parseFloat(e.target.value) })}
                                                className="border border-slate-300 rounded px-2 py-1 w-20 text-right focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            />
                                        ) : `${inv.vat_amount?.toFixed(2) || '0.00'} ${inv.currency}`}
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-1 justify-end">
                                            {isEditing ? (
                                                <>
                                                    <button onClick={() => saveEdit(inv.id)} className="text-green-600 hover:bg-green-100 p-1.5 rounded-md transition-colors" title="Save"><Check size={16} /></button>
                                                    <button onClick={cancelEdit} className="text-red-500 hover:bg-red-100 p-1.5 rounded-md transition-colors" title="Cancel"><X size={16} /></button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => startEdit(inv)} className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-md transition-colors" title="Edit"><Edit2 size={16} /></button>
                                                    <button onClick={async () => {
                                                        if (window.confirm("Are you sure you want to delete this invoice?")) {
                                                            try {
                                                                await deleteInvoice(inv.id);
                                                                setInvoices(invoices.filter(i => i.id !== inv.id));
                                                            } catch (err) {
                                                                alert("Failed to delete");
                                                            }
                                                        }
                                                    }} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors" title="Delete"><Trash2 size={16} /></button>
                                                    {inv.download_url && (
                                                        <a href={inv.download_url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-md transition-colors" title="Download PDF">
                                                            <Download size={16} />
                                                        </a>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan="7" className="text-center py-12 text-slate-400 italic">
                                    No invoices match the current filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
