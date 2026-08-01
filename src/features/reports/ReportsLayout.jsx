import React, { useCallback, useState } from 'react';
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
} from 'lucide-react';
import { ReportContext } from './ReportContext';
import { useBiData } from './hooks/useBiData';
import { TIME_RANGES, rangeLabel } from './lib/timeRanges';
import { exportToCSV, exportToExcel, printReport } from './lib/export';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const REPORT_TABS = [
  { path: '/reports', end: true, label: 'Executive', icon: LayoutDashboard },
  { path: '/reports/trips', label: 'Trips', icon: Map },
  { path: '/reports/vehicles', label: 'Vehicles', icon: Truck },
  { path: '/reports/drivers', label: 'Drivers', icon: Users },
  { path: '/reports/companies', label: 'Companies', icon: Building2 },
  { path: '/reports/revenue', label: 'Revenue', icon: IndianRupee },
  { path: '/reports/expenses', label: 'Expenses', icon: Wallet },
  { path: '/reports/profit', label: 'Profit', icon: PiggyBank },
  { path: '/reports/fleet', label: 'Fleet Utilization', icon: Warehouse },
  { path: '/reports/driver-utilization', label: 'Driver Utilization', icon: UserCheck },
  { path: '/reports/routes', label: 'Routes', icon: RouteIcon },
  { path: '/reports/comparison', label: 'Time Comparison', icon: ArrowLeftRight },
];

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
        {/* Header + Period controls */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold font-display tracking-tight text-slate-100">
              Reports & Business Intelligence
            </h1>
            <p className="text-sm text-slate-400">
              Enterprise analytics across trips, finance, fleet, drivers, customers and routes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Period selector */}
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500">
                <Calendar size={14} />
              </span>
              <select
                value={rangeKey}
                onChange={handleRangeChange}
                className="bg-slate-900 border border-slate-800 focus:border-accent-indigo rounded-lg py-2 pl-8 pr-3 text-xs text-slate-200 focus:outline-none cursor-pointer font-semibold outline-none"
              >
                {TIME_RANGES.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom date range inputs */}
            {rangeKey === 'custom' && (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={customRange.start}
                  onChange={(e) => setCustomRange((p) => ({ ...p, start: e.target.value }))}
                  className="!w-36"
                />
                <span className="text-slate-600 text-xs">to</span>
                <Input
                  type="date"
                  value={customRange.end}
                  onChange={(e) => setCustomRange((p) => ({ ...p, end: e.target.value }))}
                  className="!w-36"
                />
              </div>
            )}

            {/* Export controls */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => runExport('csv')}
              disabled={!exporter.run || exporter.rangeKey !== rangeKey}
              className="flex items-center gap-1 text-xs"
            >
              <Download size={14} />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => runExport('excel')}
              disabled={!exporter.run || exporter.rangeKey !== rangeKey}
              className="flex items-center gap-1 text-xs"
            >
              <FileSpreadsheet size={14} />
              Excel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => printReport()}
              className="flex items-center gap-1 text-xs"
            >
              <Printer size={14} />
              PDF / Print
            </Button>
          </div>
        </div>

        {/* Active period summary */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-indigo animate-pulse" />
          Reporting Window: {rangeLabel(bi.range)}
        </div>

        {/* Sub-navigation tabs */}
        <nav className="flex gap-1.5 border-b border-slate-800 pb-px overflow-x-auto print:hidden">
          {REPORT_TABS.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.end}
              className={({ isActive }) => `
                px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer
                ${isActive
                  ? 'border-indigo-500 text-slate-100 bg-indigo-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'}
              `}
            >
              <tab.icon size={14} />
              {tab.label}
            </NavLink>
          ))}
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
