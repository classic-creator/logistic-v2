// Mock Database with dynamic data generator and CRUD operations persisted in localStorage.

const COMPANIES_KEY = 'ltms_companies';
const VEHICLES_KEY = 'ltms_vehicles';
const DRIVERS_KEY = 'ltms_drivers';
const ORDERS_KEY = 'ltms_orders';
const TRIPS_KEY = 'ltms_trips';
const FINANCES_KEY = 'ltms_finances';
const SEED_KEY = 'ltms_seed_version';
const SEED_VERSION = 'demo-today-v1';

// Helpers to read/write localStorage
const read = (key) => JSON.parse(localStorage.getItem(key));
const write = (key, data) => localStorage.setItem(key, JSON.stringify(data));
const toDateStr = (d) => d.toISOString().split('T')[0];

// Master Lists Initial Setup
const initialCompanies = [
  { id: 'CMP-001', name: 'Amazon India', gst: '29AAACA1234A1Z1', address: 'Outer Ring Road, Bangalore, Karnataka', contactPerson: 'Ankit Sharma', phone: '9876543210', email: 'shipping@amazon.in', paymentTerms: 'Net 30', status: 'Active' },
  { id: 'CMP-002', name: 'Flipkart Internet', gst: '29BBBCB5678B1Z2', address: 'Bellandur, Bangalore, Karnataka', contactPerson: 'Sneha Rao', phone: '8765432109', email: 'operations@flipkart.com', paymentTerms: 'Net 15', status: 'Active' },
  { id: 'CMP-003', name: 'Delhivery Logistics', gst: '07CCCC1234C1Z3', address: 'Sector 45, Gurugram, Haryana', contactPerson: 'Vikram Jeet', phone: '7654321098', email: 'vendor@delhivery.com', paymentTerms: 'Net 45', status: 'Active' },
  { id: 'CMP-004', name: 'Reliance Retail', gst: '27DDDD5678D1Z4', address: 'Ghansoli, Navi Mumbai, Maharashtra', contactPerson: 'Pranav Shah', phone: '9988776655', email: 'transport@reliance.co.in', paymentTerms: 'Net 30', status: 'Active' },
  { id: 'CMP-005', name: 'Blue Dart Express', gst: '27EEEE1234E1Z5', address: 'Santacruz East, Mumbai, Maharashtra', contactPerson: 'Meera Deshmukh', phone: '8877665544', email: 'vendor-relations@bluedart.com', paymentTerms: 'Net 30', status: 'Active' }
];

const initialVehicles = [
  { id: 'VEH-001', number: 'KA-03-MM-7890', type: 'Tata Ace', capacity: '1.5 Tons', fuelType: 'Diesel', rc: 'RC-KA03MM7890', insurance: 'INS-998811', fitness: '2027-12-15', permit: 'National', pollution: 'PUC-77665', gpsId: 'GPS-ACE-001', status: 'Available' },
  { id: 'VEH-002', number: 'MH-12-QW-5689', type: 'Mahindra Bolero Pickup', capacity: '2.0 Tons', fuelType: 'Diesel', rc: 'RC-MH12QW5689', insurance: 'INS-998822', fitness: '2026-08-05', permit: 'State', pollution: 'PUC-77666', gpsId: 'GPS-BOL-002', status: 'Running' },
  { id: 'VEH-003', number: 'DL-01-AB-1234', type: 'Tata 407', capacity: '4.0 Tons', fuelType: 'Diesel', rc: 'RC-DL01AB1234', insurance: 'INS-998833', fitness: '2027-01-20', permit: 'National', pollution: 'PUC-77667', gpsId: 'GPS-407-003', status: 'Available' },
  { id: 'VEH-004', number: 'KA-51-XY-8822', type: 'Eicher Pro 2049', capacity: '5.0 Tons', fuelType: 'Diesel', rc: 'RC-KA51XY8822', insurance: 'INS-998844', fitness: '2027-06-18', permit: 'National', pollution: 'PUC-77668', gpsId: 'GPS-EIC-004', status: 'Maintenance' },
  { id: 'VEH-005', number: 'HR-55-P-4433', type: 'Tata 10-Wheeler', capacity: '15.0 Tons', fuelType: 'Diesel', rc: 'RC-HR55P4433', insurance: 'INS-998855', fitness: '2028-03-10', permit: 'National', pollution: 'PUC-77669', gpsId: 'GPS-T10-005', status: 'Available' },
  { id: 'VEH-006', number: 'MH-43-BB-9900', type: 'Leyland 12-Wheeler', capacity: '25.0 Tons', fuelType: 'Diesel', rc: 'RC-MH43BB9900', insurance: 'INS-998866', fitness: '2027-11-22', permit: 'National', pollution: 'PUC-77670', gpsId: 'GPS-L12-006', status: 'Running' },
  { id: 'VEH-007', number: 'KA-04-JJ-3211', type: 'Container Truck 32ft', capacity: '32.0 Tons', fuelType: 'Diesel', rc: 'RC-KA04JJ3211', insurance: 'INS-998877', fitness: '2027-09-09', permit: 'National', pollution: 'PUC-77671', gpsId: 'GPS-CON-007', status: 'Available' }
];

