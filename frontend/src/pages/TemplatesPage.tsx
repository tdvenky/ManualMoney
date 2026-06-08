import { useEffect, useMemo, useState } from 'react';
import type { Category, Template, TemplateAllocation } from '../types';
import * as api from '../api/client';

interface FormAllocation {
  categoryId: string;
  allocatedAmount: string;
}

const emptyForm = () => ({ name: '', income: '', allocations: [] as FormAllocation[] });

export function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formIncome, setFormIncome] = useState('');
  const [formAllocations, setFormAllocations] = useState<FormAllocation[]>([]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  const loadData = async () => {
    try {
      const [tmpl, cats] = await Promise.all([api.getTemplates(), api.getCategories()]);
      setTemplates(tmpl);
      setCategories(cats);
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const resetForm = () => {
    const f = emptyForm();
    setFormName(f.name);
    setFormIncome(f.income);
    setFormAllocations(f.allocations);
  };

  const loadFormFrom = (t: Template) => {
    setFormName(t.name);
    setFormIncome(String(t.income));
    setFormAllocations(t.allocations.map(a => ({
      categoryId: a.categoryId,
      allocatedAmount: String(a.allocatedAmount),
    })));
  };

  const handleStartCreate = () => {
    resetForm();
    setEditingId(null);
    setShowCreate(true);
  };

  const handleStartEdit = (t: Template) => {
    loadFormFrom(t);
    setEditingId(t.id);
    setShowCreate(false);
  };

  const handleCancel = () => {
    setShowCreate(false);
    setEditingId(null);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      await api.deleteTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch {
      setError('Failed to delete template');
    }
  };

  const buildPayload = () => ({
    name: formName.trim(),
    income: parseFloat(formIncome),
    allocations: formAllocations
      .filter(a => a.categoryId && a.allocatedAmount)
      .map(a => ({ categoryId: a.categoryId, allocatedAmount: parseFloat(a.allocatedAmount) } as TemplateAllocation)),
  });

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createTemplate(buildPayload());
      setTemplates(prev => [...prev, created]);
      setShowCreate(false);
      resetForm();
    } catch {
      setError('Failed to create template');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      const updated = await api.updateTemplate(editingId, buildPayload());
      setTemplates(prev => prev.map(t => t.id === editingId ? updated : t));
      setEditingId(null);
      resetForm();
    } catch {
      setError('Failed to update template');
    }
  };

  const addAllocationRow = () => {
    setFormAllocations(prev => [...prev, { categoryId: '', allocatedAmount: '' }]);
  };

  const removeAllocationRow = (i: number) => {
    setFormAllocations(prev => prev.filter((_, idx) => idx !== i));
  };

  const updateAllocationRow = (i: number, field: keyof FormAllocation, value: string) => {
    setFormAllocations(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: value } : a));
  };

  const selectedCategoryIds = formAllocations.map(a => a.categoryId).filter(Boolean);

  const availableCategoriesFor = (i: number) =>
    categories.filter(c => !selectedCategoryIds.includes(c.id) || c.id === formAllocations[i].categoryId);

  const inputCls = 'border-[0.5px] border-slate-300 rounded-[7px] px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 w-full';

  const renderForm = (onSubmit: (e: React.FormEvent) => void, submitLabel: string) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Template Name</label>
          <input
            type="text"
            value={formName}
            onChange={e => setFormName(e.target.value)}
            placeholder="e.g. Biweekly Standard"
            className={inputCls}
            required
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Income Amount</label>
          <input
            type="number"
            value={formIncome}
            onChange={e => setFormIncome(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
            className={inputCls}
            required
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-medium text-slate-500">Allocations</label>
          <button
            type="button"
            onClick={addAllocationRow}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
          >
            + Add
          </button>
        </div>
        {formAllocations.length === 0 ? (
          <div className="text-xs text-slate-400 py-2">No allocations yet — click + Add to start.</div>
        ) : (
          <div className="space-y-2">
            {formAllocations.map((alloc, i) => (
              <div key={i} className="flex gap-2 items-center">
                <select
                  value={alloc.categoryId}
                  onChange={e => updateAllocationRow(i, 'categoryId', e.target.value)}
                  className="flex-1 border-[0.5px] border-slate-300 rounded-[7px] px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-emerald-500"
                  required
                >
                  <option value="">Select category</option>
                  {availableCategoriesFor(i).map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.type === 'SAVINGS' ? 'Savings' : 'Expense'})</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={alloc.allocatedAmount}
                  onChange={e => updateAllocationRow(i, 'allocatedAmount', e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-28 border-[0.5px] border-slate-300 rounded-[7px] px-3 py-2 text-sm font-mono text-slate-800 focus:outline-none focus:border-emerald-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => removeAllocationRow(i)}
                  className="text-slate-400 hover:text-red-500 text-lg leading-none px-1"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {(() => {
        const incomeVal = parseFloat(formIncome) || 0;
        const totalAllocated = Math.round(formAllocations.reduce((s, a) => s + (parseFloat(a.allocatedAmount) || 0), 0) * 100) / 100;
        const remaining = Math.round((incomeVal - totalAllocated) * 100) / 100;
        const isBalanced = incomeVal > 0 && remaining === 0;
        const canSubmit = isBalanced;

        return (
          <>
            <div className="rounded-[8px] border-[0.5px] border-slate-200 bg-slate-50 px-4 py-3 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Income</span>
                <span className="font-mono text-slate-700">{fmt(incomeVal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Allocated</span>
                <span className="font-mono text-slate-700">{fmt(totalAllocated)}</span>
              </div>
              <div className="border-t border-slate-200 pt-1.5 flex justify-between font-medium">
                <span className={remaining === 0 && incomeVal > 0 ? 'text-emerald-600' : remaining < 0 ? 'text-red-600' : 'text-amber-600'}>
                  {remaining === 0 && incomeVal > 0 ? 'Balanced' : remaining < 0 ? 'Over-allocated' : 'Remaining'}
                </span>
                <span className={`font-mono ${remaining === 0 && incomeVal > 0 ? 'text-emerald-600' : remaining < 0 ? 'text-red-600' : 'text-amber-600'}`}>
                  {remaining === 0 && incomeVal > 0 ? '✓' : fmt(Math.abs(remaining))}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={!canSubmit}
                className={`px-4 py-2 text-white text-sm rounded-[7px] transition-colors ${canSubmit ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-300 cursor-not-allowed'}`}
              >
                {submitLabel}
              </button>
              <button type="button" onClick={handleCancel} className="px-4 py-2 bg-slate-700 text-white text-sm rounded-[7px] hover:bg-slate-600">
                Cancel
              </button>
            </div>
          </>
        );
      })()}
    </form>
  );

  const renderTemplateCard = (t: Template) => {
    const expenseAllocs = t.allocations.filter(a => categoryMap.get(a.categoryId)?.type !== 'SAVINGS');
    const savingsAllocs = t.allocations.filter(a => categoryMap.get(a.categoryId)?.type === 'SAVINGS');

    return (
      <div key={t.id} className="bg-white rounded-[10px] border-[0.5px] border-slate-200">
        {editingId === t.id ? (
          <div className="p-5">
            <div className="text-sm font-semibold text-slate-700 mb-4">Edit Template</div>
            {renderForm(handleSaveEdit, 'Save Changes')}
          </div>
        ) : (
          <div className="p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="font-semibold text-slate-800">{t.name}</div>
                <div className="text-sm text-emerald-700 font-mono mt-0.5">{fmt(t.income)} income</div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleStartEdit(t)}
                  className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded border-[0.5px] border-slate-200 hover:border-slate-300"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="text-xs text-slate-500 hover:text-red-600 px-2 py-1 rounded border-[0.5px] border-slate-200 hover:border-red-200"
                >
                  Delete
                </button>
              </div>
            </div>

            {t.allocations.length === 0 ? (
              <div className="text-xs text-slate-400">No allocations</div>
            ) : (
              <div className="space-y-3">
                {expenseAllocs.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 tracking-wider mb-1.5">EXPENSES</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1">
                      {expenseAllocs.map((a, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-slate-600 truncate">{categoryMap.get(a.categoryId)?.name ?? <span className="text-slate-400 italic">Unknown</span>}</span>
                          <span className="font-mono text-slate-700 ml-2 shrink-0">{fmt(a.allocatedAmount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {savingsAllocs.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 tracking-wider mb-1.5">SAVINGS</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1">
                      {savingsAllocs.map((a, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-slate-600 truncate">{categoryMap.get(a.categoryId)?.name ?? <span className="text-slate-400 italic">Unknown</span>}</span>
                          <span className="font-mono text-emerald-600 ml-2 shrink-0">{fmt(a.allocatedAmount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="text-sm text-slate-400 py-12 text-center">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Templates</h1>
        {!showCreate && !editingId && (
          <button
            onClick={handleStartCreate}
            className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-[7px] hover:bg-emerald-700"
          >
            New Template
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border-[0.5px] border-red-200 text-red-700 px-4 py-3 rounded-[10px] text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-4 underline">Dismiss</button>
        </div>
      )}

      {showCreate && (
        <div className="bg-white rounded-[10px] border-[0.5px] border-slate-200 p-5">
          <div className="text-sm font-semibold text-slate-700 mb-4">New Template</div>
          {renderForm(handleSaveCreate, 'Create Template')}
        </div>
      )}

      {templates.length === 0 && !showCreate ? (
        <div className="bg-white rounded-[10px] border-[0.5px] border-slate-200 p-10 text-center text-sm text-slate-400">
          No templates yet. Create one to speed up pay period setup.
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map(t => renderTemplateCard(t))}
        </div>
      )}
    </div>
  );
}
