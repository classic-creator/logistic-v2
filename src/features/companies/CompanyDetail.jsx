import React, { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCompany, useOrders, useTrips, useFinances } from '../../services/services';
import StatCard from '../../components/common/StatCard';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import { CardSkeleton } from '../../components/common/Skeleton';
import { formatCurrency } from '../reports/lib/format';
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Truck,
  IndianRupee,
  Wallet,
  TrendingUp,
  Award,
  Calendar,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#0ea5e9'];

export const CompanyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: company, isLoading: companyLoading } = useCompany(id);
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { data: trips, isLoading: tripsLoading } = useTrips();
  const { data: finances, isLoading: financesLoading } = useFinances();

  const stats = useMemo(() => {
    if (!company) return null;
    const myOrders = (orders || []).filter((o) => o.companyId === company.id);
    const myTrips = (trips || []).filter((t) => t.companyId === company.id);
    const completedTrips = myTrips.filter((t) => t.status === 'Completed');
    const tripIds = new Set(myTrips.map((t) => t.id));
    const myFin = (finances || []).filter((f) => tripIds.has(f.tripId));
    const revenue = myFin.reduce((s, f) => s + (f.tripAmount || 0), 0);
    const received = myFin.reduce((s, f) => s + (f.paymentReceived || 0), 0);
    const outstanding = myFin.reduce((s, f) => s + (f.pendingAmount || 0), 0);
    const expenses = myFin.reduce((s, f) => s + (f.totalExpenses || 0), 0);
    const profit = revenue - expenses;
    const margin = revenue ? (profit / revenue) * 100 : 0;

    return {
      company,
      orders: myOrders,
      trips: myTrips,
      completedTrips,
      revenue,
      received,
      outstanding,
      profit,
      margin,
      orderCount: myOrders.length,
      tripCount: myTrips.length,
      completedCount: completedTrips.length,
    };
  }, [company, orders, trips, finances]);

  const chartData = useMemo(() => {
    if (!company) return [];
    const months = {};
    (finances || [])
      .filter((f) => f.companyId === company.id)
      .forEach((f) => {
        if (!f.recordedAt) return;
        const d = new Date(f.recordedAt);
        const key = `${d.toLocaleString('default', { month: 'short' })} ${String(d.getFullYear()).slice(-2)}`;
        if (!months[key]) months[key] = { name: key, revenue: 0, profit: 0 };
        months[key].revenue += f.tripAmount || 0;
        months[key].profit += f.netProfit || 0;
      });
    const order = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return Object.values(months).sort((a, b) => {
      const [ma, ya] = a.name.split(' ');
      const [mb, yb] = b.name.split(' ');
      return ya !== yb ? ya - yb : order.indexOf(ma) - order.indexOf(mb);
    });
  }, [company, finances]);

  const paymentData = useMemo(() => {
    if (!company) return [];
    const myFin = (finances || []).filter((f) => f.companyId === company.id);
    return [
      { name: 'Paid', value: myFin.filter((f) => f.status === 'Paid').length },
      { name: 'Partial', value: myFin.filter((f) => f.status === 'Partial').length },
      { name: 'Pending', value: myFin.filter((f) => f.status === 'Pending').length },
    ].filter((d) => d.value > 0);
  }, [company, finances]);

  if (companyLoading || ordersLoading || tripsLoading || financesLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (!company || !stats) {
    return (
      <div className="py-12 text-center space-y-4">
        <Building2 size={48} className="text-accent-rose mx-auto" />
        <h2 className="text-lg font-bold text-slate-300">Company Not Found</h2>
        <Button variant="outline" onClick={() => navigate('/companies')}>
          Back to Accounts
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 select-none">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/companies')}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-all cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="p-2.5 bg-indigo-500/10 rounded-xl text-accent-indigo">
            <Building2 size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-display text-slate-100">{company.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                company.status === 'Active' ? 'bg-emerald-500/15 text-accent-emerald' : 'bg-rose-500/15 text-accent-rose'
              }`}>
                {company.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-semibold uppercase tracking-wider">
              GST: {company.gst} • {company.paymentTerms}
            </p>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={() => navigate('/orders')} className="flex items-center gap-1.5">
          <FileText size={14} />
          View Orders
        </Button>
      </div>

      {/* Contact strip */}
      <div className="glass-panel rounded-xl p-4 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="flex items-center gap-2.5 text-slate-300">
          <MapPin size={15} className="text-slate-500" />
          <span>{company.address}</span>
        </div>
        <div className="flex items-center gap-2.5 text-slate-300">
          <Phone size={15} className="text-slate-500" />
          <span>{company.contactPerson} • {company.phone}</span>
        </div>
        <div className="flex items-center gap-2.5 text-slate-300">
          <Mail size={15} className="text-slate-500" />
          <span>{company.email}</span>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Orders" value={stats.orderCount || 0} subtitle="Placed by this client" icon={FileText} color="indigo" />
        <StatCard title="Trips Dispatched" value={stats.tripCount || 0} subtitle={`${stats.completedCount || 0} completed`} icon={Truck} color="sky" />
        <StatCard title="Revenue Generated" value={`₹${(stats.revenue || 0).toLocaleString('en-IN')}`} subtitle="All invoiced billing" icon={IndianRupee} color="emerald" />
        <StatCard title="Outstanding Receivables" value={`₹${(stats.outstanding || 0).toLocaleString('en-IN')}`} subtitle={`${formatCurrency(stats.received)} received`} icon={Wallet} color="amber" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Net Profit" value={`₹${(stats.profit || 0).toLocaleString('en-IN')}`} subtitle="Revenue minus operating cost" icon={Award} color="emerald" />
        <StatCard title="Profit Margin" value={`${Number(stats.margin || 0).toFixed(1)}%`} subtitle="Net over gross billing" icon={TrendingUp} color="violet" />
        <StatCard title="Avg Order Value" value={`₹${stats.orderCount ? Math.round(stats.revenue / stats.orderCount).toLocaleString('en-IN') : 0}`} subtitle="Revenue per order" icon={TrendingUp} color="sky" />
        <StatCard title="First Order" value={stats.orders.length ? stats.orders[stats.orders.length - 1]?.deliveryDate || '—' : '—'} subtitle="Oldest recorded" icon={Calendar} color="amber" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-xl p-5 border border-slate-800 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-100 font-display">Revenue & Profit Trend</h3>
            <p className="text-xs text-slate-500 font-medium">Monthly billing and net profit from this client</p>
          </div>
          <div className="h-[240px] w-full text-xs">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tickLine={false} />
                  <YAxis stroke="#64748b" tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f1f5f9' }} formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 font-semibold text-xs">
                No financial records for this client yet.
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel rounded-xl p-5 border border-slate-800 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-100 font-display">Payment Mix</h3>
            <p className="text-xs text-slate-500 font-medium">Invoice settlement status</p>
          </div>
          <div className="h-[240px] w-full text-xs">
            {paymentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3}>
                    {paymentData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f1f5f9' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 font-semibold text-xs">
                No invoices yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Orders */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2 border-b border-slate-800 pb-3">
          <FileText size={16} className="text-accent-indigo" />
          Orders ({stats.orderCount})
        </h3>
        <Table
          columns={[
            { header: 'Order', accessor: 'id', render: (o) => <span className="font-bold text-indigo-400">{o.id}</span> },
            { header: 'Route', accessor: 'pickupLocation', render: (o) => <span className="text-slate-300">{o.pickupLocation} → {o.destination}</span> },
            { header: 'Material', accessor: 'material', render: (o) => <span className="text-slate-400">{o.material}</span> },
            { header: 'Weight', accessor: 'weight', render: (o) => <span className="font-mono">{o.weight} T</span> },
            { header: 'Priority', accessor: 'priority', render: (o) => <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${o.priority === 'High' ? 'bg-rose-500/15 text-accent-rose' : 'bg-amber-500/15 text-accent-amber'}`}>{o.priority}</span> },
            { header: 'Status', accessor: 'status', render: (o) => <span className="text-slate-400">{o.status}</span> },
          ]}
          data={stats.orders}
          searchFields={['id', 'material', 'pickupLocation', 'destination']}
        />
      </div>

      {/* Trips */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2 border-b border-slate-800 pb-3">
          <Truck size={16} className="text-accent-indigo" />
          Dispatch History ({stats.tripCount})
        </h3>
        <Table
          columns={[
            { header: 'Trip', accessor: 'id', render: (t) => <Link to={`/trips/${t.id}`} className="font-bold text-indigo-400 hover:text-indigo-300 hover:underline">{t.id}</Link> },
            { header: 'Route', accessor: 'pickupLocation', render: (t) => <span className="text-slate-300">{t.pickupLocation} → {t.destination}</span> },
            { header: 'Vehicle', accessor: 'vehicleNumber', render: (t) => <span className="font-mono text-slate-400">{t.vehicleNumber}</span> },
            { header: 'Driver', accessor: 'driverName', render: (t) => <span className="text-slate-300">{t.driverName}</span> },
            { header: 'Distance', accessor: 'distance', render: (t) => <span className="font-mono">{t.distance} km</span> },
            { header: 'Date', accessor: 'pickupDate', render: (t) => <span className="font-mono text-slate-500">{t.pickupDate}</span> },
            { header: 'Status', accessor: 'status', render: (t) => <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${t.status === 'Completed' ? 'bg-emerald-500/15 text-accent-emerald' : t.status === 'Running' ? 'bg-sky-500/15 text-accent-sky' : t.status === 'Cancelled' ? 'bg-rose-500/15 text-accent-rose' : 'bg-slate-800 text-slate-400'}`}>{t.status}</span> },
          ]}
          data={stats.trips}
          searchFields={['id', 'vehicleNumber', 'driverName', 'pickupLocation', 'destination']}
        />
      </div>
    </div>
  );
};

export default CompanyDetail;
