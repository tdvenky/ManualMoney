import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PayPeriodForm } from '../components';
import type { Template } from '../types';
import * as api from '../api/client';

export function NewPayPeriodPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [useTemplate, setUseTemplate] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  useEffect(() => {
    api.getTemplates()
      .then(setTemplates)
      .catch(() => {});
  }, []);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  const handleSubmit = async (payDate: string, endDate: string) => {
    try {
      const newPayPeriod = await api.createPayPeriod({ payDate, endDate });

      if (useTemplate && selectedTemplate) {
        await api.addIncome(newPayPeriod.id, {
          description: 'Salary',
          amount: selectedTemplate.income,
          date: payDate,
        });
        for (const alloc of selectedTemplate.allocations) {
          await api.addAllocation(newPayPeriod.id, {
            categoryId: alloc.categoryId,
            allocatedAmount: alloc.allocatedAmount,
          });
        }
      }

      navigate(`/payperiods/${newPayPeriod.id}`);
    } catch {
      setError('Failed to create pay period');
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

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

      <div className="bg-white border-[0.5px] border-slate-200 rounded-[10px] p-5 space-y-4">
          <div>
            <div className="text-[11px] font-medium text-slate-500 mb-2">Start from</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setUseTemplate(false); setSelectedTemplateId(''); }}
                className={`px-3 py-1.5 text-sm rounded-[7px] border-[0.5px] transition-colors ${
                  !useTemplate
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                }`}
              >
                Blank
              </button>
              <button
                type="button"
                onClick={() => setUseTemplate(true)}
                className={`px-3 py-1.5 text-sm rounded-[7px] border-[0.5px] transition-colors ${
                  useTemplate
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                }`}
              >
                Template
              </button>
            </div>
          </div>

          {useTemplate && (templates.length === 0 ? (
            <div className="text-xs text-slate-500">
              No templates yet.{' '}
              <Link to="/templates" className="text-emerald-600 hover:text-emerald-700 underline">
                Create one on the Templates page.
              </Link>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Select Template</label>
              <select
                value={selectedTemplateId}
                onChange={e => setSelectedTemplateId(e.target.value)}
                className="w-full border-[0.5px] border-slate-300 rounded-[7px] px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-emerald-500"
              >
                <option value="">Choose a template…</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name} — {fmt(t.income)}</option>
                ))}
              </select>
              {selectedTemplate && (
                <div className="mt-2 text-xs text-slate-500">
                  {selectedTemplate.allocations.length} allocation{selectedTemplate.allocations.length !== 1 ? 's' : ''} will be pre-filled
                </div>
              )}
            </div>
          ))}
        </div>

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
