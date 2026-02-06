import React, { useState, useMemo } from 'react';
import { FileText, CheckCircle, AlertCircle, Download, Search } from 'lucide-react';

export function InvoiceTable({ invoices }) {
    const [filterText, setFilterText] = useState("");
    const [filterStatus, setFilterStatus] = useState("all"); // all, processed, pending

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
                        inv.status === 'Pending';

            return matchesText && matchesStatus;
        });
    }, [invoices, filterText, filterStatus]);

    // CSV Export Logic
    const downloadCSV = () => {
        if (!filteredInvoices.length) return;

        const headers = ["ID", "Date", "Vendor", "Subject", "Amount", "Currency", "VAT", "Status"];
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
                inv.is_processed ? "Processed" : "Pending"
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
                        className="pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-80"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-slate-700 font-medium"
                    >
                        <option value="all">All Status</option>
                        <option value="processed">Processed</option>
                        <option value="pending">Pending</option>
                    </select>

                    <button
                        onClick={downloadCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-md font-medium transition-colors ml-auto sm:ml-0"
                    >
                        <Download size={18} />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Vendor</th>
                                <th className="px-6 py-3">Subject</th>
                                <th className="px-6 py-3 text-right">Amount</th>
                                <th className="px-6 py-3 text-right">VAT</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredInvoices.length > 0 ? (
                                filteredInvoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-3">
                                            {inv.status === 'Processed' ? (
                                                <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium border border-green-100">
                                                    <CheckCircle size={12} /> Processed
                                                </span>
                                            ) : inv.status === 'Cancelled' ? (
                                                <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-medium border border-red-100">
                                                    <XCircle size={12} /> Cancelled
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-full text-xs font-medium border border-amber-100">
                                                    <AlertCircle size={12} /> Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3 text-slate-600">
                                            {inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString('en-GB') : '-'}
                                        </td>
                                        <td className="px-6 py-3 font-medium text-slate-900">{inv.vendor_name}</td>
                                        <td className="px-6 py-3 text-slate-500 max-w-xs truncate" title={inv.subject}>{inv.subject}</td>
                                        <td className="px-6 py-3 text-right font-medium text-slate-900">
                                            {inv.total_amount?.toFixed(2)} {inv.currency}
                                        </td>
                                        <td className="px-6 py-3 text-right text-slate-500">
                                            {inv.vat_amount?.toFixed(2)} {inv.currency}
                                        </td>
                                        <td className="px-6 py-3">
                                            {inv.download_url ? (
                                                <a
                                                    href={inv.download_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 text-xs font-medium border border-blue-200 hover:border-blue-400 px-3 py-1 rounded transition-colors inline-block"
                                                >
                                                    View PDF
                                                </a>
                                            ) : (
                                                <span className="text-slate-400 text-xs">No PDF</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
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
