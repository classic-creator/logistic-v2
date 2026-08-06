import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFuelScores } from '../../services/intelligenceServices';
import { CardSkeleton } from '../../components/common/Skeleton';
import Button from '../../components/common/Button';
import { ArrowLeft, Award, Truck, Users, Map } from 'lucide-react';
import FuelScoreGauge from './components/FuelScoreGauge';
import { formatCurrency } from './lib/fuelFormat';

export const FuelScoreboard = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useFuelScores();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-800 rounded animate-pulse" />
        <CardSkeleton className="h-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      </div>
    );
  }

  const { fleet = 0, vehicles = [], drivers = [], routes = [] } = data || {};

  const ScoreBar = ({ score }) => {
    let color = 'bg-rose-500';
    if (score >= 70) color = 'bg-emerald-500';
    else if (score >= 40) color = 'bg-amber-500';
    
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full ${color}`} style={{ width: `${score}%` }} />
        </div>
        <span className="text-[10px] font-mono font-bold text-slate-300 w-6 text-right">{score}</span>
      </div>
    );
  };

  return (
    <div className="space-y-8 select-none">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/fuel')} className="!p-2 text-slate-400 hover:text-white">
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-slate-100 flex items-center gap-3">
            <Award size={28} className="text-accent-amber" />
            Fuel Scoreboard
          </h1>
          <p className="text-sm text-slate-400">Health scores across fleet entities.</p>
        </div>
      </div>

      <div className="glass-panel rounded-xl p-8 border border-slate-800 flex flex-col items-center justify-center py-12">
        <h2 className="text-lg font-bold text-slate-300 mb-6 tracking-widest uppercase">Overall Fleet Score</h2>
        <FuelScoreGauge score={fleet} size="lg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel rounded-xl p-5 border border-slate-800">
          <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2 border-b border-slate-800 pb-3 mb-3">
            <Truck size={16} className="text-accent-sky" /> Vehicles
          </h3>
          <div className="space-y-4">
            {vehicles.map((v, i) => (
              <div key={v.id || i} className="text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-200">{v.number}</span>
                  <span className="text-[10px] text-slate-500">{v.avgMileage} km/L • {v.totalTrips} trips</span>
                </div>
                <ScoreBar score={v.score} />
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-xl p-5 border border-slate-800">
          <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2 border-b border-slate-800 pb-3 mb-3">
            <Users size={16} className="text-accent-emerald" /> Drivers
          </h3>
          <div className="space-y-4">
            {drivers.map((d, i) => (
              <div key={d.id || i} className="text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-200">{d.name}</span>
                  <span className="text-[10px] text-slate-500">{d.avgMileage} km/L • {d.totalTrips} trips</span>
                </div>
                <ScoreBar score={d.score} />
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-xl p-5 border border-slate-800">
          <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2 border-b border-slate-800 pb-3 mb-3">
            <Map size={16} className="text-accent-violet" /> Routes
          </h3>
          <div className="space-y-4">
            {routes.map((r, i) => (
              <div key={r.routeKey || i} className="text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-200 truncate w-32">{r.pickup} → {r.destination}</span>
                  <span className="text-[10px] text-slate-500">{formatCurrency(r.avgProfit, true)}/trip</span>
                </div>
                <ScoreBar score={r.score} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FuelScoreboard;