const initialDrivers = [
  { id: 'DRV-001', name: 'Rajesh Kumar', mobile: '9876500111', license: 'DL-122015004321', licenseExpiry: '2030-05-14', aadhaar: '1234-5678-9012', emergencyContact: '9876500112 (Wife)', assignedVehicle: 'MH-12-QW-5689', status: 'On Trip', rating: 4.8 },
  { id: 'DRV-002', name: 'Vikram Singh', mobile: '9876500222', license: 'DL-132014005432', licenseExpiry: '2029-11-20', aadhaar: '2345-6789-0123', emergencyContact: '9876500223 (Brother)', assignedVehicle: 'KA-03-MM-7890', status: 'Available', rating: 4.5 },
  { id: 'DRV-003', name: 'Sukhwinder Singh', mobile: '9876500333', license: 'DL-142018006543', licenseExpiry: '2032-02-18', aadhaar: '3456-7890-1234', emergencyContact: '9876500334 (Uncle)', assignedVehicle: 'HR-55-P-4433', status: 'Available', rating: 4.9 },
  { id: 'DRV-004', name: 'Amit Patel', mobile: '9876500444', license: 'DL-152016007654', licenseExpiry: '2026-09-12', aadhaar: '4567-8901-2345', emergencyContact: '9876500445 (Father)', assignedVehicle: 'MH-43-BB-9900', status: 'On Trip', rating: 4.2 },
  { id: 'DRV-005', name: 'Mahesh Patil', mobile: '9876500555', license: 'DL-162017008765', licenseExpiry: '2028-07-25', aadhaar: '5678-9012-3456', emergencyContact: '9876500556 (Wife)', assignedVehicle: 'KA-51-XY-8822', status: 'Leave', rating: 4.6 },
  { id: 'DRV-006', name: 'Gurnam Singh', mobile: '9876500666', license: 'DL-172019009876', licenseExpiry: '2035-10-01', aadhaar: '6789-0123-4567', emergencyContact: '9876500667 (Son)', assignedVehicle: 'KA-04-JJ-3211', status: 'Available', rating: 4.7 }
];

