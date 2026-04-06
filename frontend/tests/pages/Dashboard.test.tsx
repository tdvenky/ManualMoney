import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from '../../src/pages/Dashboard';
import type { PayPeriod, Category } from '../../src/types';

vi.mock('../../src/api/client', () => ({
  getPayPeriods: vi.fn(),
  getCategories: vi.fn(),
}));

import * as api from '../../src/api/client';

const mockCategories: Category[] = [
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
      categoryId: 'b1',
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
    vi.mocked(api.getCategories).mockReturnValue(new Promise(() => {}));

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows empty state when no pay periods exist', async () => {
    vi.mocked(api.getPayPeriods).mockResolvedValue([]);
    vi.mocked(api.getCategories).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No pay periods yet.')).toBeInTheDocument();
    });
  });

  it('displays active pay period section', async () => {
    vi.mocked(api.getPayPeriods).mockResolvedValue([mockActivePayPeriod]);
    vi.mocked(api.getCategories).mockResolvedValue(mockCategories);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('ACTIVE PAY PERIOD')).toBeInTheDocument();
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    });
  });

  it('displays income amount for active pay period', async () => {
    vi.mocked(api.getPayPeriods).mockResolvedValue([mockActivePayPeriod]);
    vi.mocked(api.getCategories).mockResolvedValue(mockCategories);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('$2,000.00')).toBeInTheDocument();
    });
  });

  it('does not show closed pay periods in dashboard', async () => {
    vi.mocked(api.getPayPeriods).mockResolvedValue([mockClosedPayPeriod]);
    vi.mocked(api.getCategories).mockResolvedValue(mockCategories);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('ACTIVE PAY PERIOD')).toBeInTheDocument();
    });

    expect(screen.queryByText('Dec 1')).not.toBeInTheDocument();
  });

  it('shows error message on API failure', async () => {
    vi.mocked(api.getPayPeriods).mockRejectedValue(new Error('Network error'));
    vi.mocked(api.getCategories).mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    });
  });

  it('shows category name in active pay period allocation table', async () => {
    vi.mocked(api.getPayPeriods).mockResolvedValue([mockActivePayPeriod]);
    vi.mocked(api.getCategories).mockResolvedValue(mockCategories);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Groceries')).toBeInTheDocument();
    });
  });

  it('shows + New Pay Period button', async () => {
    vi.mocked(api.getPayPeriods).mockResolvedValue([]);
    vi.mocked(api.getCategories).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('+ New Pay Period')).toBeInTheDocument();
    });
  });
});
