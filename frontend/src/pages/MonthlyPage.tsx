import { useEffect, useMemo, useState } from 'react';
import type { PayPeriod, Category } from '../types';
import * as api from '../api/client';

function monthKey(date: string) {
  return date.substring(0, 7);
}

function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

interface MonthRow {
  month: string;
  income: number;
  spent: number;
  saved: number;
  plannedExpense: number;
  overspend: number;
}

export function MonthlyPage() {
  const currentYear = new Date().getFullYear();

  const [payPeriods, setPayPeriods] = useState<PayPeriod[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getPayPeriods(), api.getCategories()])
      .then(([pp, cats]) => {
        setPayPeriods(pp);
        setCategories(cats);
      })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const categoryMap = useMemo(
    () => new Map(categories.map(c => [c.id, c])),
    [categories]
  );

  const rows = useMemo((): MonthRow[] => {
    const byMonth = new Map<string, { income: number; spent: number; saved: number; plannedExpense: number; overspend: number }>();

    const ensure = (mk: string) => {
      if (!byMonth.has(mk)) byMonth.set(mk, { income: 0, spent: 0, saved: 0, plannedExpense: 0, overspend: 0 });
      return byMonth.get(mk)!;
    };

    for (const pp of payPeriods) {
      const ppMonth = monthKey(pp.payDate);
      for (const inc of pp.incomes) {
        ensure(monthKey(inc.date)).income += inc.amount;
      }
      for (const alloc of pp.allocations) {
        const allocType = categoryMap.get(alloc.categoryId)?.type ?? alloc.categoryType ?? 'EXPENSE';
        if (allocType === 'EXPENSE') {
          for (const txn of alloc.transactions) {
            ensure(monthKey(txn.date)).spent += txn.amount;
          }
          if (alloc.currentBalance < 0) {
            ensure(ppMonth).overspend += Math.abs(alloc.currentBalance);
          }
        } else if (allocType === 'SAVINGS') {
          for (const st of alloc.savingsTransfers ?? []) {
            if (st.type === 'TRANSFER' || st.type == null) {
              if (st.excludeFromSavings) {
                ensure(monthKey(st.date)).plannedExpense += st.amount;
              } else {
                ensure(monthKey(st.date)).saved += st.amount;
              }
            }
          }
        }
      }
    }

    return Array.from(byMonth.entries())
      .map(([month, { income, spent, saved, plannedExpense, overspend }]) => ({
        month,
        income: Math.round(income * 100) / 100,
        spent: Math.round(spent * 100) / 100,
        saved: Math.round(saved * 100) / 100,
        plannedExpense: Math.round(plannedExpense * 100) / 100,
        overspend: Math.round(overspend * 100) / 100,
      }))
      .filter(row => row.month.startsWith(`${currentYear}-`))
      .sort((a, b) => b.month.localeCompare(a.month));
  }, [payPeriods, categoryMap, currentYear]);

  if (loading) {
    return <div className="text-sm text-slate-400 py-12 text-center">Loading...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-500 py-12 text-center">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-slate-800">Monthly Summary</h1>
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-600">{currentYear} YTD</span>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-[10px] border-[0.5px] border-slate-200 p-10 text-center text-sm text-slate-400">
          No data yet.
        </div>
      ) : (
        <div className="bg-white rounded-[10px] border-[0.5px] border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-slate-400 border-b border-[0.5px] border-slate-200">
                <th className="text-left px-5 py-3 font-medium">Month</th>
                <th className="text-right px-5 py-3 font-medium">Income</th>
                <th className="text-right px-5 py-3 font-medium">Spent</th>
                <th className="text-right px-5 py-3 font-medium">Overspend</th>
                <th className="text-right px-5 py-3 font-medium">Planned Exp.</th>
                <th className="text-right px-5 py-3 font-medium">Saved</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.month} className="border-b border-[0.5px] border-slate-100 hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-700">{formatMonthLabel(row.month)}</td>
                  <td className="px-5 py-3 text-right font-mono text-slate-800">{fmt(row.income)}</td>
                  <td className="px-5 py-3 text-right font-mono text-slate-800">{fmt(row.spent)}</td>
                  <td className="px-5 py-3 text-right font-mono">
                    {row.overspend > 0
                      ? <span className="text-red-600">{fmt(row.overspend)}</span>
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-slate-600">
                    {row.plannedExpense > 0 ? fmt(row.plannedExpense) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-emerald-700">{fmt(row.saved)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-[0.5px] border-slate-200 bg-slate-50">
                <td className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Total</td>
                <td className="px-5 py-3 text-right font-mono font-semibold text-slate-800">
                  {fmt(rows.reduce((s, r) => s + r.income, 0))}
                </td>
                <td className="px-5 py-3 text-right font-mono font-semibold text-slate-800">
                  {fmt(rows.reduce((s, r) => s + r.spent, 0))}
                </td>
                <td className="px-5 py-3 text-right font-mono font-semibold text-red-600">
                  {fmt(rows.reduce((s, r) => s + r.overspend, 0))}
                </td>
                <td className="px-5 py-3 text-right font-mono font-semibold text-slate-600">
                  {fmt(rows.reduce((s, r) => s + r.plannedExpense, 0))}
                </td>
                <td className="px-5 py-3 text-right font-mono font-semibold text-emerald-700">
                  {fmt(rows.reduce((s, r) => s + r.saved, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
