export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'agent';
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  summary: { customerCount: number; policyCount: number };
}

export interface Customer {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  aadhaar: string;
  pan?: string;
  dateOfBirth: string;
  nomineeName: string;
  nomineeRelation: string;
  createdAt: string;
  updatedAt: string;
}

export interface Policy {
  _id: string;
  policyNumber: string;
  customerId: string;
  term: number;
  premiumAmount: number;
  premiumFrequency: string;
  startDate: string;
  status: string;
  createdAt: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string>;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
