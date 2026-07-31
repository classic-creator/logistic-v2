import React from 'react';

export const Select = React.forwardRef(({
  label,
  options = [],
  placeholder,
  error,
  className = '',
  id,
  required,
  ...props
}, ref) => {
  const selectId = id || `select-${Math.random().toString().slice(-4)}`;
  
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={selectId} className="text-xs font-semibold text-slate-400 tracking-wide">
          {label} {required && <span className="text-accent-rose">*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={`w-full bg-slate-900 border ${error ? 'border-accent-rose/50 focus:border-accent-rose focus:ring-accent-rose/20' : 'border-slate-800 focus:border-accent-indigo focus:ring-accent-indigo/20'} rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:ring-2 transition-all outline-none appearance-none`}
        style={{
          backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
          backgroundPosition: 'right 0.75rem center',
          backgroundSize: '1.25rem',
          backgroundRepeat: 'no-repeat',
          paddingRight: '2.5rem'
        }}
        {...props}
      >
        {placeholder && (
          <option value="" className="bg-slate-900 text-slate-500">
            {placeholder}
          </option>
        )}
        {options.map((opt) => {
          const val = typeof opt === 'object' ? opt.value : opt;
          const labelText = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={val} value={val} className="bg-slate-900 text-slate-200">
              {labelText}
            </option>
          );
        })}
      </select>
      {error && (
        <span className="text-xs text-accent-rose mt-0.5 font-medium">
          {error.message || error}
        </span>
      )}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;
