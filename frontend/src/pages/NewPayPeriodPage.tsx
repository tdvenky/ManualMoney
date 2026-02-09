import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PayPeriodForm } from '../components';
import * as api from '../api/client';

export function NewPayPeriodPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (payDate: string, endDate: string, amount: number) => {
    try {
      const newPayPeriod = await api.createPayPeriod({ payDate, endDate, amount });
      navigate(`/payperiods/${newPayPeriod.id}`);
    } catch (err) {
      setError('Failed to create pay period');
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <Link to="/" className="text-blue-600 hover:text-blue-800">&larr; Back to Dashboard</Link>
        <h1 className="text-2xl font-bold mt-2">New Pay Period</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
          <button onClick={() => setError(null)} className="ml-4 underline">Dismiss</button>
        </div>
      )}

      <div className="border border-gray-300 bg-white p-4 rounded">
        <PayPeriodForm
          onSubmit={handleSubmit}
          submitLabel="Create Pay Period"
          onCancel={() => navigate('/')}
        />
      </div>
    </div>
  );
}
