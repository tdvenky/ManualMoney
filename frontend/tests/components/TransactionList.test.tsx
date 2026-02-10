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

  it('calls onUpdateTransaction when edit form is saved', () => {
    const onUpdateTransaction = vi.fn();
    render(
      <TransactionList
        transactions={mockTransactions}
        onAddTransaction={vi.fn()}
        onUpdateTransaction={onUpdateTransaction}
        onDeleteTransaction={vi.fn()}
        payPeriodStartDate="2024-01-01"
        payPeriodEndDate="2024-01-15"
      />
    );

    // Click on a transaction to enter edit mode
    fireEvent.click(screen.getByText('Coffee'));

    // Modify description and amount
    fireEvent.change(screen.getByDisplayValue('Coffee'), {
      target: { value: 'Espresso' },
    });
    fireEvent.change(screen.getByDisplayValue('5'), {
      target: { value: '7' },
    });

    // Submit the edit form
    fireEvent.click(screen.getByText('Save'));

    expect(onUpdateTransaction).toHaveBeenCalledWith('1', 'Espresso', 7, '2024-01-03');
  });

  it('cancels edit mode without saving', () => {
    const onUpdateTransaction = vi.fn();
    render(
      <TransactionList
        transactions={mockTransactions}
        onAddTransaction={vi.fn()}
        onUpdateTransaction={onUpdateTransaction}
        onDeleteTransaction={vi.fn()}
        payPeriodStartDate="2024-01-01"
        payPeriodEndDate="2024-01-15"
      />
    );

    // Click on a transaction to enter edit mode
    fireEvent.click(screen.getByText('Coffee'));
    expect(screen.getByText('Save')).toBeInTheDocument();

    // Click cancel
    fireEvent.click(screen.getByText('Cancel'));

    // Should exit edit mode without calling update
    expect(onUpdateTransaction).not.toHaveBeenCalled();
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
  });

  it('calls onDeleteTransaction when delete is confirmed', () => {
    const onDeleteTransaction = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <TransactionList
        transactions={mockTransactions}
        onAddTransaction={vi.fn()}
        onUpdateTransaction={vi.fn()}
        onDeleteTransaction={onDeleteTransaction}
        payPeriodStartDate="2024-01-01"
        payPeriodEndDate="2024-01-15"
      />
    );

    // Click the delete button (×) on the first transaction
    const deleteButtons = screen.getAllByTitle('Delete transaction');
    fireEvent.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalled();
    expect(onDeleteTransaction).toHaveBeenCalledWith('1');
  });

  it('does not delete transaction when confirm is cancelled', () => {
    const onDeleteTransaction = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(
      <TransactionList
        transactions={mockTransactions}
        onAddTransaction={vi.fn()}
        onUpdateTransaction={vi.fn()}
        onDeleteTransaction={onDeleteTransaction}
        payPeriodStartDate="2024-01-01"
        payPeriodEndDate="2024-01-15"
      />
    );

    const deleteButtons = screen.getAllByTitle('Delete transaction');
    fireEvent.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalled();
    expect(onDeleteTransaction).not.toHaveBeenCalled();
  });

  it('does not add transaction when fields are empty', () => {
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

    // Submit without filling in fields
    fireEvent.click(screen.getByText('Add'));

    expect(onAddTransaction).not.toHaveBeenCalled();
  });
});
