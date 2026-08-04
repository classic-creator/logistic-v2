import { useMemo, useState } from 'react';
import { FuelVarianceBadge } from './FuelVarianceBadge';
import { FuelTimeline } from './FuelTimeline';
import { FuelEntryForm } from './FuelEntryForm';
import { formatCurrency, formatLiters, formatKmPerLiter } from './lib/fuelFormat';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { Fuel, Calculator, ArrowRightLeft, Gauge, PlusCircle } from 'lucide-react';

const CompareRow = ({ label, estimated, actual, unit = '', goodWhen }) => {
  const diff = actual - estimated;
  const isBetter = goodWhen === 'low' ? diff <= 0 : diff >= 0;
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 text-xs py-2.5 border-b border-slate-800/50 last:border-0">
      <span className="text-slate-400 font-semibold">{label}</span>
      <div className="text-right">
        <span className="text-slate-500 text-[10px] uppercase tracking-wider block">Est.</span>
        <span className="font-mono font-bold text-indigo-300">{estimated}{unit}</span>
      </div>
      <div className="text-right">
        <span className="text-slate-500 text-[10px] uppercase tracking-wider block">Act.</span>
        <span className={`font-mono font-bold ${isBetter ? 'text-accent-emerald' : 'text-accent-rose'}`}>{actual}{unit}</span>
      </div>
      <div className="text-right min-w-[64px]">
        <span className="text-slate-500 text-[10px] uppercase tracking-wider block">Δ</span>
        <span className={`font-mono font-bold ${diff === 0 ? 'text-slate-400' : diff > 0 ? 'text-accent-rose' : 'text-accent-emerald'}`}>
          {diff > 0 ? '+' : ''}{diff.toFixed(1)}{unit}
        </span>
      </div>
    </div>
  );
};

