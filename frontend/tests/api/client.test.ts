import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Category, PayPeriod, AppData } from '../../src/types';

// Create mock functions
const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPut = vi.fn();
const mockDelete = vi.fn();

// Mock axios before any imports
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: mockGet,
      post: mockPost,
      put: mockPut,
      delete: mockDelete,
    })),
  },
}));

describe('API Client', () => {
  // Import client dynamically after mock is set up
  let api: typeof import('../../src/api/client');

  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset module cache and re-import
    vi.resetModules();
    api = await import('../../src/api/client');
  });

  describe('Buckets API', () => {
    it('getCategories calls GET /categories', async () => {
      const mockBuckets: Category[] = [
        { id: '1', name: 'Test', type: 'EXPENSE', createdAt: '', updatedAt: '' },
      ];
      mockGet.mockResolvedValueOnce({ data: mockBuckets });

      const result = await api.getCategories();

      expect(mockGet).toHaveBeenCalledWith('/categories');
      expect(result).toEqual(mockBuckets);
    });

    it('getCategory calls GET /categories/:id', async () => {
      const mockBucket: Category = { id: '1', name: 'Test', type: 'EXPENSE', createdAt: '', updatedAt: '' };
      mockGet.mockResolvedValueOnce({ data: mockBucket });

      const result = await api.getCategory('1');

      expect(mockGet).toHaveBeenCalledWith('/categories/1');
      expect(result).toEqual(mockBucket);
    });

    it('createCategory calls POST /categories', async () => {
      const newBucket = { name: 'Test', type: 'EXPENSE' as const };
      const createdBucket = { id: '1', ...newBucket, createdAt: '', updatedAt: '' };
      mockPost.mockResolvedValueOnce({ data: createdBucket });

      const result = await api.createCategory(newBucket);

      expect(mockPost).toHaveBeenCalledWith('/categories', newBucket);
      expect(result).toEqual(createdBucket);
    });

    it('updateCategory calls PUT /categories/:id', async () => {
      const updateData = { name: 'Updated', type: 'SAVINGS' as const };
      mockPut.mockResolvedValueOnce({ data: { id: '1', ...updateData } });

      await api.updateCategory('1', updateData);

      expect(mockPut).toHaveBeenCalledWith('/categories/1', updateData);
    });

    it('deleteCategory calls DELETE /categories/:id', async () => {
      mockDelete.mockResolvedValueOnce({});

      await api.deleteCategory('1');

      expect(mockDelete).toHaveBeenCalledWith('/categories/1');
    });
  });

  describe('PayPeriods API', () => {
    it('getPayPeriods calls GET /payperiods', async () => {
      const mockPayPeriods: PayPeriod[] = [];
      mockGet.mockResolvedValueOnce({ data: mockPayPeriods });

      await api.getPayPeriods();

      expect(mockGet).toHaveBeenCalledWith('/payperiods');
    });

    it('getPayPeriod calls GET /payperiods/:id', async () => {
      const mockPayPeriod = { id: '1', payDate: '2024-01-01', amount: 2000 };
      mockGet.mockResolvedValueOnce({ data: mockPayPeriod });

      const result = await api.getPayPeriod('1');

      expect(mockGet).toHaveBeenCalledWith('/payperiods/1');
      expect(result).toEqual(mockPayPeriod);
    });

    it('createPayPeriod calls POST /payperiods', async () => {
      const newPayPeriod = { payDate: '2024-01-01', endDate: '2024-01-15', amount: 2000 };
      mockPost.mockResolvedValueOnce({ data: { id: '1', ...newPayPeriod } });

      await api.createPayPeriod(newPayPeriod);

      expect(mockPost).toHaveBeenCalledWith('/payperiods', newPayPeriod);
    });

    it('updatePayPeriod calls PUT /payperiods/:id', async () => {
      const updateData = { payDate: '2024-02-01', endDate: '2024-02-15', amount: 3000 };
      mockPut.mockResolvedValueOnce({ data: { id: '1', ...updateData } });

      const result = await api.updatePayPeriod('1', updateData);

      expect(mockPut).toHaveBeenCalledWith('/payperiods/1', updateData);
      expect(result).toEqual({ id: '1', ...updateData });
    });

    it('closePayPeriod calls PUT /payperiods/:id/close', async () => {
      mockPut.mockResolvedValueOnce({ data: { id: '1', status: 'CLOSED' } });

      await api.closePayPeriod('1');

      expect(mockPut).toHaveBeenCalledWith('/payperiods/1/close');
    });
  });

  describe('Allocations API', () => {
    it('addAllocation calls POST /payperiods/:id/allocations', async () => {
      const allocationData = { categoryId: 'bucket-1', allocatedAmount: 500 };
      mockPost.mockResolvedValueOnce({ data: { id: 'alloc-1', ...allocationData } });

      await api.addAllocation('period-1', allocationData);

      expect(mockPost).toHaveBeenCalledWith('/payperiods/period-1/allocations', allocationData);
    });

    it('updateAllocation calls PUT /allocations/:id', async () => {
      const updateData = { allocatedAmount: 600 };
      mockPut.mockResolvedValueOnce({ data: { id: 'alloc-1', ...updateData } });

      await api.updateAllocation('alloc-1', updateData);

      expect(mockPut).toHaveBeenCalledWith('/allocations/alloc-1', updateData);
    });
  });

  describe('Transactions API', () => {
    it('addTransaction calls POST /allocations/:id/transactions', async () => {
      const transactionData = { description: 'Coffee', amount: 5, date: '2024-01-01', subCategoryId: 'sc1', priority: 'NEED_IT' as const };
      mockPost.mockResolvedValueOnce({ data: { id: 'trans-1', ...transactionData } });

      await api.addTransaction('alloc-1', transactionData);

      expect(mockPost).toHaveBeenCalledWith('/allocations/alloc-1/transactions', transactionData);
    });

    it('updateTransaction calls PUT /transactions/:id', async () => {
      const updateData = { description: 'Lunch', amount: 10, date: '2024-01-01', subCategoryId: 'sc1', priority: 'NEED_IT' as const };
      mockPut.mockResolvedValueOnce({ data: { id: 'trans-1', ...updateData } });

      await api.updateTransaction('trans-1', updateData);

      expect(mockPut).toHaveBeenCalledWith('/transactions/trans-1', updateData);
    });

    it('deleteTransaction calls DELETE /transactions/:id', async () => {
      mockDelete.mockResolvedValueOnce({});

      await api.deleteTransaction('trans-1');

      expect(mockDelete).toHaveBeenCalledWith('/transactions/trans-1');
    });
  });

  describe('Export/Import API', () => {
    it('exportData calls GET /export', async () => {
      const mockData: AppData = { categories: [], subCategories: [], payPeriods: [] };
      mockGet.mockResolvedValueOnce({ data: mockData });

      const result = await api.exportData();

      expect(mockGet).toHaveBeenCalledWith('/export');
      expect(result).toEqual(mockData);
    });

    it('importData calls POST /import', async () => {
      const importData: AppData = { categories: [], subCategories: [], payPeriods: [] };
      mockPost.mockResolvedValueOnce({});

      await api.importData(importData);

      expect(mockPost).toHaveBeenCalledWith('/import', importData);
    });
  });
});
