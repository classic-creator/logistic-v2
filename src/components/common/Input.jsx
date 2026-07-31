import React from 'react';

export const Input = React.forwardRef(({
  label,
  type = 'text',
  error,
  icon: Icon,
  className = '',
  id,
  required,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString().slice(-4)}`;
  
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-slate-400 tracking-wide">
          {label} {required && <span className="text-accent-rose">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-slate-500 pointer-events-none">
            <Icon size={16} />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          id={inputId}
          className={`w-full bg-slate-900 border ${error ? 'border-accent-rose/50 focus:border-accent-rose focus:ring-accent-rose/20' : 'border-slate-800 focus:border-accent-indigo focus:ring-accent-indigo/20'} rounded-lg py-2 ${Icon ? 'pl-10' : 'px-3'} pr-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all outline-none`}
          {...props}
        />
      </div>
      {error && (
        <span className="text-xs text-accent-rose mt-0.5 font-medium">
          {error.message || error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
