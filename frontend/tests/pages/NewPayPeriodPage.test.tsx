import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { NewPayPeriodPage } from '../../src/pages/NewPayPeriodPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../src/api/client', () => ({
  createPayPeriod: vi.fn(),
}));

import * as api from '../../src/api/client';

describe('NewPayPeriodPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the form', () => {
    render(
      <MemoryRouter>
        <NewPayPeriodPage />
      </MemoryRouter>
    );

    expect(screen.getByText('New Pay Period')).toBeInTheDocument();
    expect(screen.getByText('Create Pay Period')).toBeInTheDocument();
  });

  it('creates pay period and navigates on success', async () => {
    vi.mocked(api.createPayPeriod).mockResolvedValue({
      id: 'pp1',
      payDate: '2024-01-01',
      endDate: '2024-01-15',
      amount: 2000,
      status: 'ACTIVE',
      allocations: [],
      createdAt: '',
      updatedAt: '',
    });

    render(
      <MemoryRouter>
        <NewPayPeriodPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '2000' } });
    fireEvent.click(screen.getByText('Create Pay Period'));

    await waitFor(() => {
      expect(api.createPayPeriod).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/payperiods/pp1');
    });
  });

  it('shows error on creation failure', async () => {
    vi.mocked(api.createPayPeriod).mockRejectedValue(new Error('Server error'));

    render(
      <MemoryRouter>
        <NewPayPeriodPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '2000' } });
    fireEvent.click(screen.getByText('Create Pay Period'));

    await waitFor(() => {
      expect(screen.getByText('Failed to create pay period')).toBeInTheDocument();
    });
  });

  it('navigates back when cancel is clicked', () => {
    render(
      <MemoryRouter>
        <NewPayPeriodPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('has back link to dashboard', () => {
    render(
      <MemoryRouter>
        <NewPayPeriodPage />
      </MemoryRouter>
    );

    const backLink = screen.getByText(/Back to Dashboard/);
    expect(backLink).toBeInTheDocument();
  });
});
