import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PayPeriodDetailPage } from '../../src/pages/PayPeriodDetailPage';
import type { PayPeriod, Category } from '../../src/types';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual };
});

vi.mock('../../src/api/client', () => ({
  getPayPeriod: vi.fn(),
  getCategories: vi.fn(),
  getSubCategories: vi.fn(),
  addIncome: vi.fn(),
  updateIncome: vi.fn(),
  deleteIncome: vi.fn(),
  addAllocation: vi.fn(),
  updateAllocation: vi.fn(),
  deleteAllocation: vi.fn(),
  addTransaction: vi.fn(),
  updateTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
  closePayPeriod: vi.fn(),
  reopenPayPeriod: vi.fn(),
}));

import * as api from '../../src/api/client';

const mockCategories: Category[] = [
  { id: 'b1', name: 'Groceries', type: 'EXPENSE', createdAt: '', updatedAt: '' },
  { id: 'b2', name: 'Rent', type: 'EXPENSE', createdAt: '', updatedAt: '' },
  { id: 'b3', name: 'Savings', type: 'SAVINGS', createdAt: '', updatedAt: '' },
];

const mockPayPeriod: PayPeriod = {
  id: 'pp1',
  payDate: '2024-01-01',
  endDate: '2024-01-15',
  amount: 2000,
  incomes: [],
  status: 'ACTIVE',
  allocations: [
    {
      id: 'a1',
      categoryId: 'b1',
      allocatedAmount: 500,
      currentBalance: 450,
      transactions: [
        {
          id: 't1',
          description: 'Coffee',
          amount: 50,
          date: '2024-01-03',
          previousBalance: 500,
          newBalance: 450,
          subCategoryId: 'sc1',
          priority: 'NEED_IT' as const,
          createdAt: '',
          updatedAt: '',
        },
      ],
      savingsTransfers: [],
      createdAt: '',
      updatedAt: '',
    },
  ],
  createdAt: '',
  updatedAt: '',
};

