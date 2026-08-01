// Shared aggregation engine powering every BI report page.

export const sum = (list, key) =>
  (list || []).reduce((acc, item) => acc + (Number(item?.[key]) || 0), 0);

export const avg = (list, key) => {
  const arr = list || [];
  if (!arr.length) return 0;
  return sum(arr, key) / arr.length;
};

// Financial totals over a collection of ledger entries.
export const financialTotals = (finances) => {
  const t = {
    tripAmount: 0,
    dieselExpense: 0,
    tollExpense: 0,
    driverAllowance: 0,
    loadingCharge: 0,
    unloadingCharge: 0,
    otherExpenses: 0,
    totalExpenses: 0,
    paymentReceived: 0,
    pendingAmount: 0,
    netProfit: 0,
  };
  (finances || []).forEach((f) => {
    t.tripAmount += f.tripAmount || 0;
    t.dieselExpense += f.dieselExpense || 0;
    t.tollExpense += f.tollExpense || 0;
    t.driverAllowance += f.driverAllowance || 0;
    t.loadingCharge += f.loadingCharge || 0;
    t.unloadingCharge += f.unloadingCharge || 0;
    t.otherExpenses += f.otherExpenses || 0;
    t.totalExpenses += f.totalExpenses || 0;
    t.paymentReceived += f.paymentReceived || 0;
    t.pendingAmount += f.pendingAmount || 0;
    t.netProfit += f.netProfit || 0;
  });
  return t;
};

