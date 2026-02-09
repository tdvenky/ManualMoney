import { useState } from 'react';
import type { Transaction } from '../types';

interface TransactionListProps {
  transactions: Transaction[];
  onAddTransaction: (description: string, amount: number, date: string) => void;
  onUpdateTransaction: (id: string, description: string, amount: number, date: string) => void;
  onDeleteTransaction: (id: string) => void;
  payPeriodStartDate: string;
  payPeriodEndDate: string;
}

export function TransactionList({
  transactions,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  payPeriodStartDate,
  payPeriodEndDate,
}: TransactionListProps) {
  const [newDescription, setNewDescription] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDescription && newAmount) {
      onAddTransaction(newDescription, parseFloat(newAmount), newDate);
      setNewDescription('');
      setNewAmount('');
      setNewDate(new Date().toISOString().split('T')[0]);
    }
  };

  const startEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setEditDescription(transaction.description);
    setEditAmount(transaction.amount.toString());
    setEditDate(transaction.date || new Date().toISOString().split('T')[0]);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId && editDescription && editAmount) {
      onUpdateTransaction(editingId, editDescription, parseFloat(editAmount), editDate);
      setEditingId(null);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this transaction?')) {
      onDeleteTransaction(id);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="border border-gray-300 bg-white">
      <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
        <h3 className="font-bold text-sm">TRANSACTIONS</h3>
      </div>

      <div className="divide-y divide-gray-200">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="px-4 py-2">
            {editingId === transaction.id ? (
              <form onSubmit={handleUpdate} className="space-y-2">
                <div className="flex gap-2 items-center">
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    min={payPeriodStartDate}
                    max={payPeriodEndDate}
                    className="border border-gray-300 px-2 py-1 text-sm font-mono"
                  />
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="flex-1 border border-gray-300 px-2 py-1 text-sm font-mono"
                    placeholder="Description"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-24 border border-gray-300 px-2 py-1 text-sm font-mono text-right"
                    placeholder="Amount"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-2 py-1 bg-green-600 text-white text-xs hover:bg-green-700"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="px-2 py-1 bg-gray-400 text-white text-xs hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div
                className="flex justify-between items-center cursor-pointer hover:bg-gray-50"
                onClick={() => startEdit(transaction)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{formatDate(transaction.date)}</span>
                    <span className="text-sm">{transaction.description}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right text-sm font-mono">
                    <div className="text-red-600">-{formatCurrency(transaction.amount)}</div>
                    <div className="text-xs text-gray-500">
                      <span className="line-through">{formatCurrency(transaction.previousBalance)}</span>
                      {' → '}
                      <span className="font-semibold">{formatCurrency(transaction.newBalance)}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, transaction.id)}
                    className="text-red-400 hover:text-red-600 text-sm px-1"
                    title="Delete transaction"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {transactions.length === 0 && (
          <div className="px-4 py-4 text-center text-gray-400 text-sm italic">
            No transactions yet
          </div>
        )}
      </div>

      <form onSubmit={handleAdd} className="border-t border-gray-300 px-4 py-2 bg-gray-50">
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            min={payPeriodStartDate}
            max={payPeriodEndDate}
            className="border border-gray-300 px-2 py-1 text-sm font-mono"
          />
          <input
            type="text"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            className="flex-1 border border-gray-300 px-2 py-1 text-sm font-mono"
            placeholder="New transaction..."
          />
          <input
            type="number"
            step="0.01"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            className="w-24 border border-gray-300 px-2 py-1 text-sm font-mono text-right"
            placeholder="Amount"
          />
          <button
            type="submit"
            className="px-3 py-1 bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            Add
          </button>
        </div>
      </form>
    </div>
  );
}
