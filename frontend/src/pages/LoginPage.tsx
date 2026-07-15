import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Field, inputClass, buttonPrimary } from '../components/ui';
import type { ApiError } from '../types';

interface LoginForm {
  email: string;
  password: string;
}

interface LoginPageProps {
  role: 'admin' | 'agent';
}

export const LoginPage = ({ role }: LoginPageProps) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setError('');
    setLoading(true);
    try {
      await login(data.email, data.password, role);
      navigate(role === 'admin' ? '/admin' : '/agent');
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <Link to="/" className="text-sm text-brand-600 hover:underline">
          &larr; Back to home
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-800">
          {role === 'admin' ? 'Admin' : 'Agent'} Login
        </h1>
        <p className="mb-6 text-sm text-slate-500">Session expires in 15 minutes</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Email">
            <input
              type="email"
              className={inputClass}
              {...register('email', { required: true })}
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              className={inputClass}
              {...register('password', { required: true })}
            />
          </Field>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          <button type="submit" disabled={loading} className={`w-full ${buttonPrimary}`}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};
