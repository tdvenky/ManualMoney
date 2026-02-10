import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PayPeriodDetailPage } from '../../src/pages/PayPeriodDetailPage';
import type { PayPeriod, Bucket } from '../../src/types';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../src/api/client', () => ({
  getPayPeriod: vi.fn(),
  getBuckets: vi.fn(),
  addAllocation: vi.fn(),
  updateAllocation: vi.fn(),
  addTransaction: vi.fn(),
  updateTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
  closePayPeriod: vi.fn(),
}));

import * as api from '../../src/api/client';

const mockBuckets: Bucket[] = [
  { id: 'b1', name: 'Groceries', type: 'EXPENSE', createdAt: '', updatedAt: '' },
  { id: 'b2', name: 'Rent', type: 'EXPENSE', createdAt: '', updatedAt: '' },
  { id: 'b3', name: 'Savings', type: 'SAVINGS', createdAt: '', updatedAt: '' },
];

const mockPayPeriod: PayPeriod = {
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
      transactions: [
        {
          id: 't1',
          description: 'Coffee',
          amount: 50,
          date: '2024-01-03',
          previousBalance: 500,
          newBalance: 450,
          createdAt: '',
          updatedAt: '',
        },
      ],
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
  });

  it('shows loading state initially', () => {
    vi.mocked(api.getPayPeriod).mockReturnValue(new Promise(() => {}));
    vi.mocked(api.getBuckets).mockReturnValue(new Promise(() => {}));

    renderWithRouter();

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays pay period details', async () => {
    vi.mocked(api.getPayPeriod).mockResolvedValue(mockPayPeriod);
    vi.mocked(api.getBuckets).mockResolvedValue(mockBuckets);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
      expect(screen.getByText('$2,000.00')).toBeInTheDocument();
      expect(screen.getByText('Groceries')).toBeInTheDocument();
    });
  });

  it('shows summary stats', async () => {
    vi.mocked(api.getPayPeriod).mockResolvedValue(mockPayPeriod);
    vi.mocked(api.getBuckets).mockResolvedValue(mockBuckets);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Income')).toBeInTheDocument();
      expect(screen.getByText('Allocated')).toBeInTheDocument();
      expect(screen.getByText('Unallocated')).toBeInTheDocument();
      expect(screen.getByText('Remaining')).toBeInTheDocument();
    });
  });

  it('shows close button for active pay period', async () => {
    vi.mocked(api.getPayPeriod).mockResolvedValue(mockPayPeriod);
    vi.mocked(api.getBuckets).mockResolvedValue(mockBuckets);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Close Pay Period')).toBeInTheDocument();
    });
  });

  it('does not show close button for closed pay period', async () => {
    const closedPayPeriod = { ...mockPayPeriod, status: 'CLOSED' as const };
    vi.mocked(api.getPayPeriod).mockResolvedValue(closedPayPeriod);
    vi.mocked(api.getBuckets).mockResolvedValue(mockBuckets);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('CLOSED')).toBeInTheDocument();
    });

    expect(screen.queryByText('Close Pay Period')).not.toBeInTheDocument();
  });

  it('closes pay period when close button is clicked', async () => {
    vi.mocked(api.getPayPeriod).mockResolvedValue(mockPayPeriod);
    vi.mocked(api.getBuckets).mockResolvedValue(mockBuckets);
    vi.mocked(api.closePayPeriod).mockResolvedValue({ ...mockPayPeriod, status: 'CLOSED' });

    renderWithRouter();

    await waitFor(() => {
      fireEvent.click(screen.getByText('Close Pay Period'));
    });

    await waitFor(() => {
      expect(api.closePayPeriod).toHaveBeenCalledWith('pp1');
    });
  });

  it('shows add allocation button for active pay period', async () => {
    vi.mocked(api.getPayPeriod).mockResolvedValue(mockPayPeriod);
    vi.mocked(api.getBuckets).mockResolvedValue(mockBuckets);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Add Allocation')).toBeInTheDocument();
    });
  });

  it('shows allocation form when Add Allocation is clicked', async () => {
    vi.mocked(api.getPayPeriod).mockResolvedValue(mockPayPeriod);
    vi.mocked(api.getBuckets).mockResolvedValue(mockBuckets);

    renderWithRouter();

    await waitFor(() => {
      fireEvent.click(screen.getByText('Add Allocation'));
    });

    expect(screen.getByText('Select a bucket...')).toBeInTheDocument();
  });

  it('shows pay period not found on load failure', async () => {
    vi.mocked(api.getPayPeriod).mockRejectedValue(new Error('Not found'));
    vi.mocked(api.getBuckets).mockRejectedValue(new Error('Not found'));

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Pay period not found')).toBeInTheDocument();
    });
  });

  it('shows empty allocations message', async () => {
    const emptyPayPeriod = { ...mockPayPeriod, allocations: [] };
    vi.mocked(api.getPayPeriod).mockResolvedValue(emptyPayPeriod);
    vi.mocked(api.getBuckets).mockResolvedValue(mockBuckets);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText(/No allocations yet/)).toBeInTheDocument();
    });
  });

  it('shows pay period not found when pay period API fails', async () => {
    vi.mocked(api.getPayPeriod).mockRejectedValue(new Error('Not found'));
    vi.mocked(api.getBuckets).mockResolvedValue(mockBuckets);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Pay period not found')).toBeInTheDocument();
    });
  });

  it('submits the add allocation form', async () => {
    vi.mocked(api.getPayPeriod).mockResolvedValue(mockPayPeriod);
    vi.mocked(api.getBuckets).mockResolvedValue(mockBuckets);
    vi.mocked(api.addAllocation).mockResolvedValue({
      id: 'a2',
      bucketId: 'b2',
      allocatedAmount: 800,
      currentBalance: 800,
      transactions: [],
      createdAt: '',
      updatedAt: '',
    });

    renderWithRouter();

    await waitFor(() => {
      fireEvent.click(screen.getByText('Add Allocation'));
    });

    // Select a bucket and enter amount
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'b2' } });
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '800' } });

    // Submit the form
    fireEvent.click(screen.getByText('Add'));

    await waitFor(() => {
      expect(api.addAllocation).toHaveBeenCalledWith('pp1', {
        bucketId: 'b2',
        allocatedAmount: 800,
      });
    });
  });

  it('cancels the add allocation form', async () => {
    vi.mocked(api.getPayPeriod).mockResolvedValue(mockPayPeriod);
    vi.mocked(api.getBuckets).mockResolvedValue(mockBuckets);

    renderWithRouter();

    await waitFor(() => {
      fireEvent.click(screen.getByText('Add Allocation'));
    });

    expect(screen.getByText('Select a bucket...')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancel'));

    expect(screen.queryByText('Select a bucket...')).not.toBeInTheDocument();
  });

  it('shows error when add allocation fails', async () => {
    vi.mocked(api.getPayPeriod).mockResolvedValue(mockPayPeriod);
    vi.mocked(api.getBuckets).mockResolvedValue(mockBuckets);
    vi.mocked(api.addAllocation).mockRejectedValue(new Error('Failed'));

    renderWithRouter();

    await waitFor(() => {
      fireEvent.click(screen.getByText('Add Allocation'));
    });

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'b2' } });
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '800' } });
    fireEvent.click(screen.getByText('Add'));

    await waitFor(() => {
      expect(screen.getByText('Failed to add allocation')).toBeInTheDocument();
    });
  });

  it('shows error when close pay period fails', async () => {
    vi.mocked(api.getPayPeriod).mockResolvedValue(mockPayPeriod);
    vi.mocked(api.getBuckets).mockResolvedValue(mockBuckets);
    vi.mocked(api.closePayPeriod).mockRejectedValue(new Error('Failed'));

    renderWithRouter();

    await waitFor(() => {
      fireEvent.click(screen.getByText('Close Pay Period'));
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to close pay period')).toBeInTheDocument();
    });
  });

  it('does not close pay period when confirm is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    vi.mocked(api.getPayPeriod).mockResolvedValue(mockPayPeriod);
    vi.mocked(api.getBuckets).mockResolvedValue(mockBuckets);

    renderWithRouter();

    await waitFor(() => {
      fireEvent.click(screen.getByText('Close Pay Period'));
    });

    expect(api.closePayPeriod).not.toHaveBeenCalled();
  });

  it('dismisses error message', async () => {
    vi.mocked(api.getPayPeriod).mockResolvedValue(mockPayPeriod);
    vi.mocked(api.getBuckets).mockResolvedValue(mockBuckets);
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

  it('does not show Add Allocation when all buckets are allocated', async () => {
    const fullyAllocated: PayPeriod = {
      ...mockPayPeriod,
      allocations: mockBuckets.map((b) => ({
        id: `a-${b.id}`,
        bucketId: b.id,
        allocatedAmount: 500,
        currentBalance: 500,
        transactions: [],
        createdAt: '',
        updatedAt: '',
      })),
    };
    vi.mocked(api.getPayPeriod).mockResolvedValue(fullyAllocated);
    vi.mocked(api.getBuckets).mockResolvedValue(mockBuckets);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Allocations (3)')).toBeInTheDocument();
    });

    expect(screen.queryByText('Add Allocation')).not.toBeInTheDocument();
  });
});
