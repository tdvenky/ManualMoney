import { useState } from 'react';
import type { ClosePayPeriodRequest } from '../types';

interface SavingsAllocationOption {
  id: string;
  categoryName: string;
  remainingBalance: number;
}

interface OverspentAllocation {
  categoryName: string;
  overspentBy: number;
}

interface Props {
  overspend: number;
  overspentAllocations: OverspentAllocation[];
  savingsAllocations: SavingsAllocationOption[];
  submitLabel?: string;
  onSubmit: (resolution: ClosePayPeriodRequest) => Promise<void>;
  onCancel: () => void;
}

export function OverspendResolutionModal({ overspend, overspentAllocations, savingsAllocations, submitLabel = 'Resolve & Close', onSubmit, onCancel }: Props) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  // Per-allocation offset amounts (Option 1)
  const [offsets, setOffsets] = useState<Record<string, string>>(
    Object.fromEntries(savingsAllocations.map(a => [a.id, '']))
  );
  // Per-allocation HYSA withdrawal amounts (Option 3)
  const [withdrawals, setWithdrawals] = useState<Record<string, string>>(
    Object.fromEntries(savingsAllocations.map(a => [a.id, '']))
  );
  // Carry forward amount (Option 2)
  const [carryForward, setCarryForward] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalOffsets = Object.values(offsets).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const totalWithdrawals = Object.values(withdrawals).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const totalCarryForward = parseFloat(carryForward) || 0;
  const totalResolved = totalOffsets + totalWithdrawals + totalCarryForward;
  const remaining = Math.round((overspend - totalResolved) * 100) / 100;
  const overResolved = totalResolved > overspend + 0.005;
  const excess = Math.round((totalResolved - overspend) * 100) / 100;
  const fullyResolved = remaining <= 0.005 && !overResolved;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullyResolved || overResolved) return;
    setSubmitting(true);
    setError(null);
    try {
      const resolution: ClosePayPeriodRequest = {};
      const savingsOffsets = savingsAllocations
        .filter(a => parseFloat(offsets[a.id] || '0') > 0)
        .map(a => ({ allocationId: a.id, amount: parseFloat(offsets[a.id]) }));
      const hysaWithdrawals = savingsAllocations
        .filter(a => parseFloat(withdrawals[a.id] || '0') > 0)
        .map(a => ({ allocationId: a.id, amount: parseFloat(withdrawals[a.id]) }));
      if (savingsOffsets.length > 0) resolution.savingsOffsets = savingsOffsets;
      if (hysaWithdrawals.length > 0) resolution.hysaWithdrawals = hysaWithdrawals;
      if (totalCarryForward > 0) resolution.carryForwardAmount = totalCarryForward;
      await onSubmit(resolution);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to close pay period');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full border-[0.5px] border-slate-300 rounded-[7px] px-3 py-2 text-sm font-mono text-slate-800 focus:outline-none focus:border-emerald-500";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[10px] w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 border-[0.5px] border-slate-200">
        <div className="mb-5">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h2 className="text-base font-bold text-slate-800">Resolve Overspend</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">You must resolve this before closing the pay period.</p>
            </div>
            <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600 text-xl leading-none ml-4 shrink-0">✕</button>
          </div>
          <div className={`rounded-[8px] border-[0.5px] p-3 flex items-center justify-between ${
            overResolved ? 'bg-red-50 border-red-200' : fullyResolved ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
          }`}>
            <div className="flex items-center gap-3">
              <div>
                <div className="text-[11px] text-slate-500">Overspent</div>
                <div className="font-mono font-bold text-red-600">{fmt(overspend)}</div>
              </div>
              <div className="text-slate-300">→</div>
              <div>
                <div className="text-[11px] text-slate-500">Resolved</div>
                <div className={`font-mono font-bold ${overResolved ? 'text-red-600' : fullyResolved ? 'text-emerald-700' : 'text-amber-600'}`}>{fmt(totalResolved)}</div>
              </div>
              {!fullyResolved && !overResolved && (
                <>
                  <div className="text-slate-300">→</div>
                  <div>
                    <div className="text-[11px] text-slate-500">Still needed</div>
                    <div className="font-mono font-bold text-red-500">{fmt(remaining)}</div>
                  </div>
                </>
              )}
            </div>
            {fullyResolved && (
              <div className="text-[11px] text-emerald-700 font-medium">Ready to close ✓</div>
            )}
            {overResolved && (
              <div className="text-[11px] text-red-600 font-medium">Reduce by {fmt(excess)}</div>
            )}
          </div>
        </div>

        {overspentAllocations.length > 0 && (
          <div className="mb-5">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Overspend Breakdown</div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-slate-400 border-b border-[0.5px] border-slate-200">
                  <th className="text-left pb-1 font-medium">Category</th>
                  <th className="text-right pb-1 font-medium">Overspent by</th>
                </tr>
              </thead>
              <tbody>
                {overspentAllocations.map((a, i) => (
                  <tr key={i} className="border-b border-[0.5px] border-slate-100 last:border-0">
                    <td className="py-1.5 text-slate-700">{a.categoryName}</td>
                    <td className="py-1.5 text-right font-mono text-red-600">{fmt(a.overspentBy)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-50 border-[0.5px] border-red-200 text-red-700 px-3 py-2 rounded-[7px] text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Option 1: Savings Offset */}
          {savingsAllocations.length > 0 && (
            <div className="bg-slate-50 rounded-[8px] border-[0.5px] border-slate-200 p-4">
              <div className="text-xs font-semibold text-slate-700 mb-0.5">Option 1 — Use Remaining Savings</div>
              <p className="text-[11px] text-slate-500 mb-3">Money allocated to savings that you haven't transferred to HYSA yet. Reduces your savings balance.</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] text-slate-400 border-b border-[0.5px] border-slate-200">
                    <th className="text-left pb-1 font-medium">Category</th>
                    <th className="text-right pb-1 font-medium">Available</th>
                    <th className="text-right pb-1 font-medium w-28">Use</th>
                  </tr>
                </thead>
                <tbody>
                  {savingsAllocations.map(a => (
                    <tr key={a.id}>
                      <td className="py-1.5 text-slate-700">{a.categoryName}</td>
                      <td className="py-1.5 text-right font-mono text-slate-500">{fmt(a.remainingBalance)}</td>
                      <td className="py-1.5 pl-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={a.remainingBalance}
                          value={offsets[a.id]}
                          onChange={e => setOffsets(prev => ({ ...prev, [a.id]: e.target.value }))}
                          className={inputClass}
                          placeholder="0.00"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Option 2: Carry Forward */}
          <div className="bg-slate-50 rounded-[8px] border-[0.5px] border-slate-200 p-4">
            <div className="text-xs font-semibold text-slate-700 mb-0.5">Option 2 — Carry Forward to Next Period</div>
            <p className="text-[11px] text-slate-500 mb-3">Record this as a debt to your next paycheck. It will show as a reminder on your next pay period.</p>
            <input
              type="number"
              step="0.01"
              min="0"
              value={carryForward}
              onChange={e => setCarryForward(e.target.value)}
              className={inputClass}
              placeholder="0.00"
            />
          </div>

          {/* Option 3: HYSA Withdrawal */}
          {savingsAllocations.length > 0 && (
            <div className="bg-slate-50 rounded-[8px] border-[0.5px] border-slate-200 p-4">
              <div className="text-xs font-semibold text-slate-700 mb-0.5">Option 3 — HYSA Withdrawal</div>
              <p className="text-[11px] text-slate-500 mb-3">Pull money back from HYSA or investments. Increases your savings balance to cover the overspend.</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] text-slate-400 border-b border-[0.5px] border-slate-200">
                    <th className="text-left pb-1 font-medium">Savings Account</th>
                    <th className="text-right pb-1 font-medium w-28">Withdraw</th>
                  </tr>
                </thead>
                <tbody>
                  {savingsAllocations.map(a => (
                    <tr key={a.id}>
                      <td className="py-1.5 text-slate-700">{a.categoryName}</td>
                      <td className="py-1.5 pl-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={withdrawals[a.id]}
                          onChange={e => setWithdrawals(prev => ({ ...prev, [a.id]: e.target.value }))}
                          className={inputClass}
                          placeholder="0.00"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="pt-1">
            <button
              type="submit"
              disabled={!fullyResolved || submitting}
              className="w-full px-4 py-2 bg-emerald-600 text-white rounded-[7px] text-sm hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
