export type CategoryType = 'EXPENSE' | 'SAVINGS';

export type PayPeriodStatus = 'ACTIVE' | 'CLOSED';

export type Priority = 'NEED_IT' | 'GOTTA_HAVE_IT' | 'MEH' | 'DROP_IT';

export const PRIORITY_LABELS: Record<Priority, string> = {
  NEED_IT: 'Need It',
  GOTTA_HAVE_IT: 'Gotta Have It',
  MEH: 'Meh',
  DROP_IT: 'Drop It',
};

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  createdAt: string;
  updatedAt: string;
}

export interface SubCategory {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  previousBalance: number;
  newBalance: number;
  subCategoryId: string;
  priority: Priority;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type SavingsTransferType = 'TRANSFER' | 'OVERSPEND_OFFSET' | 'HYSA_WITHDRAWAL';

export interface SavingsTransfer {
  id: string;
  amount: number;
  date: string;
  notes?: string;
  type: SavingsTransferType;
  createdAt: string;
  updatedAt: string;
}

export interface Allocation {
  id: string;
  categoryId: string;
  categoryName?: string;
  allocatedAmount: number;
  currentBalance: number;
  transactions: Transaction[];
  savingsTransfers: SavingsTransfer[];
  createdAt: string;
  updatedAt: string;
}

export interface PayPeriod {
  id: string;
  payDate: string;
  endDate: string;
  amount: number;
  allocations: Allocation[];
  status: PayPeriodStatus;
  carryForwardAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface OverspendResolutionItem {
  allocationId: string;
  amount: number;
}

export interface ClosePayPeriodRequest {
  savingsOffsets?: OverspendResolutionItem[];
  hysaWithdrawals?: OverspendResolutionItem[];
  carryForwardAmount?: number;
}

export interface AppData {
  categories: Category[];
  subCategories: SubCategory[];
  payPeriods: PayPeriod[];
}

export interface CreateCategoryRequest {
  name: string;
  type: CategoryType;
}

export interface UpdateCategoryRequest {
  name: string;
  type: CategoryType;
}

export interface CreateSubCategoryRequest {
  name: string;
}

export interface UpdateSubCategoryRequest {
  name: string;
}

export interface CreatePayPeriodRequest {
  payDate: string;
  endDate: string;
  amount: number;
}

export interface UpdatePayPeriodRequest {
  payDate: string;
  endDate: string;
  amount: number;
}

export interface CreateAllocationRequest {
  categoryId: string;
  allocatedAmount: number;
}

export interface UpdateAllocationRequest {
  allocatedAmount: number;
}

export interface CreateTransactionRequest {
  description: string;
  amount: number;
  date: string;
  subCategoryId: string;
  priority: Priority;
  notes?: string;
}

export interface UpdateTransactionRequest {
  description: string;
  amount: number;
  date: string;
  subCategoryId: string;
  priority: Priority;
  notes?: string;
}

export interface SavingsTransferRequest {
  amount: number;
  date: string;
  notes?: string;
}
