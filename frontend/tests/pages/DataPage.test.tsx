import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { DataPage } from '../../src/pages/DataPage';

vi.mock('../../src/api/client', () => ({
  exportData: vi.fn(),
  importData: vi.fn(),
}));

import * as api from '../../src/api/client';

describe('DataPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('renders export and import sections', () => {
    render(
      <MemoryRouter>
        <DataPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Export Data')).toBeInTheDocument();
    expect(screen.getByText('Import Data')).toBeInTheDocument();
    expect(screen.getByText('Export to JSON')).toBeInTheDocument();
  });

  it('exports data when export button is clicked', async () => {
    vi.mocked(api.exportData).mockResolvedValue({ categories: [], subCategories: [], payPeriods: [] });

    // Mock the anchor element click behavior
    const mockClick = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === 'a') {
        el.click = mockClick;
      }
      return el;
    });
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    window.URL.revokeObjectURL = vi.fn();

    render(
      <MemoryRouter>
        <DataPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Export to JSON'));

    await waitFor(() => {
      expect(api.exportData).toHaveBeenCalled();
      expect(screen.getByText('Data exported successfully')).toBeInTheDocument();
    });

    vi.mocked(document.createElement).mockRestore();
  });

  it('shows error on export failure', async () => {
    vi.mocked(api.exportData).mockRejectedValue(new Error('Export failed'));

    render(
      <MemoryRouter>
        <DataPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Export to JSON'));

    await waitFor(() => {
      expect(screen.getByText('Failed to export data')).toBeInTheDocument();
    });
  });

  it('imports data from file', async () => {
    vi.mocked(api.importData).mockResolvedValue(undefined);

    const jsonData = JSON.stringify({ categories: [], subCategories: [], payPeriods: [] });
    const file = new File([jsonData], 'data.json', { type: 'application/json' });
    // Mock file.text() since jsdom doesn't fully support it
    file.text = vi.fn().mockResolvedValue(jsonData);

    render(
      <MemoryRouter>
        <DataPage />
      </MemoryRouter>
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(api.importData).toHaveBeenCalled();
      expect(screen.getByText('Data imported successfully')).toBeInTheDocument();
    });
  });

  it('shows error on import failure', async () => {
    vi.mocked(api.importData).mockRejectedValue(new Error('Import failed'));

    render(
      <MemoryRouter>
        <DataPage />
      </MemoryRouter>
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(
      [JSON.stringify({ categories: [], subCategories: [], payPeriods: [] })],
      'data.json',
      { type: 'application/json' }
    );

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Failed to import data/)).toBeInTheDocument();
    });
  });

  it('dismisses error message', async () => {
    vi.mocked(api.exportData).mockRejectedValue(new Error('Export failed'));

    render(
      <MemoryRouter>
        <DataPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Export to JSON'));

    await waitFor(() => {
      expect(screen.getByText('Failed to export data')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Dismiss'));
    expect(screen.queryByText('Failed to export data')).not.toBeInTheDocument();
  });

  it('dismisses success message', async () => {
    vi.mocked(api.exportData).mockResolvedValue({ categories: [], subCategories: [], payPeriods: [] });

    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === 'a') {
        el.click = vi.fn();
      }
      return el;
    });
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    window.URL.revokeObjectURL = vi.fn();

    render(
      <MemoryRouter>
        <DataPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Export to JSON'));

    await waitFor(() => {
      expect(screen.getByText('Data exported successfully')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Dismiss'));
    expect(screen.queryByText('Data exported successfully')).not.toBeInTheDocument();

    vi.mocked(document.createElement).mockRestore();
  });
});
