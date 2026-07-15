import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { agentApi } from '../api';
import { Layout } from '../components/Layout';
import { Field, inputClass, buttonPrimary } from '../components/ui';
import type { ApiError } from '../types';

interface CustomerForm {
  name: string;
  email: string;
  mobile: string;
  aadhaar: string;
  pan?: string;
  dateOfBirth: string;
  nomineeName: string;
  nomineeRelation: string;
}

export const CustomerFormPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm<CustomerForm>();

  const onSubmit = async (data: CustomerForm) => {
    setError('');
    setFieldErrors({});
    setLoading(true);
    try {
      const { data: res } = await agentApi.createCustomer(data);
      navigate(`/agent/customers/${res.customer._id}`);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message);
      if (apiErr.errors) setFieldErrors(apiErr.errors);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Create Customer">
      <Link to="/agent" className="text-sm text-brand-600 hover:underline">
        &larr; Back to dashboard
      </Link>
      <h2 className="mt-4 mb-6 text-2xl font-bold text-slate-800">New Customer</h2>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full Name" error={fieldErrors.name}>
            <input className={inputClass} {...register('name', { required: true })} />
          </Field>
          <Field label="Email" error={fieldErrors.email}>
            <input type="email" className={inputClass} {...register('email', { required: true })} />
          </Field>
          <Field label="Mobile (10 digits)" error={fieldErrors.mobile}>
            <input className={inputClass} maxLength={10} {...register('mobile', { required: true })} />
          </Field>
          <Field label="Aadhaar (12 digits)" error={fieldErrors.aadhaar}>
            <input className={inputClass} maxLength={12} {...register('aadhaar', { required: true })} />
          </Field>
          <Field label="PAN (optional unless premium > ₹50,000)" error={fieldErrors.pan}>
            <input className={inputClass} maxLength={10} {...register('pan')} />
          </Field>
          <Field label="Date of Birth" error={fieldErrors.dateOfBirth}>
            <input type="date" className={inputClass} {...register('dateOfBirth', { required: true })} />
          </Field>
          <Field label="Nominee Name" error={fieldErrors.nomineeName}>
            <input className={inputClass} {...register('nomineeName', { required: true })} />
          </Field>
          <Field label="Nominee Relation" error={fieldErrors.nomineeRelation}>
            <input className={inputClass} {...register('nomineeRelation', { required: true })} />
          </Field>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <button type="submit" disabled={loading} className={`mt-6 ${buttonPrimary}`}>
          {loading ? 'Creating...' : 'Create Customer'}
        </button>
      </form>
    </Layout>
  );
};
