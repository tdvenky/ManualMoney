import { useEffect, useMemo, useState } from 'react';
import type { NetWorthCategoryKey, NetWorthCategoryMeta, NetWorthSnapshot } from '../types';
import * as api from '../api/client';

type FormEntries = Partial<Record<NetWorthCategoryKey, string>>;

const emptyForm = () => ({ date: '', entries: {} as FormEntries, notes: '' });

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
    return type === 'LIABILITY' ? sum - e.amount : sum + e.amount;
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

  const resetForm = () => {
    const f = emptyForm();
    setFormDate(f.date);
    setFormEntries(f.entries);
    setFormNotes(f.notes);
  };

  const loadFormFrom = (s: NetWorthSnapshot) => {
    setFormDate(s.date);
    const entries: FormEntries = {};
    for (const e of s.entries) entries[e.category] = String(e.amount);
    setFormEntries(entries);
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
      .filter(c => formEntries[c.key])
      .map(c => ({ category: c.key, amount: parseFloat(formEntries[c.key]!) })),
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

  const inputCls = 'border-[0.5px] border-slate-300 rounded-[7px] px-3 py-2 text-sm font-mono text-slate-800 focus:outline-none focus:border-emerald-500 w-full';

  const totalAssets = assetCategories.reduce((s, c) => s + (parseFloat(formEntries[c.key] ?? '') || 0), 0);
  const totalLiabilities = liabilityCategories.reduce((s, c) => s + (parseFloat(formEntries[c.key] ?? '') || 0), 0);
  const netWorth = totalAssets - totalLiabilities;

  const renderForm = (onSubmit: (e: React.FormEvent) => void, submitLabel: string) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="networth-date" className="block text-[11px] font-medium text-slate-500 mb-1">Date</label>
        <input
          id="networth-date"
          type="date"
          value={formDate}
          onChange={e => setFormDate(e.target.value)}
          className={inputCls + ' max-w-xs'}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <div className="text-[11px] font-bold text-slate-400 tracking-wider mb-2">ASSETS</div>
          <div className="space-y-2">
            {assetCategories.map(c => (
              <div key={c.key} className="flex items-center gap-2">
                <label htmlFor={`networth-entry-${c.key}`} className="flex-1 text-sm text-slate-600">{c.label}</label>
                <input
                  id={`networth-entry-${c.key}`}
                  type="number"
                  value={formEntries[c.key] ?? ''}
                  onChange={e => setFormEntries(prev => ({ ...prev, [c.key]: e.target.value }))}
                  onWheel={blurOnWheel}
                  placeholder="0.00"
                  step="0.01"
                  className={inputCls + ' w-32'}
                />
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-bold text-slate-400 tracking-wider mb-2">LIABILITIES</div>
          <div className="space-y-2">
            {liabilityCategories.map(c => (
              <div key={c.key} className="flex items-center gap-2">
                <label htmlFor={`networth-entry-${c.key}`} className="flex-1 text-sm text-slate-600">{c.label}</label>
                <input
                  id={`networth-entry-${c.key}`}
                  type="number"
                  value={formEntries[c.key] ?? ''}
                  onChange={e => setFormEntries(prev => ({ ...prev, [c.key]: e.target.value }))}
                  onWheel={blurOnWheel}
                  placeholder="0.00"
                  step="0.01"
                  className={inputCls + ' w-32'}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="networth-notes" className="block text-[11px] font-medium text-slate-500 mb-1">Notes (optional)</label>
        <textarea
          id="networth-notes"
          value={formNotes}
          onChange={e => setFormNotes(e.target.value)}
          placeholder="e.g. IRA lost value due to market dip"
          className={inputCls + ' font-sans'}
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
