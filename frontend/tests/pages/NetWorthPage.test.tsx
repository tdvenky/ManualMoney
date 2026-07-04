import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NetWorthPage } from '../../src/pages/NetWorthPage';
import type { NetWorthCategoryMeta, NetWorthSnapshot } from '../../src/types';

vi.mock('../../src/api/client', () => ({
  getNetWorthCategories: vi.fn(),
  getNetWorthSnapshots: vi.fn(),
  createNetWorthSnapshot: vi.fn(),
  updateNetWorthSnapshot: vi.fn(),
  deleteNetWorthSnapshot: vi.fn(),
}));

import * as api from '../../src/api/client';

const mockCategories: NetWorthCategoryMeta[] = [
  { key: 'CHECKING', label: 'Checking', type: 'ASSET' },
  { key: 'SAVINGS', label: 'Savings', type: 'ASSET' },
  { key: 'CREDIT_CARD', label: 'Credit Card', type: 'LIABILITY' },
];

const mockSnapshotJan: NetWorthSnapshot = {
  id: 's1',
  date: '2024-01-28',
  entries: [
    { category: 'CHECKING', amount: 5000 },
    { category: 'SAVINGS', amount: 10000 },
    { category: 'CREDIT_CARD', amount: 500 },
  ],
  createdAt: '',
  updatedAt: '',
};

const mockSnapshotMar: NetWorthSnapshot = {
  id: 's2',
  date: '2024-03-02',
  entries: [
    { category: 'CHECKING', amount: 6000 },
    { category: 'SAVINGS', amount: 11000 },
    { category: 'CREDIT_CARD', amount: 300 },
  ],
  createdAt: '',
  updatedAt: '',
};

describe('NetWorthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    vi.mocked(api.getNetWorthCategories).mockReturnValue(new Promise(() => {}));
    vi.mocked(api.getNetWorthSnapshots).mockReturnValue(new Promise(() => {}));

    render(<NetWorthPage />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows empty state when no snapshots exist', async () => {
    vi.mocked(api.getNetWorthCategories).mockResolvedValue(mockCategories);
    vi.mocked(api.getNetWorthSnapshots).mockResolvedValue([]);

    render(<NetWorthPage />);

    await waitFor(() => {
      expect(screen.getByText(/No snapshots yet/)).toBeInTheDocument();
    });
  });

  it('displays computed net worth for each snapshot', async () => {
    vi.mocked(api.getNetWorthCategories).mockResolvedValue(mockCategories);
    vi.mocked(api.getNetWorthSnapshots).mockResolvedValue([mockSnapshotJan]);

    render(<NetWorthPage />);

    await waitFor(() => {
      // 5000 + 10000 - 500 = 14500
      expect(screen.getByText('$14,500.00')).toBeInTheDocument();
    });
  });

  it('displays month-over-month change between snapshots', async () => {
    vi.mocked(api.getNetWorthCategories).mockResolvedValue(mockCategories);
    vi.mocked(api.getNetWorthSnapshots).mockResolvedValue([mockSnapshotJan, mockSnapshotMar]);

    render(<NetWorthPage />);

    await waitFor(() => {
      // Jan total 14500, Mar total 6000+11000-300=16700, change = +2200
      expect(screen.getByText(/\+\$2,200\.00/)).toBeInTheDocument();
    });
  });

  it('shows error message on API failure', async () => {
    vi.mocked(api.getNetWorthCategories).mockRejectedValue(new Error('Network error'));
    vi.mocked(api.getNetWorthSnapshots).mockRejectedValue(new Error('Network error'));

    render(<NetWorthPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load net worth data')).toBeInTheDocument();
    });
  });

  it('creates a new snapshot with entered balances', async () => {
    vi.mocked(api.getNetWorthCategories).mockResolvedValue(mockCategories);
    vi.mocked(api.getNetWorthSnapshots).mockResolvedValue([]);
    vi.mocked(api.createNetWorthSnapshot).mockResolvedValue(mockSnapshotJan);

    render(<NetWorthPage />);

    await waitFor(() => {
      expect(screen.getByText('New Snapshot')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('New Snapshot'));

    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2024-01-28' } });
    fireEvent.change(screen.getByLabelText('Checking'), { target: { value: '5000' } });
    fireEvent.change(screen.getByLabelText('Savings'), { target: { value: '10000' } });
    fireEvent.change(screen.getByLabelText('Credit Card'), { target: { value: '500' } });

    fireEvent.click(screen.getByText('Save Snapshot'));

    await waitFor(() => {
      expect(api.createNetWorthSnapshot).toHaveBeenCalledWith(
        expect.objectContaining({
          date: '2024-01-28',
          entries: expect.arrayContaining([
            { category: 'CHECKING', amount: 5000 },
            { category: 'SAVINGS', amount: 10000 },
            { category: 'CREDIT_CARD', amount: 500 },
          ]),
        })
      );
    });
  });
});
