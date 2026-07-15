interface FieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

export const Field = ({ label, error, children }: FieldProps) => (
  <div>
    <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
    {children}
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

export const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100';

export const buttonPrimary =
  'rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50';

export const buttonSecondary =
  'rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50';
