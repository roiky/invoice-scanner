import React, { useState } from 'react';
import { Tag, Plus, X } from 'lucide-react';

export function LabelManager({ labels, onAddLabel, onDeleteLabel }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [newLabel, setNewLabel] = useState("");

    const handleAdd = async () => {
        if (newLabel.trim()) {
            await onAddLabel(newLabel.trim());
            setNewLabel("");
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm mb-4">
            <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <Tag size={18} />
                    <span>Manage Labels ({labels.length})</span>
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-800">
                    {isExpanded ? "Close" : "Expand"}
                </button>
            </div>

            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                    {/* List */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {labels.map(label => (
                            <span key={label} className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                                {label}
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDeleteLabel(label); }}
                                    className="hover:text-red-500 ml-1"
                                >
                                    <X size={14} />
                                </button>
                            </span>
                        ))}
                    </div>

                    {/* Add New */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newLabel}
                            onChange={(e) => setNewLabel(e.target.value)}
                            placeholder="New label name..."
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        />
                        <button
                            onClick={handleAdd}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
                        >
                            <Plus size={16} /> Add
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
