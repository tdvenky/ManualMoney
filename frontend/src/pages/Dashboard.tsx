import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { PayPeriod, Bucket } from '../types';
import * as api from '../api/client';

export function Dashboard() {
  const [payPeriods, setPayPeriods] = useState<PayPeriod[]>([]);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [payPeriodsData, bucketsData] = await Promise.all([
        api.getPayPeriods(),
        api.getBuckets(),
      ]);
      setPayPeriods(payPeriodsData);
      setBuckets(bucketsData);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const activePayPeriods = payPeriods.filter(p => p.status === 'ACTIVE');
  const closedPayPeriods = payPeriods.filter(p => p.status === 'CLOSED');

  const getTotalAllocated = (payPeriod: PayPeriod) => {
    return payPeriod.allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
  };

  const getTotalRemaining = (payPeriod: PayPeriod) => {
    return payPeriod.allocations.reduce((sum, a) => sum + a.currentBalance, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Link
            to="/buckets"
            className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            Manage Buckets ({buckets.length})
          </Link>
          <Link
            to="/payperiods/new"
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700"
          >
            New Pay Period
          </Link>
        </div>
      </div>

      {activePayPeriods.length === 0 && closedPayPeriods.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Welcome to ManualMoney</h2>
          <p className="text-gray-500 mb-4">
            Start by creating some buckets for your expenses and savings, then create your first pay period.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/buckets"
              className="px-4 py-2 bg-gray-600 text-white hover:bg-gray-700"
            >
              Create Buckets
            </Link>
            <Link
              to="/payperiods/new"
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700"
            >
              Create Pay Period
            </Link>
          </div>
        </div>
      ) : (
        <>
          {activePayPeriods.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-4 text-green-700">Active Pay Periods</h2>
              <div className="grid gap-4">
                {activePayPeriods.map((payPeriod) => (
                  <Link
                    key={payPeriod.id}
                    to={`/payperiods/${payPeriod.id}`}
                    className="block border border-green-200 bg-green-50 rounded-lg p-4 hover:border-green-400 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-lg">
                          {formatDate(payPeriod.payDate)} - {formatDate(payPeriod.endDate)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {payPeriod.allocations.length} allocation{payPeriod.allocations.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-sm text-gray-500">
                          Income: {formatCurrency(payPeriod.amount)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Allocated: {formatCurrency(getTotalAllocated(payPeriod))}
                        </div>
                        <div className="text-lg font-bold text-green-700">
                          Remaining: {formatCurrency(getTotalRemaining(payPeriod))}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {closedPayPeriods.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-4 text-gray-500">Closed Pay Periods</h2>
              <div className="grid gap-2">
                {closedPayPeriods.map((payPeriod) => (
                  <Link
                    key={payPeriod.id}
                    to={`/payperiods/${payPeriod.id}`}
                    className="block border border-gray-200 bg-gray-50 rounded p-3 hover:border-gray-400 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-medium">
                        {formatDate(payPeriod.payDate)} - {formatDate(payPeriod.endDate)}
                      </div>
                      <div className="text-sm font-mono text-gray-500">
                        {formatCurrency(payPeriod.amount)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
