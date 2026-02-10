import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { BucketsPage } from '../../src/pages/BucketsPage';
import type { Bucket } from '../../src/types';

vi.mock('../../src/api/client', () => ({
  getBuckets: vi.fn(),
  createBucket: vi.fn(),
  updateBucket: vi.fn(),
  deleteBucket: vi.fn(),
}));

import * as api from '../../src/api/client';

const mockBuckets: Bucket[] = [
  { id: 'b1', name: 'Groceries', type: 'EXPENSE', createdAt: '', updatedAt: '' },
  { id: 'b2', name: 'Rent', type: 'EXPENSE', createdAt: '', updatedAt: '' },
  { id: 'b3', name: 'Emergency Fund', type: 'SAVINGS', createdAt: '', updatedAt: '' },
];

describe('BucketsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('shows loading state initially', () => {
    vi.mocked(api.getBuckets).mockReturnValue(new Promise(() => {}));

    render(
      <MemoryRouter>
        <BucketsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays buckets grouped by type', async () => {
    vi.mocked(api.getBuckets).mockResolvedValue(mockBuckets);

    render(
      <MemoryRouter>
        <BucketsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Expense Buckets (2)')).toBeInTheDocument();
      expect(screen.getByText('Savings Buckets (1)')).toBeInTheDocument();
      expect(screen.getByText('Groceries')).toBeInTheDocument();
      expect(screen.getByText('Rent')).toBeInTheDocument();
      expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
    });
  });

  it('shows empty state when no buckets exist', async () => {
    vi.mocked(api.getBuckets).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <BucketsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No buckets yet/)).toBeInTheDocument();
    });
  });

  it('shows create form when New Bucket is clicked', async () => {
    vi.mocked(api.getBuckets).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <BucketsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      fireEvent.click(screen.getByText('New Bucket'));
    });

    expect(screen.getByText('Create New Bucket')).toBeInTheDocument();
  });

  it('creates a new bucket', async () => {
    vi.mocked(api.getBuckets).mockResolvedValue([]);
    const newBucket: Bucket = { id: 'b4', name: 'Transport', type: 'EXPENSE', createdAt: '', updatedAt: '' };
    vi.mocked(api.createBucket).mockResolvedValue(newBucket);

    render(
      <MemoryRouter>
        <BucketsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      fireEvent.click(screen.getByText('New Bucket'));
    });

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Transport' } });
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(api.createBucket).toHaveBeenCalledWith({ name: 'Transport', type: 'EXPENSE' });
    });
  });

  it('deletes a bucket', async () => {
    vi.mocked(api.getBuckets).mockResolvedValue(mockBuckets);
    vi.mocked(api.deleteBucket).mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <BucketsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Groceries')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(api.deleteBucket).toHaveBeenCalledWith('b1');
    });
  });

  it('enters edit mode when Edit is clicked', async () => {
    vi.mocked(api.getBuckets).mockResolvedValue(mockBuckets);

    render(
      <MemoryRouter>
        <BucketsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Groceries')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    expect(screen.getByText('Update')).toBeInTheDocument();
  });

  it('shows error message on API failure', async () => {
    vi.mocked(api.getBuckets).mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <BucketsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load buckets')).toBeInTheDocument();
    });
  });

  it('dismisses error message', async () => {
    vi.mocked(api.getBuckets).mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <BucketsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load buckets')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Dismiss'));

    expect(screen.queryByText('Failed to load buckets')).not.toBeInTheDocument();
  });

  it('updates a bucket via the edit form', async () => {
    vi.mocked(api.getBuckets).mockResolvedValue(mockBuckets);
    const updatedBucket: Bucket = { id: 'b1', name: 'Food', type: 'EXPENSE', createdAt: '', updatedAt: '' };
    vi.mocked(api.updateBucket).mockResolvedValue(updatedBucket);

    render(
      <MemoryRouter>
        <BucketsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Groceries')).toBeInTheDocument();
    });

    // Click Edit on the first expense bucket
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    // Change the name in the edit form
    const nameInput = screen.getByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: 'Food' } });

    // Submit the form
    fireEvent.click(screen.getByText('Update'));

    await waitFor(() => {
      expect(api.updateBucket).toHaveBeenCalledWith('b1', { name: 'Food', type: 'EXPENSE' });
    });
  });

  it('shows error when update fails', async () => {
    vi.mocked(api.getBuckets).mockResolvedValue(mockBuckets);
    vi.mocked(api.updateBucket).mockRejectedValue(new Error('Update failed'));

    render(
      <MemoryRouter>
        <BucketsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Groceries')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    fireEvent.click(screen.getByText('Update'));

    await waitFor(() => {
      expect(screen.getByText('Failed to update bucket')).toBeInTheDocument();
    });
  });

  it('shows error when create fails', async () => {
    vi.mocked(api.getBuckets).mockResolvedValue([]);
    vi.mocked(api.createBucket).mockRejectedValue(new Error('Create failed'));

    render(
      <MemoryRouter>
        <BucketsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      fireEvent.click(screen.getByText('New Bucket'));
    });

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test' } });
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(screen.getByText('Failed to create bucket')).toBeInTheDocument();
    });
  });

  it('shows error when delete fails', async () => {
    vi.mocked(api.getBuckets).mockResolvedValue(mockBuckets);
    vi.mocked(api.deleteBucket).mockRejectedValue(new Error('Delete failed'));

    render(
      <MemoryRouter>
        <BucketsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Groceries')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Failed to delete bucket')).toBeInTheDocument();
    });
  });

  it('does not delete when confirm is cancelled', async () => {
    vi.mocked(api.getBuckets).mockResolvedValue(mockBuckets);
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(
      <MemoryRouter>
        <BucketsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Groceries')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    expect(api.deleteBucket).not.toHaveBeenCalled();
  });

  it('shows "No expense buckets" when only savings buckets exist', async () => {
    const savingsOnly: Bucket[] = [
      { id: 'b3', name: 'Emergency Fund', type: 'SAVINGS', createdAt: '', updatedAt: '' },
    ];
    vi.mocked(api.getBuckets).mockResolvedValue(savingsOnly);

    render(
      <MemoryRouter>
        <BucketsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No expense buckets')).toBeInTheDocument();
      expect(screen.getByText('Savings Buckets (1)')).toBeInTheDocument();
    });
  });

  it('shows "No savings buckets" when only expense buckets exist', async () => {
    const expenseOnly: Bucket[] = [
      { id: 'b1', name: 'Groceries', type: 'EXPENSE', createdAt: '', updatedAt: '' },
    ];
    vi.mocked(api.getBuckets).mockResolvedValue(expenseOnly);

    render(
      <MemoryRouter>
        <BucketsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No savings buckets')).toBeInTheDocument();
      expect(screen.getByText('Expense Buckets (1)')).toBeInTheDocument();
    });
  });

  it('edits a savings bucket', async () => {
    const savingsOnly: Bucket[] = [
      { id: 'b3', name: 'Emergency Fund', type: 'SAVINGS', createdAt: '', updatedAt: '' },
    ];
    vi.mocked(api.getBuckets).mockResolvedValue(savingsOnly);
    const updatedBucket: Bucket = { id: 'b3', name: 'Rainy Day Fund', type: 'SAVINGS', createdAt: '', updatedAt: '' };
    vi.mocked(api.updateBucket).mockResolvedValue(updatedBucket);

    render(
      <MemoryRouter>
        <BucketsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Edit'));

    const nameInput = screen.getByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: 'Rainy Day Fund' } });
    fireEvent.click(screen.getByText('Update'));

    await waitFor(() => {
      expect(api.updateBucket).toHaveBeenCalledWith('b3', { name: 'Rainy Day Fund', type: 'SAVINGS' });
    });
  });

  it('cancels editing a bucket', async () => {
    vi.mocked(api.getBuckets).mockResolvedValue(mockBuckets);

    render(
      <MemoryRouter>
        <BucketsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Groceries')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    expect(screen.getByText('Update')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancel'));

    // Should be back to display mode
    expect(screen.queryByText('Update')).not.toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
  });
});
