import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BucketForm } from '../../src/components/BucketForm';

describe('BucketForm', () => {
  it('renders with default values', () => {
    render(<BucketForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText('Name')).toHaveValue('');
    expect(screen.getByLabelText('Type')).toHaveValue('EXPENSE');
  });

  it('renders with initial values', () => {
    render(
      <BucketForm
        onSubmit={vi.fn()}
        initialName="Groceries"
        initialType="SAVINGS"
      />
    );

    expect(screen.getByLabelText('Name')).toHaveValue('Groceries');
    expect(screen.getByLabelText('Type')).toHaveValue('SAVINGS');
  });

  it('calls onSubmit with form values', () => {
    const onSubmit = vi.fn();
    render(<BucketForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Rent' },
    });
    fireEvent.change(screen.getByLabelText('Type'), {
      target: { value: 'EXPENSE' },
    });
    fireEvent.click(screen.getByText('Create'));

    expect(onSubmit).toHaveBeenCalledWith('Rent', 'EXPENSE');
  });

  it('shows custom submit label', () => {
    render(<BucketForm onSubmit={vi.fn()} submitLabel="Update" />);

    expect(screen.getByText('Update')).toBeInTheDocument();
  });

  it('shows cancel button when onCancel provided', () => {
    const onCancel = vi.fn();
    render(<BucketForm onSubmit={vi.fn()} onCancel={onCancel} />);

    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('trims whitespace from name', () => {
    const onSubmit = vi.fn();
    render(<BucketForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: '  Groceries  ' },
    });
    fireEvent.click(screen.getByText('Create'));

    expect(onSubmit).toHaveBeenCalledWith('Groceries', 'EXPENSE');
  });
});
