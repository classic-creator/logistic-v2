import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTrips, useUpdateTrip } from '../../services/services';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import MapContainer from '../../components/common/MapContainer';
import CreateDispatchForm from './CreateDispatchForm';
import { Compass, PhoneCall, CheckSquare, XSquare, PlusCircle } from 'lucide-react';

export const TripList = () => {
  const navigate = useNavigate();
  const { currentRole } = useSelector((state) => state.auth);
  
  const { data: trips, isLoading } = useTrips();
  const updateTripMutation = useUpdateTrip();

  const [isTrackOpen, setIsTrackOpen] = useState(false);
  const [trackingTrip, setTrackingTrip] = useState(null);
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);

  const canDispatch = ['Super Admin', 'Dispatcher', 'Operations Manager'].includes(currentRole);
  const closedTripStatuses = ['Completed', 'Delivered', 'Cancelled'];
  const activeTrips = (trips || []).filter(trip => !closedTripStatuses.includes(trip.status));
  const tripHistory = (trips || []).filter(trip => closedTripStatuses.includes(trip.status));

  const handleOpenTrack = (e, trip) => {
    e.stopPropagation();
    setTrackingTrip(trip);
    setIsTrackOpen(true);
  };

  const handleCompleteTrip = (id) => {
    if (window.confirm('Force complete this active trip? Odometer logs and POD requirements will be filled automatically.')) {
      updateTripMutation.mutate({
        id,
        data: {
          status: 'Completed',
          remarks: 'Completed manually from operations desk.',
          endOdometer: trackingTrip ? (trackingTrip.startOdometer + trackingTrip.distance) : 40000,
          deliveryPhoto: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=400&q=80',
          podPhoto: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=400&q=80'
        }
      }, {
        onSuccess: () => {
          setIsTrackOpen(false);
        }
      });
    }
  };

  const handleCancelTrip = (e, id) => {
    e.stopPropagation();
    if (window.confirm('Cancel this scheduled trip? Assigned assets and drivers will be freed up.')) {
      updateTripMutation.mutate({
        id,
        data: { status: 'Cancelled', remarks: 'Cancelled by operations supervisor.' }
      });
    }
  };

  const handleCallDriver = (name) => {
    alert(`Initiating simulated voice channel to Driver ${name}: (+91 98765 00XXX)`);
  };

  const columns = [
    {
      header: 'Trip ID',
      accessor: 'id',
      render: (row) => (
        <div className="space-y-0.5">
          <Link to={`/trips/${row.id}`} className="font-bold text-slate-200 block hover:text-indigo-300 hover:underline">{row.id}</Link>
          <span className="text-[10px] text-slate-500 font-mono tracking-wider">ORD: {row.orderId}</span>
        </div>
      )
    },
    {
      header: 'Client Account',
      accessor: 'companyName',
      render: (row) => <span className="font-semibold text-slate-300">{row.companyName}</span>
    },
    {
      header: 'Assigned Crew',
      accessor: 'driverName',
      render: (row) => (
        <div className="text-xs space-y-0.5">
          <span className="text-slate-300 font-medium block">Crew: {row.driverName}</span>
          <span className="text-[10px] text-slate-500 font-mono block">Vehicle: {row.vehicleNumber}</span>
        </div>
      )
    },
    {
      header: 'Route Details',
      accessor: 'pickupLocation',
      render: (row) => (
        <div className="text-xs space-y-0.5">
          <span className="font-semibold text-slate-300 block">
            {row.pickupLocation} → {row.destination}
          </span>
          <span className="text-[10px] text-slate-500 block">Distance: {row.distance} km</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        const statusColors = {
          Assigned: 'bg-indigo-500/15 text-accent-indigo border border-indigo-500/20',
          Running: 'bg-sky-500/15 text-accent-sky border border-sky-500/20',
          Delivered: 'bg-emerald-500/15 text-accent-emerald border border-emerald-500/20',
          Completed: 'bg-emerald-500/15 text-accent-emerald border border-emerald-500/20',
          Cancelled: 'bg-slate-800 text-slate-500 border border-slate-700/60'
        };
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${statusColors[row.status]}`}>
            {row.status}
          </span>
        );
      }
    },
    {
      header: 'Tracking & Controls',
      accessor: 'actions',
      sortable: false,
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end gap-2">
          {row.status === 'Running' ? (
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => handleOpenTrack(e, row)}
              className="flex items-center gap-1 text-xs"
            >
              <Compass size={12} className="animate-spin-slow" />
              <span>Track Live</span>
            </Button>
          ) : (
            row.status === 'Assigned' && ['Super Admin', 'Dispatcher'].includes(currentRole) ? (
              <Button
                variant="danger"
                size="sm"
                onClick={(e) => handleCancelTrip(e, row.id)}
                className="flex items-center gap-1 text-xs"
              >
                <XSquare size={12} />
                <span>Cancel</span>
              </Button>
            ) : (
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider pr-2">
                Log Closed
              </span>
            )
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 select-none">
      {/* Header toolbar */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-slate-100">
            Dispatch Operations
          </h1>
          <p className="text-sm text-slate-400">
            Supervise scheduled dispatches, track fleet routes in transit, and resolve delays.
          </p>
        </div>

        {canDispatch && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsDispatchOpen(true)}
            className="flex items-center gap-2"
          >
            <PlusCircle size={16} />
            <span>Create & Dispatch Trip</span>
          </Button>
        )}
      </div>

      {/* Active Trips */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-slate-500">Loading operational trips...</div>
      ) : (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-200">Active Trips</h2>
              <p className="mt-1 text-xs text-slate-500">Assigned and in-transit dispatches requiring attention.</p>
            </div>
            <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-[10px] font-bold text-sky-300">
              {activeTrips.length} active
            </span>
          </div>
          <Table
            columns={columns}
            data={activeTrips}
            searchPlaceholder="Search active trips by ID, vehicle, driver..."
            searchFields={['id', 'vehicleNumber', 'driverName', 'pickupLocation', 'destination', 'status']}
          />
        </section>
      )}

      {/* Trip History */}
      {!isLoading && (
        <section className="space-y-3">
          <div className="flex items-center justify-between border-t border-slate-800 pt-6">
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-300">Trip History</h2>
              <p className="mt-1 text-xs text-slate-500">Completed, delivered, and cancelled dispatch records.</p>
            </div>
            <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[10px] font-bold text-slate-400">
              {tripHistory.length} closed
            </span>
          </div>
          <Table
            columns={columns}
            data={tripHistory}
            searchPlaceholder="Search trip history..."
            searchFields={['id', 'vehicleNumber', 'driverName', 'pickupLocation', 'destination', 'status']}
          />
        </section>
      )}

      {/* Live Tracking HUD Drawer */}
      <Modal
        isOpen={isTrackOpen}
        onClose={() => setIsTrackOpen(false)}
        title={`Live Fleet Tracking - ${trackingTrip?.id}`}
        size="lg"
      >
        {trackingTrip && (
          <div className="space-y-5">
            {/* Visual Vector Map Container */}
            <MapContainer
              pickup={trackingTrip.pickupLocation}
              destination={trackingTrip.destination}
              pickupCoordinates={trackingTrip.pickupCoordinates}
              destinationCoordinates={trackingTrip.destinationCoordinates}
              currentLocation={trackingTrip.currentLocation}
              vehicleNumber={trackingTrip.vehicleNumber}
              driverName={trackingTrip.driverName}
              speed={trackingTrip.speed || 62}
              status={trackingTrip.status}
              eta={trackingTrip.eta || '2.0 hrs'}
              remainingDistance={trackingTrip.remainingDistance || trackingTrip.distance}
              onComplete={() => {
                alert(`Simulated Delivery: Vehicle has reached ${trackingTrip.destination}!`);
              }}
            />

            {/* Operator Actions HUD */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center p-4 border border-slate-800 bg-slate-900/60 rounded-xl gap-3">
              <div className="text-xs">
                <span className="font-bold text-slate-200 block">Communications Desk</span>
                <p className="text-slate-400 mt-0.5">Contact the driver or perform administrative completions.</p>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleCallDriver(trackingTrip.driverName)}
                  className="flex items-center gap-1.5"
                >
                  <PhoneCall size={14} />
                  <span>Call Crew Desk</span>
                </Button>
                {['Super Admin', 'Operations Manager'].includes(currentRole) && (
                  <Button 
                    variant="success" 
                    size="sm" 
                    onClick={() => handleCompleteTrip(trackingTrip.id)}
                    className="flex items-center gap-1.5"
                  >
                    <CheckSquare size={14} />
                    <span>Force Complete</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
      {/* Create & Dispatch Trip Modal */}
      <Modal
        isOpen={isDispatchOpen}
        onClose={() => setIsDispatchOpen(false)}
        title="Create & Dispatch Trip"
        size="lg"
      >
        <CreateDispatchForm
          onDispatched={(trip) => {
            setIsDispatchOpen(false);
            navigate(`/trips/${trip.id}`);
          }}
        />
      </Modal>
    </div>
  );
};

export default TripList;
