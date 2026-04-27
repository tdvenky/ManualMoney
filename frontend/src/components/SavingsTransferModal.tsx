import { useState } from 'react';
import type { SavingsTransfer } from '../types';

interface Props {
  payPeriod: { payDate: string; endDate: string };
  categoryName: string;
  initialData?: SavingsTransfer;
  onSubmit: (data: { amount: number; date: string; notes?: string }) => Promise<void>;
  onClose: () => void;
}

export function SavingsTransferModal({ payPeriod, categoryName, initialData, onSubmit, onClose }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const isEdit = initialData != null;

  const [amount, setAmount] = useState(initialData ? String(initialData.amount) : '');
  const [date, setDate] = useState(initialData?.date ?? today);
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        amount: parseFloat(amount),
        date,
        notes: notes || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : isEdit ? 'Failed to update transfer' : 'Failed to record transfer';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full border-[0.5px] border-slate-300 rounded-[7px] px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-emerald-500";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[10px] w-full max-w-sm p-6 border-[0.5px] border-slate-200">
        <div className="flex justify-between items-center mb-1">
          <h2 className="text-base font-bold text-slate-800">
            {isEdit ? 'Edit Savings Transfer' : 'Record Savings'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>
        <div className="text-[11px] text-slate-400 mb-5">{categoryName}</div>

        {error && (
          <div className="mb-4 bg-red-50 border-[0.5px] border-red-200 text-red-700 px-3 py-2 rounded-[7px] text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Amount Saved</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className={`${inputClass} font-mono`}
              placeholder="0.00"
              required
              autoFocus
            />
          </div>

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
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className={inputClass}
              placeholder="e.g. Transferred to Marcus HYSA"
            />
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
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-[7px] text-sm hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? (isEdit ? 'Saving...' : 'Recording...') : (isEdit ? 'Save Changes' : 'Record')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
