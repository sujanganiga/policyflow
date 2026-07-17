import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';
import { agentApi } from '../api';
import { Layout } from '../components/Layout';
import { Field, inputClass, buttonPrimary, buttonSecondary } from '../components/ui';
import type { ApiError, Customer, Policy } from '../types';

interface EditForm {
  name: string;
  email: string;
  mobile: string;
  pan?: string;
  nomineeName: string;
  nomineeRelation: string;
}

interface PolicyForm {
  term: number;
  premiumAmount: number;
  premiumFrequency: string;
  startDate: string;
}

const TERMS = [10, 15, 20, 25, 30];
const FREQUENCIES = ['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly'];

export const CustomerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [policyCount, setPolicyCount] = useState(0);
  const [editing, setEditing] = useState(false);
  const [showPolicyForm, setShowPolicyForm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const editForm = useForm<EditForm>();
  const policyForm = useForm<PolicyForm>({
    defaultValues: { term: 20, premiumFrequency: 'Yearly' },
  });

  const fetchData = async () => {
    if (!id) return;
    try {
      const [customerRes, policiesRes] = await Promise.all([
        agentApi.getCustomer(id),
        agentApi.getCustomerPolicies(id),
      ]);
      setCustomer(customerRes.data.customer);
      setPolicyCount(customerRes.data.summary.policyCount);
      setPolicies(policiesRes.data.policies);
      editForm.reset({
        name: customerRes.data.customer.name,
        email: customerRes.data.customer.email,
        mobile: customerRes.data.customer.mobile,
        nomineeName: customerRes.data.customer.nomineeName,
        nomineeRelation: customerRes.data.customer.nomineeRelation,
      });
    } catch (err) {
      setError((err as ApiError).message);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const onUpdate = async (data: EditForm) => {
    if (!id) return;
    setError('');
    setFieldErrors({});
    setLoading(true);
    try {
      // Customer details are returned with masked PII. Send only fields that
      // the agent has actually changed so a masked mobile number is never sent
      // back to the API as if it were a real phone number.
      const changedData = Object.entries(editForm.formState.dirtyFields).reduce(
        (updates, [field, changed]) => {
          if (changed) {
            updates[field as keyof EditForm] = data[field as keyof EditForm];
          }
          return updates;
        },
        {} as Partial<EditForm>
      );

      const { data: res } = await agentApi.updateCustomer(id, changedData);
      setCustomer(res.customer);
      setEditing(false);
      setMessage('Customer updated successfully');
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message);
      if (apiErr.errors) setFieldErrors(apiErr.errors);
    } finally {
      setLoading(false);
    }
  };

  const onIssuePolicy = async (data: PolicyForm) => {
    if (!id) return;
    setError('');
    setFieldErrors({});
    setLoading(true);
    try {
      await agentApi.issuePolicy({ ...data, customerId: id });
      setMessage('Policy issued successfully');
      setShowPolicyForm(false);
      policyForm.reset({ term: 20, premiumFrequency: 'Yearly' });
      fetchData();
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message);
      if (apiErr.errors) setFieldErrors(apiErr.errors);
    } finally {
      setLoading(false);
    }
  };

  if (!customer && !error) {
    return (
      <Layout title="Customer Details">
        <div className="flex justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Customer Details">
      <Link to="/agent" className="text-sm text-brand-600 hover:underline">
        &larr; Back to dashboard
      </Link>

      {message && (
        <p className="mt-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{message}</p>
      )}
      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      {customer && (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-slate-800">{customer.name}</h2>
            <div className="flex gap-2">
              <button onClick={() => setEditing(!editing)} className={buttonSecondary}>
                {editing ? 'Cancel Edit' : 'Edit Customer'}
              </button>
              <button onClick={() => setShowPolicyForm(!showPolicyForm)} className={buttonPrimary}>
                {showPolicyForm ? 'Cancel' : 'Issue Policy'}
              </button>
            </div>
          </div>

          {!editing ? (
            <div className="mt-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2">
              <div><span className="text-slate-500">Email:</span> {customer.email}</div>
              <div><span className="text-slate-500">Mobile:</span> {customer.mobile}</div>
              <div><span className="text-slate-500">Aadhaar:</span> {customer.aadhaar}</div>
              <div><span className="text-slate-500">PAN:</span> {customer.pan || 'N/A'}</div>
              <div>
                <span className="text-slate-500">DOB:</span>{' '}
                {new Date(customer.dateOfBirth).toLocaleDateString()}
              </div>
              <div>
                <span className="text-slate-500">Nominee:</span> {customer.nomineeName} (
                {customer.nomineeRelation})
              </div>
              <div><span className="text-slate-500">Policies:</span> {policyCount}</div>
            </div>
          ) : (
            <form
              onSubmit={editForm.handleSubmit(onUpdate)}
              className="mt-6 max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" error={fieldErrors.name}>
                  <input className={inputClass} {...editForm.register('name')} />
                </Field>
                <Field label="Email" error={fieldErrors.email}>
                  <input className={inputClass} {...editForm.register('email')} />
                </Field>
                <Field label="Mobile" error={fieldErrors.mobile}>
                  <input className={inputClass} {...editForm.register('mobile')} />
                </Field>
                <Field label="PAN" error={fieldErrors.pan}>
                  <input
                    className={inputClass}
                    maxLength={10}
                    placeholder="Enter full PAN only to add or change it"
                    {...editForm.register('pan')}
                  />
                </Field>
                <Field label="Nominee Name" error={fieldErrors.nomineeName}>
                  <input className={inputClass} {...editForm.register('nomineeName')} />
                </Field>
                <Field label="Nominee Relation" error={fieldErrors.nomineeRelation}>
                  <input className={inputClass} {...editForm.register('nomineeRelation')} />
                </Field>
              </div>
              <button type="submit" disabled={loading} className={`mt-4 ${buttonPrimary}`}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <p className="mt-3 text-xs text-slate-500">
                Your current mobile number and PAN are masked for privacy. Enter a full value only when you want to change it.
              </p>
            </form>
          )}

          {showPolicyForm && (
            <form
              onSubmit={policyForm.handleSubmit(onIssuePolicy)}
              className="mt-6 max-w-2xl rounded-xl border border-brand-200 bg-brand-50 p-6"
            >
              <h3 className="mb-4 text-lg font-semibold text-brand-700">Issue New Policy</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Term (years)" error={fieldErrors.term}>
                  <select className={inputClass} {...policyForm.register('term', { valueAsNumber: true })}>
                    {TERMS.map((t) => (
                      <option key={t} value={t}>{t} years</option>
                    ))}
                  </select>
                </Field>
                <Field label="Premium Amount (min ₹5,000)" error={fieldErrors.premiumAmount}>
                  <input
                    type="number"
                    min={5000}
                    className={inputClass}
                    {...policyForm.register('premiumAmount', { valueAsNumber: true, required: true })}
                  />
                </Field>
                <Field label="Premium Frequency" error={fieldErrors.premiumFrequency}>
                  <select className={inputClass} {...policyForm.register('premiumFrequency')}>
                    {FREQUENCIES.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Start Date" error={fieldErrors.startDate}>
                  <input type="date" className={inputClass} {...policyForm.register('startDate', { required: true })} />
                </Field>
              </div>
              <button type="submit" disabled={loading} className={`mt-4 ${buttonPrimary}`}>
                {loading ? 'Issuing...' : 'Issue Policy'}
              </button>
              {fieldErrors.pan && (
                <p className="mt-3 text-sm text-red-600">
                  Add the customer&apos;s PAN from Edit Customer before issuing a policy above ₹50,000.
                </p>
              )}
            </form>
          )}

          <div className="mt-8">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">Policies</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Policy Number</th>
                    <th className="px-4 py-3">Term</th>
                    <th className="px-4 py-3">Premium</th>
                    <th className="px-4 py-3">Frequency</th>
                    <th className="px-4 py-3">Start Date</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {policies.map((p) => (
                    <tr key={p._id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{p.policyNumber}</td>
                      <td className="px-4 py-3">{p.term} years</td>
                      <td className="px-4 py-3">₹{p.premiumAmount.toLocaleString()}</td>
                      <td className="px-4 py-3">{p.premiumFrequency}</td>
                      <td className="px-4 py-3">
                        {new Date(p.startDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {policies.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        No policies issued yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};
