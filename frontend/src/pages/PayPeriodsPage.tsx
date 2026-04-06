import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { PayPeriod } from '../types';
import * as api from '../api/client';

export function PayPeriodsPage() {
  const [payPeriods, setPayPeriods] = useState<PayPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getPayPeriods()
      .then(setPayPeriods)
      .catch(() => setError('Failed to load pay periods'))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const fmtDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const fmtDateShort = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const getTotalAllocated = (pp: PayPeriod) =>
    pp.allocations.reduce((s, a) => s + a.allocatedAmount, 0);

  const getTotalSpent = (pp: PayPeriod) =>
    pp.allocations.reduce((s, a) => s + (a.allocatedAmount - a.currentBalance), 0);

  const getTotalRemaining = (pp: PayPeriod) =>
    pp.allocations.reduce((s, a) => s + a.currentBalance, 0);

  const handleDelete = async (pp: PayPeriod) => {
    const label = `${fmtDateShort(pp.payDate)} – ${fmtDateShort(pp.endDate)}`;
    if (!confirm(`Delete pay period "${label}"? This will permanently remove all allocations and transactions within it.`)) return;
    try {
      await api.deletePayPeriod(pp.id);
      setPayPeriods(prev => prev.filter(p => p.id !== pp.id));
    } catch {
      setError('Failed to delete pay period');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-[0.5px] border-red-200 text-red-700 px-4 py-3 rounded-[10px]">
        {error}
      </div>
    );
  }

  const sorted = [...payPeriods].sort((a, b) => b.payDate.localeCompare(a.payDate));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-bold text-slate-800">Pay Periods</h1>
        <Link
          to="/payperiods/new"
          className="px-4 py-2 bg-emerald-600 text-white text-sm hover:bg-emerald-700 rounded-[7px]"
        >
          New Pay Period
        </Link>
      </div>

      {sorted.length === 0 ? (
        <div className="bg-white border-[0.5px] border-slate-200 rounded-[10px] p-8 text-center text-slate-500">
          No pay periods yet.
        </div>
      ) : (
        <div className="bg-white border-[0.5px] border-slate-200 rounded-[10px] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[0.5px] border-slate-200 bg-slate-50 text-slate-500 text-xs">
                <th className="text-left px-4 py-2.5 font-medium">Period</th>
                <th className="text-center px-4 py-2.5 font-medium">Status</th>
                <th className="text-right px-4 py-2.5 font-medium">Income</th>
                <th className="text-right px-4 py-2.5 font-medium">Allocated</th>
                <th className="text-right px-4 py-2.5 font-medium">Spent</th>
                <th className="text-right px-4 py-2.5 font-medium">Remaining</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(pp => (
                <tr key={pp.id} className="border-b border-[0.5px] border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {fmtDateShort(pp.payDate)} – {fmtDateShort(pp.endDate)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      pp.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {pp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-800">{fmt(pp.amount)}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-800">{fmt(getTotalAllocated(pp))}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-800">{fmt(getTotalSpent(pp))}</td>
                  <td className={`px-4 py-3 text-right font-mono ${getTotalRemaining(pp) < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                    {fmt(getTotalRemaining(pp))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <Link
                        to={`/payperiods/${pp.id}`}
                        className="px-3 py-1.5 text-sm bg-slate-700 rounded-[7px] hover:bg-slate-600 text-white"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleDelete(pp)}
                        className="px-3 py-1.5 text-sm bg-red-100 rounded-[7px] hover:bg-red-200 text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