function renderWithRouter() {
  return render(
    <MemoryRouter initialEntries={['/payperiods/pp1']}>
      <Routes>
        <Route path="/payperiods/:id" element={<PayPeriodDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('PayPeriodDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(api.getSubCategories).mockResolvedValue([]);
  });

  it('shows loading state initially', () => {
    vi.mocked(api.getPayPeriod).mockReturnValue(new Promise(() => {}));
    vi.mocked(api.getCategories).mockReturnValue(new Promise(() => {}));

    renderWithRouter();

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays pay period status badge', async () => {
    vi.mocked(api.getPayPeriod).mockResolvedValue(mockPayPeriod);
    vi.mocked(api.getCategories).mockResolvedValue(mockCategories);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    });
  });

  it('displays income amount', async () => {
    vi.mocked(api.getPayPeriod).mockResolvedValue(mockPayPeriod);
    vi.mocked(api.getCategories).mockResolvedValue(mockCategories);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('$2,000.00')).toBeInTheDocument();
    });
  });

  it('shows summary stats headers', async () => {
    vi.mocked(api.getPayPeriod).mockResolvedValue(mockPayPeriod);
    vi.mocked(api.getCategories).mockResolvedValue(mockCategories);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Income')).toBeInTheDocument();
      expect(screen.getAllByText('Allocated').length).toBeGreaterThan(0);
      expect(screen.getByText('Unallocated')).toBeInTheDocument();
      expect(screen.getAllByText('Remaining').length).toBeGreaterThan(0);
    });
  });

  it('shows close button for active pay period', async () => {
    vi.mocked(api.getPayPeriod).mockResolvedValue(mockPayPeriod);
    vi.mocked(api.getCategories).mockResolvedValue(mockCategories);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Close Pay Period')).toBeInTheDocument();
    });
  });

  it('does not show close button for closed pay period', async () => {
    const closedPayPeriod = { ...mockPayPeriod, status: 'CLOSED' as const };
    vi.mocked(api.getPayPeriod).mockResolvedValue(closedPayPeriod);
    vi.mocked(api.getCategories).mockResolvedValue(mockCategories);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('CLOSED')).toBeInTheDocument();
    });

    expect(screen.queryByText('Close Pay Period')).not.toBeInTheDocument();
  });

  it('closes pay period when close button is clicked', async () => {
    vi.mocked(api.getPayPeriod).mockResolvedValue(mockPayPeriod);
    vi.mocked(api.getCategories).mockResolvedValue(mockCategories);
    vi.mocked(api.closePayPeriod).mockResolvedValue({ ...mockPayPeriod, status: 'CLOSED' });

    renderWithRouter();

    await waitFor(() => {
      fireEvent.click(screen.getByText('Close Pay Period'));
    });

    await waitFor(() => {
      expect(api.closePayPeriod).toHaveBeenCalledWith('pp1');
    });
  });

  it('does not close pay period when confirm is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    vi.mocked(api.getPayPeriod).mockResolvedValue(mockPayPeriod);
    vi.mocked(api.getCategories).mockResolvedValue(mockCategories);

    renderWithRouter();

    await waitFor(() => {
      fireEvent.click(screen.getByText('Close Pay Period'));
    });

    expect(api.closePayPeriod).not.toHaveBeenCalled();
  });

  it('shows pay period not found on load failure', async () => {
    vi.mocked(api.getPayPeriod).mockRejectedValue(new Error('Not found'));
    vi.mocked(api.getCategories).mockRejectedValue(new Error('Not found'));

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Pay period not found')).toBeInTheDocument();
    });
  });

  it('shows sections headers', async () => {
    vi.mocked(api.getPayPeriod).mockResolvedValue(mockPayPeriod);
    vi.mocked(api.getCategories).mockResolvedValue(mockCategories);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('SUMMARY')).toBeInTheDocument();
      expect(screen.getByText('CATEGORIES')).toBeInTheDocument();
      expect(screen.getByText('TRANSACTIONS')).toBeInTheDocument();
    });
  });

  it('shows category name in allocation table', async () => {
    vi.mocked(api.getPayPeriod).mockResolvedValue(mockPayPeriod);
    vi.mocked(api.getCategories).mockResolvedValue(mockCategories);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getAllByText('Groceries').length).toBeGreaterThan(0);
    });
  });

  it('shows transaction in transactions list', async () => {
    vi.mocked(api.getPayPeriod).mockResolvedValue(mockPayPeriod);
    vi.mocked(api.getCategories).mockResolvedValue(mockCategories);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Coffee')).toBeInTheDocument();
    });
  });

  it('shows allocate budget button for active pay period', async () => {
    vi.mocked(api.getPayPeriod).mockResolvedValue(mockPayPeriod);
    vi.mocked(api.getCategories).mockResolvedValue(mockCategories);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Allocate Budget')).toBeInTheDocument();
    });
  });

  it('shows error when close pay period fails', async () => {
    vi.mocked(api.getPayPeriod).mockResolvedValue(mockPayPeriod);
    vi.mocked(api.getCategories).mockResolvedValue(mockCategories);
    vi.mocked(api.closePayPeriod).mockRejectedValue(new Error('Failed'));

    renderWithRouter();

    await waitFor(() => {
      fireEvent.click(screen.getByText('Close Pay Period'));
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to close pay period')).toBeInTheDocument();
    });
  });

  it('dismisses error message', async () => {
    vi.mocked(api.getPayPeriod).mockResolvedValue(mockPayPeriod);
    vi.mocked(api.getCategories).mockResolvedValue(mockCategories);
    vi.mocked(api.closePayPeriod).mockRejectedValue(new Error('Failed'));

    renderWithRouter();

    await waitFor(() => {
      fireEvent.click(screen.getByText('Close Pay Period'));
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to close pay period')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Dismiss'));

    expect(screen.queryByText('Failed to close pay period')).not.toBeInTheDocument();
  });

  it('shows error and does not call addAllocation when amount exceeds unallocated', async () => {
    // mockPayPeriod: amount=2000, allocated=500, so unallocated=1500
    vi.mocked(api.getPayPeriod).mockResolvedValue(mockPayPeriod);
    vi.mocked(api.getCategories).mockResolvedValue(mockCategories);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Allocate Budget')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Allocate Budget'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    const categorySelect = selects[0];
    fireEvent.change(categorySelect, { target: { value: 'b2' } });

    const amountInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(amountInput, { target: { value: '1600' } });

    const form = amountInput.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/Only \$1,500\.00 is available to allocate\./)).toBeInTheDocument();
    });

    expect(api.addAllocation).not.toHaveBeenCalled();
  });

  it('calls addAllocation when amount is within unallocated', async () => {
    // mockPayPeriod: amount=2000, allocated=500, so unallocated=1500
    vi.mocked(api.getPayPeriod).mockResolvedValue(mockPayPeriod);
    vi.mocked(api.getCategories).mockResolvedValue(mockCategories);
    vi.mocked(api.addAllocation).mockResolvedValue({
      id: 'a2',
      categoryId: 'b2',
      allocatedAmount: 300,
      currentBalance: 300,
      transactions: [],
      savingsTransfers: [],
      createdAt: '',
      updatedAt: '',
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Allocate Budget')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Allocate Budget'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    const categorySelect = selects[0];
    fireEvent.change(categorySelect, { target: { value: 'b2' } });

    const amountInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(amountInput, { target: { value: '300' } });

    const form = amountInput.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(api.addAllocation).toHaveBeenCalledWith('pp1', { categoryId: 'b2', allocatedAmount: 300 });
    });
  });
});
