import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  useTrips, 
  useVehicles, 
  useDrivers, 
  useOrders, 
  useFinances 
} from '../../services/services';
import StatCard from '../../components/common/StatCard';
import { CardSkeleton } from '../../components/common/Skeleton';
import LiveMap from '../../components/common/LiveMap';
import { 
  TrendingUp, 
  Truck, 
  Users, 
  FileText, 
  Navigation, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle,
  PlusCircle,
  Send
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar
} from 'recharts';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { currentRole } = useSelector((state) => state.auth);

  // Fetch all entities via react-query
  const { data: trips, isLoading: tripsLoading } = useTrips();
  const { data: vehicles, isLoading: vehiclesLoading } = useVehicles();
  const { data: drivers, isLoading: driversLoading } = useDrivers();
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { data: finances, isLoading: financesLoading } = useFinances();

  const isDataLoading = tripsLoading || vehiclesLoading || driversLoading || ordersLoading || financesLoading;

  // Calculate dynamic stats
  const stats = useMemo(() => {
    if (isDataLoading) return {};

    const totalOrders = orders.length;
    const runningTrips = trips.filter(t => t.status === 'Running').length;
    const completedTrips = trips.filter(t => t.status === 'Completed').length;
    const cancelledTrips = trips.filter(t => t.status === 'Cancelled').length;

    const availVehicles = vehicles.filter(v => v.status === 'Available').length;
    const availDrivers = drivers.filter(d => d.status === 'Available').length;

    const totalRev = finances.reduce((sum, f) => sum + (f.tripAmount || 0), 0);
    const totalExp = finances.reduce((sum, f) => sum + (f.totalExpenses || 0), 0);
    const netProfit = finances.reduce((sum, f) => sum + (f.netProfit || 0), 0);

    const vehicleUtil = vehicles.length 
      ? Math.round((vehicles.filter(v => v.status === 'Running').length / vehicles.length) * 100) 
      : 0;

    const driverUtil = drivers.length 
      ? Math.round((drivers.filter(d => d.status === 'On Trip').length / drivers.length) * 100) 
      : 0;

    return {
      totalOrders,
      runningTrips,
      completedTrips,
      cancelledTrips,
      availVehicles,
      availDrivers,
      totalRev,
      totalExp,
      netProfit,
      vehicleUtil,
      driverUtil
    };
  }, [trips, vehicles, drivers, orders, finances, isDataLoading]);

  // Aggregate monthly revenues & margins for the Area Chart
  const monthlyFinanceData = useMemo(() => {
    if (isDataLoading) return [];
    
    // Group finances by Month
    const groups = {};
    finances.forEach(f => {
      if (!f.recordedAt) return;
      const date = new Date(f.recordedAt);
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear().toString().slice(-2);
      const key = `${month} ${year}`;
      
      if (!groups[key]) {
        groups[key] = { name: key, revenue: 0, profit: 0, expenses: 0 };
      }
      groups[key].revenue += (f.tripAmount || 0);
      groups[key].profit += (f.netProfit || 0);
      groups[key].expenses += (f.totalExpenses || 0);
    });

    // Format and sort monthly data
    const monthsOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return Object.values(groups).sort((a, b) => {
      const [aMon, aYr] = a.name.split(' ');
      const [bMon, bYr] = b.name.split(' ');
      if (aYr !== bYr) return aYr - bYr;
      return monthsOrder.indexOf(aMon) - monthsOrder.indexOf(bMon);
    }).slice(-6); // show last 6 months
  }, [finances, isDataLoading]);

  // Aggregate company-wise distribution for pie-chart
  const companyBusinessData = useMemo(() => {
    if (isDataLoading) return [];
    
    const counts = {};
    trips.forEach(t => {
      counts[t.companyName] = (counts[t.companyName] || 0) + 1;
    });
    
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value).slice(0, 4);
  }, [trips, isDataLoading]);

  const PIE_COLORS = ['#6366f1', '#10b981', '#0ea5e9', '#f59e0b'];

  if (isDataLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-slate-800 rounded animate-pulse" />
          <div className="h-10 w-32 bg-slate-800 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  // Format currency
  const formatCurrency = (num) => {
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} Lakh`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-8 select-none">
      {/* Top Banner section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-slate-100">
            Control Console
          </h1>
          <p className="text-sm text-slate-400">
            System overview and real-time operations monitor.
          </p>
        </div>

        {/* Quick Actions Panel */}
        <div className="flex items-center gap-3">
          {['Super Admin', 'Dispatcher'].includes(currentRole) && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/orders')} 
              className="flex items-center gap-2"
            >
              <PlusCircle size={16} />
              <span>Create Order</span>
            </Button>
          )}
          {['Super Admin', 'Dispatcher', 'Operations Manager'].includes(currentRole) && (
            <Button 
              variant="primary" 
              size="sm" 
              onClick={() => navigate('/trips')} 
              className="flex items-center gap-2"
            >
              <Send size={16} />
              <span>Dispatch Trip</span>
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Orders"
          value={stats.totalOrders}
          change="+12%"
          changeType="positive"
          subtitle="vs yesterday"
          icon={FileText}
          color="indigo"
        />
        <StatCard
          title="Active Trips"
          value={stats.runningTrips}
          subtitle="Vehicles currently in transit"
          icon={Navigation}
          color="sky"
        />
        <StatCard
          title="Available Drivers"
          value={`${stats.availDrivers} / ${drivers.length}`}
          change={`${stats.driverUtil}%`}
          changeType="neutral"
          subtitle="Active Utilization"
          icon={Users}
          color="emerald"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.netProfit)}
          change="+18.4%"
          changeType="positive"
          subtitle="Net Margins ledger"
          icon={DollarSign}
          color="amber"
        />
      </div>

      {/* Chart Layout: Split between Area Chart and Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Income / Expense History Trend Chart */}
        <div className="lg:col-span-2 glass-panel rounded-xl p-5 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-100 font-display">Revenue History</h3>
              <p className="text-xs text-slate-500">6-Month comparison of billing income vs operating costs</p>
            </div>
            <TrendingUp size={18} className="text-slate-500" />
          </div>

          <div className="h-[280px] w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyFinanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tickLine={false} />
                <YAxis stroke="#64748b" tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f1f5f9' }}
                  formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, '']}
                />
                <Area type="monotone" dataKey="revenue" name="Total Billing" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="expenses" name="Operating Expenses" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer Distribution / Share Pie Chart */}
        <div className="glass-panel rounded-xl p-5 border border-slate-800 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-100 font-display">Customer Share</h3>
            <p className="text-xs text-slate-500">Trip dispatch share across primary logistics accounts</p>
          </div>

          <div className="h-[200px] w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={companyBusinessData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {companyBusinessData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f1f5f9' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Runs</span>
              <span className="text-2xl font-extrabold text-slate-200">{trips.length}</span>
            </div>
          </div>

          {/* Custom Legends */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {companyBusinessData.map((d, index) => (
              <div key={d.name} className="flex items-center gap-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                <span className="text-slate-400 font-medium truncate">{d.name}</span>
                <span className="text-slate-200 font-bold ml-auto">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Live Vehicle Tracking Map */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800 flex flex-col h-[500px]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100 font-display">Live Fleet Tracking</h3>
            <p className="text-xs text-slate-500">Real-time GPS coordinates of active dispatches in transit</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-emerald-400">LIVE</span>
          </div>
        </div>
        <div className="flex-1 w-full rounded-xl overflow-hidden border border-slate-700 relative">
          <LiveMap trips={trips} />
        </div>
      </div>

      {/* Bottom Layout: Alerts/Expirations & Recent Trips activity list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Urgent System Alerts Column */}
        <div className="glass-panel rounded-xl p-5 border border-slate-800/80 space-y-4">
          <div className="flex items-center gap-2 text-accent-amber border-b border-slate-800 pb-3">
            <AlertTriangle size={18} />
            <h3 className="text-sm font-bold text-slate-100 font-display">Compliance Alerts</h3>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/10 flex items-start gap-2.5">
              <AlertTriangle className="text-accent-rose flex-shrink-0 mt-0.5" size={16} />
              <div className="text-xs">
                <span className="font-bold text-slate-200 block">Fitness Expiring</span>
                <p className="text-slate-400 mt-0.5">Vehicle MH-12-QW-5689 requires structural certificate validation by Aug 05, 2026.</p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 flex items-start gap-2.5">
              <AlertTriangle className="text-accent-amber flex-shrink-0 mt-0.5" size={16} />
              <div className="text-xs">
                <span className="font-bold text-slate-200 block">Licensing Limit Warning</span>
                <p className="text-slate-400 mt-0.5">Driver Amit Patel license DL-152016007654 expires in 43 days.</p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-sky-500/5 border border-sky-500/10 flex items-start gap-2.5">
              <Users className="text-accent-sky flex-shrink-0 mt-0.5" size={16} />
              <div className="text-xs">
                <span className="font-bold text-slate-200 block">Idle Assets</span>
                <p className="text-slate-400 mt-0.5">3 Available heavy-capacity containers remain unassigned for over 48 hours.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Operations Activity Log (latest 4 completed trips) */}
        <div className="lg:col-span-2 glass-panel rounded-xl p-5 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <h3 className="text-sm font-bold text-slate-100 font-display">Recent Activity Log</h3>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Latest Dispatches</span>
          </div>

          <div className="space-y-4">
            {trips.slice(2, 6).map((trip) => (
              <div key={trip.id} className="flex justify-between items-center gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
                    <Truck size={16} />
                  </div>
                  <div>
                    <span className="font-bold text-slate-200 block">Trip {trip.id} • {trip.companyName}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Routed {trip.pickupLocation} to {trip.destination} ({trip.distance} km)
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold text-[9px] ${
                    trip.status === 'Completed' ? 'bg-emerald-500/15 text-accent-emerald' : 'bg-sky-500/15 text-accent-sky'
                  }`}>
                    <CheckCircle size={10} />
                    {trip.status}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-1">{trip.deliveryDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
