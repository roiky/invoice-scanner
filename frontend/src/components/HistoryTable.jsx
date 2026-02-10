import React, { useState, useEffect } from 'react';
import { Save, X, Edit2, Check, Download, AlertCircle, TriangleAlert, CheckCircle, XCircle, Search, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getInvoices, updateInvoice, deleteInvoice } from '../api';

export function HistoryTable() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterText, setFilterText] = useState("");
    const [selectedStatuses, setSelectedStatuses] = useState(["Pending", "Warning", "Processed", "Cancelled"]);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

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
        setCurrentPage(1); // Reset to first page
    };

    // Reset pagination when search text changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filterText]);

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
        const activeClass = styles[status] || "text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800";
        const inactiveClass = "text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 opacity-60 grayscale";

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

    if (loading) return <div className="text-center py-8 text-slate-500 dark:text-slate-400">Loading history...</div>;

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">

                <div className="flex flex-col gap-3 w-full md:w-auto">
                    {/* Status Filters */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-slate-500 dark:text-slate-400 mr-2 font-medium">Filter Status:</span>
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
                            className="pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                    </div>
                    <button onClick={downloadCSV} className="flex items-center gap-2 px-3 py-2 bg-slate-800 dark:bg-blue-600 text-white rounded-md hover:bg-slate-900 dark:hover:bg-blue-700 text-sm font-medium whitespace-nowrap transition-colors shadow-sm">
                        <Download size={16} /> Export
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden min-h-[400px] flex flex-col">
                <div className="overflow-x-auto flex-grow">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium border-b border-slate-200 dark:border-slate-700">
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
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredInvoices.length > 0 ? (
                                filteredInvoices
                                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                    .map(inv => {
                                        const isEditing = editingId === inv.id;
                                        return (
                                            <tr key={inv.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 group ${isEditing ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                                                <td className="px-6 py-3">
                                                    {isEditing ? (
                                                        <select
                                                            value={editForm.status || "Pending"}
                                                            onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                                                            className="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded px-2 py-1 text-xs w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                        >
                                                            <option value="Pending">Pending</option>
                                                            <option value="Warning">Warning</option>
                                                            <option value="Processed">Processed</option>
                                                            <option value="Cancelled">Cancelled</option>
                                                        </select>
                                                    ) : (
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border dark:bg-opacity-20
                                                            ${inv.status === 'Processed' ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900 border-green-100 dark:border-green-800' :
                                                                inv.status === 'Pending' ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900 border-amber-100 dark:border-amber-800' :
                                                                    inv.status === 'Warning' ? 'text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900 border-orange-100 dark:border-orange-800' :
                                                                        'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900 border-red-100 dark:border-red-800'}`}>
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
                                                        <span className="text-slate-600 dark:text-slate-300 font-mono text-xs whitespace-nowrap">
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
                                                            className="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded px-2 py-1 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                        />
                                                    ) : <span className="text-slate-900 dark:text-slate-100">{inv.vendor_name}</span>}
                                                </td>
                                                <td className="px-6 py-3 text-slate-500 dark:text-slate-400 max-w-xs truncate" title={inv.subject}>
                                                    {inv.subject}
                                                </td>
                                                <td className="px-6 py-3 text-right font-mono text-slate-700 dark:text-slate-300">
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={editForm.total_amount || ""}
                                                            onChange={e => setEditForm({ ...editForm, total_amount: e.target.value === "" ? null : parseFloat(e.target.value) })}
                                                            className="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded px-2 py-1 w-24 text-right focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                        />
                                                    ) : `${inv.total_amount?.toFixed(2) || '0.00'} ${inv.currency}`}
                                                </td>
                                                <td className="px-6 py-3 text-right text-slate-500 dark:text-slate-400 font-mono">
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={editForm.vat_amount || ""}
                                                            onChange={e => setEditForm({ ...editForm, vat_amount: e.target.value === "" ? null : parseFloat(e.target.value) })}
                                                            className="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded px-2 py-1 w-20 text-right focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                        />
                                                    ) : `${inv.vat_amount?.toFixed(2) || '0.00'} ${inv.currency}`}
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-1 justify-end">
                                                        {isEditing ? (
                                                            <>
                                                                <button onClick={() => saveEdit(inv.id)} className="text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 p-1.5 rounded-md transition-colors" title="Save"><Check size={16} /></button>
                                                                <button onClick={cancelEdit} className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 p-1.5 rounded-md transition-colors" title="Cancel"><X size={16} /></button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button onClick={() => startEdit(inv)} className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-1.5 rounded-md transition-colors" title="Edit"><Edit2 size={16} /></button>
                                                                <button onClick={async () => {
                                                                    if (window.confirm("Are you sure you want to delete this invoice?")) {
                                                                        try {
                                                                            await deleteInvoice(inv.id);
                                                                            setInvoices(invoices.filter(i => i.id !== inv.id));
                                                                        } catch (err) {
                                                                            alert("Failed to delete");
                                                                        }
                                                                    }
                                                                }} className="text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded-md transition-colors" title="Delete"><Trash2 size={16} /></button>
                                                                {inv.download_url && (
                                                                    <a href={inv.download_url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-1.5 rounded-md transition-colors" title="Download PDF">
                                                                        <Download size={16} />
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
                                    <td colSpan="7" className="text-center py-12 text-slate-400 dark:text-slate-500 italic">
                                        No invoices match the current filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                {filteredInvoices.length > 0 && (
                    <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3 flex flex-col sm:flex-row items-center justify-between gap-4">
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
                                    className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-transparent transition-colors text-slate-500 dark:text-slate-400"
                                    title={t ? t('pagination.previous') : "Previous"}
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(Math.min(Math.ceil(filteredInvoices.length / itemsPerPage), currentPage + 1))}
                                    disabled={currentPage === Math.ceil(filteredInvoices.length / itemsPerPage)}
                                    className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-transparent transition-colors text-slate-500 dark:text-slate-400"
                                    title={t ? t('pagination.next') : "Next"}
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
