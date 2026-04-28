import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import type { PayPeriod, Category, SubCategory, Transaction, SavingsTransfer, Priority, ClosePayPeriodRequest } from '../types';
import { PRIORITY_LABELS } from '../types';
import { AddTransactionModal } from '../components/AddTransactionModal';
import { SavingsTransferModal } from '../components/SavingsTransferModal';
import { OverspendResolutionModal } from '../components/OverspendResolutionModal';
import { MoveSurplusToSavingsModal } from '../components/MoveSurplusToSavingsModal';
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
  // Savings transfer modal state
  const [savingsTransferAllocationId, setSavingsTransferAllocationId] = useState<string | null>(null);
  const [editingSavingsTransfer, setEditingSavingsTransfer] = useState<(SavingsTransfer & { allocationId: string }) | null>(null);
  // Overspend resolution modal — mode: 'resolve' (save only) | 'close' (save + close)
  const [overspendModalMode, setOverspendModalMode] = useState<'resolve' | 'close' | null>(null);
  // Move surplus to savings modal
  const [moveSurplusAllocationId, setMoveSurplusAllocationId] = useState<string | null>(null);

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
  const totalRemaining = payPeriod?.allocations
    .filter(a => a.currentBalance > 0)
    .reduce((s, a) => s + a.currentBalance, 0) ?? 0;
  const unallocated = (payPeriod?.amount ?? 0) - totalAllocated;

  // Transaction-based overspend (matches backend calculateOverspend), net of existing coverage
  const rawOverspend = payPeriod?.allocations.reduce((s, a) => {
    const spent = a.transactions.reduce((ts, t) => ts + t.amount, 0);
    const over = spent - a.allocatedAmount;
    return s + (over > 0 ? over : 0);
  }, 0) ?? 0;
  const existingCoverage = (payPeriod?.allocations.reduce((s, a) => {
    const offsets = (a.savingsTransfers ?? [])
      .filter(t => t.type === 'OVERSPEND_OFFSET')
      .reduce((ss, t) => ss + t.amount, 0);
    const withdrawals = (a.savingsTransfers ?? [])
      .filter(t => t.type === 'HYSA_WITHDRAWAL')
      .reduce((ss, t) => ss + Math.abs(t.amount), 0);
    return s + offsets + withdrawals;
  }, 0) ?? 0) + (payPeriod?.carryForwardAmount ?? 0);
  const overspend = Math.max(0, rawOverspend - existingCoverage);

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

  const savingsSummary = useMemo(() => {
    if (!payPeriod) return [];
    return payPeriod.allocations
      .filter(a => {
        const cat = categories.find(c => c.id === a.categoryId);
        return cat?.type === 'SAVINGS';
      })
      .map(a => ({
        categoryId: a.categoryId,
        saved: (a.savingsTransfers ?? []).filter(t => t.type === 'TRANSFER' || t.type == null).reduce((s, t) => s + t.amount, 0)
          - (a.savingsTransfers ?? []).filter(t => t.type === 'HYSA_WITHDRAWAL').reduce((s, t) => s + Math.abs(t.amount), 0),
        spent: a.transactions.reduce((s, t) => s + t.amount, 0)
          + (a.savingsTransfers ?? []).filter(t => t.type === 'OVERSPEND_OFFSET').reduce((s, t) => s + t.amount, 0),
      }))
      .filter(row => row.saved > 0 || row.spent > 0);
  }, [payPeriod, categories]);

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

  const handleAddSavingsTransfer = async (data: { amount: number; date: string; notes?: string }) => {
    await api.addSavingsTransfer(savingsTransferAllocationId!, data);
    await loadData();
  };

  const handleEditSavingsTransfer = async (data: { amount: number; date: string; notes?: string }) => {
    await api.updateSavingsTransfer(editingSavingsTransfer!.id, data);
    await loadData();
  };

  const handleDeleteSavingsTransfer = async (transferId: string) => {
    if (!confirm('Delete this savings transfer?')) return;
    try {
      await api.deleteSavingsTransfer(transferId);
      await loadData();
    } catch {
      setError('Failed to delete savings transfer');
    }
  };

  const handleMoveSurplus = async (data: { savingsAllocationId: string; amount: number; date: string; notes?: string }) => {
    const expenseAlloc = payPeriod!.allocations.find(a => a.id === moveSurplusAllocationId)!;
    const savingsAlloc = payPeriod!.allocations.find(a => a.id === data.savingsAllocationId)!;
    const round2 = (n: number) => Math.round(n * 100) / 100;
    await api.updateAllocation(expenseAlloc.id, { allocatedAmount: round2(expenseAlloc.allocatedAmount - data.amount) });
    await api.updateAllocation(savingsAlloc.id, { allocatedAmount: round2(savingsAlloc.allocatedAmount + data.amount) });
    await api.addSavingsTransfer(savingsAlloc.id, { amount: data.amount, date: data.date, notes: data.notes });
    setMoveSurplusAllocationId(null);
    await loadData();
  };

  const handleClosePayPeriod = () => {
    if (!payPeriod) return;

    const savingsWithBalance = payPeriod.allocations
      .filter(a => getCat(a.categoryId)?.type === 'SAVINGS' && a.currentBalance > 0.005);
    if (savingsWithBalance.length > 0) {
      const names = savingsWithBalance.map(a => getCat(a.categoryId)?.name ?? '—').join(', ');
      setError(
        `Record your savings transfers before closing. ${names} still ${savingsWithBalance.length === 1 ? 'has' : 'have'} a remaining balance.`
      );
      return;
    }

    if (overspend > 0.005) {
      setOverspendModalMode('close');
    } else {
      if (!confirm('Close this pay period?')) return;
      api.closePayPeriod(id!).then(() => loadData()).catch(() => setError('Failed to close pay period'));
    }
  };

  const handleResolveAndClose = async (resolution: ClosePayPeriodRequest) => {
    await api.closePayPeriod(id!, resolution);
    setOverspendModalMode(null);
    await loadData();
  };

  const handleResolveOnly = async (resolution: ClosePayPeriodRequest) => {
    await api.resolveOverspend(id!, resolution);
    setOverspendModalMode(null);
    await loadData();
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

  // All savings transfers across all savings allocations, sorted by date desc (includes resolution entries)
  const allSavingsTransfers = payPeriod.allocations
    .filter(a => getCat(a.categoryId)?.type === 'SAVINGS')
    .flatMap(a => (a.savingsTransfers ?? [])
      .map(s => ({ ...s, allocationId: a.id, categoryId: a.categoryId })))
    .sort((a, b) => b.date.localeCompare(a.date));

  const renderAllocationTable = (type: 'EXPENSE' | 'SAVINGS') => {
    const allocs = payPeriod.allocations.filter(a => getCat(a.categoryId)?.type === type);
    if (allocs.length === 0) return null;

    const totalAllocatedForType = allocs.reduce((s, a) => s + a.allocatedAmount, 0);
    const totalSpentForType = allocs.reduce((s, a) => {
      const txSpent = a.transactions.reduce((ts, t) => ts + t.amount, 0);
      const offsetSpent = type === 'SAVINGS'
        ? (a.savingsTransfers ?? []).filter(t => t.type === 'OVERSPEND_OFFSET').reduce((ss, t) => ss + t.amount, 0)
        : 0;
      return s + txSpent + offsetSpent;
    }, 0);
    const totalSaved = type === 'SAVINGS'
      ? allocs.reduce((s, a) => {
          const transferred = (a.savingsTransfers ?? []).filter(t => t.type === 'TRANSFER' || t.type == null).reduce((ss, t) => ss + t.amount, 0);
          const withdrawn = (a.savingsTransfers ?? []).filter(t => t.type === 'HYSA_WITHDRAWAL').reduce((ss, t) => ss + Math.abs(t.amount), 0);
          return s + transferred - withdrawn;
        }, 0)
      : 0;
    const totalPositiveRemaining = allocs.filter(a => a.currentBalance >= 0).reduce((s, a) => s + a.currentBalance, 0);
    const totalOverspent = allocs.filter(a => a.currentBalance < 0).reduce((s, a) => s + Math.abs(a.currentBalance), 0);

    return (
      <div className="mb-4">
        <div className="text-[11px] font-bold text-slate-500 tracking-wider mb-1">{type === 'EXPENSE' ? 'EXPENSES' : 'SAVINGS'}</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[0.5px] border-slate-200 text-slate-500 text-xs">
              <th className="text-left py-1 font-medium">Category</th>
              <th className="text-right py-1 font-medium">Allocated</th>
              {type === 'SAVINGS' && <th className="text-right py-1 font-medium">Saved</th>}
              <th className="text-right py-1 font-medium">Spent</th>
              <th className="text-right py-1 font-medium">Remaining</th>
              {isActive && <th className="w-32"></th>}
            </tr>
          </thead>
          <tbody>
            {allocs.map(a => {
              const savedAmount = type === 'SAVINGS'
                ? (a.savingsTransfers ?? []).filter(t => t.type === 'TRANSFER' || t.type == null).reduce((s, t) => s + t.amount, 0)
                  - (a.savingsTransfers ?? []).filter(t => t.type === 'HYSA_WITHDRAWAL').reduce((s, t) => s + Math.abs(t.amount), 0)
                : 0;
              const offsetSpent = type === 'SAVINGS'
                ? (a.savingsTransfers ?? []).filter(t => t.type === 'OVERSPEND_OFFSET').reduce((s, t) => s + t.amount, 0)
                : 0;
              const spent = a.transactions.reduce((s, t) => s + t.amount, 0) + offsetSpent;
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
                  {type === 'SAVINGS' && (
                    <td className="py-2.5 text-right font-mono text-emerald-600">{fmt(savedAmount)}</td>
                  )}
                  <td className="py-2.5 text-right font-mono text-slate-800">{fmt(spent)}</td>
                  <td className="py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded leading-none ${
                        type === 'EXPENSE' && a.currentBalance < 0 && overspend <= 0.005
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'invisible'
                      }`}>covered</span>
                      <span className={`font-mono ${a.currentBalance < 0 ? (type === 'EXPENSE' && overspend <= 0.005 ? 'text-amber-600' : 'text-red-600') : 'text-slate-800'}`}>
                        {fmt(a.currentBalance)}
                      </span>
                    </div>
                  </td>
                  {isActive && (
                    <td className="py-2.5 pl-2 pr-2 text-right">
                      {isEditing ? (
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => handleSaveAllocation(a.id)} className="text-xs text-emerald-600 hover:underline">Save</button>
                          <button onClick={() => setEditingAllocationId(null)} className="text-xs text-slate-400 hover:underline">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex gap-3 justify-end items-center">
                          {type === 'SAVINGS' && (
                            <button
                              onClick={() => setSavingsTransferAllocationId(a.id)}
                              className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-[0.5px] border-emerald-200 whitespace-nowrap"
                            >
                              Record Savings
                            </button>
                          )}
                          {type === 'EXPENSE' && a.currentBalance > 0.005 && payPeriod.allocations.some(sa => getCat(sa.categoryId)?.type === 'SAVINGS') && (
                            <button
                              onClick={() => setMoveSurplusAllocationId(a.id)}
                              className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-[0.5px] border-emerald-200 whitespace-nowrap"
                            >
                              Save surplus
                            </button>
                          )}
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
                            disabled={a.transactions.length > 0 || (a.savingsTransfers ?? []).length > 0}
                            className={`${a.transactions.length > 0 || (a.savingsTransfers ?? []).length > 0 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-red-500'}`}
                            title={a.transactions.length > 0 ? 'Cannot delete: has transactions' : (a.savingsTransfers ?? []).length > 0 ? 'Cannot delete: has savings recorded' : 'Delete'}
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
          <tfoot>
            <tr className="bg-slate-200 border-t border-slate-300 [&>td:first-child]:rounded-l-[6px] [&>td:last-child]:rounded-r-[6px]">
              <td className="py-2 px-1 font-semibold text-slate-800">Total</td>
              <td className="py-2 px-1 text-right font-mono font-semibold text-slate-800">{fmt(totalAllocatedForType)}</td>
              {type === 'SAVINGS' && (
                <td className="py-2 px-1 text-right font-mono font-semibold text-emerald-600">{fmt(totalSaved)}</td>
              )}
              <td className="py-2 px-1 text-right font-mono font-semibold">
                <div className="text-slate-800">{fmt(totalSpentForType)}</div>
                {totalOverspent > 0 && (
                  <div className="text-[11px] text-red-500 font-normal">−{fmt(totalOverspent)} overspent</div>
                )}
              </td>
              <td className="py-2 px-1 text-right font-mono font-semibold text-slate-800">{fmt(totalPositiveRemaining)}</td>
              {isActive && <td />}
            </tr>
          </tfoot>
        </table>

        {/* Savings transfer history inline under the SAVINGS table */}
        {type === 'SAVINGS' && allSavingsTransfers.length > 0 && (
          <div className="mt-3">
            <div className="text-[11px] font-medium text-slate-400 mb-1.5">TRANSFER HISTORY</div>
            <div className="rounded-[8px] border-[0.5px] border-emerald-100 overflow-hidden">
              {allSavingsTransfers.map(s => {
                const isOffset = s.type === 'OVERSPEND_OFFSET';
                const isWithdrawal = s.type === 'HYSA_WITHDRAWAL';
                const isRegular = !isOffset && !isWithdrawal;
                const displayAmount = isWithdrawal ? Math.abs(s.amount) : s.amount;
                const catName = getCat(s.categoryId)?.name ?? '—';
                const label = isOffset
                  ? `Overspend Offset — ${catName}`
                  : isWithdrawal
                  ? `HYSA Withdrawal — ${catName}`
                  : catName;
                return (
                  <div key={s.id} className={`flex items-center gap-3 px-3 py-2 border-b border-[0.5px] last:border-0 group ${
                    isOffset ? 'border-amber-50 hover:bg-amber-50' : isWithdrawal ? 'border-red-50 hover:bg-red-50' : 'border-emerald-50 hover:bg-emerald-50'
                  }`}>
                    <div className={`w-[30px] h-[30px] rounded-[6px] flex items-center justify-center shrink-0 ${
                      isOffset ? 'bg-amber-100' : isWithdrawal ? 'bg-red-100' : 'bg-emerald-100'
                    }`}>
                      {isWithdrawal ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      ) : isOffset ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-700">{label}</div>
                      <div className="text-[11px] text-slate-400">{fmtDateShort(s.date)}{s.notes ? ` · ${s.notes}` : ''}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`font-mono text-sm ${isOffset ? 'text-amber-600' : isWithdrawal ? 'text-red-600' : 'text-emerald-600'}`}>
                        {isWithdrawal ? '−' : ''}{fmt(displayAmount)}
                      </span>
                      {isActive && isRegular && (
                        <>
                          <button
                            onClick={() => setEditingSavingsTransfer(s)}
                            className="text-slate-400 hover:text-emerald-600"
                            title="Edit"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteSavingsTransfer(s.id)}
                            className="text-slate-400 hover:text-red-500"
                            title="Delete"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Find the allocation for the savings transfer modal (for category name)
  const savingsTransferAllocation = savingsTransferAllocationId
    ? payPeriod.allocations.find(a => a.id === savingsTransferAllocationId)
    : null;
  const editingSavingsTransferAllocation = editingSavingsTransfer
    ? payPeriod.allocations.find(a => a.id === editingSavingsTransfer.allocationId)
    : null;

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
            {overspend > 0.005 ? (
              <button
                onClick={() => setOverspendModalMode('resolve')}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-[7px] hover:bg-red-700"
              >
                Resolve Overspend
              </button>
            ) : null}
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

      {/* Carry forward banner */}
      {isActive && (() => {
        const cf = payPeriod.carryForwardAmount ?? 0;
        return cf > 0.005 ? (
          <div className="bg-amber-50 border-[0.5px] border-amber-300 text-amber-800 px-4 py-3 rounded-[10px] text-sm flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <span className="font-semibold">Carry forward: </span>
              <span className="font-mono">{fmt(cf)}</span> from the previous pay period is unresolved. Reduce your savings allocation by this amount to account for it.
            </div>
          </div>
        ) : null;
      })()}

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
        <div className={`grid gap-6 ${savingsSummary.length > 0 ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {/* By Category */}
          <div className="bg-slate-50 rounded-[8px] border-[0.5px] border-slate-200 p-4">
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
                  <tr className="bg-slate-200 border-t border-slate-300 [&>td:first-child]:rounded-l-[6px] [&>td:last-child]:rounded-r-[6px]">
                    <td className="py-2 px-1 font-semibold text-slate-800">Grand Total</td>
                    <td className="py-2 px-1 text-right font-mono font-semibold text-slate-800">{fmt(grandTotal)}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {/* By Priority */}
          <div className="bg-slate-50 rounded-[8px] border-[0.5px] border-slate-200 p-4">
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
                        <td className="py-1.5">
                          <span className={`text-[11px] px-1.5 py-0.5 rounded ${priorityBadge(p)}`}>{label}</span>
                        </td>
                        <td className="py-1.5 text-right font-mono font-[500] text-slate-800">{fmt(priorityTotals[p]!)}</td>
                      </tr>
                    ))}
                  <tr className="bg-slate-200 border-t border-slate-300 [&>td:first-child]:rounded-l-[6px] [&>td:last-child]:rounded-r-[6px]">
                    <td className="py-2 px-1 font-semibold text-slate-800">Grand Total</td>
                    <td className="py-2 px-1 text-right font-mono font-semibold text-slate-800">{fmt(grandTotal)}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
          {/* By Savings */}
          {savingsSummary.length > 0 && (
            <div className="bg-slate-50 rounded-[8px] border-[0.5px] border-slate-200 p-4">
              <div className="text-xs font-medium text-slate-500 mb-2">By Savings</div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[0.5px] border-slate-100 text-slate-400 text-[11px]">
                    <th className="text-left pb-1 font-medium">Category</th>
                    <th className="text-right pb-1 font-medium">Saved</th>
                    <th className="text-right pb-1 font-medium">Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {savingsSummary.map(row => (
                    <tr key={row.categoryId} className="border-b border-[0.5px] border-slate-50">
                      <td className="py-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-[7px] h-[7px] rounded-full shrink-0 ${categoryBgColor(row.categoryId)}`} />
                          <span className="text-slate-700">{getCat(row.categoryId)?.name ?? '—'}</span>
                        </div>
                      </td>
                      <td className="py-1.5 text-right font-mono font-[500] text-emerald-600">{fmt(row.saved)}</td>
                      <td className="py-1.5 text-right font-mono font-[500] text-slate-800">{fmt(row.spent)}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-200 border-t border-slate-300 [&>td:first-child]:rounded-l-[6px] [&>td:last-child]:rounded-r-[6px]">
                    <td className="py-2 px-1 font-semibold text-slate-800">Total</td>
                    <td className="py-2 px-1 text-right font-mono font-semibold text-emerald-600">
                      {fmt(savingsSummary.reduce((s, r) => s + r.saved, 0))}
                    </td>
                    <td className="py-2 px-1 text-right font-mono font-semibold text-slate-800">
                      {fmt(savingsSummary.reduce((s, r) => s + r.spent, 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
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

      {/* Add Savings Transfer Modal */}
      {savingsTransferAllocationId && savingsTransferAllocation && (
        <SavingsTransferModal
          payPeriod={{ payDate: payPeriod.payDate, endDate: payPeriod.endDate }}
          categoryName={getCat(savingsTransferAllocation.categoryId)?.name ?? ''}
          onSubmit={handleAddSavingsTransfer}
          onClose={() => setSavingsTransferAllocationId(null)}
        />
      )}

      {/* Edit Savings Transfer Modal */}
      {editingSavingsTransfer && editingSavingsTransferAllocation && (
        <SavingsTransferModal
          payPeriod={{ payDate: payPeriod.payDate, endDate: payPeriod.endDate }}
          categoryName={getCat(editingSavingsTransferAllocation.categoryId)?.name ?? ''}
          initialData={editingSavingsTransfer}
          onSubmit={handleEditSavingsTransfer}
          onClose={() => setEditingSavingsTransfer(null)}
        />
      )}

      {/* Move Surplus to Savings Modal */}
      {moveSurplusAllocationId && (() => {
        const expenseAlloc = payPeriod.allocations.find(a => a.id === moveSurplusAllocationId)!;
        const savingsOptions = payPeriod.allocations
          .filter(a => getCat(a.categoryId)?.type === 'SAVINGS')
          .map(a => ({ id: a.id, categoryName: getCat(a.categoryId)?.name ?? '—' }));
        return (
          <MoveSurplusToSavingsModal
            payPeriod={{ payDate: payPeriod.payDate, endDate: payPeriod.endDate }}
            expenseCategoryName={getCat(expenseAlloc.categoryId)?.name ?? '—'}
            remainingBalance={expenseAlloc.currentBalance}
            savingsAllocations={savingsOptions}
            onSubmit={handleMoveSurplus}
            onClose={() => setMoveSurplusAllocationId(null)}
          />
        );
      })()}

      {/* Overspend Resolution Modal */}
      {overspendModalMode !== null && (
        <OverspendResolutionModal
          overspend={overspend}
          savingsAllocations={payPeriod.allocations
            .filter(a => getCat(a.categoryId)?.type === 'SAVINGS')
            .map(a => ({
              id: a.id,
              categoryName: getCat(a.categoryId)?.name ?? '—',
              remainingBalance: Math.max(0, a.currentBalance),
            }))}
          submitLabel={overspendModalMode === 'close' ? 'Resolve & Close' : 'Save Resolution'}
          onSubmit={overspendModalMode === 'close' ? handleResolveAndClose : handleResolveOnly}
          onCancel={() => setOverspendModalMode(null)}
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
