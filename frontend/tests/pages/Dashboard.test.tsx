import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from '../../src/pages/Dashboard';
import type { PayPeriod, Bucket } from '../../src/types';

vi.mock('../../src/api/client', () => ({
  getPayPeriods: vi.fn(),
  getBuckets: vi.fn(),
}));

import * as api from '../../src/api/client';

const mockBuckets: Bucket[] = [
  { id: 'b1', name: 'Groceries', type: 'EXPENSE', createdAt: '', updatedAt: '' },
];

const mockActivePayPeriod: PayPeriod = {
  id: 'pp1',
  payDate: '2024-01-01',
  endDate: '2024-01-15',
  amount: 2000,
  status: 'ACTIVE',
  allocations: [
    {
      id: 'a1',
      bucketId: 'b1',
      allocatedAmount: 500,
      currentBalance: 450,
      transactions: [],
      createdAt: '',
      updatedAt: '',
    },
  ],
  createdAt: '',
  updatedAt: '',
};

const mockClosedPayPeriod: PayPeriod = {
  id: 'pp2',
  payDate: '2023-12-01',
  endDate: '2023-12-15',
  amount: 1800,
  status: 'CLOSED',
  allocations: [],
  createdAt: '',
  updatedAt: '',
};

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    vi.mocked(api.getPayPeriods).mockReturnValue(new Promise(() => {}));
    vi.mocked(api.getBuckets).mockReturnValue(new Promise(() => {}));

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows welcome message when no pay periods exist', async () => {
    vi.mocked(api.getPayPeriods).mockResolvedValue([]);
    vi.mocked(api.getBuckets).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Welcome to ManualMoney')).toBeInTheDocument();
    });
  });

  it('displays active pay periods', async () => {
    vi.mocked(api.getPayPeriods).mockResolvedValue([mockActivePayPeriod]);
    vi.mocked(api.getBuckets).mockResolvedValue(mockBuckets);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Active Pay Periods')).toBeInTheDocument();
      expect(screen.getByText('$2,000.00', { exact: false })).toBeInTheDocument();
    });
  });

  it('displays closed pay periods', async () => {
    vi.mocked(api.getPayPeriods).mockResolvedValue([mockClosedPayPeriod]);
    vi.mocked(api.getBuckets).mockResolvedValue(mockBuckets);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Closed Pay Periods')).toBeInTheDocument();
    });
  });

  it('displays both active and closed pay periods', async () => {
    vi.mocked(api.getPayPeriods).mockResolvedValue([mockActivePayPeriod, mockClosedPayPeriod]);
    vi.mocked(api.getBuckets).mockResolvedValue(mockBuckets);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Active Pay Periods')).toBeInTheDocument();
      expect(screen.getByText('Closed Pay Periods')).toBeInTheDocument();
    });
  });

  it('shows error message on API failure', async () => {
    vi.mocked(api.getPayPeriods).mockRejectedValue(new Error('Network error'));
    vi.mocked(api.getBuckets).mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    });
  });

  it('shows bucket count in manage buckets link', async () => {
    vi.mocked(api.getPayPeriods).mockResolvedValue([]);
    vi.mocked(api.getBuckets).mockResolvedValue(mockBuckets);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Manage Buckets (1)')).toBeInTheDocument();
    });
  });

  it('shows allocation summary for active pay periods', async () => {
    vi.mocked(api.getPayPeriods).mockResolvedValue([mockActivePayPeriod]);
    vi.mocked(api.getBuckets).mockResolvedValue(mockBuckets);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('1 allocation')).toBeInTheDocument();
    });
  });
});
