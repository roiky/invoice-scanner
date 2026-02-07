
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, AlertCircle, Play, CheckCircle } from 'lucide-react';
import { getRules, createRule, updateRule, deleteRule } from '../api';

export function RulesTab({ t, labels }) {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [editingRule, setEditingRule] = useState(null); // null = list mode, {} = create mode, {id...} = edit mode

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

    const handleDelete = async (id) => {
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
            is_active: true
        });
    };

    // --- Render List ---
    if (!editingRule) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">{t('rules.title')}</h2>
                        <p className="text-slate-500">{t('rules.subtitle')}</p>
                    </div>
                    <button onClick={startCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors">
                        <Plus size={18} /> {t('rules.create_new')}
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-slate-400">{t('common.loading')}</div>
                ) : rules.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                        <Play size={48} className="mx-auto mb-3 text-slate-300" />
                        <p className="text-slate-500">{t('rules.no_rules')}</p>
                        <button onClick={startCreate} className="text-blue-600 font-medium mt-2 hover:underline">
                            {t('rules.create_first')}
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {rules.map(rule => (
                            <div key={rule.id} className={`bg-white p-4 rounded-xl border ${rule.is_active ? 'border-slate-200' : 'border-slate-100 opacity-60'} shadow-sm hover:shadow-md transition-all`}>
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-semibold text-lg text-slate-800">{rule.name}</h3>
                                            {!rule.is_active && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Inactive</span>}
                                        </div>
                                        <div className="text-sm text-slate-600">
                                            <span className="font-medium text-slate-700">If:</span> {rule.conditions.map(c => `${c.field} ${c.operator} "${c.value}"`).join(' AND ')}
                                        </div>
                                        <div className="text-sm text-slate-600">
                                            <span className="font-medium text-slate-700">Then:</span> {rule.actions.map(a => `${a.action_type} "${a.value}"`).join(', ')}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setEditingRule(rule)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(rule.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
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
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">{editingRule.id ? t('rules.edit_rule') : t('rules.create_rule')}</h2>
                <button onClick={() => setEditingRule(null)} className="text-slate-500 hover:bg-slate-100 p-2 rounded-full">
                    <X size={20} />
                </button>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                {/* Name & Active */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('rules.rule_name')}</label>
                        <input
                            type="text"
                            value={editingRule.name}
                            onChange={e => setEditingRule({ ...editingRule, name: e.target.value })}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g., Mark Amazon as Expenses"
                        />
                    </div>
                    <div className="flex items-end pb-2">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={editingRule.is_active}
                                onChange={e => setEditingRule({ ...editingRule, is_active: e.target.checked })}
                                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-slate-700">{t('rules.is_active')}</span>
                        </label>
                    </div>
                </div>

                {/* Conditions */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">{t('rules.conditions')} (AND)</h3>
                        <button
                            onClick={() => setEditingRule({ ...editingRule, conditions: [...editingRule.conditions, emptyCondition] })}
                            className="text-xs text-blue-600 font-medium hover:bg-blue-50 px-2 py-1 rounded"
                        >
                            + Add Condition
                        </button>
                    </div>
                    <div className="space-y-2">
                        {editingRule.conditions.map((cond, idx) => (
                            <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                                <select
                                    className="text-sm border-slate-300 rounded px-2 py-1.5 flex-1"
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
                                    className="text-sm border-slate-300 rounded px-2 py-1.5 w-32"
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
                                    className="text-sm border-slate-300 rounded px-2 py-1.5 flex-1"
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
                                    className="text-slate-400 hover:text-red-500"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">{t('rules.actions')}</h3>
                        <button
                            onClick={() => setEditingRule({ ...editingRule, actions: [...editingRule.actions, emptyAction] })}
                            className="text-xs text-blue-600 font-medium hover:bg-blue-50 px-2 py-1 rounded"
                        >
                            + Add Action
                        </button>
                    </div>
                    <div className="space-y-2">
                        {editingRule.actions.map((action, idx) => (
                            <div key={idx} className="flex gap-2 items-center bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                                <select
                                    className="text-sm border-slate-300 rounded px-2 py-1.5 w-40"
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
                                    <select
                                        className="text-sm border-slate-300 rounded px-2 py-1.5 flex-1"
                                        value={action.value}
                                        onChange={e => {
                                            const newActions = [...editingRule.actions];
                                            newActions[idx].value = e.target.value;
                                            setEditingRule({ ...editingRule, actions: newActions });
                                        }}
                                    >
                                        <option value="Processed">Processed</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                ) : (
                                    <select
                                        className="text-sm border-slate-300 rounded px-2 py-1.5 flex-1"
                                        value={action.value}
                                        onChange={e => {
                                            const newActions = [...editingRule.actions];
                                            newActions[idx].value = e.target.value;
                                            setEditingRule({ ...editingRule, actions: newActions });
                                        }}
                                    >
                                        <option value="">{t('rules.select_label') || "Select Label..."}</option>
                                        {(labels || []).map(label => (
                                            <option key={label} value={label}>{label}</option>
                                        ))}
                                    </select>
                                )}

                                <button
                                    onClick={() => {
                                        const newActions = editingRule.actions.filter((_, i) => i !== idx);
                                        setEditingRule({ ...editingRule, actions: newActions });
                                    }}
                                    className="text-slate-400 hover:text-red-500"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                        onClick={() => setEditingRule(null)}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                    >
                        {t('actions.cancel')}
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium flex items-center gap-2 shadow-lg shadow-blue-600/20"
                    >
                        <Save size={18} />
                        {t('actions.save')}
                    </button>
                </div>
            </div>
        </div>
    );
}
