import { useCallback, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Map,
  Truck,
  Users,
  Building2,
  IndianRupee,
  Wallet,
  PiggyBank,
  Warehouse,
  UserCheck,
  Route as RouteIcon,
  ArrowLeftRight,
  Calendar,
  Download,
  FileSpreadsheet,
  Printer,
  Activity,
  BarChart3,
  Database,
  Sparkles,
} from 'lucide-react';
import { ReportContext } from './ReportContext';
import { useBiData } from './hooks/useBiData';
import { TIME_RANGES, rangeLabel } from './lib/timeRanges';
import { exportToCSV, exportToExcel, printReport } from './lib/export';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const REPORT_GROUPS = [
  {
    label: 'Overview',
    color: 'text-indigo-300 border-indigo-500/30 bg-indigo-500/10',
    items: [{ path: '/reports', end: true, label: 'Executive', icon: LayoutDashboard }],
  },
  {
    label: 'Operations',
    color: 'text-sky-300 border-sky-500/30 bg-sky-500/10',
    items: [
      { path: '/reports/trips', label: 'Trips', icon: Map },
      { path: '/reports/routes', label: 'Routes', icon: RouteIcon },
      { path: '/reports/comparison', label: 'Compare', icon: ArrowLeftRight },
    ],
  },
  {
    label: 'Financial',
    color: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
    items: [
      { path: '/reports/revenue', label: 'Revenue', icon: IndianRupee },
      { path: '/reports/expenses', label: 'Expenses', icon: Wallet },
      { path: '/reports/profit', label: 'Profit', icon: PiggyBank },
    ],
  },
  {
    label: 'Resources',
    color: 'text-amber-300 border-amber-500/30 bg-amber-500/10',
    items: [
      { path: '/reports/vehicles', label: 'Vehicles', icon: Truck },
      { path: '/reports/drivers', label: 'Drivers', icon: Users },
      { path: '/reports/companies', label: 'Companies', icon: Building2 },
      { path: '/reports/fleet', label: 'Fleet', icon: Warehouse },
      { path: '/reports/driver-utilization', label: 'Driver Utilization', icon: UserCheck },
    ],
  },
];

const REPORT_TAB_COUNT = REPORT_GROUPS.reduce((total, group) => total + group.items.length, 0);

