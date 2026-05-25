/**
 * Input — Styled input with label, error state, and icon support.
 */
import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  { label, error, icon: Icon, type = 'text', className = '', ...props },
  ref
) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Icon className="w-4 h-4 text-slate-500" />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={`
            w-full rounded-xl border bg-slate-900/60 backdrop-blur-sm
            text-slate-200 placeholder-slate-500
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-electric/40 focus:border-electric/50
            ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 text-sm
            ${error
              ? 'border-danger/50 focus:ring-danger/40 focus:border-danger/50'
              : 'border-slate-700/50 hover:border-slate-600'}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-danger flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-danger" />
          {error}
        </p>
      )}
    </div>
  );
});

export default Input;