export const TripFuelPanel = ({ trip }) => {
  const [showEntry, setShowEntry] = useState(false);

  const data = useMemo(() => {
    const estimatedLiters = Number(trip.estimatedFuelLiters || 0);
    const estimatedCost = Number(trip.estimatedFuelCost || 0);
    const estimatedDistance = Number(trip.estimatedDistance || trip.distance || 0);
    const estimatedMileage = Number(trip.estimatedMileage || 0);

    const entries = (trip.fuelEntries || []).filter((e) => e.status === 'Approved');
    const actualLiters = entries.reduce((s, e) => s + Number(e.quantity || 0), 0);
    const actualCost = entries.reduce((s, e) => s + Number(e.total_cost || e.totalCost || 0), 0);
    const actualDistance = Number(trip.actualDistance || (trip.startOdometer && trip.endOdometer ? trip.endOdometer - trip.startOdometer : trip.distance || 0));
    const actualMileage = actualLiters > 0 ? actualDistance / actualLiters : 0;

    const fuelVariancePct = estimatedLiters > 0 ? ((actualLiters - estimatedLiters) / estimatedLiters) * 100 : 0;
    const costVariancePct = estimatedCost > 0 ? ((actualCost - estimatedCost) / estimatedCost) * 100 : 0;

    return {
      estimatedLiters,
      estimatedCost,
      estimatedDistance,
      estimatedMileage,
      actualLiters,
      actualCost,
      actualDistance,
      actualMileage,
      fuelVariancePct,
      costVariancePct,
      entries,
    };
  }, [trip]);

  const pctUsed = data.estimatedLiters > 0 ? Math.min(100, (data.actualLiters / data.estimatedLiters) * 100) : 0;
  const costPctUsed = data.estimatedCost > 0 ? Math.min(100, (data.actualCost / data.estimatedCost) * 100) : 0;

  const progressColor = pctUsed <= 105 ? 'bg-emerald-400' : pctUsed <= 115 ? 'bg-amber-400' : 'bg-rose-500';
  const costProgressColor = costPctUsed <= 105 ? 'bg-emerald-400' : costPctUsed <= 115 ? 'bg-amber-400' : 'bg-rose-500';

  return (
    <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2">
          <Fuel size={16} className="text-accent-amber" />
          Fuel Intelligence
        </h3>
        <div className="flex items-center gap-2">
          <FuelVarianceBadge actual={data.actualLiters} estimated={data.estimatedLiters} />
          {trip.status !== 'Cancelled' && (
            <Button variant="outline" size="sm" onClick={() => setShowEntry(true)} className="flex items-center gap-1">
              <PlusCircle size={13} />
              Add Fuel
            </Button>
          )}
        </div>
      </div>

      {/* Progress bars */}
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-[11px] mb-1.5">
            <span className="text-slate-500 font-bold uppercase tracking-wider">Fuel Budget Used</span>
            <span className="font-mono font-bold text-slate-300">{formatLiters(data.actualLiters)} / {formatLiters(data.estimatedLiters)}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${progressColor}`} style={{ width: `${pctUsed}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[11px] mb-1.5">
            <span className="text-slate-500 font-bold uppercase tracking-wider">Cost Budget Used</span>
            <span className="font-mono font-bold text-slate-300">{formatCurrency(data.actualCost)} / {formatCurrency(data.estimatedCost)}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${costProgressColor}`} style={{ width: `${costPctUsed}%` }} />
          </div>
        </div>
      </div>

      {/* Variance summary chips */}
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Fuel Variance</span>
          <span className={`text-lg font-extrabold font-mono ${Math.abs(data.fuelVariancePct) <= 5 ? 'text-accent-emerald' : data.fuelVariancePct <= 15 ? 'text-accent-amber' : 'text-accent-rose'}`}>
            {data.fuelVariancePct > 0 ? '+' : ''}{data.fuelVariancePct.toFixed(1)}%
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Cost Variance</span>
          <span className={`text-lg font-extrabold font-mono ${Math.abs(data.costVariancePct) <= 5 ? 'text-accent-emerald' : data.costVariancePct <= 15 ? 'text-accent-amber' : 'text-accent-rose'}`}>
            {data.costVariancePct > 0 ? '+' : ''}{data.costVariancePct.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Estimation vs Actual comparison */}
      <div>
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
          <Calculator size={12} /> Estimation vs Actual
        </div>
        <CompareRow label="Distance" estimated={data.estimatedDistance} actual={data.actualDistance} unit=" km" goodWhen="high" />
        <CompareRow label="Fuel" estimated={data.estimatedLiters} actual={data.actualLiters} unit=" L" goodWhen="low" />
        <CompareRow label="Fuel Cost" estimated={data.estimatedCost} actual={data.actualCost} unit=" ₹" goodWhen="low" />
        <CompareRow label="Mileage" estimated={data.estimatedMileage} actual={data.actualMileage} unit=" km/L" goodWhen="high" />
      </div>

      {/* Efficiency summary */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/15">
        <Gauge size={18} className="text-accent-indigo flex-shrink-0" />
        <div className="text-xs">
          <span className="text-slate-400 block">Expected Trip Fuel Efficiency</span>
          <span className="font-bold text-slate-100 font-mono">
            {data.actualMileage > 0 ? formatKmPerLiter(data.actualMileage) : data.estimatedMileage ? formatKmPerLiter(data.estimatedMileage) : '—'}
            {data.actualMileage > 0 && data.estimatedMileage > 0 && (
              <span className="text-[10px] text-slate-500 ml-1">({formatKmPerLiter(data.estimatedMileage)} est.)</span>
            )}
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div className="pt-1">
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
          <ArrowRightLeft size={12} /> Fuel Timeline
        </div>
        <FuelTimeline entries={trip.fuelEntries || []} />
      </div>

      {/* Add fuel modal */}
      <Modal isOpen={showEntry} onClose={() => setShowEntry(false)} title={`Add Fuel - Trip #${trip.id}`}>
        <FuelEntryForm trip={trip} onSaved={() => setShowEntry(false)} />
      </Modal>
    </div>
  );
};

export default TripFuelPanel;
