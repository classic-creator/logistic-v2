export const INITIAL_DRIVER_DATA = {
  name: "Alex Morgan",
  driverId: "DRV-9082",
  phone: "+1 (555) 234-5678",
  rating: 4.9,
  vehicle: {
    model: "Freightliner Cascadia",
    plate: "TX-9842-LOG",
    capacity: "24 Tons / 48 Ft",
    fuelLevel: "82%",
  },
  stats: {
    tripsCompletedToday: 3,
    earningsToday: "$420.00",
    hoursOnline: "6.5 hrs",
    onTimeRate: "98.5%",
  },
  isOnline: true,
};

export const INITIAL_TRIPS = [
  {
    id: "TRIP-10492",
    status: "IN_TRANSIT", // ASSIGNED, IN_TRANSIT, DELIVERED
    cargo: "Industrial Electronics & Parts",
    weight: "14,200 lbs",
    origin: {
      name: "Central Logistics Hub - Bay 4",
      address: "102 Industrial Pkwy, Dallas, TX",
      time: "08:30 AM",
    },
    destination: {
      name: "Metro Retail Distribution Center",
      address: "880 Commerce Blvd, Fort Worth, TX",
      time: "02:15 PM (Est.)",
    },
    distance: "34.2 miles",
    payout: "$280.00",
    dispatcher: "Sarah Jenkins (Dispatched 07:15 AM)",
    customer: "Nexus Distribution Inc.",
    notes: "Requires gate clearance code #4829 upon arrival. Use West gate.",
    timeline: [
      { step: "Assigned", time: "07:15 AM", completed: true },
      { step: "Arrived at Pickup", time: "08:10 AM", completed: true },
      { step: "Loaded & Verified", time: "08:45 AM", completed: true },
      { step: "In Transit", time: "09:00 AM", completed: true },
      { step: "Delivered & Signed", time: "--:--", completed: false },
    ]
  },
  {
    id: "TRIP-10498",
    status: "ASSIGNED",
    cargo: "Automotive Components",
    weight: "18,500 lbs",
    origin: {
      name: "AutoParts Mfg Depot",
      address: "500 Logistics Way, Arlington, TX",
      time: "04:00 PM",
    },
    destination: {
      name: "Assembly Plant Gate #2",
      address: "1200 Manufacturing Rd, Plano, TX",
      time: "07:30 PM",
    },
    distance: "48.6 miles",
    payout: "$340.00",
    dispatcher: "Sarah Jenkins",
    customer: "Apex Motors",
    notes: "Temperature control not required. Check seal #99201 before departure.",
    timeline: [
      { step: "Assigned", time: "10:00 AM", completed: true },
      { step: "Arrived at Pickup", time: "--:--", completed: false },
      { step: "Loaded & Verified", time: "--:--", completed: false },
      { step: "In Transit", time: "--:--", completed: false },
      { step: "Delivered & Signed", time: "--:--", completed: false },
    ]
  },
  {
    id: "TRIP-10488",
    status: "DELIVERED",
    cargo: "Commercial Medical Supplies",
    weight: "8,100 lbs",
    origin: {
      name: "PharmaCare Warehouse",
      address: "300 BioMed Drive, Irving, TX",
      time: "06:00 AM",
    },
    destination: {
      name: "City General Hospital - Dock B",
      address: "900 Medical Center Dr, Dallas, TX",
      time: "08:15 AM",
    },
    distance: "18.4 miles",
    payout: "$190.00",
    dispatcher: "Mike Reynolds",
    customer: "Global Health Logistics",
    notes: "Signed by Dock Manager E. Vance.",
    timeline: [
      { step: "Assigned", time: "05:30 AM", completed: true },
      { step: "Arrived at Pickup", time: "05:55 AM", completed: true },
      { step: "Loaded & Verified", time: "06:15 AM", completed: true },
      { step: "In Transit", time: "06:30 AM", completed: true },
      { step: "Delivered & Signed", time: "08:15 AM", completed: true },
    ]
  }
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: "N-1",
    title: "New Trip Assigned!",
    message: "Trip #TRIP-10498 has been assigned to you for 04:00 PM pickup.",
    time: "10 mins ago",
    type: "TRIP_ASSIGNED",
    unread: true,
  },
  {
    id: "N-2",
    title: "Route Weather Alert",
    message: "Heavy rain reported on I-35 West near Fort Worth. Proceed with caution.",
    time: "45 mins ago",
    type: "ALERT",
    unread: true,
  },
  {
    id: "N-3",
    title: "Payout Received",
    message: "Direct deposit of $420.00 processed for yesterday's completed shifts.",
    time: "3 hours ago",
    type: "PAYMENT",
    unread: false,
  }
];
