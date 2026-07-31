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

export const FinanceList = () => {
  const { data: finances, isLoading } = useFinances();
  const updateFinanceMutation = useUpdateFinance();

  const [isOpen, setIsOpen] = useState(false);
  const [editingFinance, setEditingFinance] = useState(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();

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
    const margin = revenue ? ((profit / revenue) * 100).toFixed(1) : 0;
    const pending = revenue - Number(watchReceived || 0);

    return {
      expenses,
      profit,
      margin,
      pending
    };
  }, [watchTripAmount, watchDiesel, watchToll, watchAllowance, watchLoading, watchUnloading, watchOther, watchReceived]);

  // Compute ledger header stats
  const ledgerStats = useMemo(() => {
    if (isLoading || !finances) return {};

    const totalRev = finances.reduce((sum, f) => sum + (f.tripAmount || 0), 0);
    const totalExp = finances.reduce((sum, f) => sum + (f.totalExpenses || 0), 0);
    const outstanding = finances.reduce((sum, f) => sum + (f.pendingAmount || 0), 0);
    
    const totalProfit = totalRev - totalExp;
    const avgMargin = totalRev ? ((totalProfit / totalRev) * 100).toFixed(1) : 0;

    return {
      totalRev,
      totalExp,
      outstanding,
      avgMargin
    };
  }, [finances, isLoading]);

  const handleOpenEdit = (finance) => {
    setEditingFinance(finance);
    reset(finance);
    setIsOpen(true);
  };

  const onSubmit = (data) => {
    // Cast fields to numbers
    const payload = {
      tripAmount: Number(data.tripAmount),
      dieselExpense: Number(data.dieselExpense),
      tollExpense: Number(data.tollExpense),
      driverAllowance: Number(data.driverAllowance),
      loadingCharge: Number(data.loadingCharge),
      unloadingCharge: Number(data.unloadingCharge),
      otherExpenses: Number(data.otherExpenses),
      paymentReceived: Number(data.paymentReceived),
      remarks: data.remarks
    };

    updateFinanceMutation.mutate({ id: editingFinance.id, data: payload }, {
      onSuccess: () => {
        setIsOpen(false);
        reset();
      }
    });
  };

  const columns = [
    {
      header: 'Invoice Code',
      accessor: 'invoiceNumber',
      render: (row) => (
        <div className="space-y-0.5">
          <span className="font-bold text-slate-200 block">{row.invoiceNumber}</span>
          <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase block">TRIP: {row.tripId}</span>
        </div>
      )
    },
    {
      header: 'Company Account',
      accessor: 'companyName',
      render: (row) => <span className="font-semibold text-slate-300">{row.companyName}</span>
    },
    {
      header: 'Trip Revenue',
      accessor: 'tripAmount',
      render: (row) => <span className="font-mono text-slate-200 font-semibold">₹{(row.tripAmount || 0).toLocaleString('en-IN')}</span>
    },
    {
      header: 'Operating Cost',
      accessor: 'totalExpenses',
      render: (row) => <span className="font-mono text-rose-400 font-semibold">₹{(row.totalExpenses || 0).toLocaleString('en-IN')}</span>
    },
    {
      header: 'Net Margin',
      accessor: 'netProfit',
      render: (row) => (
        <div className="space-y-0.5">
          <span className={`font-mono font-semibold block ${row.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            ₹{(row.netProfit || 0).toLocaleString('en-IN')}
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
          {row.pendingAmount > 0 ? `₹${row.pendingAmount.toLocaleString('en-IN')}` : 'Settled'}
        </span>
      )
    },
    {
      header: 'Payment Status',
      accessor: 'status',
      render: (row) => {
        const statusColors = {
          Paid: 'bg-emerald-500/15 text-accent-emerald border border-emerald-500/20',
          Partial: 'bg-amber-500/15 text-accent-amber border border-amber-500/20',
          Pending: 'bg-rose-500/15 text-accent-rose border border-rose-500/20'
        };
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusColors[row.status]}`}>
            {row.status}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      accessor: 'actions',
      sortable: false,
      className: 'text-right',
      render: (row) => (
        <button
          onClick={() => handleOpenEdit(row)}
          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          <Edit2 size={14} />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6 select-none">
      {/* Header section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-slate-100">
            Accounts Ledger
          </h1>
          <p className="text-sm text-slate-400">
            Audit trip expenses, invoice revenues, check profit margins, and manage company balances.
          </p>
        </div>
      </div>

      {/* KPI Stats cards */}
      {!isLoading && finances && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Billings"
            value={`₹${ledgerStats.totalRev.toLocaleString('en-IN')}`}
            subtitle="Combined gross revenue"
            icon={Coins}
            color="indigo"
          />
          <StatCard
            title="Operating Costs"
            value={`₹${ledgerStats.totalExp.toLocaleString('en-IN')}`}
            subtitle="Fuel, tolls, and allowance expenses"
            icon={ArrowDownRight}
            color="rose"
          />
          <StatCard
            title="Outstanding Receivables"
            value={`₹${ledgerStats.outstanding.toLocaleString('en-IN')}`}
            subtitle="Unsettled customer balances"
            icon={Wallet}
            color="amber"
          />
          <StatCard
            title="Avg Profit Margin"
            value={`${ledgerStats.avgMargin}%`}
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
          data={finances}
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
