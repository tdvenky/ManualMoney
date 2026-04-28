import { useState } from 'react';

interface SavingsOption {
  id: string;
  categoryName: string;
}

interface Props {
  payPeriod: { payDate: string; endDate: string };
  expenseCategoryName: string;
  remainingBalance: number;
  savingsAllocations: SavingsOption[];
  onSubmit: (data: { savingsAllocationId: string; amount: number; date: string; notes?: string }) => Promise<void>;
  onClose: () => void;
}

export function MoveSurplusToSavingsModal({ payPeriod, expenseCategoryName, remainingBalance, savingsAllocations, onSubmit, onClose }: Props) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const today = new Date().toISOString().split('T')[0];
  const clamp = (d: string) => d < payPeriod.payDate ? payPeriod.payDate : d > payPeriod.endDate ? payPeriod.endDate : d;

  const [amount, setAmount] = useState(String(remainingBalance));
  const [savingsAllocationId, setSavingsAllocationId] = useState(savingsAllocations[0]?.id ?? '');
  const [date, setDate] = useState(clamp(today));
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedAmount = parseFloat(amount) || 0;
  const overMax = parsedAmount > remainingBalance + 0.005;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!savingsAllocationId || parsedAmount <= 0 || overMax) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ savingsAllocationId, amount: parsedAmount, date, notes: notes || undefined });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to move surplus');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full border-[0.5px] border-slate-300 rounded-[7px] px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-emerald-500";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[10px] w-full max-w-sm p-6 border-[0.5px] border-slate-200">
        <div className="flex justify-between items-center mb-1">
          <h2 className="text-base font-bold text-slate-800">Save Surplus</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>
        <div className="text-[11px] text-slate-400 mb-1">{expenseCategoryName}</div>
        <div className="text-[11px] text-slate-500 mb-5">
          Available: <span className="font-mono text-emerald-700">{fmt(remainingBalance)}</span>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border-[0.5px] border-red-200 text-red-700 px-3 py-2 rounded-[7px] text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className={`${inputClass} font-mono ${overMax ? 'border-red-400' : ''}`}
              placeholder="0.00"
              required
              autoFocus
            />
            {overMax && (
              <div className="text-[11px] text-red-500 mt-1">Cannot exceed remaining balance of {fmt(remainingBalance)}</div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Move to</label>
            <select
              value={savingsAllocationId}
              onChange={e => setSavingsAllocationId(e.target.value)}
              className={inputClass}
              required
            >
              {savingsAllocations.map(s => (
                <option key={s.id} value={s.id}>{s.categoryName}</option>
              ))}
            </select>
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
              placeholder="e.g. Leftover from groceries"
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
              disabled={submitting || overMax || parsedAmount <= 0}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-[7px] text-sm hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Surplus'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
