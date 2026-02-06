import React, { useState } from 'react';
import { Upload, X, Plus, Calendar, DollarSign, FileText } from 'lucide-react';
import { DateInput } from './DateInput';

export function ManualEntryModal({ isOpen, onClose, onSave, availableLabels = [], t = (s) => s }) {
    const [formData, setFormData] = useState({
        vendor_name: '',
        invoice_date: new Date().toISOString().split('T')[0],
        total_amount: '',
        currency: 'ILS',
        subject: '',
    });
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = new FormData();
            data.append('vendor_name', formData.vendor_name);
            data.append('invoice_date', formData.invoice_date);
            data.append('total_amount', formData.total_amount);
            data.append('currency', formData.currency);
            data.append('subject', formData.subject);
            if (file) {
                data.append('file', file);
            }

            const res = await fetch('http://127.0.0.1:8000/invoices/manual', {
                method: 'POST',
                body: data,
            });

            if (!res.ok) throw new Error("Failed to create invoice");

            const newInvoice = await res.json();
            onSave(newInvoice);
            onClose();

            // Reset form
            setFormData({
                vendor_name: '',
                invoice_date: new Date().toISOString().split('T')[0],
                total_amount: '',
                currency: 'ILS',
                subject: '',
            });
            setFile(null);

        } catch (err) {
            console.error(err);
            alert("Error creating invoice");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-semibold text-lg text-slate-800">{t('manual.title')}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* File Upload Area */}
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                        <input
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            accept=".pdf,image/*"
                            onChange={(e) => setFile(e.target.files[0])}
                        />
                        <div className="flex flex-col items-center gap-2 text-slate-500">
                            {file ? (
                                <>
                                    <FileText className="text-blue-500" size={32} />
                                    <span className="text-sm font-medium text-slate-700">{file.name}</span>
                                    <span className="text-xs text-blue-600">{t('manual.file_change')}</span>
                                </>
                            ) : (
                                <>
                                    <Upload className="text-slate-400" size={32} />
                                    <span className="text-sm">{t('manual.file_placeholder')}</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase">{t('table.date')}</label>
                            <DateInput
                                required
                                value={formData.invoice_date}
                                onChange={val => setFormData({ ...formData, invoice_date: val })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase">{t('manual.currency')}</label>
                            <select
                                value={formData.currency}
                                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                <option value="ILS">ILS (₪)</option>
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">{t('table.vendor')}</label>
                        <input
                            required
                            type="text"
                            placeholder={t('manual.vendor_placeholder')}
                            value={formData.vendor_name}
                            onChange={e => setFormData({ ...formData, vendor_name: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">{t('table.amount')}</label>
                        <div className="relative">
                            <input
                                required
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.total_amount}
                                onChange={e => setFormData({ ...formData, total_amount: e.target.value })}
                                className="w-full rtl:pl-3 rtl:pr-8 ltr:pl-8 ltr:pr-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                            <DollarSign className="absolute ltr:left-2.5 rtl:right-2.5 top-2.5 text-slate-400" size={16} />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">{t('manual.subject')}</label>
                        <input
                            type="text"
                            placeholder={t('manual.subject_placeholder')}
                            value={formData.subject}
                            onChange={e => setFormData({ ...formData, subject: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                            ) : (
                                <Plus size={18} />
                            )}
                            {loading ? t('manual.creating') : t('manual.add_button')}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
