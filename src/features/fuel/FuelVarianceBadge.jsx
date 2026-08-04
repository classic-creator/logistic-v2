import { varianceStatus, varianceColors } from './lib/fuelFormat';

export const FuelVarianceBadge = ({ actual, estimated, className = '' }) => {
  const status = varianceStatus(actual, estimated);
  const c = varianceColors[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${c.bg} ${c.text} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
};

export default FuelVarianceBadge;
