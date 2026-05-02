import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PayPeriodForm } from '../components';
import * as api from '../api/client';

export function NewPayPeriodPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (payDate: string, endDate: string) => {
    try {
      const newPayPeriod = await api.createPayPeriod({ payDate, endDate });
      navigate(`/payperiods/${newPayPeriod.id}`);
    } catch (err) {
      setError('Failed to create pay period');
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <Link to="/" className="text-emerald-600 hover:text-emerald-700 text-sm">&larr; Back to Dashboard</Link>
        <h1 className="text-xl font-bold text-slate-800 mt-2">New Pay Period</h1>
      </div>

      {error && (
        <div className="bg-red-50 border-[0.5px] border-red-200 text-red-700 px-4 py-3 rounded-[10px] text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-4 underline">Dismiss</button>
        </div>
      )}

      <div className="bg-white border-[0.5px] border-slate-200 rounded-[10px] p-5">
        <PayPeriodForm
          onSubmit={handleSubmit}
          submitLabel="Create Pay Period"
          onCancel={() => navigate('/')}
        />
      </div>
    </div>
  );
}
