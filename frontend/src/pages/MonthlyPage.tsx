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

interface MonthSummary {
  month: string;
  income: number;
  spent: number;
  saved: number;
  plannedExpense: number;
  overspend: number;
}

const PRIORITY_ORDER: Priority[] = ['NEED_IT', 'GOTTA_HAVE_IT', 'MEH', 'DROP_IT'];

const dash = <span className="text-slate-300">—</span>;

export function MonthlyPage() {
  const currentYear = new Date().getFullYear();

  const [payPeriods, setPayPeriods] = useState<PayPeriod[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [mode, setMode] = useState<'summary' | 'compare'>('summary');
  const [leftMonth, setLeftMonth] = useState('');
  const [rightMonth, setRightMonth] = useState('');

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

  const { rows, allRows, monthDetails } = useMemo(() => {
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

    const round = (n: number) => Math.round(n * 100) / 100;

    const allComputedRows: MonthSummary[] = Array.from(byMonth.entries())
      .map(([month, { income, spent, saved, plannedExpense, overspend }]) => ({
        month,
        income: round(income),
        spent: round(spent),
        saved: round(saved),
        plannedExpense: round(plannedExpense),
        overspend: round(overspend),
      }))
      .sort((a, b) => b.month.localeCompare(a.month));

    const computedRows = allComputedRows.filter(r => r.month.startsWith(`${currentYear}-`));

    const computedDetails = new Map<string, MonthDetail>();
    for (const [mk, detail] of detailsByMonth.entries()) {
      computedDetails.set(mk, {
        byCategory: Array.from(detail.byCategory.entries())
          .map(([categoryId, { name, spent }]) => ({ categoryId, name, spent: round(spent) }))
          .sort((a, b) => b.spent - a.spent),
        byPriority: PRIORITY_ORDER
          .filter(p => detail.byPriority.has(p))
          .map(p => ({ priority: p, spent: round(detail.byPriority.get(p) ?? 0) })),
        bySavings: Array.from(detail.bySavings.entries())
          .map(([categoryId, { name, saved, spent }]) => ({
            categoryId,
            name,
            saved: round(saved),
            spent: round(spent),
          }))
          .sort((a, b) => b.saved - a.saved),
      });
    }

    return { rows: computedRows, allRows: allComputedRows, monthDetails: computedDetails };
  }, [payPeriods, categoryMap, currentYear]);

  useEffect(() => {
    if (allRows.length >= 1 && !leftMonth) setLeftMonth(allRows[0].month);
    if (allRows.length >= 2 && !rightMonth) setRightMonth(allRows[1].month);
  }, [allRows]);

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
                    {s.spent > 0 ? <span className="text-red-600">{fmt(s.spent)}</span> : dash}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderCompareView = () => {
    const leftRow = allRows.find(r => r.month === leftMonth);
    const rightRow = allRows.find(r => r.month === rightMonth);
    const leftDetail = monthDetails.get(leftMonth);
    const rightDetail = monthDetails.get(rightMonth);

    const mergedCategories = (() => {
      const map = new Map<string, { name: string; left: number; right: number }>();
      for (const c of leftDetail?.byCategory ?? []) {
        map.set(c.categoryId, { name: c.name, left: c.spent, right: 0 });
      }
      for (const c of rightDetail?.byCategory ?? []) {
        if (map.has(c.categoryId)) {
          map.get(c.categoryId)!.right = c.spent;
        } else {
          map.set(c.categoryId, { name: c.name, left: 0, right: c.spent });
        }
      }
      return Array.from(map.values()).sort((a, b) => (b.left + b.right) - (a.left + a.right));
    })();

    const mergedSavings = (() => {
      const map = new Map<string, { name: string; leftSaved: number; leftSpent: number; rightSaved: number; rightSpent: number }>();
      for (const s of leftDetail?.bySavings ?? []) {
        map.set(s.categoryId, { name: s.name, leftSaved: s.saved, leftSpent: s.spent, rightSaved: 0, rightSpent: 0 });
      }
      for (const s of rightDetail?.bySavings ?? []) {
        if (map.has(s.categoryId)) {
          const e = map.get(s.categoryId)!;
          e.rightSaved = s.saved;
          e.rightSpent = s.spent;
        } else {
          map.set(s.categoryId, { name: s.name, leftSaved: 0, leftSpent: 0, rightSaved: s.saved, rightSpent: s.spent });
        }
      }
      return Array.from(map.values()).sort((a, b) => (b.leftSaved + b.rightSaved) - (a.leftSaved + a.rightSaved));
    })();

    const activePriorities = PRIORITY_ORDER.filter(p =>
      leftDetail?.byPriority.some(r => r.priority === p) ||
      rightDetail?.byPriority.some(r => r.priority === p)
    );

    const fmtCell = (v: number, cls = 'text-slate-700') =>
      v > 0 ? <span className={`font-mono ${cls}`}>{fmt(v)}</span> : dash;

    const metrics: { label: string; left: number; right: number; cls: string }[] = [
      { label: 'Income',       left: leftRow?.income ?? 0,        right: rightRow?.income ?? 0,        cls: 'text-slate-800' },
      { label: 'Spent',        left: leftRow?.spent ?? 0,         right: rightRow?.spent ?? 0,         cls: 'text-slate-800' },
      { label: 'Overspend',    left: leftRow?.overspend ?? 0,     right: rightRow?.overspend ?? 0,     cls: 'text-red-600'   },
      { label: 'Planned Exp.', left: leftRow?.plannedExpense ?? 0, right: rightRow?.plannedExpense ?? 0, cls: 'text-slate-600' },
      { label: 'Saved',        left: leftRow?.saved ?? 0,         right: rightRow?.saved ?? 0,         cls: 'text-emerald-700' },
    ];

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={leftMonth}
            onChange={e => setLeftMonth(e.target.value)}
            className="border-[0.5px] border-slate-300 rounded-lg px-3 py-1.5 text-sm text-slate-700 bg-white"
          >
            {allRows.map(r => (
              <option key={r.month} value={r.month}>{formatMonthLabel(r.month)}</option>
            ))}
          </select>
          <span className="text-sm text-slate-400 font-medium">vs</span>
          <select
            value={rightMonth}
            onChange={e => setRightMonth(e.target.value)}
            className="border-[0.5px] border-slate-300 rounded-lg px-3 py-1.5 text-sm text-slate-700 bg-white"
          >
            {allRows.map(r => (
              <option key={r.month} value={r.month}>{formatMonthLabel(r.month)}</option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-[10px] border-[0.5px] border-slate-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="border-b border-[0.5px] border-slate-200">
                <th className="text-left px-5 py-3 text-[11px] text-slate-400 font-medium w-1/3"></th>
                <th className="text-right px-5 py-3 font-semibold text-slate-700 w-1/3">
                  {leftMonth ? formatMonthLabel(leftMonth) : '—'}
                </th>
                <th className="text-right px-5 py-3 font-semibold text-slate-700 w-1/3">
                  {rightMonth ? formatMonthLabel(rightMonth) : '—'}
                </th>
              </tr>
            </thead>
            <tbody>
              {metrics.map(({ label, left, right, cls }) => (
                <tr key={label} className="border-b border-[0.5px] border-slate-100">
                  <td className="px-5 py-2.5 text-xs text-slate-500">{label}</td>
                  <td className="px-5 py-2.5 text-right">{fmtCell(left, cls)}</td>
                  <td className="px-5 py-2.5 text-right">{fmtCell(right, cls)}</td>
                </tr>
              ))}

              {mergedCategories.length > 0 && (
                <>
                  <tr className="bg-slate-50">
                    <td colSpan={3} className="px-5 py-2 text-[10px] font-bold text-slate-400 tracking-wider">BY CATEGORY</td>
                  </tr>
                  {mergedCategories.map((c, i) => (
                    <tr key={i} className="border-b border-[0.5px] border-slate-100">
                      <td className="px-5 py-2 text-xs text-slate-600">{c.name}</td>
                      <td className="px-5 py-2 text-right">{fmtCell(c.left)}</td>
                      <td className="px-5 py-2 text-right">{fmtCell(c.right)}</td>
                    </tr>
                  ))}
                </>
              )}

              {activePriorities.length > 0 && (
                <>
                  <tr className="bg-slate-50">
                    <td colSpan={3} className="px-5 py-2 text-[10px] font-bold text-slate-400 tracking-wider">BY PRIORITY</td>
                  </tr>
                  {activePriorities.map(p => {
                    const l = leftDetail?.byPriority.find(r => r.priority === p)?.spent ?? 0;
                    const r = rightDetail?.byPriority.find(r => r.priority === p)?.spent ?? 0;
                    return (
                      <tr key={p} className="border-b border-[0.5px] border-slate-100">
                        <td className="px-5 py-2 text-xs text-slate-600">{PRIORITY_LABELS[p]}</td>
                        <td className="px-5 py-2 text-right">{fmtCell(l)}</td>
                        <td className="px-5 py-2 text-right">{fmtCell(r)}</td>
                      </tr>
                    );
                  })}
                </>
              )}

              {mergedSavings.length > 0 && (
                <>
                  <tr className="bg-slate-50">
                    <td colSpan={3} className="px-5 py-2 text-[10px] font-bold text-slate-400 tracking-wider">SAVINGS</td>
                  </tr>
                  {mergedSavings.map((s, i) => (
                    <tr key={i} className="border-b border-[0.5px] border-slate-100">
                      <td className="px-5 py-2 text-xs text-slate-600">{s.name}</td>
                      <td className="px-5 py-2 text-right">
                        <div>{fmtCell(s.leftSaved, 'text-emerald-600')}</div>
                        {s.leftSpent > 0 && <div className="font-mono text-xs text-red-600">{fmt(s.leftSpent)} spent</div>}
                      </td>
                      <td className="px-5 py-2 text-right">
                        <div>{fmtCell(s.rightSaved, 'text-emerald-600')}</div>
                        {s.rightSpent > 0 && <div className="font-mono text-xs text-red-600">{fmt(s.rightSpent)} spent</div>}
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-xl font-bold text-slate-800">Monthly Summary</h1>
        {mode === 'summary' && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-600">{currentYear} YTD</span>
        )}
        <div className="ml-auto flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
          <button
            onClick={() => setMode('summary')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${mode === 'summary' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Summary
          </button>
          <button
            onClick={() => setMode('compare')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${mode === 'compare' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Compare
          </button>
        </div>
      </div>

      {mode === 'compare' ? renderCompareView() : (
        rows.length === 0 ? (
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
                            {row.overspend > 0 ? <span className="text-red-600">{fmt(row.overspend)}</span> : dash}
                          </td>
                          <td className="px-5 py-3 text-right font-mono text-slate-600">
                            {row.plannedExpense > 0 ? fmt(row.plannedExpense) : dash}
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
        )
      )}
    </div>
  );
}
