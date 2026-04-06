import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { PayPeriod, Category } from '../types';
import * as api from '../api/client';

const CATEGORY_COLORS = [
  'bg-emerald-500', 'bg-blue-500', 'bg-violet-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-orange-500', 'bg-teal-500',
  'bg-pink-500', 'bg-indigo-500',
];

function categoryBgColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return CATEGORY_COLORS[h % CATEGORY_COLORS.length];
}

function categoryInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function Dashboard() {
  const [payPeriods, setPayPeriods] = useState<PayPeriod[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRecentTxns, setShowRecentTxns] = useState(false);

  useEffect(() => {
    Promise.all([api.getPayPeriods(), api.getCategories()])
      .then(([pp, cats]) => {
        setPayPeriods(pp);
        setCategories(cats);
      })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const fmtDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const fmtDateShort = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map(c => [c.id, c])),
    [categories]
  );

  const getTotalAllocated = (pp: PayPeriod) =>
    pp.allocations.reduce((s, a) => s + a.allocatedAmount, 0);

  const getTotalSpent = (pp: PayPeriod) =>
    pp.allocations.reduce((s, a) => s + (a.allocatedAmount - a.currentBalance), 0);

  const getTotalRemaining = (pp: PayPeriod) =>
    pp.allocations.reduce((s, a) => s + a.currentBalance, 0);

  const activePayPeriods = payPeriods.filter(p => p.status === 'ACTIVE');

  const recentTransactions = useMemo(() => {
    const txns: Array<{
      date: string;
      description: string;
      amount: number;
      categoryName: string;
      categoryId: string;
      payPeriodId: string;
    }> = [];
    for (const pp of activePayPeriods) {
      for (const alloc of pp.allocations) {
        for (const txn of alloc.transactions) {
          txns.push({
            date: txn.date,
            description: txn.description,
            amount: txn.amount,
            categoryName: categoryMap[alloc.categoryId]?.name ?? '—',
            categoryId: alloc.categoryId,
            payPeriodId: pp.id,
          });
        }
      }
    }
    return txns.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
  }, [activePayPeriods, categoryMap]);

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

  return (
    <div className="space-y-6">
      {activePayPeriods.length > 1 && (
        <div className="bg-amber-50 border-[0.5px] border-amber-300 text-amber-800 px-4 py-2 rounded-[10px] text-sm">
          Warning: {activePayPeriods.length} active pay periods detected. Consider closing all but one.
        </div>
      )}

      {payPeriods.length === 0 ? (
        <div className="bg-white border-[0.5px] border-slate-200 rounded-[10px] p-8 text-center text-slate-500">
          <p className="mb-4">No pay periods yet.</p>
          <Link to="/payperiods/new" className="px-4 py-2 bg-emerald-600 text-white text-sm hover:bg-emerald-700 rounded-[7px]">
            Create Your First Pay Period
          </Link>
        </div>
      ) : activePayPeriods.length === 0 ? (
        <div className="bg-white border-[0.5px] border-slate-200 rounded-[10px] p-8 text-center text-slate-500">
          No active pay period.{' '}
          <Link to="/payperiods/new" className="text-emerald-600 hover:underline">Create one</Link>.
        </div>
      ) : (
        <div className="space-y-6">
          {activePayPeriods.map(pp => {
            const totalAllocated = getTotalAllocated(pp);
            const totalSpent = getTotalSpent(pp);
            const remaining = getTotalRemaining(pp);
            const unallocated = pp.amount - totalAllocated;
            const spentPct = totalAllocated > 0 ? Math.min((totalSpent / totalAllocated) * 100, 100) : 0;
            const remainingPct = totalAllocated > 0 ? Math.max(Math.min((remaining / totalAllocated) * 100, 100), 0) : 0;

            return (
              <div key={pp.id} className="bg-white border-[0.5px] border-slate-200 rounded-[10px] p-5 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">ACTIVE</span>
                    <span className="font-medium text-slate-800">
                      {fmtDateShort(pp.payDate)} – {fmtDate(pp.endDate)}
                    </span>
                  </div>
                  <Link
                    to={`/payperiods/${pp.id}`}
                    className="px-3 py-1.5 text-sm bg-slate-700 rounded-[7px] hover:bg-slate-600 text-white"
                  >
                    View Details
                  </Link>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-4 gap-[10px]">
                  {[
                    { label: 'Income', value: fmt(pp.amount), valueClass: 'text-slate-800', cardClass: 'bg-white border-[0.5px] border-slate-200' },
                    { label: 'Allocated', value: fmt(totalAllocated), valueClass: 'text-blue-700', cardClass: 'bg-white border-[0.5px] border-slate-200' },
                    { label: 'Unallocated', value: fmt(unallocated), valueClass: unallocated > 0 ? 'text-orange-500' : 'text-slate-800', cardClass: 'bg-white border-[0.5px] border-slate-200' },
                    { label: 'Remaining', value: fmt(remaining), valueClass: remaining < 0 ? 'text-red-600' : 'text-emerald-900', cardClass: 'bg-emerald-50 border-[0.5px] border-emerald-200' },
                  ].map(({ label, value, valueClass, cardClass }) => (
                    <div key={label} className={`${cardClass} rounded-[10px] p-3`}>
                      <div className="text-[11px] text-slate-500">{label}</div>
                      <div className={`font-mono font-[500] text-[20px] ${valueClass}`}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Progress bar: emerald bg = remaining, slate fill from left = spent */}
                <div className={`relative h-9 rounded overflow-hidden ${remaining < 0 ? 'bg-red-400' : 'bg-emerald-500'}`}>
                  {/* Slate fill from left = spent, grows as you spend */}
                  <div
                    className="absolute left-0 top-0 h-full bg-slate-400 rounded transition-all"
                    style={{ width: `${spentPct}%` }}
                  />
                  {/* Spent label at right edge of slate fill */}
                  {spentPct >= 12 && (
                    <div
                      className="absolute top-0 h-full flex items-center justify-end pr-2.5 transition-all"
                      style={{ width: `${spentPct}%` }}
                    >
                      <div className="text-right leading-tight">
                        <div className="text-[9px] text-white/70 uppercase tracking-wide">Spent</div>
                        <div className="text-[11px] font-mono text-white font-medium">{fmt(totalSpent)} · {spentPct.toFixed(0)}%</div>
                      </div>
                    </div>
                  )}
                  {/* Remaining label in the emerald area on the right */}
                  {remainingPct >= 12 && (
                    <div className="absolute right-3 top-0 h-full flex items-center">
                      <div className="text-right leading-tight">
                        <div className="text-[9px] text-white/70 uppercase tracking-wide">Remaining</div>
                        <div className="text-[11px] font-mono text-white font-medium">{fmt(remaining)} · {remainingPct.toFixed(0)}%</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Recent transactions */}
          {recentTransactions.length > 0 && (
            <div className="bg-white border-[0.5px] border-slate-200 rounded-[10px] overflow-hidden">
              <button
                onClick={() => setShowRecentTxns(v => !v)}
                className="w-full px-4 py-3 flex items-center justify-between border-b border-[0.5px] border-slate-100 hover:bg-slate-50"
              >
                <h2 className="text-[11px] font-semibold text-slate-500 tracking-wider uppercase">Recent Transactions</h2>
                <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-slate-400 transition-transform ${showRecentTxns ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showRecentTxns && <div>
                {recentTransactions.map((txn, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-[0.5px] border-slate-50 last:border-0 hover:bg-slate-50">
                    <div className="text-[11px] text-slate-400 shrink-0 w-12">{fmtDateShort(txn.date)}</div>
                    <div className={`w-[30px] h-[30px] rounded-[6px] flex items-center justify-center shrink-0 text-white text-[11px] font-semibold ${categoryBgColor(txn.categoryId)}`}>
                      {categoryInitials(txn.categoryName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-800">{txn.description}</div>
                      <div className="text-[11px] text-slate-400">{txn.categoryName}</div>
                    </div>
                    <div className="font-mono text-sm text-slate-800 shrink-0">{fmt(txn.amount)}</div>
                  </div>
                ))}
              </div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
