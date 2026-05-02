import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { PayPeriod, Category } from '../types';
import { PayPeriodForm } from '../components';
import * as api from '../api/client';

export function PayPeriodsPage() {
  const navigate = useNavigate();
  const [payPeriods, setPayPeriods] = useState<PayPeriod[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getPayPeriods(), api.getCategories()])
      .then(([periods, cats]) => {
        setPayPeriods(periods);
        setCategories(cats);
      })
      .catch(() => setError('Failed to load pay periods'))
      .finally(() => setLoading(false));
  }, []);

  const categoryMap = useMemo(
    () => new Map(categories.map(c => [c.id, c])),
    [categories]
  );

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const fmtDateShort = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const getTotalSpent = (pp: PayPeriod) =>
    pp.allocations
      .filter(a => categoryMap.get(a.categoryId)?.type === 'EXPENSE')
      .reduce((s, a) => s + (a.allocatedAmount - a.currentBalance), 0);

  const getTotalRemaining = (pp: PayPeriod) =>
    pp.allocations.reduce((s, a) => s + a.currentBalance, 0);

  const getTotalOverspend = (pp: PayPeriod) =>
    pp.allocations.reduce((s, a) => s + Math.max(0, -a.currentBalance), 0);

  const getTotalSavings = (pp: PayPeriod) =>
    pp.allocations
      .filter(a => categoryMap.get(a.categoryId)?.type === 'SAVINGS')
      .reduce((s, a) => {
        const transferred = (a.savingsTransfers ?? [])
          .filter(t => t.type === 'TRANSFER' || t.type == null)
          .reduce((ss, t) => ss + t.amount, 0);
        const withdrawn = (a.savingsTransfers ?? [])
          .filter(t => t.type === 'HYSA_WITHDRAWAL')
          .reduce((ss, t) => ss + Math.abs(t.amount), 0);
        return s + transferred - withdrawn;
      }, 0);

  const handleCreate = async (payDate: string, endDate: string) => {
    try {
      const newPayPeriod = await api.createPayPeriod({ payDate, endDate });
      setShowNewModal(false);
      navigate(`/payperiods/${newPayPeriod.id}`);
    } catch {
      setCreateError('Failed to create pay period');
    }
  };

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
        <button
          onClick={() => { setCreateError(null); setShowNewModal(true); }}
          className="px-4 py-2 bg-emerald-600 text-white text-sm hover:bg-emerald-700 rounded-[7px]"
        >
          New Pay Period
        </button>
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
                <th className="text-right px-4 py-2.5 font-medium">Spent</th>
                <th className="text-right px-4 py-2.5 font-medium">Remaining</th>
                <th className="text-right px-4 py-2.5 font-medium">Overspend</th>
                <th className="text-right px-4 py-2.5 font-medium">Savings</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(pp => {
                const remaining = getTotalRemaining(pp);
                const overspend = getTotalOverspend(pp);
                const savings = getTotalSavings(pp);
                const savingsPct = pp.amount > 0 ? Math.round((savings / pp.amount) * 100) : 0;
                return (
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
                    <td className="px-4 py-3 text-right font-mono text-slate-800">{fmt(getTotalSpent(pp))}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-500">
                      {pp.status === 'CLOSED' ? '—' : fmt(Math.max(0, remaining))}
                    </td>
                    <td className={`px-4 py-3 text-right font-mono ${overspend > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                      {overspend > 0 ? fmt(overspend) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-700">
                      {savings > 0 ? `${fmt(savings)} (${savingsPct}%)` : '—'}
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* New Pay Period Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[10px] border-[0.5px] border-slate-200 p-6 w-full max-w-sm space-y-4 shadow-lg">
            <h2 className="text-base font-semibold text-slate-800">New Pay Period</h2>
            {createError && (
              <div className="bg-red-50 border-[0.5px] border-red-200 text-red-700 px-3 py-2 rounded-[7px] text-sm">
                {createError}
              </div>
            )}
            <PayPeriodForm
              onSubmit={handleCreate}
              submitLabel="Create Pay Period"
              onCancel={() => setShowNewModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
