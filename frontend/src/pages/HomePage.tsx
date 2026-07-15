import { Link } from 'react-router-dom';

export const HomePage = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100 px-4">
    <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-lg">
      <h1 className="mb-2 text-center text-3xl font-bold text-brand-700">PolicyFlow</h1>
      <p className="mb-8 text-center text-slate-600">
        Insurance Policy Management System
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/admin/login"
          className="rounded-xl border-2 border-brand-200 bg-brand-50 p-6 text-center transition hover:border-brand-500 hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-brand-700">Admin Login</h2>
          <p className="mt-2 text-sm text-slate-600">Manage agents and monitor system</p>
        </Link>
        <Link
          to="/agent/login"
          className="rounded-xl border-2 border-slate-200 bg-slate-50 p-6 text-center transition hover:border-brand-500 hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-slate-800">Agent Login</h2>
          <p className="mt-2 text-sm text-slate-600">Customer onboarding and policy issuance</p>
        </Link>
      </div>
    </div>
  </div>
);
