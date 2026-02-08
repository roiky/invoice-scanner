
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, AlertCircle, Play, CheckCircle, XCircle } from 'lucide-react';
import { getRules, createRule, updateRule, deleteRule } from '../api';
import { getLabelColor } from '../utils/colors';

export function RulesTab({ t, labels }) {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [editingRule, setEditingRule] = useState(null);

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        setLoading(true);
        try {
            const data = await getRules();
            setRules(data);
        } catch (err) {
            setError(t('rules.error_fetching'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            if (editingRule.id) {
                await updateRule(editingRule.id, editingRule);
            } else {
                await createRule(editingRule);
            }
            setEditingRule(null);
            fetchRules();
        } catch (err) {
            console.error(err);
            alert(t('rules.error_saving'));
        }
    };

    const handleToggleStatus = async (e, rule) => {
        e.stopPropagation();
        try {
            const updatedRule = { ...rule, is_active: !rule.is_active };
            await updateRule(rule.id, updatedRule);
            // Optimistically update local state for snappiness
            setRules(rules.map(r => r.id === rule.id ? updatedRule : r));
        } catch (err) {
            console.error(err);
            alert(t('rules.error_saving'));
            fetchRules(); // Revert on error
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!confirm(t('rules.delete_confirm'))) return;
        try {
            await deleteRule(id);
            fetchRules();
        } catch (err) {
            console.error(err);
            alert(t('rules.error_deleting'));
        }
    };

    const emptyCondition = { field: 'subject', operator: 'contains', value: '' };
    const emptyAction = { action_type: 'set_status', value: 'Processed' };

    const startCreate = () => {
        setEditingRule({
            name: '',
            conditions: [emptyCondition],
            actions: [emptyAction],
            logic: 'AND',
            is_active: true
        });
    };

    // --- Render List ---
    if (!editingRule) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 font-display">{t('rules.title')}</h2>
                        <p className="text-slate-500 mt-1">{t('rules.subtitle')}</p>
                    </div>
                    <button
                        onClick={startCreate}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 hover:-translate-y-0.5 transition-all flex items-center gap-2 text-sm"
                    >
                        <Plus size={18} /> {t('rules.create_new')}
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : rules.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                        <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Play size={24} className="text-slate-400 ml-1" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">{t('rules.no_rules')}</h3>
                        <p className="text-slate-500 mt-1 mb-4">{t('rules.create_first')}</p>
                        <button onClick={startCreate} className="text-blue-600 font-medium hover:underline">
                            {t('rules.create_new')}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {rules.map(rule => (
                            <div
                                key={rule.id}
                                onClick={() => setEditingRule(rule)}
                                className={`group bg-white rounded-xl border transition-all cursor-pointer hover:shadow-lg hover:-translate-y-1 flex flex-col justify-between ${rule.is_active
                                    ? 'border-slate-200 hover:border-blue-200'
                                    : 'border-slate-100 opacity-75 grayscale-[0.2] hover:opacity-100 hover:grayscale-0'
                                    }`}
                            >
                                <div className="p-5 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div
                                                onClick={(e) => handleToggleStatus(e, rule)}
                                                className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${rule.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                                title={rule.is_active ? "Deactivate Rule" : "Activate Rule"}
                                            >
                                                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${rule.is_active ? 'translate-x-4' : 'translate-x-0'}`} />
                                            </div>
                                            <h3 className="font-semibold text-base text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors" title={rule.name}>
                                                {rule.name}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="bg-slate-50 rounded-lg p-2.5 text-xs space-y-1">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">If</span>
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-medium ${rule.logic === 'OR' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
                                                    {rule.logic === 'OR' ? 'ANY' : 'ALL'}
                                                </span>
                                            </div>
                                            {rule.conditions.slice(0, 2).map((c, i) => (
                                                <div key={i} className="text-slate-600 flex items-center gap-1.5 ml-1 truncate">
                                                    <span className="w-1 h-1 rounded-full bg-slate-400 flex-shrink-0"></span>
                                                    <span className="truncate">{c.field} <span className="text-slate-400">{c.operator}</span> <span className="font-medium text-slate-800">"{c.value}"</span></span>
                                                </div>
                                            ))}
                                            {rule.conditions.length > 2 && <div className="text-[10px] text-slate-400 pl-2.5">+{rule.conditions.length - 2} more...</div>}
                                        </div>

                                        <div className="bg-blue-50/50 rounded-lg p-2.5 text-xs space-y-1 border border-blue-50">
                                            <span className="font-bold text-blue-400 uppercase tracking-wider block mb-0.5 text-[10px]">Then</span>
                                            {rule.actions.slice(0, 2).map((a, i) => (
                                                <div key={i} className="text-slate-700 flex items-center gap-1.5 ml-1 truncate">
                                                    <span className="w-1 h-1 rounded-full bg-blue-400 flex-shrink-0"></span>
                                                    <span className="truncate">
                                                        {a.action_type === 'set_status' ? (
                                                            <>Status: <span className="font-medium text-blue-700">{a.value}</span></>
                                                        ) : (
                                                            (() => {
                                                                const labels = a.value ? a.value.split(',').map(l => l.trim()).filter(l => l) : [];
                                                                return (
                                                                    <div className="flex items-center gap-1 flex-wrap">
                                                                        Label:
                                                                        {labels.map((label, idx) => {
                                                                            const color = getLabelColor(label);
                                                                            return (
                                                                                <span key={idx} className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${color.bg} ${color.text} ${color.border}`}>
                                                                                    {label}
                                                                                </span>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                );
                                                            })()
                                                        )}
                                                    </span>
                                                </div>
                                            ))}
                                            {rule.actions.length > 2 && <div className="text-[10px] text-blue-400 pl-2.5">+{rule.actions.length - 2} more...</div>}
                                        </div>
                                    </div>
                                </div>
                                <div className="px-5 py-3 border-t border-slate-50 flex justify-end gap-2 bg-slate-50/50 rounded-b-xl group-hover:bg-white transition-colors">
                                    <button
                                        onClick={(e) => handleDelete(e, rule.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                        title={t('actions.delete')}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // --- Render Form ---
    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 font-display">{editingRule.id ? t('rules.edit_rule') : t('rules.create_rule')}</h2>
                    <p className="text-slate-500 text-sm mt-1">Configure automation conditions and actions.</p>
                </div>
                <button onClick={() => setEditingRule(null)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors">
                    <X size={24} />
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8 space-y-8">
                    {/* Name & Active */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-3">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">{t('rules.rule_name')}</label>
                            <input
                                type="text"
                                value={editingRule.name}
                                onChange={e => setEditingRule({ ...editingRule, name: e.target.value })}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                placeholder="e.g., Mark Amazon as Expenses"
                            />
                        </div>
                        <div className="flex items-end pb-1">
                            <label className="flex items-center gap-3 cursor-pointer select-none p-3 border border-slate-200 rounded-lg w-full hover:bg-slate-50 transition-colors">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={editingRule.is_active}
                                        onChange={e => setEditingRule({ ...editingRule, is_active: e.target.checked })}
                                        className="peer sr-only"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </div>
                                <span className="text-sm font-medium text-slate-700">{t('rules.is_active')}</span>
                            </label>
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Conditions */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1 h-4 bg-slate-800 rounded-full"></span>
                                {t('rules.conditions')}
                            </h3>

                            <div className="flex items-center gap-2">
                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                    <button
                                        onClick={() => setEditingRule({ ...editingRule, logic: 'AND' })}
                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${(!editingRule.logic || editingRule.logic === 'AND') ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Match ALL (AND)
                                    </button>
                                    <button
                                        onClick={() => setEditingRule({ ...editingRule, logic: 'OR' })}
                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${(editingRule.logic === 'OR') ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Match ANY (OR)
                                    </button>
                                </div>

                                <button
                                    onClick={() => setEditingRule({ ...editingRule, conditions: [...editingRule.conditions, emptyCondition] })}
                                    className="text-xs text-blue-600 font-medium hover:bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 hover:border-blue-200 transition-colors"
                                >
                                    + Add Condition
                                </button>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {editingRule.conditions.map((cond, idx) => (
                                <div key={idx} className="flex flex-wrap md:flex-nowrap gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-200 group hover:border-slate-300 transition-colors">
                                    <span className="text-xs font-mono font-bold text-slate-400 w-6 text-center">{idx + 1}.</span>
                                    <select
                                        className="text-sm border-slate-300 rounded-lg px-3 py-2 flex-grow focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none"
                                        value={cond.field}
                                        onChange={e => {
                                            const newConds = [...editingRule.conditions];
                                            newConds[idx].field = e.target.value;
                                            setEditingRule({ ...editingRule, conditions: newConds });
                                        }}
                                    >
                                        <option value="sender_email">Sender Email</option>
                                        <option value="subject">Subject</option>
                                        <option value="vendor_name">Vendor Name</option>
                                        <option value="total_amount">Amount</option>
                                    </select>
                                    <select
                                        className="text-sm border-slate-300 rounded-lg px-3 py-2 w-full md:w-40 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none"
                                        value={cond.operator}
                                        onChange={e => {
                                            const newConds = [...editingRule.conditions];
                                            newConds[idx].operator = e.target.value;
                                            setEditingRule({ ...editingRule, conditions: newConds });
                                        }}
                                    >
                                        <option value="contains">Contains</option>
                                        <option value="equals">Equals</option>
                                        <option value="starts_with">Starts With</option>
                                        <option value="ends_with">Ends With</option>
                                        <option value="gt">Greater Than</option>
                                        <option value="lt">Less Than</option>
                                    </select>
                                    <input
                                        type="text"
                                        className="text-sm border-slate-300 rounded-lg px-3 py-2 flex-[2] focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none"
                                        placeholder="Value..."
                                        value={cond.value}
                                        onChange={e => {
                                            const newConds = [...editingRule.conditions];
                                            newConds[idx].value = e.target.value;
                                            setEditingRule({ ...editingRule, conditions: newConds });
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            const newConds = editingRule.conditions.filter((_, i) => i !== idx);
                                            setEditingRule({ ...editingRule, conditions: newConds });
                                        }}
                                        className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Actions */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                                {t('rules.actions')}
                            </h3>
                            <button
                                onClick={() => setEditingRule({ ...editingRule, actions: [...editingRule.actions, emptyAction] })}
                                className="text-xs text-blue-600 font-medium hover:bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 hover:border-blue-200 transition-colors"
                            >
                                + Add Action
                            </button>
                        </div>
                        <div className="space-y-3">
                            {editingRule.actions.map((action, idx) => (
                                <div key={idx} className="flex flex-wrap md:flex-nowrap gap-3 items-center bg-blue-50/30 p-3 rounded-xl border border-blue-100 group hover:border-blue-200 transition-colors">
                                    <span className="text-xs font-mono font-bold text-blue-400/70 w-6 text-center">{idx + 1}.</span>
                                    <select
                                        className="text-sm border-slate-300 rounded-lg px-3 py-2 w-full md:w-48 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none"
                                        value={action.action_type}
                                        onChange={e => {
                                            const newActions = [...editingRule.actions];
                                            newActions[idx].action_type = e.target.value;
                                            setEditingRule({ ...editingRule, actions: newActions });
                                        }}
                                    >
                                        <option value="set_status">Set Status</option>
                                        <option value="add_label">Add Label</option>
                                    </select>

                                    {action.action_type === 'set_status' ? (
                                        <div className="flex gap-1">
                                            {[
                                                { val: 'Processed', color: 'green', icon: <CheckCircle size={12} /> },
                                                { val: 'Pending', color: 'amber', icon: <AlertCircle size={12} /> },
                                                { val: 'Cancelled', color: 'red', icon: <XCircle size={12} /> }
                                            ].map(({ val, color, icon }) => (
                                                <button
                                                    key={val}
                                                    onClick={() => {
                                                        const newActions = [...editingRule.actions];
                                                        newActions[idx].value = val;
                                                        setEditingRule({ ...editingRule, actions: newActions });
                                                    }}
                                                    className={`px-2 py-1.5 rounded text-xs font-bold border transition-all flex items-center gap-1.5
                                                    ${action.value === val
                                                            ? `bg-${color}-100 text-${color}-700 border-${color}-300 shadow-sm`
                                                            : `bg-white text-slate-400 border-slate-200 hover:border-${color}-300 hover:text-${color}-600`}`}
                                                >
                                                    {icon} {val}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-1.5 flex-grow bg-white p-2 rounded-lg border border-slate-200">
                                            {(labels || []).map(label => {
                                                const currentLabels = action.value ? action.value.split(',').map(l => l.trim()) : [];
                                                // Clean up any empty strings from split
                                                const cleanLabels = currentLabels.filter(l => l);
                                                const isSelected = cleanLabels.includes(label);
                                                const color = getLabelColor(label);

                                                return (
                                                    <button
                                                        key={label}
                                                        onClick={() => {
                                                            let newLabels;
                                                            if (isSelected) {
                                                                newLabels = cleanLabels.filter(l => l !== label);
                                                            } else {
                                                                newLabels = [...cleanLabels, label];
                                                            }
                                                            const newActions = [...editingRule.actions];
                                                            newActions[idx].value = newLabels.join(',');
                                                            setEditingRule({ ...editingRule, actions: newActions });
                                                        }}
                                                        className={`px-2 py-1 rounded text-[10px] border transition-all ${isSelected
                                                            ? `${color.bg} ${color.text} ${color.border} font-bold shadow-sm`
                                                            : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'
                                                            }`}
                                                    >
                                                        {label}
                                                    </button>
                                                )
                                            })}
                                            {(labels || []).length === 0 && <span className="text-xs text-slate-400 italic">No labels available</span>}
                                        </div>
                                    )}
                                    <button
                                        onClick={() => {
                                            const newActions = editingRule.actions.filter((_, i) => i !== idx);
                                            setEditingRule({ ...editingRule, actions: newActions });
                                        }}
                                        className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-50 px-8 py-4 border-t border-slate-200 flex justify-between items-center">
                        <button
                            onClick={() => {
                                if (confirm(t('rules.delete_confirm'))) {
                                    // Close modal (if we had one) or iterate back
                                    // Actually here we are in create/edit mode. 
                                    // Ideally we show Delete only if editing.
                                    if (editingRule.id) handleDelete({ stopPropagation: () => { } }, editingRule.id);
                                    else setEditingRule(null);
                                }
                            }}
                            className={`text-red-500 text-sm font-medium hover:underline ${!editingRule.id ? 'invisible' : ''}`}
                        >
                            {t('actions.delete')}
                        </button>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setEditingRule(null)}
                                className="px-5 py-2.5 text-slate-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-lg font-medium transition-all"
                            >
                                {t('actions.cancel')}
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium flex items-center gap-2 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 hover:-translate-y-0.5 transition-all"
                            >
                                <Save size={18} />
                                {t('actions.save')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
