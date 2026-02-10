import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AllocationCard } from '../../src/components/AllocationCard';
import type { Allocation, Bucket } from '../../src/types';

describe('AllocationCard', () => {
  const mockAllocation: Allocation = {
    id: 'alloc-1',
    bucketId: 'bucket-1',
    allocatedAmount: 500,
    currentBalance: 450,
    transactions: [
      {
        id: 't1',
        description: 'Coffee',
        amount: 5,
        date: '2024-01-03',
        previousBalance: 500,
        newBalance: 495,
        createdAt: '2024-01-01T00:00:00',
        updatedAt: '2024-01-01T00:00:00',
      },
      {
        id: 't2',
        description: 'Lunch',
        amount: 45,
        date: '2024-01-04',
        previousBalance: 495,
        newBalance: 450,
        createdAt: '2024-01-01T00:00:00',
        updatedAt: '2024-01-01T00:00:00',
      },
    ],
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00',
  };

  const mockExpenseBucket: Bucket = {
    id: 'bucket-1',
    name: 'Groceries',
    type: 'EXPENSE',
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00',
  };

  const mockSavingsBucket: Bucket = {
    id: 'bucket-2',
    name: 'Emergency Fund',
    type: 'SAVINGS',
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00',
  };

  const defaultProps = {
    allocation: mockAllocation,
    bucket: mockExpenseBucket,
    onUpdateAllocation: vi.fn(),
    onAddTransaction: vi.fn(),
    onUpdateTransaction: vi.fn(),
    onDeleteTransaction: vi.fn(),
    payPeriodStartDate: '2024-01-01',
    payPeriodEndDate: '2024-01-15',
  };

  it('renders bucket name and allocated amount', () => {
    render(<AllocationCard {...defaultProps} />);

    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('$500.00', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('$450.00')).toBeInTheDocument();
  });

  it('shows EXPENSE badge for expense bucket', () => {
    render(<AllocationCard {...defaultProps} />);

    expect(screen.getByText('EXPENSE')).toBeInTheDocument();
  });

  it('shows SAVINGS badge for savings bucket', () => {
    render(<AllocationCard {...defaultProps} bucket={mockSavingsBucket} />);

    expect(screen.getByText('SAVINGS')).toBeInTheDocument();
  });

  it('shows "Unknown Bucket" when bucket is undefined', () => {
    render(<AllocationCard {...defaultProps} bucket={undefined} />);

    expect(screen.getByText('Unknown Bucket')).toBeInTheDocument();
  });

  it('displays transaction count', () => {
    render(<AllocationCard {...defaultProps} />);

    expect(screen.getByText(/2 transactions/)).toBeInTheDocument();
  });

  it('displays singular "transaction" for 1 transaction', () => {
    const singleTransactionAllocation = {
      ...mockAllocation,
      transactions: [mockAllocation.transactions[0]],
    };
    render(<AllocationCard {...defaultProps} allocation={singleTransactionAllocation} />);

    expect(screen.getByText(/1 transaction[^s]/)).toBeInTheDocument();
  });

  it('expands to show transactions when clicked', () => {
    render(<AllocationCard {...defaultProps} />);

    expect(screen.queryByText('No transactions yet')).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(screen.getByText('Groceries'));

    // TransactionList should now be visible with transactions
    expect(screen.getByText('Coffee')).toBeInTheDocument();
  });

  it('collapses when clicked again', () => {
    render(<AllocationCard {...defaultProps} />);

    // Expand
    fireEvent.click(screen.getByText('Groceries'));
    expect(screen.getByText('Coffee')).toBeInTheDocument();

    // Collapse
    fireEvent.click(screen.getByText('Groceries'));
    // TransactionList should be hidden again (Coffee is in a transaction row that gets removed)
  });

  it('enters edit mode when balance area is clicked', () => {
    render(<AllocationCard {...defaultProps} />);

    // Click on the balance display area
    fireEvent.click(screen.getByText('$450.00'));

    // Should show Save and Cancel buttons
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('cancels edit mode', () => {
    render(<AllocationCard {...defaultProps} />);

    fireEvent.click(screen.getByText('$450.00'));
    fireEvent.click(screen.getByText('Cancel'));

    // Should be back to display mode
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
  });

  it('submits updated allocation amount', () => {
    const onUpdateAllocation = vi.fn();
    render(<AllocationCard {...defaultProps} onUpdateAllocation={onUpdateAllocation} />);

    // Enter edit mode
    fireEvent.click(screen.getByText('$450.00'));

    // Change the amount
    const input = screen.getByDisplayValue('500');
    fireEvent.change(input, { target: { value: '600' } });

    // Submit
    fireEvent.click(screen.getByText('Save'));

    expect(onUpdateAllocation).toHaveBeenCalledWith('alloc-1', 600);
  });

  it('shows negative balance in red', () => {
    const negativeAllocation = { ...mockAllocation, currentBalance: -50 };
    render(<AllocationCard {...defaultProps} allocation={negativeAllocation} />);

    const balanceElement = screen.getByText('-$50.00');
    expect(balanceElement).toHaveClass('text-red-600');
  });
});
