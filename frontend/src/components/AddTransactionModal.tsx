import { useState } from 'react';
import type { Category, SubCategory, Allocation, Priority } from '../types';
import { PRIORITY_LABELS } from '../types';

interface InitialData {
  transactionId: string;
  categoryId: string;
  subCategoryId: string;
  description: string;
  amount: number;
  date: string;
  priority: Priority;
  notes?: string;
}

interface Props {
  payPeriod: { payDate: string; endDate: string };
  allocations: Allocation[];
  categories: Category[];
  subCategories: SubCategory[];
  initialData?: InitialData;
  onSubmit: (allocationId: string, data: {
    description: string;
    amount: number;
    date: string;
    subCategoryId: string;
    priority: Priority;
    notes?: string;
  }) => Promise<void>;
  onClose: () => void;
}

export function AddTransactionModal({ payPeriod, allocations, categories, subCategories, initialData, onSubmit, onClose }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const isEdit = initialData != null;

  const [date, setDate] = useState(initialData?.date ?? today);
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? '');
  const [subCategoryId, setSubCategoryId] = useState(initialData?.subCategoryId ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [amount, setAmount] = useState(initialData ? String(initialData.amount) : '');
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [priority, setPriority] = useState<Priority>(initialData?.priority ?? 'NEED_IT');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allocationForCategory = allocations.find(a => a.categoryId === categoryId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocationForCategory || !subCategoryId || !amount) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(allocationForCategory.id, {
        description,
        amount: parseFloat(amount),
        date,
        subCategoryId,
        priority,
        notes: notes || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : isEdit ? 'Failed to update transaction' : 'Failed to add transaction';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full border-[0.5px] border-slate-300 rounded-[7px] px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-emerald-500";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[10px] w-full max-w-md max-h-full overflow-y-auto p-6 border-[0.5px] border-slate-200">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-base font-bold text-slate-800">{isEdit ? 'Edit Transaction' : 'Add Transaction'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border-[0.5px] border-red-200 text-red-700 px-3 py-2 rounded-[7px] text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Date</label>
            <input
              type="date"
              value={date}
              min={payPeriod.payDate}
              max={payPeriod.endDate}
              onChange={e => setDate(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Category</label>
            <select
              value={categoryId}
              onChange={e => { setCategoryId(e.target.value); setSubCategoryId(''); }}
              className={inputClass}
              required
            >
              <option value="">Select category...</option>
              {allocations.map(a => {
                const cat = categories.find(c => c.id === a.categoryId);
                return cat ? (
                  <option key={a.categoryId} value={a.categoryId}>{cat.name}</option>
                ) : null;
              })}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Sub-Category</label>
            <select
              value={subCategoryId}
              onChange={e => setSubCategoryId(e.target.value)}
              className={inputClass}
              required
            >
              <option value="">Select sub-category...</option>
              {subCategories.map(sc => (
                <option key={sc.id} value={sc.id}>{sc.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className={inputClass}
              placeholder="e.g. Pepper House"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className={`${inputClass} font-mono`}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className={inputClass}
              placeholder="Optional note..."
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Priority</label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as Priority)}
              className={inputClass}
              required
            >
              {(Object.entries(PRIORITY_LABELS) as [Priority, string][]).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-[7px] text-sm hover:bg-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !allocationForCategory}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-[7px] text-sm hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? (isEdit ? 'Saving...' : 'Adding...') : (isEdit ? 'Save Changes' : 'Add Transaction')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
