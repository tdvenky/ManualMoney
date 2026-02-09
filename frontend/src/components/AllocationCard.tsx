import { useState } from 'react';
import type { Allocation, Bucket } from '../types';
import { TransactionList } from './TransactionList';

interface AllocationCardProps {
  allocation: Allocation;
  bucket: Bucket | undefined;
  onUpdateAllocation: (id: string, amount: number) => void;
  onAddTransaction: (allocationId: string, description: string, amount: number, date: string) => void;
  onUpdateTransaction: (id: string, description: string, amount: number, date: string) => void;
  onDeleteTransaction: (id: string) => void;
  payPeriodStartDate: string;
  payPeriodEndDate: string;
}

export function AllocationCard({
  allocation,
  bucket,
  onUpdateAllocation,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  payPeriodStartDate,
  payPeriodEndDate,
}: AllocationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editAmount, setEditAmount] = useState(allocation.allocatedAmount.toString());

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleUpdateAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateAllocation(allocation.id, parseFloat(editAmount));
    setIsEditing(false);
  };

  const bucketTypeColor = bucket?.type === 'EXPENSE' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200';
  const bucketTypeBadge = bucket?.type === 'EXPENSE' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700';

  return (
    <div className={`border rounded ${bucketTypeColor}`}>
      <div
        className="px-4 py-3 cursor-pointer hover:bg-white/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="font-bold">{bucket?.name || 'Unknown Bucket'}</span>
            <span className={`text-xs px-2 py-0.5 rounded ${bucketTypeBadge}`}>
              {bucket?.type}
            </span>
          </div>
          <div className="text-right font-mono">
            {isEditing ? (
              <form onSubmit={handleUpdateAllocation} onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-24 border border-gray-300 px-2 py-1 text-sm text-right"
                  />
                  <button
                    type="submit"
                    className="px-2 py-1 bg-green-600 text-white text-xs hover:bg-green-700"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-2 py-1 bg-gray-400 text-white text-xs hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="hover:bg-gray-100 px-2 py-1 rounded cursor-pointer"
              >
                <div className="text-sm text-gray-500">
                  Allocated: {formatCurrency(allocation.allocatedAmount)}
                </div>
                <div className={`text-lg font-bold ${allocation.currentBalance < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatCurrency(allocation.currentBalance)}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {allocation.transactions.length} transaction{allocation.transactions.length !== 1 ? 's' : ''}
          {' | '}
          Click to {isExpanded ? 'collapse' : 'expand'}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 p-4">
          <TransactionList
            transactions={allocation.transactions}
            onAddTransaction={(description, amount, date) => onAddTransaction(allocation.id, description, amount, date)}
            onUpdateTransaction={onUpdateTransaction}
            onDeleteTransaction={onDeleteTransaction}
            payPeriodStartDate={payPeriodStartDate}
            payPeriodEndDate={payPeriodEndDate}
          />
        </div>
      )}
    </div>
  );
}
