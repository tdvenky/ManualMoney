import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Bucket, PayPeriod, Allocation, Transaction, AppData } from '../../src/types';

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
    it('getBuckets calls GET /buckets', async () => {
      const mockBuckets: Bucket[] = [
        { id: '1', name: 'Test', type: 'EXPENSE', createdAt: '', updatedAt: '' },
      ];
      mockGet.mockResolvedValueOnce({ data: mockBuckets });

      const result = await api.getBuckets();

      expect(mockGet).toHaveBeenCalledWith('/buckets');
      expect(result).toEqual(mockBuckets);
    });

    it('getBucket calls GET /buckets/:id', async () => {
      const mockBucket: Bucket = { id: '1', name: 'Test', type: 'EXPENSE', createdAt: '', updatedAt: '' };
      mockGet.mockResolvedValueOnce({ data: mockBucket });

      const result = await api.getBucket('1');

      expect(mockGet).toHaveBeenCalledWith('/buckets/1');
      expect(result).toEqual(mockBucket);
    });

    it('createBucket calls POST /buckets', async () => {
      const newBucket = { name: 'Test', type: 'EXPENSE' as const };
      const createdBucket = { id: '1', ...newBucket, createdAt: '', updatedAt: '' };
      mockPost.mockResolvedValueOnce({ data: createdBucket });

      const result = await api.createBucket(newBucket);

      expect(mockPost).toHaveBeenCalledWith('/buckets', newBucket);
      expect(result).toEqual(createdBucket);
    });

    it('updateBucket calls PUT /buckets/:id', async () => {
      const updateData = { name: 'Updated', type: 'SAVINGS' as const };
      mockPut.mockResolvedValueOnce({ data: { id: '1', ...updateData } });

      const result = await api.updateBucket('1', updateData);

      expect(mockPut).toHaveBeenCalledWith('/buckets/1', updateData);
    });

    it('deleteBucket calls DELETE /buckets/:id', async () => {
      mockDelete.mockResolvedValueOnce({});

      await api.deleteBucket('1');

      expect(mockDelete).toHaveBeenCalledWith('/buckets/1');
    });
  });

  describe('PayPeriods API', () => {
    it('getPayPeriods calls GET /payperiods', async () => {
      const mockPayPeriods: PayPeriod[] = [];
      mockGet.mockResolvedValueOnce({ data: mockPayPeriods });

      const result = await api.getPayPeriods();

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
      const newPayPeriod = { payDate: '2024-01-01', amount: 2000 };
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
      const allocationData = { bucketId: 'bucket-1', allocatedAmount: 500 };
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
      const transactionData = { description: 'Coffee', amount: 5 };
      mockPost.mockResolvedValueOnce({ data: { id: 'trans-1', ...transactionData } });

      await api.addTransaction('alloc-1', transactionData);

      expect(mockPost).toHaveBeenCalledWith('/allocations/alloc-1/transactions', transactionData);
    });

    it('updateTransaction calls PUT /transactions/:id', async () => {
      const updateData = { description: 'Lunch', amount: 10 };
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
      const mockData: AppData = { buckets: [], payPeriods: [] };
      mockGet.mockResolvedValueOnce({ data: mockData });

      const result = await api.exportData();

      expect(mockGet).toHaveBeenCalledWith('/export');
      expect(result).toEqual(mockData);
    });

    it('importData calls POST /import', async () => {
      const importData: AppData = { buckets: [], payPeriods: [] };
      mockPost.mockResolvedValueOnce({});

      await api.importData(importData);

      expect(mockPost).toHaveBeenCalledWith('/import', importData);
    });
  });
});
