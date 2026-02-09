import { useState } from 'react';
import type { BucketType } from '../types';

interface BucketFormProps {
  onSubmit: (name: string, type: BucketType) => void;
  initialName?: string;
  initialType?: BucketType;
  submitLabel?: string;
  onCancel?: () => void;
}

export function BucketForm({
  onSubmit,
  initialName = '',
  initialType = 'EXPENSE',
  submitLabel = 'Create',
  onCancel,
}: BucketFormProps) {
  const [name, setName] = useState(initialName);
  const [type, setType] = useState<BucketType>(initialType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim(), type);
      setName('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="bucket-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          id="bucket-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 px-3 py-2 font-mono text-sm"
          placeholder="e.g., Groceries"
          required
        />
      </div>
      <div>
        <label htmlFor="bucket-type" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
        <select
          id="bucket-type"
          value={type}
          onChange={(e) => setType(e.target.value as BucketType)}
          className="w-full border border-gray-300 px-3 py-2 font-mono text-sm"
        >
          <option value="EXPENSE">Expense</option>
          <option value="SAVINGS">Savings</option>
        </select>
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
