import { useState } from 'react';

interface PayPeriodFormProps {
  onSubmit: (payDate: string, endDate: string, amount: number) => void;
  initialPayDate?: string;
  initialEndDate?: string;
  initialAmount?: number;
  submitLabel?: string;
  onCancel?: () => void;
}

export function PayPeriodForm({
  onSubmit,
  initialPayDate = new Date().toISOString().split('T')[0],
  initialEndDate = '',
  initialAmount = 0,
  submitLabel = 'Create',
  onCancel,
}: PayPeriodFormProps) {
  const [payDate, setPayDate] = useState(initialPayDate);
  const [endDate, setEndDate] = useState(initialEndDate || getDefaultEndDate(initialPayDate));
  const [amount, setAmount] = useState(initialAmount.toString());

  function getDefaultEndDate(startDate: string): string {
    const date = new Date(startDate);
    date.setDate(date.getDate() + 13);
    return date.toISOString().split('T')[0];
  }

  const handlePayDateChange = (newPayDate: string) => {
    setPayDate(newPayDate);
    if (!endDate || new Date(endDate) <= new Date(newPayDate)) {
      setEndDate(getDefaultEndDate(newPayDate));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (payDate && endDate && amount) {
      onSubmit(payDate, endDate, parseFloat(amount));
      setAmount('0');
    }
  };

  const inputClass = "w-full border-[0.5px] border-slate-300 rounded-[7px] px-3 py-2 font-mono text-sm text-slate-800 focus:outline-none focus:border-emerald-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Start Date</label>
          <input
            type="date"
            value={payDate}
            onChange={(e) => handlePayDateChange(e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={payDate}
            className={inputClass}
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-[11px] font-medium text-slate-500 mb-1">Amount</label>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={inputClass}
          placeholder="0.00"
          required
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-[7px] hover:bg-emerald-700"
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-slate-700 text-white text-sm rounded-[7px] hover:bg-slate-600"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
