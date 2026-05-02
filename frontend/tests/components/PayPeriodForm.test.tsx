import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PayPeriodForm } from '../../src/components/PayPeriodForm';

describe('PayPeriodForm', () => {
  it('renders form fields', () => {
    render(<PayPeriodForm onSubmit={vi.fn()} />);

    expect(screen.getByText('Start Date')).toBeInTheDocument();
    expect(screen.getByText('End Date')).toBeInTheDocument();
  });

  it('renders with initial values', () => {
    render(
      <PayPeriodForm
        onSubmit={vi.fn()}
        initialPayDate="2024-01-01"
        initialEndDate="2024-01-15"
      />
    );

    expect(screen.getByDisplayValue('2024-01-01')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2024-01-15')).toBeInTheDocument();
  });

  it('calls onSubmit with form values', () => {
    const onSubmit = vi.fn();
    render(
      <PayPeriodForm
        onSubmit={onSubmit}
        initialPayDate="2024-01-01"
        initialEndDate="2024-01-15"
      />
    );

    fireEvent.click(screen.getByText('Create'));

    expect(onSubmit).toHaveBeenCalledWith('2024-01-01', '2024-01-15');
  });

  it('shows custom submit label', () => {
    render(<PayPeriodForm onSubmit={vi.fn()} submitLabel="Update Pay Period" />);

    expect(screen.getByText('Update Pay Period')).toBeInTheDocument();
  });

  it('shows cancel button when onCancel provided', () => {
    const onCancel = vi.fn();
    render(<PayPeriodForm onSubmit={vi.fn()} onCancel={onCancel} />);

    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('does not show cancel button when onCancel not provided', () => {
    render(<PayPeriodForm onSubmit={vi.fn()} />);

    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
  });

  it('auto-updates end date when pay date changes to after current end date', () => {
    render(
      <PayPeriodForm
        onSubmit={vi.fn()}
        initialPayDate="2024-01-01"
        initialEndDate="2024-01-05"
      />
    );

    const startDateInput = screen.getByDisplayValue('2024-01-01');
    fireEvent.change(startDateInput, {
      target: { value: '2024-02-01' },
    });

    expect(screen.getByDisplayValue('2024-02-14')).toBeInTheDocument();
  });
});
