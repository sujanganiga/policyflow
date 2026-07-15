import axios from 'axios';
import type { Agent, ApiError, Customer, Pagination, Policy, User } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError: ApiError = error.response?.data || {
      message: 'Something went wrong. Please try again.',
    };
    return Promise.reject(apiError);
  }
);

export const authApi = {
  login: (email: string, password: string, role: 'admin' | 'agent') =>
    api.post<{ user: User; message: string }>('/auth/login', { email, password, role }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get<{ user: User }>('/auth/me'),
};

export const adminApi = {
  createAgent: (data: { name: string; email: string; password: string }) =>
    api.post('/admin/agents', data),
  listAgents: (params: { page?: number; limit?: number; status?: string }) =>
    api.get<{ agents: Agent[]; pagination: Pagination }>('/admin/agents', { params }),
  deactivateAgent: (id: string) => api.delete(`/admin/agents/${id}`),
};

export const agentApi = {
  createCustomer: (data: object) =>
    api.post<{ customer: Customer; message: string }>('/customers', data),
  searchCustomers: (q: string) =>
    api.get<{ customers: Customer[] }>('/customers/search', { params: { q } }),
  getCustomer: (id: string) =>
    api.get<{ customer: Customer; summary: { policyCount: number } }>(`/customers/${id}`),
  updateCustomer: (id: string, data: object) =>
    api.put<{ customer: Customer; message: string }>(`/customers/${id}`, data),
  issuePolicy: (data: object) =>
    api.post<{ policy: Policy; message: string }>('/policies/issue', data),
  getCustomerPolicies: (customerId: string) =>
    api.get<{ policies: Policy[] }>(`/policies/customer/${customerId}`),
};

export default api;
