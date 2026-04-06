import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { PayPeriod, Category, SubCategory, Transaction, Priority } from '../types';
import { PRIORITY_LABELS } from '../types';
import { AddTransactionModal } from '../components/AddTransactionModal';
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

export function PayPeriodDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [payPeriod, setPayPeriod] = useState<PayPeriod | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<(Transaction & { allocationId: string; categoryId: string }) | null>(null);
  const [showAddAllocation, setShowAddAllocation] = useState(false);
  const [editingAllocationId, setEditingAllocationId] = useState<string | null>(null);
  const [editingAmount, setEditingAmount] = useState('');
  const [addingCategoryId, setAddingCategoryId] = useState('');
  const [addingAmount, setAddingAmount] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [ppData, catsData, subCatsData] = await Promise.all([
        api.getPayPeriod(id!),
        api.getCategories(),
        api.getSubCategories(),
      ]);
      setPayPeriod(ppData);
      setCategories(catsData);
      setSubCategories(subCatsData);
    } catch {
      setError('Failed to load pay period');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const fmtDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const fmtDateShort = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const getCat = (categoryId: string) => categories.find(c => c.id === categoryId);
  const getSubCat = (subCategoryId: string) => subCategories.find(s => s.id === subCategoryId);

  const totalAllocated = payPeriod?.allocations.reduce((s, a) => s + a.allocatedAmount, 0) ?? 0;
  const totalRemaining = payPeriod?.allocations.reduce((s, a) => s + a.currentBalance, 0) ?? 0;
  const unallocated = (payPeriod?.amount ?? 0) - totalAllocated;

  const allTransactions: (Transaction & { allocationId: string; categoryId: string })[] = useMemo(() => {
    if (!payPeriod) return [];
    return payPeriod.allocations.flatMap(a =>
      a.transactions.map(t => ({ ...t, allocationId: a.id, categoryId: a.categoryId }))
    );
  }, [payPeriod]);

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(t => {
      if (filterCategoryId && t.categoryId !== filterCategoryId) return false;
      if (filterPriority && t.priority !== filterPriority) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!t.description.toLowerCase().includes(q) && !(t.notes ?? '').toLowerCase().includes(q)) return false;
      }
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [allTransactions, filterCategoryId, filterPriority, searchQuery]);

  const transactionsByDate = useMemo(() => {
    const groups: Record<string, typeof filteredTransactions> = {};
    for (const t of filteredTransactions) {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    }
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredTransactions]);

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const t of allTransactions) {
      totals[t.categoryId] = (totals[t.categoryId] ?? 0) + t.amount;
    }
    return totals;
  }, [allTransactions]);

  const priorityTotals = useMemo(() => {
    const totals: Partial<Record<Priority, number>> = {};
    for (const t of allTransactions) {
      if (t.priority) totals[t.priority] = (totals[t.priority] ?? 0) + t.amount;
    }
    return totals;
  }, [allTransactions]);

  const grandTotal = allTransactions.reduce((s, t) => s + t.amount, 0);

  const handleAddTransaction = async (allocationId: string, data: {
    description: string; amount: number; date: string;
    subCategoryId: string; priority: Priority; notes?: string;
  }) => {
    await api.addTransaction(allocationId, data);
    await loadData();
  };

  const handleEditTransaction = async (allocationId: string, data: {
    description: string; amount: number; date: string;
    subCategoryId: string; priority: Priority; notes?: string;
  }) => {
    if (allocationId === editingTransaction!.allocationId) {
      await api.updateTransaction(editingTransaction!.id, data);
    } else {
      await api.deleteTransaction(editingTransaction!.id);
      await api.addTransaction(allocationId, data);
    }
    await loadData();
  };

  const handleClosePayPeriod = async () => {
    if (!confirm('Close this pay period?')) return;
    try {
      await api.closePayPeriod(id!);
      await loadData();
    } catch {
      setError('Failed to close pay period');
    }
  };

  const handleReopenPayPeriod = async () => {
    if (!confirm('Reopen this pay period?')) return;
    try {
      await api.reopenPayPeriod(id!);
      await loadData();
    } catch {
      setError('Failed to reopen pay period');
    }
  };

  const handleSaveAllocation = async (allocationId: string) => {
    if (payPeriod) {
      const current = payPeriod.allocations.find(a => a.id === allocationId);
      const totalAllocated = payPeriod.allocations.reduce((s, a) => s + a.allocatedAmount, 0);
      const unallocated = payPeriod.amount - totalAllocated;
      const increase = parseFloat(editingAmount) - (current?.allocatedAmount ?? 0);
      if (increase > 0 && increase > unallocated) {
        setError(`Only ${fmt(unallocated)} is available to allocate.`);
        return;
      }
    }
    try {
      await api.updateAllocation(allocationId, { allocatedAmount: parseFloat(editingAmount) });
      setEditingAllocationId(null);
      await loadData();
    } catch {
      setError('Failed to update allocation');
    }
  };

  const handleAddAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingCategoryId || !addingAmount) return;
    if (payPeriod) {
      const totalAllocated = payPeriod.allocations.reduce((s, a) => s + a.allocatedAmount, 0);
      const unallocated = payPeriod.amount - totalAllocated;
      if (parseFloat(addingAmount) > unallocated) {
        setError(`Only ${fmt(unallocated)} is available to allocate.`);
        return;
      }
    }
    try {
      await api.addAllocation(id!, { categoryId: addingCategoryId, allocatedAmount: parseFloat(addingAmount) });
      setAddingCategoryId('');
      setAddingAmount('');
      await loadData();
    } catch {
      setError('Failed to add allocation');
    }
  };

  const handleDeleteAllocation = async (allocationId: string) => {
    if (!confirm('Delete this allocation? The amount will return to unallocated.')) return;
    try {
      await api.deleteAllocation(allocationId);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete allocation';
      setError(msg);
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await api.deleteTransaction(transactionId);
      await loadData();
    } catch {
      setError('Failed to delete transaction');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-500">Loading...</div>;
  }

  if (!payPeriod) {
    return <div className="bg-red-50 border-[0.5px] border-red-200 text-red-700 px-4 py-3 rounded-[10px]">Pay period not found</div>;
  }

  const isActive = payPeriod.status === 'ACTIVE';
  const allocatedCategoryIds = new Set(payPeriod.allocations.map(a => a.categoryId));
  const availableCategories = categories.filter(c => !allocatedCategoryIds.has(c.id));

  const renderAllocationTable = (type: 'EXPENSE' | 'SAVINGS') => {
    const allocs = payPeriod.allocations.filter(a => getCat(a.categoryId)?.type === type);
    if (allocs.length === 0) return null;
    return (
      <div className="mb-4">
        <div className="text-[11px] font-bold text-slate-500 tracking-wider mb-1">{type === 'EXPENSE' ? 'EXPENSES' : 'SAVINGS'}</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[0.5px] border-slate-200 text-slate-500 text-xs">
              <th className="text-left py-1 font-medium">Category</th>
              <th className="text-right py-1 font-medium">Allocated</th>
              <th className="text-right py-1 font-medium">Spent</th>
              <th className="text-right py-1 font-medium">Remaining</th>
              {isActive && <th className="w-20"></th>}
            </tr>
          </thead>
          <tbody>
            {allocs.map(a => {
              const spent = a.allocatedAmount - a.currentBalance;
              const isEditing = editingAllocationId === a.id;
              return (
                <tr key={a.id} className="border-b border-[0.5px] border-slate-100 group">
                  <td className="py-2.5 text-slate-800">{getCat(a.categoryId)?.name ?? '—'}</td>
                  <td className="py-2.5 text-right font-mono text-slate-800">
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editingAmount}
                        onChange={e => setEditingAmount(e.target.value)}
                        className="w-24 border-[0.5px] border-slate-300 rounded px-2 py-0.5 text-right text-xs font-mono"
                        autoFocus
                      />
                    ) : fmt(a.allocatedAmount)}
                  </td>
                  <td className="py-2.5 text-right font-mono text-slate-800">{fmt(spent)}</td>
                  <td className={`py-2.5 text-right font-mono ${a.currentBalance < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                    {fmt(a.currentBalance)}
                  </td>
                  {isActive && (
                    <td className="py-2.5 pl-4 pr-2 text-right">
                      {isEditing ? (
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => handleSaveAllocation(a.id)} className="text-xs text-emerald-600 hover:underline">Save</button>
                          <button onClick={() => setEditingAllocationId(null)} className="text-xs text-slate-400 hover:underline">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex gap-3 justify-end items-center">
                          <button
                            onClick={() => { setEditingAllocationId(a.id); setEditingAmount(String(a.allocatedAmount)); }}
                            className="text-slate-400 hover:text-emerald-600"
                            title="Edit"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteAllocation(a.id)}
                            disabled={a.transactions.length > 0}
                            className={`${a.transactions.length > 0 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-red-500'}`}
                            title={a.transactions.length > 0 ? 'Cannot delete: has transactions' : 'Delete'}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-800">
              {fmtDateShort(payPeriod.payDate)} – {fmtDate(payPeriod.endDate)}
            </h1>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
              isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {payPeriod.status}
            </span>
          </div>
        </div>
        {isActive ? (
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddTransaction(true)}
              className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-[7px] hover:bg-emerald-700"
            >
              Add Transaction
            </button>
            <button
              onClick={handleClosePayPeriod}
              className="px-4 py-2 bg-slate-700 text-white text-sm rounded-[7px] hover:bg-slate-600"
            >
              Close Pay Period
            </button>
          </div>
        ) : (
          <button
            onClick={handleReopenPayPeriod}
            className="px-4 py-2 bg-slate-700 text-white text-sm rounded-[7px] hover:bg-slate-600"
          >
            Reopen Pay Period
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border-[0.5px] border-red-200 text-red-700 px-3 py-2 rounded-[10px] text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-3 underline">Dismiss</button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-[10px]">
        {[
          { label: 'Income', value: fmt(payPeriod.amount), valueClass: 'text-slate-800', cardClass: 'bg-white border-[0.5px] border-slate-200' },
          { label: 'Allocated', value: fmt(totalAllocated), valueClass: 'text-blue-700', cardClass: 'bg-white border-[0.5px] border-slate-200' },
          { label: 'Unallocated', value: fmt(unallocated), valueClass: unallocated > 0 ? 'text-orange-500' : 'text-slate-800', cardClass: 'bg-white border-[0.5px] border-slate-200' },
          { label: 'Remaining', value: fmt(totalRemaining), valueClass: totalRemaining < 0 ? 'text-red-600' : 'text-emerald-900', cardClass: 'bg-emerald-50 border-[0.5px] border-emerald-200' },
        ].map(({ label, value, valueClass, cardClass }) => (
          <div key={label} className={`${cardClass} rounded-[10px] p-3`}>
            <div className="text-[11px] text-slate-500">{label}</div>
            <div className={`font-mono font-[500] text-[20px] ${valueClass}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-white border-[0.5px] border-slate-200 rounded-[10px] p-5">
        <h2 className="text-[11px] font-bold text-slate-500 tracking-wider mb-4">SUMMARY</h2>
        <div className="grid grid-cols-2 gap-6">
          {/* By Category */}
          <div>
            <div className="text-xs font-medium text-slate-500 mb-2">By Category</div>
            {Object.keys(categoryTotals).length === 0 ? (
              <div className="text-sm text-slate-400">No transactions yet</div>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {Object.entries(categoryTotals).map(([catId, total]) => (
                    <tr key={catId} className="border-b border-[0.5px] border-slate-50">
                      <td className="py-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-[7px] h-[7px] rounded-full shrink-0 ${categoryBgColor(catId)}`} />
                          <span className="text-slate-700">{getCat(catId)?.name ?? '—'}</span>
                        </div>
                      </td>
                      <td className="py-1.5 text-right font-mono font-[500] text-slate-800">{fmt(total)}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50">
                    <td className="py-2 px-1 font-semibold text-slate-800">Grand Total</td>
                    <td className="py-2 px-1 text-right font-mono font-semibold text-slate-800">{fmt(grandTotal)}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {/* By Priority */}
          <div>
            <div className="text-xs font-medium text-slate-500 mb-2">By Priority</div>
            {Object.keys(priorityTotals).length === 0 ? (
              <div className="text-sm text-slate-400">No transactions yet</div>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {(Object.entries(PRIORITY_LABELS) as [Priority, string][])
                    .filter(([p]) => priorityTotals[p] != null)
                    .map(([p, label]) => (
                      <tr key={p} className="border-b border-[0.5px] border-slate-50">
                        <td className="py-1.5 text-slate-700">{label}</td>
                        <td className="py-1.5 text-right font-mono font-[500] text-slate-800">{fmt(priorityTotals[p]!)}</td>
                      </tr>
                    ))}
                  <tr className="bg-slate-50">
                    <td className="py-2 px-1 font-semibold text-slate-800">Grand Total</td>
                    <td className="py-2 px-1 text-right font-mono font-semibold text-slate-800">{fmt(grandTotal)}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Categories / Allocations */}
      <div className="bg-white border-[0.5px] border-slate-200 rounded-[10px] p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[11px] font-bold text-slate-500 tracking-wider">CATEGORIES</h2>
          {isActive && availableCategories.length > 0 && (
            <button
              onClick={() => setShowAddAllocation(v => !v)}
              className="px-3 py-1.5 text-sm bg-slate-700 rounded-[7px] hover:bg-slate-600 text-white"
            >
              {showAddAllocation ? 'Cancel' : 'Allocate Budget'}
            </button>
          )}
        </div>

        {isActive && showAddAllocation && availableCategories.length > 0 && (
          <form onSubmit={handleAddAllocation} className="mb-4 flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-[11px] text-slate-500 mb-1">Add Category</label>
              <select
                value={addingCategoryId}
                onChange={e => setAddingCategoryId(e.target.value)}
                className="w-full border-[0.5px] border-slate-300 rounded-[7px] px-2 py-2.5 text-sm"
                required
              >
                <option value="">Select...</option>
                {availableCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                ))}
              </select>
            </div>
            <div className="w-32">
              <label className="block text-[11px] text-slate-500 mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                value={addingAmount}
                onChange={e => setAddingAmount(e.target.value)}
                className="w-full border-[0.5px] border-slate-300 rounded-[7px] px-2 py-2.5 text-sm font-mono"
                placeholder="0.00"
                required
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2.5 bg-emerald-600 text-white text-sm rounded-[7px] hover:bg-emerald-700"
            >
              Add
            </button>
          </form>
        )}

        {payPeriod.allocations.length === 0 ? (
          <div className="text-sm text-slate-400 text-center py-4">No allocations yet.</div>
        ) : (
          <>
            {renderAllocationTable('EXPENSE')}
            {renderAllocationTable('SAVINGS')}
          </>
        )}
      </div>

      {/* Transactions */}
      <div className="bg-white border-[0.5px] border-slate-200 rounded-[10px] p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[11px] font-bold text-slate-500 tracking-wider">TRANSACTIONS</h2>
          {isActive && (
            <button
              onClick={() => setShowAddTransaction(true)}
              className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-[7px] hover:bg-emerald-700"
            >
              Add Transaction
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <select
            value={filterCategoryId}
            onChange={e => setFilterCategoryId(e.target.value)}
            className="border-[0.5px] border-slate-300 rounded-[7px] px-2 py-2 text-sm text-slate-700"
          >
            <option value="">All Categories</option>
            {payPeriod.allocations.map(a => {
              const cat = getCat(a.categoryId);
              return cat ? <option key={a.categoryId} value={a.categoryId}>{cat.name}</option> : null;
            })}
          </select>
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            className="border-[0.5px] border-slate-300 rounded-[7px] px-2 py-2 text-sm text-slate-700"
          >
            <option value="">All Priorities</option>
            {(Object.entries(PRIORITY_LABELS) as [Priority, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="border-[0.5px] border-slate-300 rounded-[7px] px-2 py-2 text-sm flex-1 text-slate-700"
          />
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="text-sm text-slate-400 text-center py-8">
            {allTransactions.length === 0 ? 'No transactions yet.' : 'No transactions match the filters.'}
          </div>
        ) : (
          <div className="space-y-4">
            {transactionsByDate.map(([date, txns]) => (
              <div key={date}>
                <div className="text-[11px] font-medium text-slate-500 mb-1.5">
                  {fmtDateShort(date)}
                </div>
                <div className="rounded-[10px] border-[0.5px] border-slate-100 overflow-hidden">
                  {txns.map(t => {
                    const cat = getCat(t.categoryId);
                    const sub = getSubCat(t.subCategoryId);
                    const bucketLabel = sub
                      ? `${cat?.name ?? ''} › ${sub.name}`
                      : (cat?.name ?? '—');
                    return (
                      <div key={t.id} className="flex items-center gap-3 px-3 py-2.5 border-b border-[0.5px] border-slate-50 last:border-0 hover:bg-slate-50 group">
                        <div className={`w-[30px] h-[30px] rounded-[6px] flex items-center justify-center shrink-0 text-white text-[11px] font-semibold ${categoryBgColor(t.categoryId)}`}>
                          {categoryInitials(cat?.name ?? '?')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-slate-800">{t.description}</div>
                          <div className="text-[11px] text-slate-400">{bucketLabel}</div>
                          {t.notes && <div className="text-[11px] text-slate-400 italic mt-0.5">{t.notes}</div>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono text-sm text-slate-800">{fmt(t.amount)}</span>
                          <span className={`text-[11px] px-1.5 py-0.5 rounded ${priorityBadge(t.priority)}`}>
                            {PRIORITY_LABELS[t.priority] ?? t.priority}
                          </span>
                          {isActive && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setEditingTransaction(t)}
                                className="text-slate-400 hover:text-emerald-600"
                                title="Edit"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteTransaction(t.id)}
                                className="text-slate-400 hover:text-red-500"
                                title="Delete"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Transaction Modal */}
      {(showAddTransaction || editingTransaction) && (
        <AddTransactionModal
          payPeriod={{ payDate: payPeriod.payDate, endDate: payPeriod.endDate }}
          allocations={payPeriod.allocations}
          categories={categories}
          subCategories={subCategories}
          initialData={editingTransaction ? {
            transactionId: editingTransaction.id,
            categoryId: editingTransaction.categoryId,
            subCategoryId: editingTransaction.subCategoryId,
            description: editingTransaction.description,
            amount: editingTransaction.amount,
            date: editingTransaction.date,
            priority: editingTransaction.priority,
            notes: editingTransaction.notes,
          } : undefined}
          onSubmit={editingTransaction ? handleEditTransaction : handleAddTransaction}
          onClose={() => { setShowAddTransaction(false); setEditingTransaction(null); }}
        />
      )}
    </div>
  );
}

function priorityBadge(priority: Priority): string {
  switch (priority) {
    case 'NEED_IT': return 'bg-blue-100 text-blue-700';
    case 'GOTTA_HAVE_IT': return 'bg-violet-100 text-violet-700';
    case 'MEH': return 'bg-amber-100 text-amber-700';
    case 'DROP_IT': return 'bg-red-100 text-red-700';
    default: return 'bg-slate-100 text-slate-500';
  }
}
