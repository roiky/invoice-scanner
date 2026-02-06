import React, { useState } from 'react';
import { Tag, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';

export function LabelManager({ labels, onAddLabel, onDeleteLabel }) {
    const [newLabel, setNewLabel] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);

    const handleAdd = async () => {
        if (newLabel.trim()) {
            await onAddLabel(newLabel.trim());
            setNewLabel("");
        }
    };

    return (
        <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 ${isExpanded ? 'shadow-md ring-1 ring-blue-100' : 'hover:shadow-md hover:border-blue-200'}`}>
            <div
                className="p-4 flex justify-between items-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2.5 text-slate-700 font-semibold text-sm">
                    <Tag size={16} className="text-blue-500" />
                    <span>Manage Labels</span>
                    <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold">{labels.length}</span>
                </div>
                <button className="text-slate-400 hover:text-blue-600 transition-colors bg-white border border-slate-200 rounded-lg p-1">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
            </div>

            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-4 border-t border-slate-100 bg-white">
                    <div className="flex flex-col gap-4">
                        {/* Tags List */}
                        <div className="flex flex-wrap gap-2">
                            {labels.length > 0 ? (
                                labels.map(label => (
                                    <span key={label} className="group inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-600 border border-slate-200 rounded-full text-xs font-medium hover:bg-white hover:border-blue-200 hover:text-blue-600 hover:shadow-sm transition-all">
                                        {label}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDeleteLabel(label); }}
                                            className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full p-0.5 transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete label"
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))
                            ) : (
                                <p className="text-slate-400 text-xs italic">No labels created yet.</p>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="flex gap-2 pt-2 border-t border-slate-50">
                            <input
                                type="text"
                                value={newLabel}
                                onChange={(e) => setNewLabel(e.target.value)}
                                placeholder="New label name..."
                                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                            />
                            <button
                                onClick={handleAdd}
                                disabled={!newLabel.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all flex items-center gap-2"
                            >
                                <Plus size={16} /> Add
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
