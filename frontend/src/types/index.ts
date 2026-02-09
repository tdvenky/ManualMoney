export type BucketType = 'EXPENSE' | 'SAVINGS';

export type PayPeriodStatus = 'ACTIVE' | 'CLOSED';

export interface Bucket {
  id: string;
  name: string;
  type: BucketType;
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
  createdAt: string;
  updatedAt: string;
}

export interface Allocation {
  id: string;
  bucketId: string;
  allocatedAmount: number;
  currentBalance: number;
  transactions: Transaction[];
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
  createdAt: string;
  updatedAt: string;
}

export interface AppData {
  buckets: Bucket[];
  payPeriods: PayPeriod[];
}

export interface CreateBucketRequest {
  name: string;
  type: BucketType;
}

export interface UpdateBucketRequest {
  name: string;
  type: BucketType;
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
  bucketId: string;
  allocatedAmount: number;
}

export interface UpdateAllocationRequest {
  allocatedAmount: number;
}

export interface CreateTransactionRequest {
  description: string;
  amount: number;
  date: string;
}

export interface UpdateTransactionRequest {
  description: string;
  amount: number;
  date: string;
}