export const ReportsLayout = () => {
  // Default to the full-year window so every report section renders the real dataset
  const [rangeKey, setRangeKey] = useState('year');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  // Exporter is keyed by range so stale data is never exported after a period change.
  const [exporter, setExporter] = useState({ rangeKey: null, run: null });

  const bi = useBiData(rangeKey, customRange.start && customRange.end ? customRange : null);

  const registerExporter = useCallback(
    (fn) => {
      setExporter({ rangeKey, run: fn });
    },
    [rangeKey]
  );

  const handleRangeChange = (e) => setRangeKey(e.target.value);

  const runExport = (kind) => {
    if (!exporter.run || exporter.rangeKey !== rangeKey) return;
    const { filename, rows } = exporter.run();
    if (!rows || !rows.length) return;
    if (kind === 'csv') exportToCSV(filename, rows);
    if (kind === 'excel') exportToExcel(filename, rows);
  };

  const value = {
    ...bi,
    rangeKey,
    setRangeKey,
    customRange,
    setCustomRange,
    registerExporter,
  };

  return (
    <ReportContext.Provider value={value}>
      <div className="space-y-6 select-none">
        {/* Report command center */}
        <section className="relative overflow-hidden rounded-2xl border border-indigo-500/15 bg-gradient-to-br from-indigo-500/[0.11] via-slate-900/80 to-slate-950/90 p-5 md:p-6 shadow-2xl shadow-indigo-950/20 print:border-slate-300 print:bg-white">
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-300">
                <Sparkles size={12} />
                Analytics command center
              </div>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-50 md:text-4xl print:text-slate-900">
                Reports <span className="text-indigo-400">&amp;</span> BI
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400 print:text-slate-600">
                One operating view for trips, finance, fleet, drivers, customers and route performance.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-indigo-300">
                  <Calendar size={14} />
                </span>
                <select
                  aria-label="Reporting period"
                  value={rangeKey}
                  onChange={handleRangeChange}
                  className="h-10 min-w-36 appearance-none rounded-lg border border-slate-700 bg-slate-950/70 py-2 pl-9 pr-8 text-xs font-bold text-slate-200 outline-none transition-colors focus:border-indigo-400"
                >
                  {TIME_RANGES.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {rangeKey === 'custom' && (
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    aria-label="Start date"
                    value={customRange.start}
                    onChange={(e) => setCustomRange((p) => ({ ...p, start: e.target.value }))}
                    className="!w-36"
                  />
                  <span className="text-xs text-slate-500">to</span>
                  <Input
                    type="date"
                    aria-label="End date"
                    value={customRange.end}
                    onChange={(e) => setCustomRange((p) => ({ ...p, end: e.target.value }))}
                    className="!w-36"
                  />
                </div>
              )}

              <Button variant="outline" size="sm" onClick={() => runExport('csv')} disabled={!exporter.run || exporter.rangeKey !== rangeKey} className="h-10 gap-1.5">
                <Download size={14} /> CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => runExport('excel')} disabled={!exporter.run || exporter.rangeKey !== rangeKey} className="h-10 gap-1.5">
                <FileSpreadsheet size={14} /> Excel
              </Button>
              <Button variant="primary" size="sm" onClick={() => printReport()} className="h-10 gap-1.5">
                <Printer size={14} /> Print
              </Button>
            </div>
          </div>

          <div className="relative mt-6 grid grid-cols-1 gap-2 border-t border-white/10 pt-4 text-xs sm:grid-cols-3">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300"><Activity size={14} /></span>
              <span><b className="block text-[10px] uppercase tracking-wider text-slate-500">Reporting window</b>{rangeLabel(bi.range)}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-400/10 text-sky-300"><Database size={14} /></span>
              <span><b className="block text-[10px] uppercase tracking-wider text-slate-500">Data scope</b>{bi.allTrips.length} trips · {bi.allVehicles.length} vehicles</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-400/10 text-violet-300"><BarChart3 size={14} /></span>
              <span><b className="block text-[10px] uppercase tracking-wider text-slate-500">Available views</b>{REPORT_TAB_COUNT} connected reports</span>
            </div>
          </div>
        </section>

        {/* Grouped report navigation */}
        <nav
          className="relative rounded-2xl border border-slate-800/90 bg-slate-900/60 p-2 backdrop-blur-xl shadow-xl print:hidden overflow-x-auto custom-scrollbar"
          aria-label="Report sections"
        >
          <div className="flex items-center gap-3 min-w-max">
            {REPORT_GROUPS.map((group) => (
              <div
                key={group.label}
                className="flex items-center gap-1.5 rounded-xl border border-slate-800/80 bg-slate-950/40 p-1.5"
              >
                <div className={`px-2.5 py-1 rounded-lg border text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${group.color}`}>
                  <span>{group.label}</span>
                </div>
                <div className="flex items-center gap-1">
                  {group.items.map((tab) => (
                    <NavLink
                      key={tab.path}
                      to={tab.path}
                      end={tab.end}
                      className={({ isActive }) => `
                        relative inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-all duration-200 cursor-pointer
                        ${
                          isActive
                            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 ring-1 ring-indigo-400/40 scale-[1.02]'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                        }
                      `}
                    >
                      <tab.icon size={14} className="stroke-[2.2px]" />
                      <span>{tab.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Active report page */}
        <motion.div
          key={bi.rangeKey}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Outlet />
        </motion.div>
      </div>
    </ReportContext.Provider>
  );
};

export default ReportsLayout;