// Status breakdown + derived quality metrics for a trip collection.
export const tripBreakdown = (trips) => {
  const list = trips || [];
  const completed = list.filter((t) => t.status === 'Completed');
  const delayed = completed.filter((t) => t.isDelayed);
  return {
    total: list.length,
    assigned: list.filter((t) => t.status === 'Assigned').length,
    running: list.filter((t) => t.status === 'Running').length,
    delivered: list.filter((t) => t.status === 'Delivered').length,
    completed: completed.length,
    cancelled: list.filter((t) => t.status === 'Cancelled').length,
    delayed: delayed.length,
    onTimeRate: completed.length
      ? Math.round(((completed.length - delayed.length) / completed.length) * 100)
      : 100,
    avgDistance: Math.round(avg(list, 'distance')),
    avgDuration: Number(avg(list, 'estimatedDuration').toFixed(1)),
  };
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const monthKey = (dateStr) => {
  const d = new Date(dateStr);
  return `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;
};

export const monthIndex = (key) => {
  const [m, y] = key.split(' ');
  return parseInt(y, 10) * 12 + MONTHS.indexOf(m);
};

// Group ledger entries into a monthly financial series.
export const monthlyFinanceSeries = (finances) => {
  const groups = {};
  (finances || []).forEach((f) => {
    if (!f.recordedAt) return;
    const key = monthKey(f.recordedAt);
    if (!groups[key]) groups[key] = { name: key, revenue: 0, expenses: 0, profit: 0, trips: 0 };
    groups[key].revenue += f.tripAmount || 0;
    groups[key].expenses += f.totalExpenses || 0;
    groups[key].profit += f.netProfit || 0;
    groups[key].trips += 1;
  });
  return Object.values(groups).sort((a, b) => monthIndex(a.name) - monthIndex(b.name));
};

// Group trips into a monthly series (counts + distance).
export const monthlyTripSeries = (trips) => {
  const groups = {};
  (trips || []).forEach((t) => {
    if (!t.pickupDate) return;
    const key = monthKey(t.pickupDate);
    if (!groups[key]) {
      groups[key] = { name: key, trips: 0, completed: 0, cancelled: 0, delayed: 0, distance: 0 };
    }
    groups[key].trips += 1;
    if (t.status === 'Completed') groups[key].completed += 1;
    if (t.status === 'Cancelled') groups[key].cancelled += 1;
    if (t.isDelayed) groups[key].delayed += 1;
    groups[key].distance += t.distance || 0;
  });
  return Object.values(groups).sort((a, b) => monthIndex(a.name) - monthIndex(b.name));
};

// Daily trip series (count by pickup date).
export const dailyTripSeries = (trips, limit = 30) => {
  const counts = {};
  (trips || [])
    .slice(0, limit)
    .filter((t) => t.pickupDate)
    .forEach((t) => {
      counts[t.pickupDate] = (counts[t.pickupDate] || 0) + 1;
    });
  return Object.entries(counts)
    .map(([date, count]) => ({ name: date, trips: count }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

// Group an array by a key function into a Map.
export const groupBy = (list, keyFn) => {
  const map = new Map();
  (list || []).forEach((item) => {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  });
  return map;
};

// Financial ledger rows belonging to a set of trip ids.
export const financesForTrips = (trips, finances) => {
  const ids = new Set((trips || []).map((t) => t.id));
  return (finances || []).filter((f) => ids.has(f.tripId));
};

// ---------------- Entity-level analytics builders --------------------------

export const vehicleAnalytics = (vehicles, trips, finances) => {
  return (vehicles || []).map((v) => {
    const vTrips = (trips || []).filter((t) => t.vehicleId === v.id);
    const completed = vTrips.filter((t) => t.status === 'Completed');
    const vFin = financesForTrips(completed, finances);
    const totals = financialTotals(vFin);
    const distance = sum(completed, 'distance');
    const runningHours = sum(completed, 'estimatedDuration');
    return {
      id: v.id,
      number: v.number,
      type: v.type,
      capacity: v.capacity,
      fuelType: v.fuelType,
      status: v.status,
      gpsId: v.gpsId,
      fitness: v.fitness,
      insurance: v.insurance,
      permit: v.permit,
      pollution: v.pollution,
      trips: vTrips.length,
      completedTrips: completed.length,
      distance,
      runningHours,
      idleHours: Math.max(0, 720 - runningHours),
      revenue: totals.tripAmount,
      fuelExpense: totals.dieselExpense,
      tollExpense: totals.tollExpense,
      allowanceExpense: totals.driverAllowance,
      maintenanceExpense: 0,
      totalExpenses: totals.totalExpenses,
      profit: totals.netProfit,
      margin: totals.tripAmount ? (totals.netProfit / totals.tripAmount) * 100 : 0,
      avgDailyDistance: 0,
      utilization: v.status === 'Running' ? 100 : v.status === 'Available' ? 65 : v.status === 'Maintenance' ? 20 : 0,
    };
  });
};

export const driverAnalytics = (drivers, trips, finances) => {
  return (drivers || []).map((d) => {
    const dTrips = (trips || []).filter((t) => t.driverId === d.id);
    const completed = dTrips.filter((t) => t.status === 'Completed');
    const delayed = completed.filter((t) => t.isDelayed);
    const dFin = financesForTrips(completed, finances);
    const totals = financialTotals(dFin);
    return {
      id: d.id,
      name: d.name,
      mobile: d.mobile,
      status: d.status,
      rating: d.rating || 5,
      assignedVehicle: d.assignedVehicle,
      licenseExpiry: d.licenseExpiry,
      trips: dTrips.length,
      completedTrips: completed.length,
      delayed: delayed.length,
      onTimeRate: completed.length
        ? Math.round(((completed.length - delayed.length) / completed.length) * 100)
        : 100,
      distance: sum(completed, 'distance'),
      drivingHours: sum(completed, 'estimatedDuration'),
      revenue: totals.tripAmount,
      allowance: totals.driverAllowance,
      profit: totals.netProfit,
    };
  });
};

export const companyAnalytics = (companies, trips, finances, orders) => {
  return (companies || []).map((c) => {
    const cOrders = (orders || []).filter((o) => o.companyId === c.id);
    const cTrips = (trips || []).filter((t) => t.companyId === c.id);
    const completed = cTrips.filter((t) => t.status === 'Completed');
    const cFin = financesForTrips(completed, finances);
    const totals = financialTotals(cFin);
    const avgOrderValue = cOrders.length
      ? totals.tripAmount / cOrders.length
      : cTrips.length
        ? totals.tripAmount / cTrips.length
        : 0;
    return {
      id: c.id,
      name: c.name,
      gst: c.gst,
      status: c.status,
      paymentTerms: c.paymentTerms,
      orders: cOrders.length,
      trips: cTrips.length,
      completedTrips: completed.length,
      revenue: totals.tripAmount,
      expenses: totals.totalExpenses,
      profit: totals.netProfit,
      outstanding: totals.pendingAmount,
      received: totals.paymentReceived,
      avgOrderValue,
      avgMargin: totals.tripAmount ? (totals.netProfit / totals.tripAmount) * 100 : 0,
    };
  });
};

export const routeAnalytics = (trips, finances) => {
  const map = new Map();
  (trips || []).forEach((t) => {
    const key = `${t.pickupLocation} → ${t.destination}`;
    if (!map.has(key)) {
      map.set(key, {
        route: key,
        from: t.pickupLocation,
        to: t.destination,
        distance: t.distance || 0,
        duration: t.estimatedDuration || 0,
        count: 0,
        completed: 0,
        delayed: 0,
        cancelled: 0,
        revenue: 0,
        expenses: 0,
        profit: 0,
      });
    }
    const r = map.get(key);
    r.count += 1;
    if (t.status === 'Completed') r.completed += 1;
    if (t.status === 'Cancelled') r.cancelled += 1;
    if (t.isDelayed) r.delayed += 1;
  });

  // Attach financial data per route via trip ids
  const finByTrip = new Map((finances || []).map((f) => [f.tripId, f]));
  (trips || []).forEach((t) => {
    const f = finByTrip.get(t.id);
    if (!f) return;
    const r = map.get(`${t.pickupLocation} → ${t.destination}`);
    if (!r) return;
    r.revenue += f.tripAmount || 0;
    r.expenses += f.totalExpenses || 0;
    r.profit += f.netProfit || 0;
  });

  return Array.from(map.values()).map((r) => ({
    ...r,
    avgDeliveryTime: r.completed ? Math.round(r.duration) / Math.max(r.count, 1) : 0,
    revenuePerTrip: r.count ? r.revenue / r.count : 0,
    profitPerTrip: r.count ? r.profit / r.count : 0,
  }));
};

// Expense category breakdown for donut / bar charts.
export const expenseBreakdown = (finances) => {
  const t = financialTotals(finances);
  return [
    { name: 'Diesel', value: t.dieselExpense },
    { name: 'Tolls', value: t.tollExpense },
    { name: 'Driver Allowance', value: t.driverAllowance },
    { name: 'Loading', value: t.loadingCharge },
    { name: 'Unloading', value: t.unloadingCharge },
    { name: 'Other', value: t.otherExpenses },
  ].filter((e) => e.value > 0);
};

export const utilizationRate = (total, active) =>
  total ? Math.round((active / total) * 100) : 0;

// Simple linear-regression forecast for a monthly revenue series.
export const forecastRevenue = (monthlySeries, steps = 2) => {
  const points = (monthlySeries || []).slice(-6);
  if (points.length < 2) return [];
  const n = points.length;
  const xs = points.map((_, i) => i);
  const ys = points.map((p) => p.revenue);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  const slope =
    xs.reduce((acc, x, i) => acc + (x - meanX) * (ys[i] - meanY), 0) /
    xs.reduce((acc, x) => acc + (x - meanX) * (x - meanX), 0);
  const intercept = meanY - slope * meanX;
  return Array.from({ length: steps }, (_, i) => {
    const x = n + i;
    return { name: `Forecast ${i + 1}`, revenue: Math.max(0, Math.round(slope * x + intercept)), forecast: true };
  });
};

// Ranked list helper.
export const topList = (list, key, n = 5, order = 'desc') =>
  [...(list || [])].sort((a, b) => (order === 'desc' ? b[key] - a[key] : a[key] - b[key])).slice(0, n);
