import { useMemo } from 'react';
import {
  useTrips,
  useVehicles,
  useDrivers,
  useCompanies,
  useOrders,
  useFinances,
} from '../../../services/services';
import { getRange, dateInRange } from '../lib/timeRanges';
import {
  tripBreakdown,
  financialTotals,
  monthlyFinanceSeries,
  monthlyTripSeries,
  dailyTripSeries,
  expenseBreakdown,
  vehicleAnalytics,
  driverAnalytics,
  companyAnalytics,
  routeAnalytics,
  utilizationRate,
  forecastRevenue,
} from '../lib/analytics';

// Central data provider for every BI report. Fetches all collections and
// produces range-filtered datasets plus derived analytics in one place.
export const useBiData = (rangeKey, customRange) => {
  const range = useMemo(() => getRange(rangeKey, customRange), [rangeKey, customRange]);

  const tripsQ = useTrips();
  const vehiclesQ = useVehicles();
  const driversQ = useDrivers();
  const companiesQ = useCompanies();
  const ordersQ = useOrders();
  const financesQ = useFinances();

  const isLoading =
    tripsQ.isLoading ||
    vehiclesQ.isLoading ||
    driversQ.isLoading ||
    companiesQ.isLoading ||
    ordersQ.isLoading ||
    financesQ.isLoading;

  const allTrips = useMemo(() => tripsQ.data || [], [tripsQ.data]);
  const allVehicles = useMemo(() => vehiclesQ.data || [], [vehiclesQ.data]);
  const allDrivers = useMemo(() => driversQ.data || [], [driversQ.data]);
  const allCompanies = useMemo(() => companiesQ.data?.data || [], [companiesQ.data]);
  const allOrders = useMemo(() => ordersQ.data || [], [ordersQ.data]);
  const allFinances = useMemo(() => financesQ.data || [], [financesQ.data]);

  // Range-filtered operational datasets
  const filteredTrips = useMemo(
    () => allTrips.filter((t) => dateInRange(t.pickupDate, range)),
    [allTrips, range]
  );
  const filteredFinances = useMemo(
    () => allFinances.filter((f) => dateInRange(f.recordedAt, range)),
    [allFinances, range]
  );

  // Derived analytics (all respect the active period)
  const tripStats = useMemo(() => tripBreakdown(filteredTrips), [filteredTrips]);
  const finance = useMemo(() => financialTotals(filteredFinances), [filteredFinances]);
  const monthlyFinance = useMemo(() => monthlyFinanceSeries(allFinances), [allFinances]);
  const monthlyTrips = useMemo(() => monthlyTripSeries(allTrips), [allTrips]);
  const dailyTrips = useMemo(() => dailyTripSeries(filteredTrips), [filteredTrips]);
  const expenseCategories = useMemo(() => expenseBreakdown(filteredFinances), [filteredFinances]);

  const vehicleList = useMemo(
    () => vehicleAnalytics(allVehicles, filteredTrips, filteredFinances),
    [allVehicles, filteredTrips, filteredFinances]
  );
  const driverList = useMemo(
    () => driverAnalytics(allDrivers, filteredTrips, filteredFinances),
    [allDrivers, filteredTrips, filteredFinances]
  );
  const companyList = useMemo(
    () => companyAnalytics(allCompanies, filteredTrips, filteredFinances, allOrders),
    [allCompanies, filteredTrips, filteredFinances, allOrders]
  );
  const routeList = useMemo(
    () => routeAnalytics(filteredTrips, filteredFinances),
    [filteredTrips, filteredFinances]
  );

  const fleetUtilization = useMemo(
    () => ({
      running: allVehicles.filter((v) => v.status === 'Running').length,
      available: allVehicles.filter((v) => v.status === 'Available').length,
      maintenance: allVehicles.filter((v) => v.status === 'Maintenance').length,
      inactive: allVehicles.filter((v) => v.status === 'Inactive').length,
      rate: utilizationRate(allVehicles.length, allVehicles.filter((v) => v.status === 'Running').length),
    }),
    [allVehicles]
  );

  const driverUtilization = useMemo(
    () => ({
      onTrip: allDrivers.filter((d) => d.status === 'On Trip').length,
      available: allDrivers.filter((d) => d.status === 'Available').length,
      leave: allDrivers.filter((d) => d.status === 'Leave').length,
      offline: allDrivers.filter((d) => d.status === 'Offline').length,
      rate: utilizationRate(allDrivers.length, allDrivers.filter((d) => d.status === 'On Trip').length),
    }),
    [allDrivers]
  );

  const forecast = useMemo(() => forecastRevenue(monthlyFinance), [monthlyFinance]);

  return {
    range,
    rangeKey,
    isLoading,
    allTrips,
    allVehicles,
    allDrivers,
    allCompanies,
    allOrders,
    allFinances,
    filteredTrips,
    filteredFinances,
    tripStats,
    finance,
    monthlyFinance,
    monthlyTrips,
    dailyTrips,
    expenseCategories,
    vehicleList,
    driverList,
    companyList,
    routeList,
    fleetUtilization,
    driverUtilization,
    forecast,
  };
};
