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
    date.setDate(date.getDate() + 13); // Default to 2 weeks
    return date.toISOString().split('T')[0];
  }

  const handlePayDateChange = (newPayDate: string) => {
    setPayDate(newPayDate);
    // Auto-update end date if it hasn't been manually set or is before new pay date
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

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            value={payDate}
            onChange={(e) => handlePayDateChange(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 font-mono text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={payDate}
            className="w-full border border-gray-300 px-3 py-2 font-mono text-sm"
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full border border-gray-300 px-3 py-2 font-mono text-sm"
          placeholder="0.00"
          required
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white text-sm hover:bg-blue-700"
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 text-sm hover:bg-gray-300"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
