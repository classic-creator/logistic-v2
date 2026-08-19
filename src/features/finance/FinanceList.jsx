import React, { useState, useMemo } from 'react';
import { useFinances, useUpdateFinance } from '../../services/services';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import StatCard from '../../components/common/StatCard';
import { Edit2, Coins, ArrowUpRight, ArrowDownRight, Wallet, Percent } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { formatCurrency } from '../fuel/lib/fuelFormat';

export const FinanceList = () => {
  const [queryParams, setQueryParams] = useState({
    page: 1,
    per_page: 25,
    search: '',
    sort: 'created_at',
    sort_direction: 'desc'
  });

  const { data: finances, isLoading } = useFinances(queryParams);
  const updateFinanceMutation = useUpdateFinance();

  const handleFetchData = ({ page, pageSize, search, sortKey, sortDirection }) => {
    setQueryParams({
      page,
      per_page: pageSize,
      search: search || '',
      sort: sortKey || 'created_at',
      sort_direction: sortDirection || 'desc'
    });
  };

  const [isOpen, setIsOpen] = useState(false);
  const [editingFinance, setEditingFinance] = useState(null);

  const { register, handleSubmit, reset, watch } = useForm();

  // Watch inputs for live profit calculations inside the Modal
  const watchTripAmount = watch('tripAmount', 0);
  const watchDiesel = watch('dieselExpense', 0);
  const watchToll = watch('tollExpense', 0);
  const watchAllowance = watch('driverAllowance', 0);
  const watchLoading = watch('loadingCharge', 0);
  const watchUnloading = watch('unloadingCharge', 0);
  const watchOther = watch('otherExpenses', 0);
  const watchReceived = watch('paymentReceived', 0);

  // Live profit calculation inside form
  const liveCalculations = useMemo(() => {
    const revenue = Number(watchTripAmount || 0);
    const expenses = 
      Number(watchDiesel || 0) + 
      Number(watchToll || 0) + 
      Number(watchAllowance || 0) + 
      Number(watchLoading || 0) + 
      Number(watchUnloading || 0) + 
      Number(watchOther || 0);
    
    const profit = revenue - expenses;
    const pending = revenue - Number(watchReceived || 0);

    return { expenses, profit, pending };
  }, [watchTripAmount, watchDiesel, watchToll, watchAllowance, watchLoading, watchUnloading, watchOther, watchReceived]);

  const handleEdit = (finance) => {
    setEditingFinance(finance);
    reset({
      tripAmount: finance.tripAmount,
      dieselExpense: finance.dieselExpense,
      tollExpense: finance.tollExpense,
      driverAllowance: finance.driverAllowance,
      loadingCharge: finance.loadingCharge || 0,
      unloadingCharge: finance.unloadingCharge || 0,
      otherExpenses: finance.otherExpenses || 0,
      paymentReceived: finance.paymentReceived,
      status: finance.status,
      invoiceNumber: finance.invoiceNumber || '',
    });
    setIsOpen(true);
  };

  const onSubmit = (data) => {
    updateFinanceMutation.mutate(
      {
        id: editingFinance.id,
        data: {
          tripAmount: Number(data.tripAmount),
          dieselExpense: Number(data.dieselExpense),
          tollExpense: Number(data.tollExpense),
          driverAllowance: Number(data.driverAllowance),
          loadingCharge: Number(data.loadingCharge),
          unloadingCharge: Number(data.unloadingCharge),
          otherExpenses: Number(data.otherExpenses),
          paymentReceived: Number(data.paymentReceived),
          status: data.status,
          invoiceNumber: data.invoiceNumber,
        },
      },
      {
        onSuccess: () => {
          setIsOpen(false);
          setEditingFinance(null);
        },
      }
    );
  };

  // Aggregated Ledger Summary Statistics
  const ledgerStats = useMemo(() => {
    if (!finances || finances.length === 0) {
      return { totalRev: 0, totalExp: 0, outstanding: 0, avgMargin: 0 };
    }
    const totalRev = finances.reduce((acc, f) => acc + Number(f.tripAmount || 0), 0);
    const totalExp = finances.reduce((acc, f) => acc + Number(f.totalExpenses || 0), 0);
    const totalProfit = totalRev - totalExp;
    const outstanding = finances.reduce((acc, f) => acc + Number(f.pendingAmount || 0), 0);
    const avgMargin = totalRev ? ((totalProfit / totalRev) * 100).toFixed(1) : 0;

    return { totalRev, totalExp, outstanding, avgMargin };
  }, [finances]);

  const columns = [
    {
      header: 'Invoice #',
      accessor: 'invoiceNumber',
      render: (row) => <span className="font-mono text-indigo-400 font-semibold">{row.invoiceNumber || `INV-${row.id}`}</span>
    },
    {
      header: 'Trip Ref',
      accessor: 'tripId',
      render: (row) => <span className="font-mono text-slate-400">TRIP-{row.tripId}</span>
    },
    {
      header: 'Company Client',
      accessor: 'companyName',
      render: (row) => <span className="font-semibold text-slate-300">{row.companyName}</span>
    },
    {
      header: 'Trip Revenue',
      accessor: 'tripAmount',
      render: (row) => <span className="font-mono text-slate-200 font-semibold">{formatCurrency(row.tripAmount)}</span>
    },
    {
      header: 'Operating Cost',
      accessor: 'totalExpenses',
      render: (row) => <span className="font-mono text-rose-400 font-semibold">{formatCurrency(row.totalExpenses)}</span>
    },
    {
      header: 'Net Margin',
      accessor: 'netProfit',
      render: (row) => (
        <div className="space-y-0.5">
          <span className={`font-mono font-semibold block ${row.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(row.netProfit)}
          </span>
          <span className="text-[10px] text-slate-500 font-semibold block">Margin: {row.profitMargin || 0}%</span>
        </div>
      )
    },
    {
      header: 'Outstanding Balance',
      accessor: 'pendingAmount',
      render: (row) => (
        <span className={`font-mono text-xs font-semibold ${row.pendingAmount > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
          {row.pendingAmount > 0 ? formatCurrency(row.pendingAmount) : 'Settled'}
        </span>
      )
    },
    {
      header: 'Payment Status',
      accessor: 'status',
      render: (row) => {
        const colors = {
          Paid: 'bg-emerald-500/15 text-accent-emerald border-emerald-500/20',
          Partial: 'bg-amber-500/15 text-accent-amber border-amber-500/20',
          Pending: 'bg-rose-500/15 text-accent-rose border-rose-500/20',
        };
        return (
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${colors[row.status] || 'bg-slate-800 text-slate-400'}`}>
            {row.status}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleEdit(row)}
          className="flex items-center gap-1 hover:bg-slate-800"
        >
          <Edit2 size={13} />
          Edit Ledger
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-8 select-none">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-100 flex items-center gap-2.5">
            <Coins className="text-accent-indigo" size={26} />
            Finance & Billing Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Monitor freight revenue, operational expense breakdowns, client receivables, and profit margins.
          </p>
        </div>
      </div>

      {/* KPI Stats cards */}
      {!isLoading && finances && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Billings"
            value={formatCurrency(ledgerStats.totalRev)}
            subtitle="Combined gross revenue"
            icon={Coins}
            color="indigo"
          />
          <StatCard
            title="Operating Costs"
            value={formatCurrency(ledgerStats.totalExp)}
            subtitle="Fuel, tolls, and allowance expenses"
            icon={ArrowDownRight}
            color="rose"
          />
          <StatCard
            title="Outstanding Receivables"
            value={formatCurrency(ledgerStats.outstanding)}
            subtitle="Unsettled customer balances"
            icon={Wallet}
            color="amber"
          />
          <StatCard
            title="Avg Profit Margin"
            value={`${Number(ledgerStats.avgMargin || 0).toFixed(1)}%`}
            subtitle="Overall company operational margins"
            icon={Percent}
            color="emerald"
          />
        </div>
      )}

      {/* Main Table */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-slate-500">Loading ledger data...</div>
      ) : (
        <Table
          columns={columns}
          data={finances || []}
          serverPagination={true}
          totalRows={finances?.meta?.total || (finances || []).length}
          onFetchData={handleFetchData}
          initialPageSize={25}
          searchPlaceholder="Search ledger by invoice, trip, company..."
          searchFields={['invoiceNumber', 'tripId', 'companyName', 'status']}
        />
      )}

      {/* Edit Finance ledger item Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={`Audit Invoice Details - ${editingFinance?.invoiceNumber}`}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          
          {/* Live calculator telemetry */}
          <div className="grid grid-cols-3 gap-4 p-4 border border-slate-800 bg-slate-950/60 rounded-xl text-center text-xs">
            <div>
              <span className="text-slate-500 font-semibold uppercase block text-[10px]">Expenses</span>
              <span className="text-rose-400 font-bold font-mono text-sm mt-1 block">₹{liveCalculations.expenses.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold uppercase block text-[10px]">Net Profit</span>
              <span className={`font-bold font-mono text-sm mt-1 block ${liveCalculations.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ₹{liveCalculations.profit.toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold uppercase block text-[10px]">Outstanding</span>
              <span className="text-amber-400 font-bold font-mono text-sm mt-1 block">₹{liveCalculations.pending.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Trip Invoiced Amount (₹)"
              type="number"
              required
              {...register('tripAmount')}
            />
            <Input
              label="Payment Received (₹)"
              type="number"
              required
              {...register('paymentReceived')}
            />
          </div>

          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1.5">
            Operational Expenses Breakdown
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Diesel Expense (₹)"
              type="number"
              required
              {...register('dieselExpense')}
            />
            <Input
              label="Toll Charges (₹)"
              type="number"
              required
              {...register('tollExpense')}
            />
            <Input
              label="Driver Allowance (₹)"
              type="number"
              required
              {...register('driverAllowance')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Loading Cost (₹)"
              type="number"
              required
              {...register('loadingCharge')}
            />
            <Input
              label="Unloading Cost (₹)"
              type="number"
              required
              {...register('unloadingCharge')}
            />
            <Input
              label="Other Expenses (₹)"
              type="number"
              required
              {...register('otherExpenses')}
            />
          </div>

          <Input
            label="Ledger Remarks / Notes"
            placeholder="Diesel slips matching, billing adjusted..."
            {...register('remarks')}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={updateFinanceMutation.isPending}>
              Update Ledger Entry
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FinanceList;
