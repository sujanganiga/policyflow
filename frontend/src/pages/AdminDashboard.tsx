import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { adminApi } from '../api';
import { Layout } from '../components/Layout';
import { Field, inputClass, buttonPrimary, buttonSecondary } from '../components/ui';
import type { Agent, ApiError, Pagination } from '../types';

interface CreateAgentForm {
  name: string;
  email: string;
  password: string;
}

export const AdminDashboard = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset } = useForm<CreateAgentForm>();

  const fetchAgents = async () => {
    try {
      const { data } = await adminApi.listAgents({ page, status: status || undefined });
      setAgents(data.agents);
      setPagination(data.pagination);
    } catch (err) {
      setError((err as ApiError).message);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [page, status]);

  const onCreate = async (formData: CreateAgentForm) => {
    setError('');
    setFieldErrors({});
    setLoading(true);
    try {
      await adminApi.createAgent(formData);
      setMessage('Agent created successfully');
      reset();
      setShowForm(false);
      fetchAgents();
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message);
      if (apiErr.errors) setFieldErrors(apiErr.errors);
    } finally {
      setLoading(false);
    }
  };

  const onDeactivate = async (id: string) => {
    if (!confirm('Deactivate this agent?')) return;
    try {
      await adminApi.deactivateAgent(id);
      setMessage('Agent deactivated');
      fetchAgents();
    } catch (err) {
      setError((err as ApiError).message);
    }
  };

  return (
    <Layout title="Admin Dashboard - Agent Management">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Agents</h2>
        <button onClick={() => setShowForm(!showForm)} className={buttonPrimary}>
          {showForm ? 'Cancel' : 'Create Agent'}
        </button>
      </div>

      {message && (
        <p className="mb-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{message}</p>
      )}
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit(onCreate)}
          className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h3 className="mb-4 text-lg font-semibold">New Agent</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Name" error={fieldErrors.name}>
              <input className={inputClass} {...register('name', { required: true })} />
            </Field>
            <Field label="Email" error={fieldErrors.email}>
              <input type="email" className={inputClass} {...register('email', { required: true })} />
            </Field>
            <Field label="Password" error={fieldErrors.password}>
              <input
                type="password"
                className={inputClass}
                {...register('password', { required: true, minLength: 6 })}
              />
            </Field>
          </div>
          <button type="submit" disabled={loading} className={`mt-4 ${buttonPrimary}`}>
            {loading ? 'Creating...' : 'Create Agent'}
          </button>
        </form>
      )}

      <div className="mb-4 flex gap-2">
        {['', 'active', 'inactive'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              status === s
                ? 'bg-brand-600 text-white'
                : 'bg-white text-slate-600 border border-slate-300'
            }`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Customers</th>
              <th className="px-4 py-3">Policies</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => (
              <tr key={agent.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{agent.name}</td>
                <td className="px-4 py-3">{agent.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      agent.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {agent.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">{agent.summary.customerCount}</td>
                <td className="px-4 py-3">{agent.summary.policyCount}</td>
                <td className="px-4 py-3">
                  {agent.isActive && (
                    <button
                      onClick={() => onDeactivate(agent.id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Deactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {agents.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No agents found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className={buttonSecondary}
          >
            Previous
          </button>
          <span className="text-sm text-slate-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(page + 1)}
            className={buttonSecondary}
          >
            Next
          </button>
        </div>
      )}
    </Layout>
  );
};
