import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  usePredictionHistory,
  useRecommendations,
  usePredictOnDemand,
  useIntelligenceService,
} from '../../services/intelligenceServices';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import { CardSkeleton } from '../../components/common/Skeleton';
import Button from '../../components/common/Button';
import {
  ArrowLeft, Target, Lightbulb, Zap, Brain, RefreshCw,
  TrendingUp, AlertTriangle, CheckCircle, Activity,
} from 'lucide-react';
import PredictionCard from './components/PredictionCard';
import RecommendationCard from './components/RecommendationCard';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { formatCurrency, formatLiters } from './lib/fuelFormat';

// ---- Hooks ----------------------------------------------------------------
const useMLStatus = () =>
  useQuery({
    queryKey: ['ml-status'],
    queryFn: async () => {
      const r = await api.get('/api/v1/fuel/intelligence/ml-status');
      return r.data?.data ?? r.data;
    },
    retry: false,          // don't spam if ML service is down
    staleTime: 30_000,
  });

const useMLRetrain = () =>
  useMutation({
    mutationFn: () => api.post('/api/v1/fuel/intelligence/ml-retrain'),
  });

// ---- Feature importance colours -------------------------------------------
const FEATURE_COLORS = [
  '#6366f1', '#8b5cf6', '#06b6d4', '#10b981',
  '#f59e0b', '#ef4444', '#ec4899', '#84cc16',
];

const FEATURE_LABELS = {
  distance_km:         'Distance (km)',
  cargo_load_ratio:    'Cargo Load',
  driver_score:        'Driver Score',
  vehicle_age_km:      'Vehicle Age',
  vehicle_type_encoded:'Vehicle Type',
  route_terrain:       'Terrain',
  traffic_index:       'Traffic',
  temp_celsius:        'Temperature',
};

