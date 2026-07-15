import { useState } from 'react';
import { Link } from 'react-router-dom';
import { agentApi } from '../api';
import { Layout } from '../components/Layout';
import { inputClass, buttonPrimary } from '../components/ui';
import type { ApiError, Customer } from '../types';

export const AgentDashboard = () => {
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setError('');
    setLoading(true);
    try {
      const { data } = await agentApi.searchCustomers(query.trim());
      setCustomers(data.customers);
      setSearched(true);
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Agent Dashboard">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Customer Search</h2>
        <Link to="/agent/customers/new" className={buttonPrimary}>
          + New Customer
        </Link>
      </div>

      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, or mobile..."
          className={`flex-1 ${inputClass}`}
        />
        <button type="submit" disabled={loading} className={buttonPrimary}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      {searched && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c._id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">{c.email}</td>
                  <td className="px-4 py-3">{c.mobile}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/agent/customers/${c._id}`}
                      className="text-brand-600 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No customers found.{' '}
                    <Link to="/agent/customers/new" className="text-brand-600 hover:underline">
                      Create new customer
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
};
