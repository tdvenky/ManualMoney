import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { PayPeriod, Bucket } from '../types';
import { AllocationCard } from '../components';
import * as api from '../api/client';

export function PayPeriodDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [payPeriod, setPayPeriod] = useState<PayPeriod | null>(null);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllocationForm, setShowAllocationForm] = useState(false);
  const [selectedBucketId, setSelectedBucketId] = useState('');
  const [allocationAmount, setAllocationAmount] = useState('');

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [payPeriodData, bucketsData] = await Promise.all([
        api.getPayPeriod(id!),
        api.getBuckets(),
      ]);
      setPayPeriod(payPeriodData);
      setBuckets(bucketsData);
    } catch (err) {
      setError('Failed to load pay period');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBucketId || !allocationAmount) return;
    try {
      await api.addAllocation(id!, {
        bucketId: selectedBucketId,
        allocatedAmount: parseFloat(allocationAmount),
      });
      await loadData();
      setShowAllocationForm(false);
      setSelectedBucketId('');
      setAllocationAmount('');
    } catch (err) {
      setError('Failed to add allocation');
    }
  };

  const handleUpdateAllocation = async (allocationId: string, amount: number) => {
    try {
      await api.updateAllocation(allocationId, { allocatedAmount: amount });
      await loadData();
    } catch (err) {
      setError('Failed to update allocation');
    }
  };

  const handleAddTransaction = async (allocationId: string, description: string, amount: number, date: string) => {
    try {
      await api.addTransaction(allocationId, { description, amount, date });
      await loadData();
    } catch (err) {
      setError('Failed to add transaction');
    }
  };

  const handleUpdateTransaction = async (transactionId: string, description: string, amount: number, date: string) => {
    try {
      await api.updateTransaction(transactionId, { description, amount, date });
      await loadData();
    } catch (err) {
      setError('Failed to update transaction');
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      await api.deleteTransaction(transactionId);
      await loadData();
    } catch (err) {
      setError('Failed to delete transaction');
    }
  };

  const handleClosePayPeriod = async () => {
    if (!confirm('Are you sure you want to close this pay period?')) return;
    try {
      await api.closePayPeriod(id!);
      await loadData();
    } catch (err) {
      setError('Failed to close pay period');
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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getBucket = (bucketId: string) => buckets.find(b => b.id === bucketId);

  const availableBuckets = buckets.filter(
    b => !payPeriod?.allocations.some(a => a.bucketId === b.id)
  );

  const totalAllocated = payPeriod?.allocations.reduce((sum, a) => sum + a.allocatedAmount, 0) || 0;
  const totalRemaining = payPeriod?.allocations.reduce((sum, a) => sum + a.currentBalance, 0) || 0;
  const unallocated = (payPeriod?.amount || 0) - totalAllocated;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!payPeriod) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Pay period not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Link to="/" className="text-blue-600 hover:text-blue-800">&larr; Back to Dashboard</Link>
          <h1 className="text-2xl font-bold mt-2">
            Pay Period: {formatDate(payPeriod.payDate)} - {formatDate(payPeriod.endDate)}
          </h1>
          <div className={`inline-block mt-1 px-2 py-0.5 text-sm rounded ${
            payPeriod.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
          }`}>
            {payPeriod.status}
          </div>
        </div>
        {payPeriod.status === 'ACTIVE' && (
          <button
            onClick={handleClosePayPeriod}
            className="px-4 py-2 bg-gray-600 text-white hover:bg-gray-700"
          >
            Close Pay Period
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
          <button onClick={() => setError(null)} className="ml-4 underline">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <div className="border border-gray-200 bg-gray-50 p-4 rounded">
          <div className="text-sm text-gray-500">Income</div>
          <div className="text-xl font-bold font-mono">{formatCurrency(payPeriod.amount)}</div>
        </div>
        <div className="border border-blue-200 bg-blue-50 p-4 rounded">
          <div className="text-sm text-gray-500">Allocated</div>
          <div className="text-xl font-bold font-mono text-blue-700">{formatCurrency(totalAllocated)}</div>
        </div>
        <div className={`border p-4 rounded ${unallocated > 0 ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200 bg-gray-50'}`}>
          <div className="text-sm text-gray-500">Unallocated</div>
          <div className={`text-xl font-bold font-mono ${unallocated > 0 ? 'text-yellow-700' : 'text-gray-500'}`}>
            {formatCurrency(unallocated)}
          </div>
        </div>
        <div className="border border-green-200 bg-green-50 p-4 rounded">
          <div className="text-sm text-gray-500">Remaining</div>
          <div className={`text-xl font-bold font-mono ${totalRemaining < 0 ? 'text-red-600' : 'text-green-700'}`}>
            {formatCurrency(totalRemaining)}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Allocations ({payPeriod.allocations.length})</h2>
        {payPeriod.status === 'ACTIVE' && availableBuckets.length > 0 && (
          <button
            onClick={() => setShowAllocationForm(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            Add Allocation
          </button>
        )}
      </div>

      {showAllocationForm && (
        <form onSubmit={handleAddAllocation} className="border border-gray-300 bg-white p-4 rounded space-y-3">
          <h3 className="font-bold">Add Allocation</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bucket</label>
              <select
                value={selectedBucketId}
                onChange={(e) => setSelectedBucketId(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 font-mono text-sm"
                required
              >
                <option value="">Select a bucket...</option>
                {availableBuckets.map((bucket) => (
                  <option key={bucket.id} value={bucket.id}>
                    {bucket.name} ({bucket.type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                value={allocationAmount}
                onChange={(e) => setAllocationAmount(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 font-mono text-sm"
                placeholder="0.00"
                required
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white text-sm hover:bg-blue-700"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowAllocationForm(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 text-sm hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {payPeriod.allocations.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500">
            No allocations yet. Add allocations to distribute your income to different buckets.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {payPeriod.allocations.map((allocation) => (
            <AllocationCard
              key={allocation.id}
              allocation={allocation}
              bucket={getBucket(allocation.bucketId)}
              onUpdateAllocation={payPeriod.status === 'ACTIVE' ? handleUpdateAllocation : () => {}}
              onAddTransaction={payPeriod.status === 'ACTIVE' ? handleAddTransaction : () => {}}
              onUpdateTransaction={payPeriod.status === 'ACTIVE' ? handleUpdateTransaction : () => {}}
              onDeleteTransaction={payPeriod.status === 'ACTIVE' ? handleDeleteTransaction : () => {}}
              payPeriodStartDate={payPeriod.payDate}
              payPeriodEndDate={payPeriod.endDate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
