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
  excludeFromSavings: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Allocation {
  id: string;
  categoryId: string;
  categoryName?: string;
  categoryType?: CategoryType;
  allocatedAmount: number;
  currentBalance: number;
  transactions: Transaction[];
  savingsTransfers: SavingsTransfer[];
  createdAt: string;
  updatedAt: string;
}

export interface Income {
  id: string;
  description: string;
  amount: number;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayPeriod {
  id: string;
  payDate: string;
  endDate: string;
  amount: number;
  incomes: Income[];
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

export interface TemplateAllocation {
  categoryId: string;
  allocatedAmount: number;
}

export interface Template {
  id: string;
  name: string;
  income: number;
  allocations: TemplateAllocation[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateRequest {
  name: string;
  income: number;
  allocations: TemplateAllocation[];
}

export interface UpdateTemplateRequest {
  name: string;
  income: number;
  allocations: TemplateAllocation[];
}

export type NetWorthCategoryType = 'ASSET' | 'LIABILITY';

// Either a fixed category's enum name (e.g. "SAVINGS") or a custom category's UUID.
export type NetWorthCategoryKey = string;

export interface NetWorthCategoryMeta {
  key: NetWorthCategoryKey;
  label: string;
  type: NetWorthCategoryType;
  custom: boolean;
}

export interface NetWorthSubItem {
  name?: string;
  amount: number;
}

export interface NetWorthEntry {
  category: NetWorthCategoryKey;
  subItems: NetWorthSubItem[];
}

export interface NetWorthSnapshot {
  id: string;
  date: string;
  entries: NetWorthEntry[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NetWorthSnapshotRequest {
  date: string;
  entries: NetWorthEntry[];
  notes?: string;
}

export interface CreateNetWorthCategoryRequest {
  name: string;
  type: NetWorthCategoryType;
}

export interface AppData {
  categories: Category[];
  subCategories: SubCategory[];
  payPeriods: PayPeriod[];
  templates?: Template[];
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
}

export interface UpdatePayPeriodRequest {
  payDate: string;
  endDate: string;
}

export interface CreateIncomeRequest {
  description: string;
  amount: number;
  date: string;
}

export interface UpdateIncomeRequest {
  description: string;
  amount: number;
  date: string;
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
  excludeFromSavings?: boolean;
}
