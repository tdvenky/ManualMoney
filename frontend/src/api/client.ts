import axios from 'axios';
import type {
  Bucket,
  PayPeriod,
  Allocation,
  Transaction,
  AppData,
  CreateBucketRequest,
  UpdateBucketRequest,
  CreatePayPeriodRequest,
  UpdatePayPeriodRequest,
  CreateAllocationRequest,
  UpdateAllocationRequest,
  CreateTransactionRequest,
  UpdateTransactionRequest,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Bucket API
export const getBuckets = async (): Promise<Bucket[]> => {
  const response = await api.get<Bucket[]>('/buckets');
  return response.data;
};

export const getBucket = async (id: string): Promise<Bucket> => {
  const response = await api.get<Bucket>(`/buckets/${id}`);
  return response.data;
};

export const createBucket = async (data: CreateBucketRequest): Promise<Bucket> => {
  const response = await api.post<Bucket>('/buckets', data);
  return response.data;
};

export const updateBucket = async (id: string, data: UpdateBucketRequest): Promise<Bucket> => {
  const response = await api.put<Bucket>(`/buckets/${id}`, data);
  return response.data;
};

export const deleteBucket = async (id: string): Promise<void> => {
  await api.delete(`/buckets/${id}`);
};

// PayPeriod API
export const getPayPeriods = async (): Promise<PayPeriod[]> => {
  const response = await api.get<PayPeriod[]>('/payperiods');
  return response.data;
};

export const getPayPeriod = async (id: string): Promise<PayPeriod> => {
  const response = await api.get<PayPeriod>(`/payperiods/${id}`);
  return response.data;
};

export const createPayPeriod = async (data: CreatePayPeriodRequest): Promise<PayPeriod> => {
  const response = await api.post<PayPeriod>('/payperiods', data);
  return response.data;
};

export const updatePayPeriod = async (id: string, data: UpdatePayPeriodRequest): Promise<PayPeriod> => {
  const response = await api.put<PayPeriod>(`/payperiods/${id}`, data);
  return response.data;
};

export const closePayPeriod = async (id: string): Promise<PayPeriod> => {
  const response = await api.put<PayPeriod>(`/payperiods/${id}/close`);
  return response.data;
};

// Allocation API
export const addAllocation = async (payPeriodId: string, data: CreateAllocationRequest): Promise<Allocation> => {
  const response = await api.post<Allocation>(`/payperiods/${payPeriodId}/allocations`, data);
  return response.data;
};

export const updateAllocation = async (id: string, data: UpdateAllocationRequest): Promise<Allocation> => {
  const response = await api.put<Allocation>(`/allocations/${id}`, data);
  return response.data;
};

// Transaction API
export const addTransaction = async (allocationId: string, data: CreateTransactionRequest): Promise<Transaction> => {
  const response = await api.post<Transaction>(`/allocations/${allocationId}/transactions`, data);
  return response.data;
};

export const updateTransaction = async (id: string, data: UpdateTransactionRequest): Promise<Transaction> => {
  const response = await api.put<Transaction>(`/transactions/${id}`, data);
  return response.data;
};

export const deleteTransaction = async (id: string): Promise<void> => {
  await api.delete(`/transactions/${id}`);
};

// Export/Import API
export const exportData = async (): Promise<AppData> => {
  const response = await api.get<AppData>('/export');
  return response.data;
};

export const importData = async (data: AppData): Promise<void> => {
  await api.post('/import', data);
};

export default api;