// ---- ML Model Status Card -------------------------------------------------
function MLModelCard({ status, onRetrain, isRetraining }) {
  const isOnline = status?.mlAvailable !== false && !!status?.r2;

  return (
    <div className="glass-panel rounded-xl p-5 border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2">
          <Brain size={16} className="text-accent-violet" />
          ML Engine Status
        </h3>
        <div className="flex items-center gap-2">
          {isOnline
            ? <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold"><CheckCircle size={12} /> Online</span>
            : <span className="flex items-center gap-1 text-xs text-amber-400 font-semibold"><AlertTriangle size={12} /> EWMA Fallback</span>
          }
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-900/60 rounded-lg p-3 text-center">
          <div className="text-xl font-extrabold text-indigo-400 font-display">
            {isOnline ? `${((status?.r2 ?? 0) * 100).toFixed(1)}%` : '—'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">R² Score</div>
        </div>
        <div className="bg-slate-900/60 rounded-lg p-3 text-center">
          <div className="text-xl font-extrabold text-violet-400 font-display">
            {isOnline ? `±${status?.maeLiters?.toFixed(1) ?? '—'}L` : '—'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Avg Error (MAE)</div>
        </div>
        <div className="bg-slate-900/60 rounded-lg p-3 text-center">
          <div className="text-xl font-extrabold text-cyan-400 font-display">
            {isOnline ? (status?.nSamples ?? status?.nTrainingSamples ?? '—') : '—'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Training Trips</div>
        </div>
        <div className="bg-slate-900/60 rounded-lg p-3 text-center">
          <div className="text-xs font-bold text-slate-300 font-display truncate">
            {isOnline
              ? (status?.modelSource === 'synthetic' ? 'Bootstrap' : 'Real Data')
              : 'EWMA ML'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Data Source</div>
        </div>
      </div>

      {/* Trained at */}
      {status?.trainedAt && (
        <p className="text-[10px] text-slate-600 mb-3">
          Last trained: {new Date(status.trainedAt).toLocaleString('en-IN')}
        </p>
      )}

      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs"
        onClick={onRetrain}
        isLoading={isRetraining}
        disabled={isRetraining}
      >
        <RefreshCw size={12} className="mr-1.5" />
        Retrain Model on Latest Trips
      </Button>

      {!isOnline && (
        <p className="mt-2 text-[10px] text-amber-400/80">
          Start the Python ML service on port 8001 to enable gradient-boosted predictions.
        </p>
      )}
    </div>
  );
}

// ---- Feature Importance Chart ---------------------------------------------
function FeatureImportanceChart({ importances }) {
  if (!importances || Object.keys(importances).length === 0) return null;

  const data = Object.entries(importances)
    .sort(([, a], [, b]) => b - a)
    .map(([key, val], i) => ({
      name: FEATURE_LABELS[key] ?? key,
      value: Number(val.toFixed(1)),
      color: FEATURE_COLORS[i % FEATURE_COLORS.length],
    }));

  return (
    <div className="glass-panel rounded-xl p-5 border border-slate-800">
      <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2 mb-4">
        <Activity size={16} className="text-accent-cyan" />
        Feature Importance
        <span className="text-[10px] text-slate-500 font-normal ml-auto">Which factors drive fuel use most</span>
      </h3>
      <div className="h-[190px] w-full text-xs">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 80, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
            <XAxis type="number" stroke="#64748b" tickLine={false} tickFormatter={v => `${v}%`} />
            <YAxis type="category" dataKey="name" stroke="#64748b" tickLine={false} width={76} tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f1f5f9', fontSize: 11 }}
              formatter={v => [`${v}%`, 'Importance']}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ---- Confidence Interval Banner -------------------------------------------
function CIBanner({ result }) {
  if (!result?.ciLowerLiters && !result?.ci_lower_liters) return null;

  const lower = result.ciLowerLiters ?? result.ci_lower_liters ?? 0;
  const upper = result.ciUpperLiters ?? result.ci_upper_liters ?? 0;
  const point = result.predictedFuelLiters ?? result.predicted_fuel_liters ?? 0;

  return (
    <div className="rounded-lg bg-indigo-950/50 border border-indigo-800/50 p-3 text-xs">
      <div className="text-indigo-300 font-semibold mb-1">90% Confidence Interval</div>
      <div className="flex items-center gap-2">
        <span className="text-slate-400">{formatLiters(lower)}</span>
        <div className="flex-1 h-1.5 bg-slate-800 rounded-full relative">
          <div className="absolute inset-y-0 bg-indigo-600/60 rounded-full"
            style={{
              left: `${((lower / (upper || 1)) * 100)}%`,
              right: `${100 - ((upper / (upper || 1)) * 100)}%`,
            }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-indigo-400 rounded-full border-2 border-slate-900"
            style={{ left: `${(point / (upper || 1)) * 100}%` }}
          />
        </div>
        <span className="text-slate-400">{formatLiters(upper)}</span>
      </div>
      <div className="text-center text-indigo-400 font-bold mt-1">Point: {formatLiters(point)}</div>
    </div>
  );
}

// ---- Main Component -------------------------------------------------------
export const FuelPredictionCenter = () => {
  const navigate = useNavigate();
  const { data: history, isLoading: historyLoading } = usePredictionHistory();
  const { data: recommendations, isLoading: recLoading } = useRecommendations();
  const { data: mlStatus, refetch: refetchML } = useMLStatus();
  const predictMutation = usePredictOnDemand();
  const retrainMutation = useMLRetrain();

  const [formData, setFormData] = useState({
    vehicle: '', driver: '', pickup: '', destination: '', weight: '',
  });
  const [predictionResult, setPredictionResult] = useState(null);

  const handlePredict = async (e) => {
    e.preventDefault();
    try {
      const res = await predictMutation.mutateAsync(formData);
      setPredictionResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRetrain = async () => {
    try {
      await retrainMutation.mutateAsync();
      refetchML();
    } catch (err) {
      console.error(err);
    }
  };

  const isLoading = historyLoading || recLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-800 rounded animate-pulse" />
        <CardSkeleton className="h-64" />
      </div>
    );
  }

  const importances = mlStatus?.featureImportances ?? mlStatus?.feature_importances ?? {};

  return (
    <div className="space-y-8 select-none">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/fuel')} className="!p-2 text-slate-400 hover:text-white">
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-slate-100 flex items-center gap-3">
            <Target size={28} className="text-accent-indigo" />
            ML Prediction Center
          </h1>
          <p className="text-sm text-slate-400">
            Gradient Boosted ML fuel estimation with confidence intervals &amp; feature attribution.
          </p>
        </div>
      </div>

      {/* Top row: form | ML model card | feature importance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prediction form */}
        <div className="glass-panel rounded-xl p-5 border border-slate-800 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2">
            <Zap size={16} className="text-accent-amber" /> Run Prediction
          </h3>
          <form onSubmit={handlePredict} className="flex flex-col gap-3 text-xs">
            {[
              { key: 'vehicle', label: 'Vehicle ID' },
              { key: 'driver',  label: 'Driver ID' },
              { key: 'pickup',  label: 'Pickup Location' },
              { key: 'destination', label: 'Destination' },
            ].map(({ key, label }) => (
              <input
                key={key}
                placeholder={label}
                className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-600 transition-colors"
                onChange={e => setFormData({ ...formData, [key]: e.target.value })}
              />
            ))}
            <input
              placeholder="Cargo Weight (Tons)"
              type="number"
              className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-600 transition-colors"
              onChange={e => setFormData({ ...formData, weight: e.target.value })}
            />
            <Button type="submit" variant="primary" className="mt-2" isLoading={predictMutation.isPending}>
              Generate ML Prediction
            </Button>
          </form>

          {predictionResult && (
            <div className="mt-2 space-y-3">
              <PredictionCard prediction={predictionResult} />
              <CIBanner result={predictionResult} />
            </div>
          )}
        </div>

        {/* ML Model card */}
        <MLModelCard
          status={mlStatus}
          onRetrain={handleRetrain}
          isRetraining={retrainMutation.isPending}
        />

        {/* Feature Importance */}
        <FeatureImportanceChart importances={importances} />
      </div>

      {/* Bottom row: accuracy chart | recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prediction Accuracy Trend */}
        <div className="glass-panel rounded-xl p-5 border border-slate-800">
          <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-accent-indigo" /> Prediction Accuracy Trend
          </h3>
          <div className="h-[200px] w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={
                  (Array.isArray(history?.data) ? history.data : Array.isArray(history) ? history : []).map((h, i) => ({
                    date: h.createdAt
                      ? new Date(h.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
                      : `Pred #${h.id || i + 1}`,
                    accuracy: Number(h.accuracyScore || 0),
                  }))
                }
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" tickLine={false} />
                <YAxis stroke="#64748b" tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f1f5f9' }} />
                <Line type="monotone" dataKey="accuracy" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} name="Accuracy %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="glass-panel rounded-xl p-5 border border-slate-800">
          <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2 mb-4">
            <Lightbulb size={16} className="text-accent-emerald" /> AI Recommendations
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(Array.isArray(recommendations) ? recommendations : Array.isArray(recommendations?.data) ? recommendations.data : []).map((rec, i) => (
              <RecommendationCard key={i} recommendation={rec} />
            ))}
            {(!recommendations || (Array.isArray(recommendations) ? recommendations : recommendations?.data || []).length === 0) && (
              <p className="text-xs text-slate-500">No active recommendations.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FuelPredictionCenter;