// Generate past 6 months of historical data
const generateHistoricalData = () => {
  const companies = initialCompanies;
  const vehicles = initialVehicles;
  const drivers = initialDrivers;
  
  const orders = [];
  const trips = [];
  const finances = [];

  const routes = [
    { from: 'Bangalore', to: 'Mumbai', distance: 1000, duration: 24 },
    { from: 'Mumbai', to: 'Delhi', distance: 1400, duration: 36 },
    { from: 'Chennai', to: 'Bangalore', distance: 350, duration: 8 },
    { from: 'Delhi', to: 'Jaipur', distance: 280, duration: 6 },
    { from: 'Kolkata', to: 'Patna', distance: 580, duration: 14 },
    { from: 'Bangalore', to: 'Hyderabad', distance: 570, duration: 12 },
    { from: 'Pune', to: 'Mumbai', distance: 150, duration: 4 },
  ];

  const materials = ['Electronics', 'Apparel', 'FMCG Goods', 'Automotive Parts', 'Industrial Steel', 'Perishable Goods', 'Chemicals'];

  // Anchor generated history to the current date so reports always have fresh data
  const now = new Date();

  let orderCounter = 1001;
  let tripCounter = 1001;
  let invoiceCounter = 5001;

  // Let's generate about 120 trips over 180 days
  for (let i = 180; i >= 1; i--) {
    // Generate trip probability (roughly 0.7 trips per day)
    if (Math.random() > 0.35) {
      const tripDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      
      const company = companies[Math.floor(Math.random() * companies.length)];
      const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
      const driver = drivers[Math.floor(Math.random() * drivers.length)];
      const route = routes[Math.floor(Math.random() * routes.length)];
      const material = materials[Math.floor(Math.random() * materials.length)];
      const weight = (Math.random() * 20 + 1).toFixed(1); // 1 to 21 tons

      const orderId = `ORD-${orderCounter++}`;
      const tripId = `TRP-${tripCounter++}`;
      const invoiceNo = `INV-${invoiceCounter++}`;

      // Create Order
      const order = {
        id: orderId,
        companyId: company.id,
        companyName: company.name,
        pickupLocation: route.from,
        destination: route.to,
        material: material,
        weight: weight,
        vehicleRequirement: vehicle.type,
        priority: Math.random() > 0.7 ? 'High' : 'Medium',
        deliveryDate: tripDate.toISOString().split('T')[0],
        notes: 'Pre-scheduled delivery order.',
        status: 'Delivered'
      };
      orders.push(order);

      // Create Trip
      const startOdo = Math.floor(Math.random() * 50000) + 10000;
      const endOdo = startOdo + route.distance;
      
      // Random delay simulation (85% on-time, 15% delayed)
      const delayed = Math.random() > 0.85;

      const trip = {
        id: tripId,
        orderId: orderId,
        companyId: company.id,
        companyName: company.name,
        vehicleId: vehicle.id,
        vehicleNumber: vehicle.number,
        driverId: driver.id,
        driverName: driver.name,
        pickupLocation: route.from,
        destination: route.to,
        material: material,
        weight: weight,
        distance: route.distance,
        estimatedDuration: route.duration,
        remarks: delayed ? 'Delayed due to highway traffic blockage.' : 'Delivered on time.',
        status: 'Completed',
        pickupDate: tripDate.toISOString().split('T')[0],
        deliveryDate: new Date(tripDate.getTime() + route.duration * 3600000).toISOString().split('T')[0],
        startOdometer: startOdo,
        endOdometer: endOdo,
        isDelayed: delayed,
        pickupPhoto: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80',
        deliveryPhoto: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=400&q=80',
        podPhoto: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=400&q=80',
      };
      trips.push(trip);

      // Finances
      const ratePerKm = Math.floor(Math.random() * 20) + 45; // 45 to 65 Rs/km
      const tripAmount = route.distance * ratePerKm;
      
      const dieselExpense = Math.round(route.distance * 16.5); // ~16.5 Rs/km
      const tollExpense = Math.round(route.distance * 2.2); // ~2.2 Rs/km
      const driverAllowance = Math.round(route.distance * 2.0); // ~2.0 Rs/km
      const loadingCharge = Math.round(Math.random() * 1000) + 500;
      const unloadingCharge = Math.round(Math.random() * 1000) + 500;
      const otherExpenses = Math.round(Math.random() * 800);
      
      const totalExpenses = dieselExpense + tollExpense + driverAllowance + loadingCharge + unloadingCharge + otherExpenses;
      const netProfit = tripAmount - totalExpenses;
      const profitMargin = ((netProfit / tripAmount) * 100).toFixed(1);

      // 90% are fully paid, 10% outstanding (receivables) for the last 2 weeks, older ones are 100% paid
      const daysDiff = (now.getTime() - tripDate.getTime()) / (1000 * 3600 * 24);
      const isPaid = daysDiff > 15 ? true : Math.random() > 0.2;
      const paymentReceived = isPaid ? tripAmount : Math.round(tripAmount * 0.3); // Partial payment if unpaid
      const pendingAmount = tripAmount - paymentReceived;

      const finance = {
        id: `FIN-${tripId.split('-')[1]}`,
        tripId: tripId,
        companyId: company.id,
        companyName: company.name,
        invoiceNumber: invoiceNo,
        tripAmount: tripAmount,
        dieselExpense: dieselExpense,
        tollExpense: tollExpense,
        driverAllowance: driverAllowance,
        loadingCharge: loadingCharge,
        unloadingCharge: unloadingCharge,
        otherExpenses: otherExpenses,
        totalExpenses: totalExpenses,
        paymentReceived: paymentReceived,
        pendingAmount: pendingAmount,
        netProfit: netProfit,
        profitMargin: parseFloat(profitMargin),
        status: pendingAmount === 0 ? 'Paid' : (paymentReceived > 0 ? 'Partial' : 'Pending'),
        recordedAt: trip.deliveryDate,
        remarks: 'Auto-generated invoice ledger.'
      };
      finances.push(finance);
    }
  }

  // Pre-load two active running trips for real-time tracking
  const activeOrder1 = {
    id: `ORD-${orderCounter++}`,
    companyId: 'CMP-003',
    companyName: 'Delhivery Logistics',
    pickupLocation: 'Pune',
    destination: 'Mumbai',
    material: 'Automotive Parts',
    weight: '2.5',
    vehicleRequirement: 'Mahindra Bolero Pickup',
    priority: 'High',
    deliveryDate: toDateStr(new Date(now.getTime() + 24 * 3600 * 1000)),
    notes: 'Urgent factory line replenishment.',
    status: 'Running'
  };
  orders.unshift(activeOrder1);

  const activeTrip1 = {
    id: `TRP-10001`,
    orderId: activeOrder1.id,
    companyId: 'CMP-003',
    companyName: 'Delhivery Logistics',
    vehicleId: 'VEH-002',
    vehicleNumber: 'MH-12-QW-5689',
    driverId: 'DRV-001',
    driverName: 'Rajesh Kumar',
    pickupLocation: 'Pune',
    destination: 'Mumbai',
    material: 'Automotive Parts',
    weight: '2.5',
    distance: 150,
    estimatedDuration: 4,
    remarks: 'Trip in progress. Driver departed pickup location.',
    status: 'Running',
    pickupDate: toDateStr(now),
    deliveryDate: toDateStr(new Date(now.getTime() + 24 * 3600 * 1000)),
    startOdometer: 34500,
    endOdometer: 0,
    isDelayed: false,
    pickupPhoto: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80',
    deliveryPhoto: null,
    podPhoto: null,
    // Live simulator coordinate fields
    currentLocation: { lat: 18.75, lng: 73.40 }, // intermediate point
    speed: 62,
    eta: '1.5 hrs',
    remainingDistance: 68,
    lastUpdated: '10m ago'
  };
  trips.unshift(activeTrip1);

  const activeOrder2 = {
    id: `ORD-${orderCounter++}`,
    companyId: 'CMP-004',
    companyName: 'Reliance Retail',
    pickupLocation: 'Mumbai',
    destination: 'Delhi',
    material: 'Apparel',
    weight: '12.0',
    vehicleRequirement: 'Leyland 12-Wheeler',
    priority: 'Medium',
    deliveryDate: toDateStr(new Date(now.getTime() + 72 * 3600 * 1000)),
    notes: 'Warehouse transfer shipment.',
    status: 'Running'
  };
  orders.unshift(activeOrder2);

  const activeTrip2 = {
    id: `TRP-10002`,
    orderId: activeOrder2.id,
    companyId: 'CMP-004',
    companyName: 'Reliance Retail',
    vehicleId: 'VEH-006',
    vehicleNumber: 'MH-43-BB-9900',
    driverId: 'DRV-004',
    driverName: 'Amit Patel',
    pickupLocation: 'Mumbai',
    destination: 'Delhi',
    material: 'Apparel',
    weight: '12.0',
    distance: 1400,
    estimatedDuration: 36,
    remarks: 'Trip started. Passing thru Gujarat Highway.',
    status: 'Running',
    pickupDate: toDateStr(now),
    deliveryDate: toDateStr(new Date(now.getTime() + 72 * 3600 * 1000)),
    startOdometer: 78900,
    endOdometer: 0,
    isDelayed: false,
    pickupPhoto: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80',
    deliveryPhoto: null,
    podPhoto: null,
    currentLocation: { lat: 22.30, lng: 73.18 }, // Vadodara area
    speed: 55,
    eta: '22 hrs',
    remainingDistance: 920,
    lastUpdated: '5m ago'
  };
  trips.unshift(activeTrip2);

  // Add one pending order ready for driver/vehicle assignment
  const pendingOrder = {
    id: `ORD-${orderCounter++}`,
    companyId: 'CMP-001',
    companyName: 'Amazon India',
    pickupLocation: 'Chennai',
    destination: 'Bangalore',
    material: 'Electronics',
    weight: '8.4',
    vehicleRequirement: 'Tata 407',
    priority: 'High',
    deliveryDate: toDateStr(new Date(now.getTime() + 24 * 3600 * 1000)),
    notes: 'Express courier load delivery.',
    status: 'Pending'
  };
  orders.unshift(pendingOrder);

  // Seed a few "today" dispatches so the Today's Orders ledger has demo data
  const demoDispatches = [
    {
      company: companies[4],
      vehicle: vehicles[2],
      driver: drivers[2],
      route: { from: 'Pune', to: 'Mumbai', distance: 150, duration: 4 },
      material: 'FMCG Goods',
      weight: '4.0',
      priority: 'Medium',
      status: 'Assigned',
      remarks: 'Scheduled dispatch awaiting driver acceptance.'
    },
    {
      company: companies[0],
      vehicle: vehicles[6],
      driver: drivers[5],
      route: { from: 'Bangalore', to: 'Hyderabad', distance: 570, duration: 12 },
      material: 'Electronics',
      weight: '9.5',
      priority: 'High',
      status: 'Running',
      remarks: 'In transit. Passing thru Anantapur.'
    },
    {
      company: companies[1],
      vehicle: vehicles[0],
      driver: drivers[1],
      route: { from: 'Delhi', to: 'Jaipur', distance: 280, duration: 6 },
      material: 'Perishable Goods',
      weight: '1.5',
      priority: 'High',
      status: 'Delivered',
      remarks: 'Delivered on time. POD collected.'
    }
  ];

  demoDispatches.forEach((d) => {
    const orderId = `ORD-${orderCounter++}`;
    const tripId = `TRP-${tripCounter++}`;
    const invoiceNo = `INV-${invoiceCounter++}`;

    orders.unshift({
      id: orderId,
      companyId: d.company.id,
      companyName: d.company.name,
      pickupLocation: d.route.from,
      destination: d.route.to,
      material: d.material,
      weight: d.weight,
      vehicleRequirement: d.vehicle.type,
      priority: d.priority,
      deliveryDate: toDateStr(new Date(now.getTime() + d.route.duration * 3600000)),
      notes: d.remarks,
      status: d.status === 'Delivered' ? 'Delivered' : 'Assigned'
    });

    const startOdo = Math.floor(Math.random() * 30000) + 20000;
    trips.unshift({
      id: tripId,
      orderId,
      companyId: d.company.id,
      companyName: d.company.name,
      vehicleId: d.vehicle.id,
      vehicleNumber: d.vehicle.number,
      driverId: d.driver.id,
      driverName: d.driver.name,
      pickupLocation: d.route.from,
      destination: d.route.to,
      material: d.material,
      weight: d.weight,
      distance: d.route.distance,
      estimatedDuration: d.route.duration,
      remarks: d.remarks,
      status: d.status,
      pickupDate: toDateStr(now),
      deliveryDate: toDateStr(new Date(now.getTime() + d.route.duration * 3600000)),
      startOdometer: d.status === 'Assigned' ? 0 : startOdo,
      endOdometer: d.status === 'Delivered' ? startOdo + d.route.distance : 0,
      isDelayed: false,
      pickupPhoto: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80',
      deliveryPhoto: d.status === 'Delivered' ? 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=400&q=80' : null,
      podPhoto: d.status === 'Delivered' ? 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=400&q=80' : null,
      currentLocation: { lat: 18.90, lng: 73.50 },
      speed: d.status === 'Running' ? 58 : 0,
      eta: d.status === 'Running' ? '4.5 hrs' : 'Calculating...',
      remainingDistance: d.status === 'Running' ? Math.round(d.route.distance * 0.4) : d.route.distance,
      lastUpdated: 'Just now'
    });

    const ratePerKm = 55;
    const tripAmount = d.route.distance * ratePerKm;
    const dieselExpense = Math.round(d.route.distance * 16.5);
    const tollExpense = Math.round(d.route.distance * 2.2);
    const driverAllowance = Math.round(d.route.distance * 2.0);
    const loadingCharge = 800;
    const unloadingCharge = 700;
    const otherExpenses = 350;
    const totalExpenses = dieselExpense + tollExpense + driverAllowance + loadingCharge + unloadingCharge + otherExpenses;
    const netProfit = tripAmount - totalExpenses;
    const paymentReceived = d.status === 'Delivered' ? tripAmount : Math.round(tripAmount * 0.3);
    const pendingAmount = tripAmount - paymentReceived;

    finances.unshift({
      id: `FIN-${tripId.split('-')[1]}`,
      tripId,
      companyId: d.company.id,
      companyName: d.company.name,
      invoiceNumber: invoiceNo,
      tripAmount,
      dieselExpense,
      tollExpense,
      driverAllowance,
      loadingCharge,
      unloadingCharge,
      otherExpenses,
      totalExpenses,
      paymentReceived,
      pendingAmount,
      netProfit,
      profitMargin: parseFloat(((netProfit / tripAmount) * 100).toFixed(1)),
      status: pendingAmount === 0 ? 'Paid' : (paymentReceived > 0 ? 'Partial' : 'Pending'),
      recordedAt: toDateStr(now),
      remarks: 'Demo dispatch ledger.'
    });

    // Reflect asset usage in registry
    d.vehicle.status = d.status === 'Delivered' ? 'Available' : 'Running';
    d.driver.status = d.status === 'Delivered' ? 'Available' : 'On Trip';
  });

  return { companies, vehicles, drivers, orders, trips, finances };
};

