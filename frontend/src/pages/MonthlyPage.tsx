import { Fragment, useEffect, useMemo, useState } from 'react';
import type { PayPeriod, Category, Priority } from '../types';
import { PRIORITY_LABELS } from '../types';
import * as api from '../api/client';

function monthKey(date: string) {
  return date.substring(0, 7);
}

function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}


interface MonthDetail {
  byCategory: { categoryId: string; name: string; spent: number }[];
  byPriority: { priority: Priority; spent: number }[];
  bySavings: { categoryId: string; name: string; saved: number; spent: number }[];
}

const PRIORITY_ORDER: Priority[] = ['NEED_IT', 'GOTTA_HAVE_IT', 'MEH', 'DROP_IT'];

export function MonthlyPage() {
  const currentYear = new Date().getFullYear();

  const [payPeriods, setPayPeriods] = useState<PayPeriod[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

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

  const { rows, monthDetails } = useMemo(() => {
    const byMonth = new Map<string, { income: number; spent: number; saved: number; plannedExpense: number; overspend: number }>();
    const detailsByMonth = new Map<string, {
      byCategory: Map<string, { name: string; spent: number }>;
      byPriority: Map<string, number>;
      bySavings: Map<string, { name: string; saved: number; spent: number }>;
    }>();

    const ensureMonth = (mk: string) => {
      if (!byMonth.has(mk)) byMonth.set(mk, { income: 0, spent: 0, saved: 0, plannedExpense: 0, overspend: 0 });
      return byMonth.get(mk)!;
    };

    const ensureDetail = (mk: string) => {
      if (!detailsByMonth.has(mk)) {
        detailsByMonth.set(mk, { byCategory: new Map(), byPriority: new Map(), bySavings: new Map() });
      }
      return detailsByMonth.get(mk)!;
    };

    for (const pp of payPeriods) {
      const ppMonth = monthKey(pp.payDate);
      for (const inc of pp.incomes) {
        ensureMonth(monthKey(inc.date)).income += inc.amount;
      }
      for (const alloc of pp.allocations) {
        const allocType = categoryMap.get(alloc.categoryId)?.type ?? alloc.categoryType ?? 'EXPENSE';
        const catName = categoryMap.get(alloc.categoryId)?.name ?? '—';

        if (allocType === 'EXPENSE') {
          for (const txn of alloc.transactions) {
            const mk = monthKey(txn.date);
            ensureMonth(mk).spent += txn.amount;

            const detail = ensureDetail(mk);
            if (!detail.byCategory.has(alloc.categoryId)) {
              detail.byCategory.set(alloc.categoryId, { name: catName, spent: 0 });
            }
            detail.byCategory.get(alloc.categoryId)!.spent += txn.amount;

            const pri = txn.priority as string;
            if (pri) {
              detail.byPriority.set(pri, (detail.byPriority.get(pri) ?? 0) + txn.amount);
            }
          }
          if (alloc.currentBalance < 0) {
            ensureMonth(ppMonth).overspend += Math.abs(alloc.currentBalance);
          }
        } else if (allocType === 'SAVINGS') {
          for (const st of alloc.savingsTransfers ?? []) {
            if (st.type === 'TRANSFER' || st.type == null) {
              const mk = monthKey(st.date);
              if (st.excludeFromSavings) {
                ensureMonth(mk).plannedExpense += st.amount;
              } else {
                ensureMonth(mk).saved += st.amount;
                const detail = ensureDetail(mk);
                if (!detail.bySavings.has(alloc.categoryId)) {
                  detail.bySavings.set(alloc.categoryId, { name: catName, saved: 0, spent: 0 });
                }
                detail.bySavings.get(alloc.categoryId)!.saved += st.amount;
              }
            } else if (st.type === 'OVERSPEND_OFFSET') {
              const mk = monthKey(st.date);
              const detail = ensureDetail(mk);
              if (!detail.bySavings.has(alloc.categoryId)) {
                detail.bySavings.set(alloc.categoryId, { name: catName, saved: 0, spent: 0 });
              }
              detail.bySavings.get(alloc.categoryId)!.spent += st.amount;
            }
          }
          for (const txn of alloc.transactions) {
            const mk = monthKey(txn.date);
            const detail = ensureDetail(mk);
            if (!detail.bySavings.has(alloc.categoryId)) {
              detail.bySavings.set(alloc.categoryId, { name: catName, saved: 0, spent: 0 });
            }
            detail.bySavings.get(alloc.categoryId)!.spent += txn.amount;
          }
        }
      }
    }

    const computedRows = Array.from(byMonth.entries())
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

    const computedDetails = new Map<string, MonthDetail>();
    for (const [mk, detail] of detailsByMonth.entries()) {
      computedDetails.set(mk, {
        byCategory: Array.from(detail.byCategory.entries())
          .map(([categoryId, { name, spent }]) => ({ categoryId, name, spent: Math.round(spent * 100) / 100 }))
          .sort((a, b) => b.spent - a.spent),
        byPriority: PRIORITY_ORDER
          .filter(p => detail.byPriority.has(p))
          .map(p => ({ priority: p, spent: Math.round((detail.byPriority.get(p) ?? 0) * 100) / 100 })),
        bySavings: Array.from(detail.bySavings.entries())
          .map(([categoryId, { name, saved, spent }]) => ({
            categoryId,
            name,
            saved: Math.round(saved * 100) / 100,
            spent: Math.round(spent * 100) / 100,
          }))
          .sort((a, b) => b.saved - a.saved),
      });
    }

    return { rows: computedRows, monthDetails: computedDetails };
  }, [payPeriods, categoryMap, currentYear]);

  const toggleMonth = (month: string) => {
    setExpandedMonth(prev => prev === month ? null : month);
  };

  if (loading) {
    return <div className="text-sm text-slate-400 py-12 text-center">Loading...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-500 py-12 text-center">{error}</div>;
  }

  const renderDetailPanel = (detail: MonthDetail) => (
    <div className="grid grid-cols-3 gap-6 px-5 py-4 bg-slate-50">
      <div>
        <div className="text-[10px] font-bold text-slate-400 tracking-wider mb-2">BY CATEGORY</div>
        {detail.byCategory.length === 0 ? (
          <div className="text-xs text-slate-300">—</div>
        ) : (
          <table className="w-full text-xs">
            <tbody>
              {detail.byCategory.map(c => (
                <tr key={c.categoryId}>
                  <td className="py-0.5 text-slate-600">{c.name}</td>
                  <td className="py-0.5 text-right font-mono text-slate-700">{fmt(c.spent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div>
        <div className="text-[10px] font-bold text-slate-400 tracking-wider mb-2">BY PRIORITY</div>
        {detail.byPriority.length === 0 ? (
          <div className="text-xs text-slate-300">—</div>
        ) : (
          <table className="w-full text-xs">
            <tbody>
              {detail.byPriority.map(p => (
                <tr key={p.priority}>
                  <td className="py-0.5 text-slate-600">{PRIORITY_LABELS[p.priority]}</td>
                  <td className="py-0.5 text-right font-mono text-slate-700">{fmt(p.spent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div>
        <div className="text-[10px] font-bold text-slate-400 tracking-wider mb-2">SAVINGS</div>
        {detail.bySavings.length === 0 ? (
          <div className="text-xs text-slate-300">—</div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] text-slate-400">
                <th className="text-left font-medium pb-1">Category</th>
                <th className="text-right font-medium pb-1">Saved</th>
                <th className="text-right font-medium pb-1">Spent</th>
              </tr>
            </thead>
            <tbody>
              {detail.bySavings.map(s => (
                <tr key={s.categoryId}>
                  <td className="py-0.5 text-slate-600">{s.name}</td>
                  <td className="py-0.5 text-right font-mono text-emerald-600">{fmt(s.saved)}</td>
                  <td className="py-0.5 text-right font-mono">
                    {s.spent > 0
                      ? <span className="text-red-600">{fmt(s.spent)}</span>
                      : <span className="text-slate-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

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
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {rows.map(row => {
              const isExpanded = expandedMonth === row.month;
              const detail = monthDetails.get(row.month);
              return (
                <div key={row.month} className="bg-white rounded-[10px] border-[0.5px] border-slate-200">
                  <div className="px-4 py-3 cursor-pointer" onClick={() => toggleMonth(row.month)}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-semibold text-slate-800">{formatMonthLabel(row.month)}</div>
                      <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <div className="space-y-1.5">
                      {[
                        { label: 'Income',       value: fmt(row.income),       cls: 'text-slate-800' },
                        { label: 'Spent',        value: fmt(row.spent),        cls: 'text-slate-800' },
                        ...(row.overspend > 0      ? [{ label: 'Overspend',    value: fmt(row.overspend),      cls: 'text-red-600'   }] : []),
                        ...(row.plannedExpense > 0 ? [{ label: 'Planned Exp.', value: fmt(row.plannedExpense), cls: 'text-slate-600' }] : []),
                        { label: 'Saved',        value: fmt(row.saved),        cls: 'text-emerald-700' },
                      ].map(({ label, value, cls }) => (
                        <div key={label} className="flex justify-between items-center">
                          <span className="text-[11px] text-slate-400">{label}</span>
                          <span className={`font-mono text-sm ${cls}`}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {isExpanded && detail && (
                    <div className="border-t border-[0.5px] border-slate-100 px-4 py-3 space-y-4">
                      {detail.byCategory.length > 0 && (
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 tracking-wider mb-2">BY CATEGORY</div>
                          <div className="space-y-1">
                            {detail.byCategory.map(c => (
                              <div key={c.categoryId} className="flex justify-between text-xs">
                                <span className="text-slate-600">{c.name}</span>
                                <span className="font-mono text-slate-700">{fmt(c.spent)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {detail.byPriority.length > 0 && (
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 tracking-wider mb-2">BY PRIORITY</div>
                          <div className="space-y-1">
                            {detail.byPriority.map(p => (
                              <div key={p.priority} className="flex justify-between text-xs">
                                <span className="text-slate-600">{PRIORITY_LABELS[p.priority]}</span>
                                <span className="font-mono text-slate-700">{fmt(p.spent)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {detail.bySavings.length > 0 && (
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 tracking-wider mb-2">SAVINGS</div>
                          <div className="space-y-1">
                            {detail.bySavings.map(s => (
                              <div key={s.categoryId} className="flex justify-between text-xs gap-4">
                                <span className="text-slate-600 flex-1">{s.name}</span>
                                <span className="font-mono text-emerald-600">{fmt(s.saved)}</span>
                                {s.spent > 0 && <span className="font-mono text-red-600">{fmt(s.spent)}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="bg-slate-50 rounded-[10px] border-[0.5px] border-slate-200 px-4 py-3">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">YTD Total</div>
              <div className="space-y-1.5">
                {[
                  { label: 'Income',       value: fmt(rows.reduce((s, r) => s + r.income, 0)),         cls: 'text-slate-800 font-semibold'   },
                  { label: 'Spent',        value: fmt(rows.reduce((s, r) => s + r.spent, 0)),          cls: 'text-slate-800 font-semibold'   },
                  { label: 'Overspend',    value: fmt(rows.reduce((s, r) => s + r.overspend, 0)),      cls: 'text-red-600 font-semibold'     },
                  { label: 'Planned Exp.', value: fmt(rows.reduce((s, r) => s + r.plannedExpense, 0)), cls: 'text-slate-600 font-semibold'   },
                  { label: 'Saved',        value: fmt(rows.reduce((s, r) => s + r.saved, 0)),          cls: 'text-emerald-700 font-semibold' },
                ].map(({ label, value, cls }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-[11px] text-slate-400">{label}</span>
                    <span className={`font-mono text-sm ${cls}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-white rounded-[10px] border-[0.5px] border-slate-200">
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
                {rows.map(row => {
                  const isExpanded = expandedMonth === row.month;
                  const detail = monthDetails.get(row.month);
                  return (
                    <Fragment key={row.month}>
                      <tr
                        className="border-b border-[0.5px] border-slate-100 hover:bg-slate-50 cursor-pointer select-none"
                        onClick={() => toggleMonth(row.month)}
                      >
                        <td className="px-5 py-3 font-medium text-slate-700">
                          <div className="flex items-center gap-2">
                            <svg className={`w-3 h-3 text-slate-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            {formatMonthLabel(row.month)}
                          </div>
                        </td>
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
                      {isExpanded && detail && (
                        <tr className="border-b border-[0.5px] border-slate-100">
                          <td colSpan={6} className="p-0">
                            {renderDetailPanel(detail)}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
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
        </>
      )}
    </div>
  );
}
