import React, { useState, useMemo } from 'react';
import { 
  useTrips, 
  useVehicles, 
  useDrivers, 
  useCompanies, 
  useFinances 
} from '../../services/services';
import StatCard from '../../components/common/StatCard';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Calendar, 
  Download, 
  Printer, 
  LayoutDashboard, 
  Map, 
  Truck, 
  Users, 
  Building2, 
  IndianRupee,
  ChevronRight,
  TrendingUp,
  Percent,
  ShieldAlert
} from 'lucide-react';

export const ReportsDashboard = () => {
  const [activeTab, setActiveTab] = useState('executive'); // executive, trips, vehicles, drivers, companies, finance
  const [timeRange, setTimeRange] = useState('This Month'); // Today, This Week, This Month, This Year, All Time

  const { data: trips, isLoading: tripsLoading } = useTrips();
  const { data: vehicles, isLoading: vehiclesLoading } = useVehicles();
  const { data: drivers, isLoading: driversLoading } = useDrivers();
  const { data: companies, isLoading: companiesLoading } = useCompanies();
  const { data: finances, isLoading: financesLoading } = useFinances();

  const isDataLoading = tripsLoading || vehiclesLoading || driversLoading || companiesLoading || financesLoading;

  // Filter data based on time range
  const filteredFinances = useMemo(() => {
    if (isDataLoading || !finances) return [];
    if (timeRange === 'All Time') return finances;

    const now = new Date('2026-07-31T17:00:00+05:30');
    return finances.filter(f => {
      if (!f.recordedAt) return false;
      const date = new Date(f.recordedAt);
      const diffDays = (now - date) / (1000 * 3600 * 24);

      if (timeRange === 'Today') return diffDays <= 1;
      if (timeRange === 'This Week') return diffDays <= 7;
      if (timeRange === 'This Month') return diffDays <= 30;
      if (timeRange === 'This Year') return diffDays <= 365;
      return true;
    });
  }, [finances, timeRange, isDataLoading]);

  const filteredTrips = useMemo(() => {
    if (isDataLoading || !trips) return [];
    if (timeRange === 'All Time') return trips;

    const now = new Date('2026-07-31T17:00:00+05:30');
    return trips.filter(t => {
      if (!t.pickupDate) return false;
      const date = new Date(t.pickupDate);
      const diffDays = (now - date) / (1000 * 3600 * 24);

      if (timeRange === 'Today') return diffDays <= 1;
      if (timeRange === 'This Week') return diffDays <= 7;
      if (timeRange === 'This Month') return diffDays <= 30;
      if (timeRange === 'This Year') return diffDays <= 365;
      return true;
    });
  }, [trips, timeRange, isDataLoading]);

  // Dynamic Executive KPIs calculation
  const reportStats = useMemo(() => {
    if (isDataLoading) return {};

    const completed = filteredTrips.filter(t => t.status === 'Completed').length;
    const delayed = filteredTrips.filter(t => t.isDelayed && t.status === 'Completed').length;
    const cancelled = filteredTrips.filter(t => t.status === 'Cancelled').length;
    
    const revenue = filteredFinances.reduce((sum, f) => sum + (f.tripAmount || 0), 0);
    const expenses = filteredFinances.reduce((sum, f) => sum + (f.totalExpenses || 0), 0);
    const profit = revenue - expenses;
    const margin = revenue ? ((profit / revenue) * 100).toFixed(1) : 0;

    const onTimeRate = completed ? Math.round(((completed - delayed) / completed) * 100) : 100;

    return {
      tripsCount: filteredTrips.length,
      completed,
      cancelled,
      revenue,
      expenses,
      profit,
      margin,
      onTimeRate
    };
  }, [filteredTrips, filteredFinances, isDataLoading]);

  // Aggregate daily trip volumes for line graph
  const dailyTripData = useMemo(() => {
    if (isDataLoading) return [];
    const counts = {};
    filteredTrips.slice(0, 30).forEach(t => {
      const dateKey = t.pickupDate;
      counts[dateKey] = (counts[dateKey] || 0) + 1;
    });

    return Object.entries(counts).map(([name, trips]) => ({
      name: name.slice(-5), // show MM-DD
      trips
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredTrips, isDataLoading]);

  // Dynamic Vehicle Rankings
  const vehiclePerformanceList = useMemo(() => {
    if (isDataLoading || !vehicles) return [];
    
    return vehicles.map(v => {
      const vTrips = trips.filter(t => t.vehicleId === v.id && t.status === 'Completed');
      const vFinances = finances.filter(f => vTrips.map(vt => vt.id).includes(f.tripId));
      
      const distance = vTrips.reduce((sum, t) => sum + (t.distance || 0), 0);
      const revenue = vFinances.reduce((sum, f) => sum + (f.tripAmount || 0), 0);
      const expenses = vFinances.reduce((sum, f) => sum + (f.totalExpenses || 0), 0);
      const profit = revenue - expenses;

      return {
        id: v.id,
        number: v.number,
        type: v.type,
        trips: vTrips.length,
        distance,
        revenue,
        profit,
        utilization: v.status === 'Running' ? 100 : (v.status === 'Available' ? 65 : 0)
      };
    }).sort((a, b) => b.profit - a.profit);
  }, [vehicles, trips, finances, isDataLoading]);

  // Dynamic Driver Rankings
  const driverPerformanceList = useMemo(() => {
    if (isDataLoading || !drivers) return [];

    return drivers.map(d => {
      const dTrips = trips.filter(t => t.driverId === d.id && t.status === 'Completed');
      const delayed = dTrips.filter(t => t.isDelayed).length;
      
      const distance = dTrips.reduce((sum, t) => sum + (t.distance || 0), 0);
      const onTimeRate = dTrips.length ? Math.round(((dTrips.length - delayed) / dTrips.length) * 100) : 100;

      return {
        id: d.id,
        name: d.name,
        trips: dTrips.length,
        distance,
        onTimeRate,
        rating: d.rating
      };
    }).sort((a, b) => b.onTimeRate - a.onTimeRate || b.trips - a.trips);
  }, [drivers, trips, isDataLoading]);

  // Dynamic Customer portfolio billing statistics
  const companyBusinessList = useMemo(() => {
    if (isDataLoading || !companies) return [];

    return companies.map(c => {
      const cTrips = trips.filter(t => t.companyId === c.id);
      const completed = cTrips.filter(t => t.status === 'Completed');
      const cFinances = finances.filter(f => cTrips.map(ct => ct.id).includes(f.tripId));

      const revenue = cFinances.reduce((sum, f) => sum + (f.tripAmount || 0), 0);
      const outstanding = cFinances.reduce((sum, f) => sum + (f.pendingAmount || 0), 0);

      return {
        id: c.id,
        name: c.name,
        orders: cTrips.length,
        trips: completed.length,
        revenue,
        outstanding
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [companies, trips, finances, isDataLoading]);

  // Simulated CSV Export
  const handleExportCSV = (tabName, dataList) => {
    if (dataList.length === 0) return;
    
    const headers = Object.keys(dataList[0]).join(',');
    const rows = dataList.map(row => 
      Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
    );
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${tabName}_bi_report_${timeRange.replace(' ', '_').toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const PIE_COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#0ea5e9'];

  if (isDataLoading) {
    return <div className="h-64 flex items-center justify-center text-slate-500">Loading Business Intelligence Suite...</div>;
  }

  return (
    <div className="space-y-8 select-none print:bg-white print:text-black">
      
      {/* Top title and Period Selector HUD */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5 print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-slate-100">
            BI Analytics Dashboard
          </h1>
          <p className="text-sm text-slate-400">
            Enterprise analytics, asset utilization registers, and financial intelligence charts.
          </p>
        </div>

        {/* Filters & Export Panel */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500">
              <Calendar size={14} />
            </span>
            <select
              value={timeRange}
              onChange={e => setTimeRange(e.target.value)}
              className="bg-slate-900 border border-slate-800 focus:border-accent-indigo rounded-lg py-1.5 pl-8 pr-3 text-xs text-slate-200 focus:outline-none cursor-pointer font-semibold"
            >
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
              <option>This Year</option>
              <option>All Time</option>
            </select>
          </div>
          
          <Button variant="outline" size="sm" onClick={handlePrint} className="flex items-center gap-1 text-xs">
            <Printer size={14} />
            <span>Print Report</span>
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => handleExportCSV(activeTab, activeTab === 'vehicles' ? vehiclePerformanceList : (activeTab === 'drivers' ? driverPerformanceList : (activeTab === 'companies' ? companyBusinessList : filteredFinances)))}
            className="flex items-center gap-1 text-xs"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Tab selectors navigation */}
      <div className="flex gap-1.5 border-b border-slate-800 pb-px overflow-x-auto print:hidden">
        <button
          onClick={() => setActiveTab('executive')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'executive' 
              ? 'border-indigo-500 text-slate-100 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard size={14} />
          <span>Executive Summary</span>
        </button>
        <button
          onClick={() => setActiveTab('trips')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'trips' 
              ? 'border-indigo-500 text-slate-100 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Map size={14} />
          <span>Trips & Routes</span>
        </button>
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'vehicles' 
              ? 'border-indigo-500 text-slate-100 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Truck size={14} />
          <span>Fleet Performance</span>
        </button>
        <button
          onClick={() => setActiveTab('drivers')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'drivers' 
              ? 'border-indigo-500 text-slate-100 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users size={14} />
          <span>Driver Leaderboard</span>
        </button>
        <button
          onClick={() => setActiveTab('companies')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'companies' 
              ? 'border-indigo-500 text-slate-100 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 size={14} />
          <span>Corporate Clients</span>
        </button>
      </div>

      {/* Dynamic Sub-modules Render block */}
      
      {/* 1. EXECUTIVE SUMMARY TAB */}
      {activeTab === 'executive' && (
        <div className="space-y-8">
          {/* KPI Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Dispatched Volume"
              value={reportStats.tripsCount}
              subtitle={`Total trips booked in ${timeRange}`}
              icon={Map}
              color="indigo"
            />
            <StatCard
              title="Operational Profit"
              value={`₹${reportStats.profit.toLocaleString('en-IN')}`}
              change={`${reportStats.margin}%`}
              changeType="positive"
              subtitle="Net operational margin"
              icon={IndianRupee}
              color="emerald"
            />
            <StatCard
              title="On-Time Delivery Rate"
              value={`${reportStats.onTimeRate}%`}
              subtitle="Compliance delivery threshold"
              icon={Users}
              color="sky"
            />
            <StatCard
              title="Cancelled Logs"
              value={reportStats.cancelled}
              subtitle="Dispatches revoked"
              icon={ShieldAlert}
              color="rose"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trip volumes history */}
            <div className="lg:col-span-2 glass-panel rounded-xl p-5 border border-slate-800 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 font-display">Dispatch Volume Trend</h3>
                  <p className="text-xs text-slate-500 font-medium">Daily completed runs inside the selected interval</p>
                </div>
              </div>

              <div className="h-[240px] w-full text-xs">
                {dailyTripData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyTripData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" tickLine={false} />
                      <YAxis stroke="#64748b" tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                      <Line type="monotone" dataKey="trips" stroke="#818cf8" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500">No date markers registered.</div>
                )}
              </div>
            </div>

            {/* Operating Expense breakdown donut chart */}
            <div className="glass-panel rounded-xl p-5 border border-slate-800 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 font-display">Operating Cost Shares</h3>
                <p className="text-xs text-slate-500">Expense breakdown across dispatches</p>
              </div>

              <div className="h-[180px] w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Diesel', value: filteredFinances.reduce((sum, f) => sum + f.dieselExpense, 0) },
                        { name: 'Tolls', value: filteredFinances.reduce((sum, f) => sum + f.tollExpense, 0) },
                        { name: 'Crew Allowance', value: filteredFinances.reduce((sum, f) => sum + f.driverAllowance, 0) },
                        { name: 'Loading', value: filteredFinances.reduce((sum, f) => sum + (f.loadingCharge || 0), 0) },
                        { name: 'Unloading', value: filteredFinances.reduce((sum, f) => sum + (f.unloadingCharge || 0), 0) }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      dataKey="value"
                    >
                      {PIE_COLORS.map((color, idx) => <Cell key={idx} fill={color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-semibold uppercase">
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#6366f1]" /> Diesel</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#10b981]" /> Tolls</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#f43f5e]" /> Allowance</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#f59e0b]" /> Handling</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. TRIP ANALYTICS TAB */}
      {activeTab === 'trips' && (
        <div className="space-y-6">
          <div className="glass-panel border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-base font-bold text-slate-100 font-display">Route Completion Log</h3>
            <Table
              columns={[
                { header: 'Trip ID', accessor: 'id', render: r => <span className="font-bold text-indigo-400">{r.id}</span> },
                { header: 'Company', accessor: 'companyName' },
                { header: 'Vehicle', accessor: 'vehicleNumber' },
                { header: 'Driver', accessor: 'driverName' },
                { header: 'Route Map', accessor: 'pickupLocation', render: r => <span>{r.pickupLocation} $\rightarrow$ {r.destination}</span> },
                { header: 'Distance', accessor: 'distance', render: r => <span>{r.distance} km</span> },
                { header: 'Duty Remarks', accessor: 'remarks', className: 'max-w-[200px] truncate text-slate-500' }
              ]}
              data={filteredTrips}
              searchFields={['id', 'companyName', 'driverName', 'vehicleNumber']}
            />
          </div>
        </div>
      )}

      {/* 3. FLEET PERFORMANCE TAB */}
      {activeTab === 'vehicles' && (
        <div className="space-y-6">
          <div className="glass-panel border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-100 font-display">Vehicle Profitability & Run Log</h3>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Ranked by Profit</span>
            </div>
            
            <Table
              columns={[
                { header: 'Vehicle Number', accessor: 'number', render: r => <span className="font-bold text-slate-200">{r.number}</span> },
                { header: 'Model Type', accessor: 'type' },
                { header: 'Trips Completed', accessor: 'trips', render: r => <span className="font-mono">{r.trips}</span> },
                { header: 'Odometer (km)', accessor: 'distance', render: r => <span className="font-mono">{r.distance.toLocaleString()} km</span> },
                { header: 'Expenses', accessor: 'revenue', render: r => <span className="font-mono text-rose-400">₹{(r.revenue - r.profit).toLocaleString('en-IN')}</span> },
                { header: 'Generated profit', accessor: 'profit', render: r => <span className="font-mono text-emerald-400 font-bold">₹{r.profit.toLocaleString('en-IN')}</span> }
              ]}
              data={vehiclePerformanceList}
              searchFields={['number', 'type']}
            />
          </div>
        </div>
      )}

      {/* 4. DRIVER LEADERBOARD TAB */}
      {activeTab === 'drivers' && (
        <div className="space-y-6">
          <div className="glass-panel border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-100 font-display">Driver Duty Performance</h3>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Ranked by On-Time Score</span>
            </div>

            <Table
              columns={[
                { header: 'Driver Name', accessor: 'name', render: r => <span className="font-bold text-slate-200">{r.name}</span> },
                { header: 'Total Trips', accessor: 'trips', render: r => <span className="font-mono">{r.trips}</span> },
                { header: 'Distance covered', accessor: 'distance', render: r => <span className="font-mono">{r.distance.toLocaleString()} km</span> },
                { 
                  header: 'On-Time Rate', 
                  accessor: 'onTimeRate', 
                  render: r => (
                    <span className={`font-mono font-bold ${r.onTimeRate >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {r.onTimeRate}%
                    </span>
                  ) 
                },
                { 
                  header: 'Safety Rating', 
                  accessor: 'rating', 
                  render: r => (
                    <span className="text-amber-400 font-bold font-mono">
                      {r.rating} / 5.0
                    </span>
                  ) 
                }
              ]}
              data={driverPerformanceList}
              searchFields={['name']}
            />
          </div>
        </div>
      )}

      {/* 5. CORPORATE CLIENTS TAB */}
      {activeTab === 'companies' && (
        <div className="space-y-6">
          <div className="glass-panel border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-100 font-display">Client Portfolio Billing</h3>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Ranked by Revenue</span>
            </div>

            <Table
              columns={[
                { header: 'Customer Corporate', accessor: 'name', render: r => <span className="font-bold text-slate-200">{r.name}</span> },
                { header: 'Total Orders', accessor: 'orders', render: r => <span className="font-mono">{r.orders}</span> },
                { header: 'Completed Runs', accessor: 'trips', render: r => <span className="font-mono">{r.trips}</span> },
                { header: 'Outstanding Balance', accessor: 'outstanding', render: r => <span className={`font-mono font-semibold ${r.outstanding > 0 ? 'text-amber-400' : 'text-slate-500'}`}>₹{r.outstanding.toLocaleString('en-IN')}</span> },
                { header: 'Billing Volume', accessor: 'revenue', render: r => <span className="font-mono text-emerald-400 font-bold">₹{r.revenue.toLocaleString('en-IN')}</span> }
              ]}
              data={companyBusinessList}
              searchFields={['name']}
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default ReportsDashboard;
