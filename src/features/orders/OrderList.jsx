import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  useOrders, 
  useCompanies, 
  useVehicles, 
  useDrivers, 
  useCreateOrder, 
  useCreateTrip
} from '../../services/services';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import { Plus, Send, AlertCircle, ExternalLink } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { GoogleTripRoutePicker, RouteSummary } from '../../components/common/GoogleRouteMap';
import { GOOGLE_MAPS_API_KEY } from '../../components/common/googleMapsConfig';

export const OrderList = () => {
  const { currentRole } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { data: companies } = useCompanies();
  const { data: vehicles } = useVehicles();
  const { data: drivers } = useDrivers();

  const createOrderMutation = useCreateOrder();
  const createTripMutation = useCreateTrip();
  const [isOpen, setIsOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [pickupLocation, setPickupLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [pickupPlace, setPickupPlace] = useState(null);
  const [destinationPlace, setDestinationPlace] = useState(null);
  const [googleRoute, setGoogleRoute] = useState(null);
  const [routeError, setRouteError] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { register: registerAssign, handleSubmit: handleSubmitAssign, reset: resetAssign } = useForm();

  const handleOpenAdd = () => {
    setPickupLocation('');
    setDestination('');
    setPickupPlace(null);
    setDestinationPlace(null);
    setGoogleRoute(null);
    setRouteError('');
    reset({
      companyId: '',
      pickupLocation: '',
      destination: '',
      material: '',
      weight: '',
      vehicleRequirement: 'Tata Ace',
      priority: 'Medium',
      deliveryDate: '',
      notes: ''
    });
    setIsOpen(true);
  };

  const handlePickupChange = useCallback((value) => {
    setPickupLocation(value);
    setPickupPlace(null);
    setGoogleRoute(null);
    setRouteError('');
  }, []);

  const handleDestinationChange = useCallback((value) => {
    setDestination(value);
    setDestinationPlace(null);
    setGoogleRoute(null);
    setRouteError('');
  }, []);

  const handlePickupSelect = useCallback((place) => {
    setPickupLocation(place.address);
    setPickupPlace(place);
    setRouteError('');
  }, []);

  const handleDestinationSelect = useCallback((place) => {
    setDestination(place.address);
    setDestinationPlace(place);
    setRouteError('');
  }, []);

  const handleGoogleRoute = useCallback((route) => {
    setGoogleRoute(route);
  }, []);

  const handleOpenAssign = (order) => {
    setSelectedOrder(order);
    resetAssign({
      vehicleId: '',
      driverId: '',
      distance: order.routeDistanceKm || 300,
      estimatedDuration: order.routeDurationHours || 12
    });
    setIsAssignOpen(true);
  };

  const onSubmit = (data) => {
    const selectedPickup = GOOGLE_MAPS_API_KEY ? pickupLocation : data.pickupLocation;
    const selectedDestination = GOOGLE_MAPS_API_KEY ? destination : data.destination;

    if (GOOGLE_MAPS_API_KEY && (!pickupPlace?.location || !destinationPlace?.location)) {
      setRouteError('Choose both pickup and destination from the Google Maps suggestions so the exact point is saved.');
      return;
    }

    if (selectedPickup === selectedDestination) {
      setRouteError('Pickup and destination must be different locations.');
      return;
    }

    const selectedCompany = (companies?.data || []).find(c => c.id === data.companyId);
    const orderPayload = {
      ...data,
      pickupLocation: selectedPickup,
      destination: selectedDestination,
      pickupCoordinates: pickupPlace?.location || null,
      destinationCoordinates: destinationPlace?.location || null,
      pickupPlaceId: pickupPlace?.placeId || null,
      destinationPlaceId: destinationPlace?.placeId || null,
      routeSource: googleRoute ? 'Google Maps' : null,
      routeDistanceKm: googleRoute?.distanceKm || null,
      routeDistanceText: googleRoute?.distanceText || null,
      routeDurationHours: googleRoute?.durationHours || null,
      routeDurationText: googleRoute?.durationText || null,
      companyName: selectedCompany ? selectedCompany.name : ''
    };

    createOrderMutation.mutate(orderPayload, {
      onSuccess: () => {
        setIsOpen(false);
        setPickupLocation('');
        setDestination('');
        setPickupPlace(null);
        setDestinationPlace(null);
        setGoogleRoute(null);
        setRouteError('');
        reset();
      }
    });
  };

  const onSubmitAssign = (data) => {
    // Guard: selectedOrder must be set before submission
    if (!selectedOrder) return;

    // Select uses string values; vehicle/driver ids may be numbers — use == for type-coerced match
    // eslint-disable-next-line eqeqeq
    const selectedVehicle = (vehicles || []).find(v => v.id == data.vehicleId);
    // eslint-disable-next-line eqeqeq
    const selectedDriver = (drivers || []).find(d => d.id == data.driverId);

    if (!selectedVehicle || !selectedDriver) {
      console.error('Vehicle or driver not found for selected ids', data.vehicleId, data.driverId);
      return;
    }

    const tripPayload = {
      orderId: selectedOrder.id,
      companyId: selectedOrder.companyId,
      companyName: selectedOrder.companyName,
      vehicleId: selectedVehicle.id,
      vehicleNumber: selectedVehicle.number,
      driverId: selectedDriver.id,
      driverName: selectedDriver.name,
      pickupLocation: selectedOrder.pickupLocation,
      destination: selectedOrder.destination,
      pickupCoordinates: selectedOrder.pickupCoordinates || null,
      destinationCoordinates: selectedOrder.destinationCoordinates || null,
      pickupPlaceId: selectedOrder.pickupPlaceId || null,
      destinationPlaceId: selectedOrder.destinationPlaceId || null,
      routeSource: selectedOrder.routeSource || null,
      routeDistanceText: selectedOrder.routeDistanceText || null,
      routeDurationText: selectedOrder.routeDurationText || null,
      material: selectedOrder.material,
      weight: selectedOrder.weight,
      distance: Number(data.distance),
      estimatedDuration: Number(data.estimatedDuration),
      remarks: 'Trip scheduled by operations desk.'
    };

    createTripMutation.mutate(tripPayload, {
      onSuccess: () => {
        setIsAssignOpen(false);
        resetAssign();
      }
    });
  };

  const columns = [
    {
      header: 'Order Details',
      accessor: 'id',
      render: (row) => (
        <div className="space-y-0.5">
          <span className="font-bold text-indigo-400 block">{row.id}</span>
          <span className="font-semibold text-slate-300 block">{row.companyName}</span>
          {row.driverName && (
            <div className="text-[10px] text-slate-350 bg-indigo-950/20 border border-indigo-900/30 rounded-md px-2 py-0.5 mt-1 inline-flex flex-col gap-0.5">
              <span className="font-semibold">Driver: {row.driverName}</span>
              {row.vehicleNumber && <span className="text-[9px] text-slate-500">Vehicle: {row.vehicleNumber}</span>}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Route Details',
      accessor: 'pickupLocation',
      render: (row) => (
        <div className="text-xs space-y-0.5">
          <span className="font-semibold text-slate-200 block">
            {row.pickupLocation} → {row.destination}
          </span>
          <span className="text-[10px] text-slate-500 block">Due Date: {row.deliveryDate}</span>
        </div>
      )
    },
    {
      header: 'Consignment',
      accessor: 'material',
      render: (row) => (
        <div className="text-xs space-y-0.5">
          <span className="text-slate-300 block">{row.material}</span>
          <span className="text-slate-500 font-medium block">Load: {row.weight} Tons</span>
        </div>
      )
    },
    {
      header: 'Requirement',
      accessor: 'vehicleRequirement',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-400 bg-slate-900 border border-slate-800 rounded px-2 py-0.5">
          {row.vehicleRequirement}
        </span>
      )
    },
    {
      header: 'Priority',
      accessor: 'priority',
      render: (row) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
          row.priority === 'High' ? 'bg-rose-500/10 text-accent-rose' : 'bg-indigo-500/10 text-accent-indigo'
        }`}>
          {row.priority}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        const statusColors = {
          Pending: 'bg-amber-500/15 text-accent-amber border border-amber-500/20',
          Assigned: 'bg-indigo-500/15 text-accent-indigo border border-indigo-500/20',
          Running: 'bg-sky-500/15 text-accent-sky border border-sky-500/20',
          Delivered: 'bg-emerald-500/15 text-accent-emerald border border-emerald-500/20',
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
      header: 'Actions',
      accessor: 'actions',
      sortable: false,
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end gap-2">
          {row.status === 'Pending' && ['Super Admin', 'Dispatcher'].includes(currentRole) ? (
            <Button
              variant="success"
              size="sm"
              onClick={() => handleOpenAssign(row)}
              className="flex items-center gap-1 text-xs"
            >
              <Send size={12} />
              <span>Assign & Dispatch</span>
            </Button>
          ) : ['Assigned', 'Running'].includes(row.status) ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/trips')}
              className="flex items-center gap-1 text-xs"
            >
              <ExternalLink size={12} />
              <span>View Trip</span>
            </Button>
          ) : (
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider pr-2">
              Processed
            </span>
          )}
        </div>
      )
    }
  ];

  const availableVehicles = vehicles?.filter(v => v.status === 'Available') || [];
  const availableDrivers = drivers?.filter(d => d.status === 'Available') || [];
  const closedOrderStatuses = ['Delivered', 'Completed', 'Cancelled'];
  const activeOrders = (orders || []).filter(order => !closedOrderStatuses.includes(order.status));
  const orderHistory = (orders || []).filter(order => closedOrderStatuses.includes(order.status));

  return (
    <div className="space-y-6 select-none">
      {/* Header toolbar */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-slate-100">
            Transport Orders
          </h1>
          <p className="text-sm text-slate-400">
            Manage incoming transport requirements from client companies and prepare dispatches.
          </p>
        </div>
        {['Super Admin', 'Dispatcher'].includes(currentRole) && (
          <Button variant="primary" size="sm" onClick={handleOpenAdd} className="flex items-center gap-1.5">
            <Plus size={16} />
            <span>Place Order</span>
          </Button>
        )}
      </div>

      {/* Active Orders */}
      {ordersLoading ? (
        <div className="h-64 flex items-center justify-center text-slate-500">Loading orders ledger...</div>
      ) : (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-200">Active Orders</h2>
              <p className="mt-1 text-xs text-slate-500">Pending and in-progress customer requirements.</p>
            </div>
            <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-[10px] font-bold text-indigo-300">
              {activeOrders.length} active
            </span>
          </div>
          <Table
            columns={columns}
            data={activeOrders}
            searchPlaceholder="Search active orders by ID, company, pickup..."
            searchFields={['id', 'companyName', 'pickupLocation', 'destination', 'status']}
          />
        </section>
      )}

      {/* Order History */}
      {!ordersLoading && (
        <section className="space-y-3">
          <div className="flex items-center justify-between border-t border-slate-800 pt-6">
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-300">Order History</h2>
              <p className="mt-1 text-xs text-slate-500">Delivered, completed, and cancelled order records.</p>
            </div>
            <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[10px] font-bold text-slate-400">
              {orderHistory.length} closed
            </span>
          </div>
          <Table
            columns={columns}
            data={orderHistory}
            searchPlaceholder="Search order history..."
            searchFields={['id', 'companyName', 'pickupLocation', 'destination', 'status']}
          />
        </section>
      )}

      {/* Place Order Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Place Transport Order"
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select
            label="Corporate Account"
            required
            error={errors.companyId}
            options={(companies?.data || []).map(c => ({ value: c.id, label: c.name }))}
            placeholder="Select customer client..."
            {...register('companyId', { required: 'Customer is required' })}
          />

          {GOOGLE_MAPS_API_KEY ? (
            <>
              <GoogleTripRoutePicker
                pickup={pickupLocation}
                destination={destination}
                pickupPlace={pickupPlace}
                destinationPlace={destinationPlace}
                onPickupChange={handlePickupChange}
                onDestinationChange={handleDestinationChange}
                onPickupSelect={handlePickupSelect}
                onDestinationSelect={handleDestinationSelect}
                onRoute={handleGoogleRoute}
              />
              <RouteSummary route={googleRoute} />
              {routeError && (
                <p className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[11px] font-semibold text-rose-300">
                  {routeError}
                </p>
              )}
            </>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Pickup Location"
                placeholder="e.g. Pune City Yard"
                required
                error={errors.pickupLocation}
                {...register('pickupLocation', { required: 'Pickup point is required' })}
              />
              <Input
                label="Destination Point"
                placeholder="e.g. Delhi Warehouse"
                required
                error={errors.destination}
                {...register('destination', { required: 'Destination point is required' })}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Material Consignment Type"
              placeholder="e.g. Electronics / FMCG"
              required
              error={errors.material}
              {...register('material', { required: 'Material details are required' })}
            />
            <Input
              label="Consignment Weight (Tons)"
              placeholder="e.g. 15.0"
              required
              error={errors.weight}
              type="number"
              step="any"
              {...register('weight', { required: 'Weight is required' })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Vehicle Requirement"
              options={['Tata Ace', 'Mahindra Bolero Pickup', 'Tata 407', 'Eicher Pro 2049', 'Tata 10-Wheeler', 'Leyland 12-Wheeler', 'Container Truck 32ft']}
              {...register('vehicleRequirement')}
            />
            <Select
              label="Delivery Priority"
              options={['Medium', 'High']}
              {...register('priority')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Expected Delivery Date"
              type="date"
              required
              error={errors.deliveryDate}
              {...register('deliveryDate', { required: 'Date is required' })}
            />
            <Input
              label="Special Remarks / Details"
              placeholder="Delivery restrictions, temperature checks..."
              {...register('notes')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createOrderMutation.isPending}>
              Create Order Entry
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assign & Dispatch Modal */}
      <Modal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        title={`Dispatch Scheduling - ${selectedOrder?.id}`}
        size="md"
      >
        {selectedOrder && (
          <form onSubmit={handleSubmitAssign(onSubmitAssign)} className="space-y-5">
            
            {/* Quick Summary of requirements */}
            <div className="p-3.5 rounded-lg bg-indigo-500/5 border border-indigo-500/10 space-y-1 text-xs">
              <span className="font-bold text-slate-200 block uppercase tracking-wider">Required Profile</span>
              <p className="text-slate-400">
                Asset Needed: <strong className="text-indigo-400">{selectedOrder.vehicleRequirement}</strong> • Cargo: {selectedOrder.material} ({selectedOrder.weight} Tons)
              </p>
              <p className="text-slate-400">
                Route: {selectedOrder.pickupLocation} → {selectedOrder.destination}
              </p>
            </div>

            {availableVehicles.length === 0 || availableDrivers.length === 0 ? (
              <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-lg flex items-center gap-3 text-xs text-rose-400 font-semibold">
                <AlertCircle size={20} className="text-accent-rose flex-shrink-0" />
                <span>Cannot dispatch. Ensure at least 1 Available Vehicle and 1 Available Driver are registered.</span>
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Assign Vehicle"
                required
                options={availableVehicles.map(v => ({ value: v.id, label: `${v.number} (${v.type})` }))}
                placeholder="Select available vehicle..."
                {...registerAssign('vehicleId', { required: true })}
              />
              <Select
                label="Assign Driver"
                required
                options={availableDrivers.map(d => ({ value: d.id, label: `${d.name} (${d.mobile})` }))}
                placeholder="Select available driver..."
                {...registerAssign('driverId', { required: true })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Driving Distance (km)"
                type="number"
                placeholder="e.g. 500"
                required
                {...registerAssign('distance', { required: true })}
              />
              <Input
                label="Est. Duration (Hours)"
                type="number"
                placeholder="e.g. 12"
                required
                {...registerAssign('estimatedDuration', { required: true })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <Button variant="outline" onClick={() => setIsAssignOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="success" 
                disabled={availableVehicles.length === 0 || availableDrivers.length === 0}
                isLoading={createTripMutation.isPending}
              >
                Dispatch Vehicle
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default OrderList;
