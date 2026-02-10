import React, { useState } from 'react';
import { Tag, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { getLabelColor } from '../utils/colors';

export function LabelManager({ labels, onAddLabel, onDeleteLabel, t = (s) => s }) {
    const [newLabel, setNewLabel] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);

    const handleAdd = async () => {
        if (newLabel.trim()) {
            await onAddLabel(newLabel.trim());
            setNewLabel("");
        }
    };

    return (
        <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300 ${isExpanded ? 'shadow-md ring-1 ring-blue-100 dark:ring-blue-900/30' : 'hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800'}`}>
            <div
                className="p-4 flex justify-between items-center cursor-pointer bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-200 font-semibold text-sm">
                    <Tag size={16} className="text-blue-500" />
                    <span>{t('labels.title')}</span>
                    <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] px-2 py-0.5 rounded-full font-bold">{labels.length}</span>
                </div>
                <button className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
            </div>

            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="flex flex-col gap-4">
                        {/* Tags List */}
                        <div className="flex flex-wrap gap-2">
                            {labels.length > 0 ? (
                                labels.map(label => {
                                    const color = getLabelColor(label);
                                    return (
                                        <span key={label} className={`group inline-flex items-center gap-1.5 px-3 py-1 ${color.bg} ${color.text} ${color.border} dark:bg-opacity-20 border rounded-full text-xs font-medium hover:bg-white dark:hover:bg-slate-800 hover:${color.border} hover:shadow-sm transition-all`}>
                                            {label}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDeleteLabel(label); }}
                                                className={`text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full p-0.5 transition-colors opacity-0 group-hover:opacity-100`}
                                                title="Delete label"
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>
                                    );
                                })
                            ) : (
                                <p className="text-slate-400 text-xs italic">{t('labels.no_labels')}</p>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="flex gap-2 pt-2 border-t border-slate-50 dark:border-slate-800">
                            <input
                                type="text"
                                value={newLabel}
                                onChange={(e) => setNewLabel(e.target.value)}
                                placeholder={t('labels.placeholder')}
                                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                            />
                            <button
                                onClick={handleAdd}
                                disabled={!newLabel.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all flex items-center gap-2"
                            >
                                <Plus size={16} /> {t('labels.add')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
