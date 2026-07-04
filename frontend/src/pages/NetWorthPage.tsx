import { useMemo, useState, useEffect } from 'react';
import type { NetWorthCategoryKey, NetWorthCategoryMeta, NetWorthCategoryType, NetWorthSnapshot } from '../types';
import * as api from '../api/client';

interface SubItemRow {
  id: string;
  name: string;
  amount: string;
}

type FormEntries = Partial<Record<string, SubItemRow[]>>;

function newRow(): SubItemRow {
  return { id: crypto.randomUUID(), name: '', amount: '' };
}

function monthsBetween(prevDate: string, date: string): number {
  const [py, pm] = prevDate.split('-').map(Number);
  const [cy, cm] = date.split('-').map(Number);
  return Math.max(1, (cy - py) * 12 + (cm - pm));
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function blurOnWheel(e: React.WheelEvent<HTMLInputElement>) {
  e.currentTarget.blur();
}

function snapshotTotal(snapshot: NetWorthSnapshot, categoryMap: Map<NetWorthCategoryKey, NetWorthCategoryMeta>): number {
  return snapshot.entries.reduce((sum, e) => {
    const type = categoryMap.get(e.category)?.type;
    const total = e.subItems.reduce((s, si) => s + si.amount, 0);
    return type === 'LIABILITY' ? sum - total : sum + total;
  }, 0);
}

export function NetWorthPage() {
  const [categories, setCategories] = useState<NetWorthCategoryMeta[]>([]);
  const [snapshots, setSnapshots] = useState<NetWorthSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formDate, setFormDate] = useState('');
  const [formEntries, setFormEntries] = useState<FormEntries>({});
  const [formNotes, setFormNotes] = useState('');
  const [addingCategoryType, setAddingCategoryType] = useState<NetWorthCategoryType | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const categoryMap = useMemo(
    () => new Map(categories.map(c => [c.key, c])),
    [categories]
  );

  const assetCategories = categories.filter(c => c.type === 'ASSET');
  const liabilityCategories = categories.filter(c => c.type === 'LIABILITY');

  const loadData = async () => {
    try {
      const [cats, snaps] = await Promise.all([api.getNetWorthCategories(), api.getNetWorthSnapshots()]);
      setCategories(cats);
      setSnapshots(snaps);
    } catch {
      setError('Failed to load net worth data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const buildInitialEntries = (cats: NetWorthCategoryMeta[], existing?: NetWorthSnapshot): FormEntries => {
    const result: FormEntries = {};
    for (const c of cats) {
      const entry = existing?.entries.find(e => e.category === c.key);
      result[c.key] = entry && entry.subItems.length > 0
        ? entry.subItems.map(si => ({ id: crypto.randomUUID(), name: si.name ?? '', amount: String(si.amount) }))
        : [newRow()];
    }
    return result;
  };

  const resetForm = () => {
    setFormDate('');
    setFormEntries(buildInitialEntries(categories));
    setFormNotes('');
  };

  const loadFormFrom = (s: NetWorthSnapshot) => {
    setFormDate(s.date);
    setFormEntries(buildInitialEntries(categories, s));
    setFormNotes(s.notes ?? '');
  };

  const handleStartCreate = () => {
    resetForm();
    setEditingId(null);
    setShowCreate(true);
  };

  const handleStartEdit = (s: NetWorthSnapshot) => {
    loadFormFrom(s);
    setEditingId(s.id);
    setShowCreate(false);
  };

  const handleCancel = () => {
    setShowCreate(false);
    setEditingId(null);
    setAddingCategoryType(null);
    setNewCategoryName('');
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this snapshot?')) return;
    try {
      await api.deleteNetWorthSnapshot(id);
      setSnapshots(prev => prev.filter(s => s.id !== id));
    } catch {
      setError('Failed to delete snapshot');
    }
  };

  const buildPayload = () => ({
    date: formDate,
    entries: categories
      .map(c => ({
        category: c.key,
        subItems: (formEntries[c.key] ?? [])
          .filter(r => r.amount !== '')
          .map(r => ({ name: r.name.trim() || undefined, amount: parseFloat(r.amount) })),
      }))
      .filter(e => e.subItems.length > 0),
    notes: formNotes.trim() || undefined,
  });

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createNetWorthSnapshot(buildPayload());
      setSnapshots(prev => [...prev, created]);
      setShowCreate(false);
      resetForm();
    } catch {
      setError('Failed to create snapshot');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      const updated = await api.updateNetWorthSnapshot(editingId, buildPayload());
      setSnapshots(prev => prev.map(s => s.id === editingId ? updated : s));
      setEditingId(null);
      resetForm();
    } catch {
      setError('Failed to update snapshot');
    }
  };

  const addSubItem = (key: string) => {
    setFormEntries(prev => ({ ...prev, [key]: [...(prev[key] ?? []), newRow()] }));
  };

  const removeSubItem = (key: string, id: string) => {
    setFormEntries(prev => ({ ...prev, [key]: (prev[key] ?? []).filter(r => r.id !== id) }));
  };

  const updateSubItem = (key: string, id: string, field: 'name' | 'amount', value: string) => {
    setFormEntries(prev => ({
      ...prev,
      [key]: (prev[key] ?? []).map(r => r.id === id ? { ...r, [field]: value } : r),
    }));
  };

  const handleAddCategory = async (type: NetWorthCategoryType) => {
    const name = newCategoryName.trim();
    if (!name) return;
    try {
      const created = await api.createNetWorthCategory({ name, type });
      setCategories(prev => [...prev, created]);
      setFormEntries(prev => ({ ...prev, [created.key]: [newRow()] }));
      setNewCategoryName('');
      setAddingCategoryType(null);
    } catch {
      setError('Failed to add category');
    }
  };

  const handleRemoveCategory = async (key: string) => {
    if (!confirm('Remove this category?')) return;
    try {
      await api.deleteNetWorthCategory(key);
      setCategories(prev => prev.filter(c => c.key !== key));
      setFormEntries(prev => {
        const rest = { ...prev };
        delete rest[key];
        return rest;
      });
    } catch {
      setError('Failed to remove category. It may still be used in an existing snapshot.');
    }
  };

  const inputCls = 'border-[0.5px] border-slate-300 rounded-[7px] px-3 py-2 text-sm font-mono text-slate-800 focus:outline-none focus:border-emerald-500';
  const textInputCls = 'border-[0.5px] border-slate-300 rounded-[7px] px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-emerald-500';

  const categoryTotal = (key: string) =>
    (formEntries[key] ?? []).reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);

  const totalAssets = assetCategories.reduce((s, c) => s + categoryTotal(c.key), 0);
  const totalLiabilities = liabilityCategories.reduce((s, c) => s + categoryTotal(c.key), 0);
  const netWorth = totalAssets - totalLiabilities;

  const renderCategoryBlock = (c: NetWorthCategoryMeta) => {
    const rows = formEntries[c.key] ?? [newRow()];
    const showNames = rows.length > 1;
    const total = categoryTotal(c.key);

    return (
      <div key={c.key}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-slate-600">{c.label}</span>
          <div className="flex items-center gap-2">
            {showNames && <span className="text-xs font-mono text-slate-400">{fmt(total)}</span>}
            <button type="button" onClick={() => addSubItem(c.key)} className="text-[11px] text-emerald-600 hover:text-emerald-700">
              + Add
            </button>
            {c.custom && (
              <button type="button" onClick={() => handleRemoveCategory(c.key)} className="text-[11px] text-slate-400 hover:text-red-500">
                Remove
              </button>
            )}
          </div>
        </div>
        <div className="space-y-1">
          {rows.map((row, idx) => (
            <div key={row.id} className="flex items-center gap-2">
              {showNames ? (
                <input
                  type="text"
                  value={row.name}
                  onChange={e => updateSubItem(c.key, row.id, 'name', e.target.value)}
                  placeholder="e.g. Chase Savings"
                  className={textInputCls + ' flex-1'}
                />
              ) : (
                <div className="flex-1" />
              )}
              <input
                type="number"
                value={row.amount}
                onChange={e => updateSubItem(c.key, row.id, 'amount', e.target.value)}
                onWheel={blurOnWheel}
                placeholder="0.00"
                step="0.01"
                aria-label={showNames ? `${c.label} ${idx + 1}` : c.label}
                className={inputCls + ' w-32'}
              />
              {showNames && (
                <button
                  type="button"
                  onClick={() => removeSubItem(c.key, row.id)}
                  className="text-slate-400 hover:text-red-500 text-lg leading-none px-1"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAddCategoryControl = (type: NetWorthCategoryType) => (
    addingCategoryType === type ? (
      <div className="flex gap-2 mt-2">
        <input
          type="text"
          value={newCategoryName}
          onChange={e => setNewCategoryName(e.target.value)}
          placeholder="Category name"
          className={textInputCls + ' flex-1'}
          autoFocus
        />
        <button type="button" onClick={() => handleAddCategory(type)} className="text-xs px-2 py-1 bg-emerald-600 text-white rounded-[7px] hover:bg-emerald-700">
          Add
        </button>
        <button type="button" onClick={() => { setAddingCategoryType(null); setNewCategoryName(''); }} className="text-xs px-2 py-1 bg-slate-700 text-white rounded-[7px] hover:bg-slate-600">
          Cancel
        </button>
      </div>
    ) : (
      <button
        type="button"
        onClick={() => setAddingCategoryType(type)}
        className="mt-2 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
      >
        + Add Custom {type === 'ASSET' ? 'Asset' : 'Liability'}
      </button>
    )
  );

  const renderForm = (onSubmit: (e: React.FormEvent) => void, submitLabel: string) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="networth-date" className="block text-[11px] font-medium text-slate-500 mb-1">Date</label>
        <input
          id="networth-date"
          type="date"
          value={formDate}
          onChange={e => setFormDate(e.target.value)}
          className={inputCls + ' w-full max-w-xs'}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <div className="text-[11px] font-bold text-slate-400 tracking-wider mb-2">ASSETS</div>
          <div className="space-y-3">
            {assetCategories.map(c => renderCategoryBlock(c))}
          </div>
          {renderAddCategoryControl('ASSET')}
        </div>
        <div>
          <div className="text-[11px] font-bold text-slate-400 tracking-wider mb-2">LIABILITIES</div>
          <div className="space-y-3">
            {liabilityCategories.map(c => renderCategoryBlock(c))}
          </div>
          {renderAddCategoryControl('LIABILITY')}
        </div>
      </div>

      <div>
        <label htmlFor="networth-notes" className="block text-[11px] font-medium text-slate-500 mb-1">Notes (optional)</label>
        <textarea
          id="networth-notes"
          value={formNotes}
          onChange={e => setFormNotes(e.target.value)}
          placeholder="e.g. IRA lost value due to market dip"
          className={inputCls + ' font-sans w-full'}
          rows={2}
        />
      </div>

      <div className="rounded-[8px] border-[0.5px] border-slate-200 bg-slate-50 px-4 py-3 space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500">Total Assets</span>
          <span className="font-mono text-slate-700">{fmt(totalAssets)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Total Liabilities</span>
          <span className="font-mono text-slate-700">{fmt(totalLiabilities)}</span>
        </div>
        <div className="border-t border-slate-200 pt-1.5 flex justify-between font-medium">
          <span className="text-slate-700">Net Worth</span>
          <span className={`font-mono ${netWorth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(netWorth)}</span>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button type="submit" className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-[7px] hover:bg-emerald-700">
          {submitLabel}
        </button>
        <button type="button" onClick={handleCancel} className="px-4 py-2 bg-slate-700 text-white text-sm rounded-[7px] hover:bg-slate-600">
          Cancel
        </button>
      </div>
    </form>
  );

  const sortedSnapshots = useMemo(
    () => [...snapshots].sort((a, b) => a.date.localeCompare(b.date)),
    [snapshots]
  );

  if (loading) {
    return <div className="text-sm text-slate-400 py-12 text-center">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Net Worth</h1>
        {!showCreate && !editingId && (
          <button
            onClick={handleStartCreate}
            className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-[7px] hover:bg-emerald-700"
          >
            New Snapshot
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border-[0.5px] border-red-200 text-red-700 px-4 py-3 rounded-[10px] text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-4 underline">Dismiss</button>
        </div>
      )}

      {showCreate && (
        <div className="bg-white rounded-[10px] border-[0.5px] border-slate-200 p-5">
          <div className="text-sm font-semibold text-slate-700 mb-4">New Snapshot</div>
          {renderForm(handleSaveCreate, 'Save Snapshot')}
        </div>
      )}

      {sortedSnapshots.length === 0 && !showCreate ? (
        <div className="bg-white rounded-[10px] border-[0.5px] border-slate-200 p-10 text-center text-sm text-slate-400">
          No snapshots yet. Log your first one monthly to start tracking net worth over time.
        </div>
      ) : (
        <div className="bg-white rounded-[10px] border-[0.5px] border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] text-slate-400 font-bold tracking-wider">
                <th className="text-left px-4 py-2">Date</th>
                <th className="text-right px-4 py-2">Net Worth</th>
                <th className="text-right px-4 py-2">Change</th>
                <th className="text-left px-4 py-2">Notes</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {sortedSnapshots.map((s, i) => {
                if (editingId === s.id) {
                  return (
                    <tr key={s.id}>
                      <td colSpan={5} className="p-5 border-b border-slate-100">
                        <div className="text-sm font-semibold text-slate-700 mb-4">Edit Snapshot</div>
                        {renderForm(handleSaveEdit, 'Save Changes')}
                      </td>
                    </tr>
                  );
                }

                const total = snapshotTotal(s, categoryMap);
                const prev = i > 0 ? sortedSnapshots[i - 1] : null;
                const change = prev ? total - snapshotTotal(prev, categoryMap) : null;
                const months = prev ? monthsBetween(prev.date, s.date) : 0;

                return (
                  <tr key={s.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50 group">
                    <td className="px-4 py-2.5 text-slate-700">{formatDate(s.date)}</td>
                    <td className={`px-4 py-2.5 text-right font-mono ${total >= 0 ? 'text-slate-800' : 'text-red-600'}`}>{fmt(total)}</td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      {change === null ? (
                        <span className="text-slate-300">—</span>
                      ) : (
                        <span className={change >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                          {change >= 0 ? '+' : ''}{fmt(change)}
                          {months > 1 && <span className="text-slate-400 font-sans text-xs"> ({fmt(change / months)}/mo)</span>}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs max-w-xs truncate" title={s.notes}>{s.notes}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleStartEdit(s)} className="text-xs text-slate-500 hover:text-emerald-600">Edit</button>
                        <button onClick={() => handleDelete(s.id)} className="text-xs text-slate-500 hover:text-red-600">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
