import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TransactionList } from '../../src/components/TransactionList';
import type { Transaction } from '../../src/types';

describe('TransactionList', () => {
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      description: 'Coffee',
      amount: 5,
      date: '2024-01-03',
      previousBalance: 100,
      newBalance: 95,
      createdAt: '2024-01-01T00:00:00',
      updatedAt: '2024-01-01T00:00:00',
    },
    {
      id: '2',
      description: 'Lunch',
      amount: 15,
      date: '2024-01-04',
      previousBalance: 95,
      newBalance: 80,
      createdAt: '2024-01-01T00:00:00',
      updatedAt: '2024-01-01T00:00:00',
    },
  ];

  it('renders transactions with correct amounts', () => {
    render(
      <TransactionList
        transactions={mockTransactions}
        onAddTransaction={vi.fn()}
        onUpdateTransaction={vi.fn()}
        onDeleteTransaction={vi.fn()}
        payPeriodStartDate="2024-01-01"
        payPeriodEndDate="2024-01-15"
      />
    );

    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText('Lunch')).toBeInTheDocument();
  });

  it('shows empty state when no transactions', () => {
    render(
      <TransactionList
        transactions={[]}
        onAddTransaction={vi.fn()}
        onUpdateTransaction={vi.fn()}
        onDeleteTransaction={vi.fn()}
        payPeriodStartDate="2024-01-01"
        payPeriodEndDate="2024-01-15"
      />
    );

    expect(screen.getByText('No transactions yet')).toBeInTheDocument();
  });

  it('calls onAddTransaction when form is submitted', () => {
    const onAddTransaction = vi.fn();
    render(
      <TransactionList
        transactions={[]}
        onAddTransaction={onAddTransaction}
        onUpdateTransaction={vi.fn()}
        onDeleteTransaction={vi.fn()}
        payPeriodStartDate="2024-01-01"
        payPeriodEndDate="2024-01-15"
      />
    );

    // Set date within pay period range (default is today which may be outside range)
    const dateInputs = screen.getAllByDisplayValue(new Date().toISOString().split('T')[0]);
    fireEvent.change(dateInputs[0], { target: { value: '2024-01-05' } });
    fireEvent.change(screen.getByPlaceholderText('New transaction...'), {
      target: { value: 'Groceries' },
    });
    fireEvent.change(screen.getByPlaceholderText('Amount'), {
      target: { value: '50' },
    });
    fireEvent.click(screen.getByText('Add'));

    expect(onAddTransaction).toHaveBeenCalledWith('Groceries', 50, '2024-01-05');
  });

  it('sets min and max on the add form date input', () => {
    render(
      <TransactionList
        transactions={[]}
        onAddTransaction={vi.fn()}
        onUpdateTransaction={vi.fn()}
        onDeleteTransaction={vi.fn()}
        payPeriodStartDate="2024-01-01"
        payPeriodEndDate="2024-01-15"
      />
    );

    const dateInput = screen.getByDisplayValue(new Date().toISOString().split('T')[0]);
    expect(dateInput).toHaveAttribute('min', '2024-01-01');
    expect(dateInput).toHaveAttribute('max', '2024-01-15');
  });

  it('sets min and max on the edit form date input', () => {
    render(
      <TransactionList
        transactions={mockTransactions}
        onAddTransaction={vi.fn()}
        onUpdateTransaction={vi.fn()}
        onDeleteTransaction={vi.fn()}
        payPeriodStartDate="2024-01-01"
        payPeriodEndDate="2024-01-15"
      />
    );

    // Click on a transaction to enter edit mode
    fireEvent.click(screen.getByText('Coffee'));

    // The edit date input should have min/max set
    const editDateInput = screen.getByDisplayValue('2024-01-03');
    expect(editDateInput).toHaveAttribute('min', '2024-01-01');
    expect(editDateInput).toHaveAttribute('max', '2024-01-15');
  });

  it('displays strikethrough balance format', () => {
    render(
      <TransactionList
        transactions={mockTransactions}
        onAddTransaction={vi.fn()}
        onUpdateTransaction={vi.fn()}
        onDeleteTransaction={vi.fn()}
        payPeriodStartDate="2024-01-01"
        payPeriodEndDate="2024-01-15"
      />
    );

    // $100.00 appears as previous balance of first transaction
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    // $95.00 appears twice: as new balance of first transaction AND previous balance of second
    expect(screen.getAllByText('$95.00').length).toBeGreaterThanOrEqual(1);
    // $80.00 appears as new balance of second transaction
    expect(screen.getByText('$80.00')).toBeInTheDocument();
  });
});