// Initialize DB in localStorage if empty or stale (bump SEED_VERSION to reseed demo data)
export const initDb = () => {
  if (!read(COMPANIES_KEY) || read(SEED_KEY) !== SEED_VERSION) {
    const data = generateHistoricalData();
    write(COMPANIES_KEY, data.companies);
    write(VEHICLES_KEY, data.vehicles);
    write(DRIVERS_KEY, data.drivers);
    write(ORDERS_KEY, data.orders);
    write(TRIPS_KEY, data.trips);
    write(FINANCES_KEY, data.finances);
    write(SEED_KEY, SEED_VERSION);
  }
};

// Data retrieval wrappers
export const db = {
  companies: {
    getAll: () => { initDb(); return read(COMPANIES_KEY); },
    getById: (id) => db.companies.getAll().find(c => c.id === id),
    create: (company) => {
      const list = db.companies.getAll();
      const newCompany = { ...company, id: `CMP-00${list.length + 1}` };
      list.unshift(newCompany);
      write(COMPANIES_KEY, list);
      return newCompany;
    },
    update: (id, updated) => {
      const list = db.companies.getAll();
      const index = list.findIndex(c => c.id === id);
      if (index !== -1) {
        list[index] = { ...list[index], ...updated };
        write(COMPANIES_KEY, list);
        return list[index];
      }
      return null;
    },
    delete: (id) => {
      const list = db.companies.getAll();
      const filtered = list.filter(c => c.id !== id);
      write(COMPANIES_KEY, filtered);
      return true;
    }
  },

  vehicles: {
    getAll: () => { initDb(); return read(VEHICLES_KEY); },
    getById: (id) => db.vehicles.getAll().find(v => v.id === id),
    create: (vehicle) => {
      const list = db.vehicles.getAll();
      const newVehicle = { ...vehicle, id: `VEH-00${list.length + 1}`, status: vehicle.status || 'Available' };
      list.unshift(newVehicle);
      write(VEHICLES_KEY, list);
      return newVehicle;
    },
    update: (id, updated) => {
      const list = db.vehicles.getAll();
      const index = list.findIndex(v => v.id === id);
      if (index !== -1) {
        list[index] = { ...list[index], ...updated };
        write(VEHICLES_KEY, list);
        return list[index];
      }
      return null;
    },
    delete: (id) => {
      const list = db.vehicles.getAll();
      const filtered = list.filter(v => v.id !== id);
      write(VEHICLES_KEY, filtered);
      return true;
    }
  },

  drivers: {
    getAll: () => { initDb(); return read(DRIVERS_KEY); },
    getById: (id) => db.drivers.getAll().find(d => d.id === id),
    create: (driver) => {
      const list = db.drivers.getAll();
      const newDriver = { ...driver, id: `DRV-00${list.length + 1}`, rating: 5.0, status: driver.status || 'Available' };
      list.unshift(newDriver);
      write(DRIVERS_KEY, list);
      return newDriver;
    },
    update: (id, updated) => {
      const list = db.drivers.getAll();
      const index = list.findIndex(d => d.id === id);
      if (index !== -1) {
        list[index] = { ...list[index], ...updated };
        write(DRIVERS_KEY, list);
        return list[index];
      }
      return null;
    },
    delete: (id) => {
      const list = db.drivers.getAll();
      const filtered = list.filter(d => d.id !== id);
      write(DRIVERS_KEY, filtered);
      return true;
    }
  },

  orders: {
    getAll: () => { initDb(); return read(ORDERS_KEY); },
    getById: (id) => db.orders.getAll().find(o => o.id === id),
    create: (order) => {
      const list = db.orders.getAll();
      const newOrder = { ...order, id: `ORD-${Date.now().toString().slice(-4)}`, status: 'Pending' };
      list.unshift(newOrder);
      write(ORDERS_KEY, list);
      return newOrder;
    },
    update: (id, updated) => {
      const list = db.orders.getAll();
      const index = list.findIndex(o => o.id === id);
      if (index !== -1) {
        list[index] = { ...list[index], ...updated };
        write(ORDERS_KEY, list);
        return list[index];
      }
      return null;
    },
    delete: (id) => {
      const list = db.orders.getAll();
      const filtered = list.filter(o => o.id !== id);
      write(ORDERS_KEY, filtered);
      return true;
    }
  },

  trips: {
    getAll: () => { initDb(); return read(TRIPS_KEY); },
    getById: (id) => db.trips.getAll().find(t => t.id === id),
    create: (tripData) => {
      const list = db.trips.getAll();
      
      const newTrip = {
        id: `TRP-${Date.now().toString().slice(-4)}`,
        status: 'Assigned',
        pickupDate: new Date().toISOString().split('T')[0],
        deliveryDate: tripData.deliveryDate || new Date(Date.now() + 24*3600*1000).toISOString().split('T')[0],
        startOdometer: 0,
        endOdometer: 0,
        pickupPhoto: null,
        deliveryPhoto: null,
        podPhoto: null,
        currentLocation: { lat: 12.97, lng: 77.59 }, // initial coords
        speed: 0,
        eta: 'Calculating...',
        remainingDistance: tripData.distance || 500,
        lastUpdated: 'Just now',
        isDelayed: false,
        ...tripData
      };
      
      list.unshift(newTrip);
      write(TRIPS_KEY, list);

      // Update associated Order status
      db.orders.update(tripData.orderId, { status: 'Assigned' });
      
      // Update vehicle and driver status
      if (tripData.vehicleId) {
        db.vehicles.update(tripData.vehicleId, { status: 'Running' });
      }
      if (tripData.driverId) {
        db.drivers.update(tripData.driverId, { status: 'On Trip' });
      }

      return newTrip;
    },
    update: (id, updated) => {
      const list = db.trips.getAll();
      const index = list.findIndex(t => t.id === id);
      if (index !== -1) {
        const prevStatus = list[index].status;
        list[index] = { ...list[index], ...updated };
        write(TRIPS_KEY, list);

        // Cascade status updates
        if (updated.status === 'Running' && prevStatus !== 'Running') {
          db.orders.update(list[index].orderId, { status: 'Running' });
        }
        
        if (updated.status === 'Delivered' && prevStatus !== 'Delivered') {
          db.orders.update(list[index].orderId, { status: 'Delivered' });
        }
        
        if (updated.status === 'Completed' && prevStatus !== 'Completed') {
          db.orders.update(list[index].orderId, { status: 'Delivered' });
          
          // Release vehicle and driver
          db.vehicles.update(list[index].vehicleId, { status: 'Available' });
          db.drivers.update(list[index].driverId, { status: 'Available' });

          // Auto-generate a pending finance record if not exists
          const financeList = db.finances.getAll();
          const finExists = financeList.some(f => f.tripId === id);
          if (!finExists) {
            const distance = list[index].distance || 400;
            const tripAmount = distance * 55; // Base automatic revenue calculation
            const dieselExpense = Math.round(distance * 16.5);
            const tollExpense = Math.round(distance * 2.2);
            const driverAllowance = Math.round(distance * 2);
            
            db.finances.create({
              tripId: id,
              companyId: list[index].companyId,
              companyName: list[index].companyName,
              invoiceNumber: `INV-${Date.now().toString().slice(-4)}`,
              tripAmount: tripAmount,
              dieselExpense: dieselExpense,
              tollExpense: tollExpense,
              driverAllowance: driverAllowance,
              loadingCharge: 1000,
              unloadingCharge: 1000,
              otherExpenses: 0,
              paymentReceived: 0,
              pendingAmount: tripAmount,
              netProfit: tripAmount - (dieselExpense + tollExpense + driverAllowance + 2000),
              status: 'Pending',
              remarks: 'Auto-generated invoice ledger from completed trip.'
            });
          }
        }

        if (updated.status === 'Cancelled' && prevStatus !== 'Cancelled') {
          db.orders.update(list[index].orderId, { status: 'Cancelled' });
          db.vehicles.update(list[index].vehicleId, { status: 'Available' });
          db.drivers.update(list[index].driverId, { status: 'Available' });
        }

        return list[index];
      }
      return null;
    },
    delete: (id) => {
      const list = db.trips.getAll();
      const filtered = list.filter(t => t.id !== id);
      write(TRIPS_KEY, filtered);
      return true;
    }
  },

  finances: {
    getAll: () => { initDb(); return read(FINANCES_KEY); },
    getById: (id) => db.finances.getAll().find(f => f.id === id),
    create: (finance) => {
      const list = db.finances.getAll();
      
      const totalExpenses = 
        Number(finance.dieselExpense || 0) + 
        Number(finance.tollExpense || 0) + 
        Number(finance.driverAllowance || 0) + 
        Number(finance.loadingCharge || 0) + 
        Number(finance.unloadingCharge || 0) + 
        Number(finance.otherExpenses || 0);

      const netProfit = Number(finance.tripAmount || 0) - totalExpenses;
      const profitMargin = finance.tripAmount ? ((netProfit / finance.tripAmount) * 100).toFixed(1) : 0;
      const pendingAmount = Number(finance.tripAmount || 0) - Number(finance.paymentReceived || 0);

      const newFinance = {
        ...finance,
        id: finance.id || `FIN-${Date.now().toString().slice(-4)}`,
        totalExpenses,
        netProfit,
        profitMargin: parseFloat(profitMargin),
        pendingAmount,
        status: pendingAmount === 0 ? 'Paid' : (finance.paymentReceived > 0 ? 'Partial' : 'Pending'),
        recordedAt: finance.recordedAt || new Date().toISOString().split('T')[0],
      };
      
      list.unshift(newFinance);
      write(FINANCES_KEY, list);
      return newFinance;
    },
    update: (id, updated) => {
      const list = db.finances.getAll();
      const index = list.findIndex(f => f.id === id);
      if (index !== -1) {
        const merged = { ...list[index], ...updated };
        
        const totalExpenses = 
          Number(merged.dieselExpense || 0) + 
          Number(merged.tollExpense || 0) + 
          Number(merged.driverAllowance || 0) + 
          Number(merged.loadingCharge || 0) + 
          Number(merged.unloadingCharge || 0) + 
          Number(merged.otherExpenses || 0);

        const netProfit = Number(merged.tripAmount || 0) - totalExpenses;
        const profitMargin = merged.tripAmount ? ((netProfit / merged.tripAmount) * 100).toFixed(1) : 0;
        const pendingAmount = Number(merged.tripAmount || 0) - Number(merged.paymentReceived || 0);

        list[index] = {
          ...merged,
          totalExpenses,
          netProfit,
          profitMargin: parseFloat(profitMargin),
          pendingAmount,
          status: pendingAmount === 0 ? 'Paid' : (merged.paymentReceived > 0 ? 'Partial' : 'Pending'),
        };
        
        write(FINANCES_KEY, list);
        return list[index];
      }
      return null;
    },
    delete: (id) => {
      const list = db.finances.getAll();
      const filtered = list.filter(f => f.id !== id);
      write(FINANCES_KEY, filtered);
      return true;
    }
  }
};
