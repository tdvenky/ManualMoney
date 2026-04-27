import axios from 'axios';
import type {
  Category,
  SubCategory,
  PayPeriod,
  Allocation,
  Transaction,
  SavingsTransfer,
  AppData,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateSubCategoryRequest,
  UpdateSubCategoryRequest,
  CreatePayPeriodRequest,
  UpdatePayPeriodRequest,
  CreateAllocationRequest,
  UpdateAllocationRequest,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  SavingsTransferRequest,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Category API
export const getCategories = async (): Promise<Category[]> => {
  const response = await api.get<Category[]>('/categories');
  return response.data;
};

export const getCategory = async (id: string): Promise<Category> => {
  const response = await api.get<Category>(`/categories/${id}`);
  return response.data;
};

export const createCategory = async (data: CreateCategoryRequest): Promise<Category> => {
  const response = await api.post<Category>('/categories', data);
  return response.data;
};

export const updateCategory = async (id: string, data: UpdateCategoryRequest): Promise<Category> => {
  const response = await api.put<Category>(`/categories/${id}`, data);
  return response.data;
};

export const deleteCategory = async (id: string): Promise<void> => {
  await api.delete(`/categories/${id}`);
};

// SubCategory API
export const getSubCategories = async (): Promise<SubCategory[]> => {
  const response = await api.get<SubCategory[]>('/subcategories');
  return response.data;
};

export const createSubCategory = async (data: CreateSubCategoryRequest): Promise<SubCategory> => {
  const response = await api.post<SubCategory>('/subcategories', data);
  return response.data;
};

export const updateSubCategory = async (id: string, data: UpdateSubCategoryRequest): Promise<SubCategory> => {
  const response = await api.put<SubCategory>(`/subcategories/${id}`, data);
  return response.data;
};

export const deleteSubCategory = async (id: string): Promise<void> => {
  await api.delete(`/subcategories/${id}`);
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

export const deletePayPeriod = async (id: string): Promise<void> => {
  await api.delete(`/payperiods/${id}`);
};

export const closePayPeriod = async (id: string): Promise<PayPeriod> => {
  const response = await api.put<PayPeriod>(`/payperiods/${id}/close`);
  return response.data;
};

export const reopenPayPeriod = async (id: string): Promise<PayPeriod> => {
  const response = await api.put<PayPeriod>(`/payperiods/${id}/reopen`);
  return response.data;
};

// Allocation API
export const addAllocation = async (payPeriodId: string, data: CreateAllocationRequest): Promise<Allocation> => {
  const response = await api.post<Allocation>(`/payperiods/${payPeriodId}/allocations`, data);
  return response.data;
};

export const deleteAllocation = async (id: string): Promise<void> => {
  await api.delete(`/allocations/${id}`);
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

// Savings Transfer API
export const addSavingsTransfer = async (allocationId: string, data: SavingsTransferRequest): Promise<SavingsTransfer> => {
  const response = await api.post<SavingsTransfer>(`/allocations/${allocationId}/savingstransfers`, data);
  return response.data;
};

export const updateSavingsTransfer = async (id: string, data: SavingsTransferRequest): Promise<SavingsTransfer> => {
  const response = await api.put<SavingsTransfer>(`/savingstransfers/${id}`, data);
  return response.data;
};

export const deleteSavingsTransfer = async (id: string): Promise<void> => {
  await api.delete(`/savingstransfers/${id}`);
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
