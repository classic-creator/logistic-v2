import React, { useMemo } from 'react';
import { useTripFuelBreakdown } from '../../services/fuelServices';
import { FuelVarianceBadge } from './FuelVarianceBadge';
import { FuelTimeline } from './FuelTimeline';
import { FuelEntryForm } from './FuelEntryForm';
import { formatCurrency, formatLiters, formatKmPerLiter } from './lib/fuelFormat';
import { Fuel, Calculator, ArrowRightLeft, Gauge, Brain, Sparkles, Award, MapPin } from 'lucide-react';

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
  const { data: breakdown } = useTripFuelBreakdown(trip.id);

  const data = useMemo(() => {
    const estLiters = breakdown?.estimate?.fuelLiters ?? Number(trip.estimatedFuelLiters || 0);
    const estCost = breakdown?.estimate?.fuelCost ?? Number(trip.estimatedFuelCost || 0);
    const estDistance = breakdown?.estimate?.distance ?? Number(trip.estimatedDistance || trip.distance || 0);
    const estMileage = breakdown?.estimate?.mileage ?? Number(trip.estimatedMileage || 0);

    const actLiters = breakdown?.actual?.fuelLiters ?? (trip.fuelEntries || []).filter(e => e.status === 'Approved').reduce((s, e) => s + Number(e.quantity || 0), 0);
    const actCost = breakdown?.actual?.fuelCost ?? (trip.fuelEntries || []).filter(e => e.status === 'Approved').reduce((s, e) => s + Number(e.total_cost || e.totalCost || 0), 0);
    const actDistance = breakdown?.actual?.distance ?? Number(trip.actualDistance || (trip.startOdometer && trip.endOdometer ? trip.endOdometer - trip.startOdometer : trip.distance || 0));
    const actMileage = breakdown?.actual?.mileage ?? (actLiters > 0 ? actDistance / actLiters : 0);

    const fuelVariancePct = breakdown?.variance?.fuelLitersPct ?? (estLiters > 0 ? ((actLiters - estLiters) / estLiters) * 100 : 0);
    const costVariancePct = breakdown?.variance?.fuelCostPct ?? (estCost > 0 ? ((actCost - estCost) / estCost) * 100 : 0);

    const intel = breakdown?.intelligence || {};

    return {
      estimatedLiters: estLiters,
      estimatedCost: estCost,
      estimatedDistance: estDistance,
      estimatedMileage: estMileage,
      actualLiters: actLiters,
      actualCost: actCost,
      actualDistance: actDistance,
      actualMileage: actMileage,
      fuelVariancePct,
      costVariancePct,
      intel,
      entries: breakdown?.entries || trip.fuelEntries || [],
    };
  }, [trip, breakdown]);

  const pctUsed = data.estimatedLiters > 0 ? Math.min(100, (data.actualLiters / data.estimatedLiters) * 100) : 0;
  const costPctUsed = data.estimatedCost > 0 ? Math.min(100, (data.actualCost / data.estimatedCost) * 100) : 0;

  const progressColor = pctUsed <= 105 ? 'bg-emerald-400' : pctUsed <= 115 ? 'bg-amber-400' : 'bg-rose-500';
  const costProgressColor = costPctUsed <= 105 ? 'bg-emerald-400' : costPctUsed <= 115 ? 'bg-amber-400' : 'bg-rose-500';

  return (
    <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-5">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-accent-indigo">
            <Brain size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2">
              Fuel Intelligence Engine
              <span className="bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1">
                <Sparkles size={10} /> AI Synced
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Live AI prediction, EWMA learned mileage, and budget sync.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FuelVarianceBadge actual={data.actualLiters} estimated={data.estimatedLiters} />
          {trip.status !== 'Cancelled' && (
            <FuelEntryForm trip={trip} />
          )}
        </div>
      </div>

      {/* AI Intelligence Micro Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block flex items-center gap-1">
            <Brain size={10} className="text-indigo-400" /> Learned Vehicle Spec
          </span>
          <div className="font-mono font-bold text-indigo-300 text-sm">
            {formatKmPerLiter(data.intel.learnedVehicleMileage || 8.0)}
          </div>
          <span className="text-[10px] text-slate-500 block">
            {Math.round((data.intel.vehicleConfidence || 0.75) * 100)}% Model Confidence
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block flex items-center gap-1">
            <Award size={10} className="text-emerald-400" /> Driver Efficiency Score
          </span>
          <div className="font-mono font-bold text-emerald-400 text-sm">
            {data.intel.driverEfficiencyScore || 80} / 100
          </div>
          <span className="text-[10px] text-slate-500 block">
            Trip Score: {data.intel.fuelScore || 75} pts
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block flex items-center gap-1">
            <MapPin size={10} className="text-sky-400" /> Route Benchmark
          </span>
          <div className="font-mono font-bold text-sky-400 text-sm">
            {formatKmPerLiter(data.intel.routeAvgMileage || 8.0)}
          </div>
          <span className="text-[10px] text-slate-500 block">
            Avg Cost: {formatCurrency(data.intel.routeAvgCost || data.estimatedCost)}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block flex items-center gap-1">
            <Calculator size={10} className="text-amber-400" /> Allocated Fuel Budget
          </span>
          <div className="font-mono font-bold text-amber-400 text-sm">
            {formatCurrency(data.intel.fuelBudget || (data.estimatedCost * 1.1))}
          </div>
          <span className="text-[10px] text-slate-500 block">
            Includes 10% Contingency Buffer
          </span>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-[11px] mb-1.5">
            <span className="text-slate-500 font-bold uppercase tracking-wider">Fuel Volume Consumed</span>
            <span className="font-mono font-bold text-slate-300">{formatLiters(data.actualLiters)} / {formatLiters(data.estimatedLiters)}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${progressColor}`} style={{ width: `${pctUsed}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[11px] mb-1.5">
            <span className="text-slate-500 font-bold uppercase tracking-wider">Cost Budget Consumed</span>
            <span className="font-mono font-bold text-slate-300">{formatCurrency(data.actualCost)} / {formatCurrency(data.estimatedCost)}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${costProgressColor}`} style={{ width: `${costPctUsed}%` }} />
          </div>
        </div>
      </div>

      {/* Variance Summary Chips */}
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Fuel Volume Variance</span>
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

      {/* Estimation vs Actual Comparison Table */}
      <div>
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
          <Calculator size={12} /> Estimation vs Actual Comparison
        </div>
        <CompareRow label="Distance" estimated={data.estimatedDistance} actual={data.actualDistance} unit=" km" goodWhen="high" />
        <CompareRow label="Fuel Volume" estimated={data.estimatedLiters} actual={data.actualLiters} unit=" L" goodWhen="low" />
        <CompareRow label="Fuel Cost" estimated={formatCurrency(data.estimatedCost)} actual={formatCurrency(data.actualCost)} unit="" goodWhen="low" />
        <CompareRow label="Efficiency Mileage" estimated={data.estimatedMileage} actual={data.actualMileage} unit=" km/L" goodWhen="high" />
      </div>

      {/* Efficiency Summary */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/15">
        <Gauge size={18} className="text-accent-indigo flex-shrink-0" />
        <div className="text-xs">
          <span className="text-slate-400 block">Realized Trip Mileage</span>
          <span className="font-bold text-slate-100 font-mono">
            {data.actualMileage > 0 ? formatKmPerLiter(data.actualMileage) : data.estimatedMileage ? formatKmPerLiter(data.estimatedMileage) : '—'}
            {data.actualMileage > 0 && data.estimatedMileage > 0 && (
              <span className="text-[10px] text-slate-500 ml-1">({formatKmPerLiter(data.estimatedMileage)} predicted)</span>
            )}
          </span>
        </div>
      </div>

      {/* Fuel Log Entries Timeline */}
      <div className="pt-1">
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
          <ArrowRightLeft size={12} /> Approved Fuel Receipts & Log Timeline
        </div>
        <FuelTimeline entries={data.entries} />
      </div>
    </div>
  );
};

export default TripFuelPanel;
