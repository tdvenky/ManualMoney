import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { PayPeriod, Category, Allocation } from '../types';
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

  const getAllocType = (a: Allocation) => categoryMap.get(a.categoryId)?.type ?? a.categoryType ?? 'EXPENSE';

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const fmtDateShort = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const getTotalSpent = (pp: PayPeriod) =>
    pp.allocations
      .filter(a => getAllocType(a) === 'EXPENSE')
      .reduce((s, a) => s + (a.allocatedAmount - a.currentBalance), 0);

  const getTotalRemaining = (pp: PayPeriod) =>
    pp.allocations.reduce((s, a) => s + a.currentBalance, 0);

  const getTotalOverspend = (pp: PayPeriod) =>
    pp.allocations.reduce((s, a) => s + Math.max(0, -a.currentBalance), 0);

  const getTotalPlannedExpense = (pp: PayPeriod) =>
    pp.allocations
      .filter(a => getAllocType(a) === 'SAVINGS')
      .reduce((s, a) =>
        s + (a.savingsTransfers ?? [])
          .filter(t => (t.type === 'TRANSFER' || t.type == null) && t.excludeFromSavings)
          .reduce((ss, t) => ss + t.amount, 0)
      , 0);

  const getTotalSavings = (pp: PayPeriod) =>
    pp.allocations
      .filter(a => getAllocType(a) === 'SAVINGS')
      .reduce((s, a) => {
        const transferred = (a.savingsTransfers ?? [])
          .filter(t => (t.type === 'TRANSFER' || t.type == null) && !t.excludeFromSavings)
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
        <div className="space-y-3">
          {sorted.map(pp => {
            const remaining = getTotalRemaining(pp);
            const overspend = getTotalOverspend(pp);
            const plannedExpense = getTotalPlannedExpense(pp);
            const savings = getTotalSavings(pp);
            const savingsPct = pp.amount > 0 ? Math.round((savings / pp.amount) * 100) : 0;
            return (
              <div key={pp.id} className="bg-white border-[0.5px] border-slate-200 rounded-[10px] px-5 py-4">

                {/* Header row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">
                      {fmtDateShort(pp.payDate)} – {fmtDateShort(pp.endDate)}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      pp.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {pp.status}
                    </span>
                  </div>
                  <div className="flex gap-2">
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
                </div>

                {/* Stats row */}
                <div className="flex gap-8">
                  <div>
                    <div className="text-[11px] text-slate-400 mb-0.5">Income</div>
                    <div className="font-mono text-sm text-slate-800">{fmt(pp.amount)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400 mb-0.5">Spent</div>
                    <div className="font-mono text-sm text-slate-800">{fmt(getTotalSpent(pp))}</div>
                  </div>
                  {overspend > 0 && (
                    <div>
                      <div className="text-[11px] text-slate-400 mb-0.5">Overspend</div>
                      <div className="font-mono text-sm text-red-600">{fmt(overspend)}</div>
                    </div>
                  )}
                  {plannedExpense > 0 && (
                    <div>
                      <div className="text-[11px] text-slate-400 mb-0.5">Planned Exp.</div>
                      <div className="font-mono text-sm text-slate-600">{fmt(plannedExpense)}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-[11px] text-slate-400 mb-0.5">Savings</div>
                    <div className="font-mono text-sm text-emerald-700">
                      {savings > 0 ? `${fmt(savings)} (${savingsPct}%)` : '—'}
                    </div>
                  </div>
                  {pp.status === 'ACTIVE' && (
                    <div>
                      <div className="text-[11px] text-slate-400 mb-0.5">Remaining</div>
                      <div className="font-mono text-sm text-slate-500">{fmt(Math.max(0, remaining))}</div>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
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
