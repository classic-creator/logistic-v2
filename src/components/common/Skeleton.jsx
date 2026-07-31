import React from 'react';

export const Skeleton = ({
  className = '',
  variant = 'text', // text, circle, rect
  width,
  height,
  ...props
}) => {
  const baseClasses = 'animate-pulse bg-slate-800/80 rounded';
  
  const variantClasses = {
    text: 'h-4 w-full rounded',
    circle: 'rounded-full',
    rect: 'rounded-lg',
  };

  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
      {...props}
    />
  );
};

export const CardSkeleton = () => (
  <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 space-y-4">
    <Skeleton variant="text" width="40%" height="16px" />
    <Skeleton variant="text" width="70%" height="28px" />
    <div className="flex gap-2 pt-2">
      <Skeleton variant="circle" width="16px" height="16px" />
      <Skeleton variant="text" width="30%" height="14px" />
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="w-full space-y-4">
    <div className="flex justify-between items-center gap-4">
      <Skeleton variant="rect" width="200px" height="36px" />
      <div className="flex gap-2">
        <Skeleton variant="rect" width="100px" height="36px" />
        <Skeleton variant="rect" width="100px" height="36px" />
      </div>
    </div>
    <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/40">
      <div className="border-b border-slate-850 px-4 py-3 bg-slate-900/80 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} variant="text" height="16px" className="flex-1" />
        ))}
      </div>
      <div className="divide-y divide-slate-850 px-4 py-1">
        {Array.from({ length: rows }).map((_, ri) => (
          <div key={ri} className="py-4 flex gap-4">
            {Array.from({ length: cols }).map((_, ci) => (
              <Skeleton key={ci} variant="text" height="14px" className="flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Skeleton;
