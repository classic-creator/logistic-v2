import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  useVehicles, 
  useCreateVehicle, 
  useUpdateVehicle, 
  useDeleteVehicle 
} from '../../services/services';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import { Plus, Edit2, Trash2, Truck, Calendar, Fuel, ShieldAlert } from 'lucide-react';
import { useForm } from 'react-hook-form';

export const VehicleList = () => {
  const navigate = useNavigate();
  const { data: vehicles, isLoading } = useVehicles();
  const createMutation = useCreateVehicle();
  const updateMutation = useUpdateVehicle();
  const deleteMutation = useDeleteVehicle();

  const [isOpen, setIsOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const handleOpenAdd = () => {
    setEditingVehicle(null);
    reset({
      number: '',
      type: '',
      capacity: '',
      fuelType: 'Diesel',
      rc: '',
      insurance: '',
      fitness: '',
      permit: 'National',
      pollution: '',
      gpsId: '',
      status: 'Available'
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (e, vehicle) => {
    e.stopPropagation(); // prevent row click routing
    setEditingVehicle(vehicle);
    reset(vehicle);
    setIsOpen(true);
  };

  const onSubmit = (data) => {
    if (editingVehicle) {
      updateMutation.mutate({ id: editingVehicle.id, data }, {
        onSuccess: () => {
          setIsOpen(false);
          reset();
        }
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          setIsOpen(false);
          reset();
        }
      });
    }
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm('Delete this vehicle registry? All tracking history will remain stored.')) {
      deleteMutation.mutate(id);
    }
  };

  const columns = [
    {
      header: 'Vehicle Number',
      accessor: 'number',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-accent-indigo">
            <Truck size={16} />
          </div>
          <div>
            <span className="font-bold text-slate-200 block">{row.number}</span>
            <span className="text-[10px] text-slate-500 font-medium block">{row.type}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Specs & Capacity',
      accessor: 'capacity',
      render: (row) => (
        <div className="text-xs space-y-0.5">
          <span className="text-slate-300 block">Payload: {row.capacity}</span>
          <span className="text-slate-500 flex items-center gap-1">
            <Fuel size={12} /> {row.fuelType}
          </span>
        </div>
      )
    },
    {
      header: 'Fitness Validity',
      accessor: 'fitness',
      render: (row) => {
        const isExpiringSoon = new Date(row.fitness) < new Date('2026-08-15');
        return (
          <div className="flex items-center gap-1.5 text-xs">
            <Calendar size={12} className={isExpiringSoon ? 'text-accent-rose' : 'text-slate-500'} />
            <span className={isExpiringSoon ? 'text-accent-rose font-semibold' : 'text-slate-400'}>
              {row.fitness}
            </span>
            {isExpiringSoon && <ShieldAlert size={12} className="text-accent-rose animate-bounce" />}
          </div>
        );
      }
    },
    {
      header: 'GPS Terminal ID',
      accessor: 'gpsId',
      render: (row) => <span className="text-xs font-mono text-slate-500">{row.gpsId}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        const statusColors = {
          Available: 'bg-emerald-500/15 text-accent-emerald',
          Running: 'bg-sky-500/15 text-accent-sky',
          Maintenance: 'bg-amber-500/15 text-accent-amber',
          Inactive: 'bg-slate-800 text-slate-500'
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
        <div className="flex justify-end gap-1.5">
          <button
            onClick={(e) => handleOpenEdit(e, row)}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={(e) => handleDelete(e, row.id)}
            className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-accent-rose rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 select-none">
      {/* Header section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-slate-100">
            Fleet Management
          </h1>
          <p className="text-sm text-slate-400">
            Monitor and maintain company-owned vehicles, tracking permits, fitness, and live terminal states.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={handleOpenAdd} className="flex items-center gap-1.5">
          <Plus size={16} />
          <span>Register Vehicle</span>
        </Button>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-slate-500">Loading fleet database...</div>
      ) : (
        <Table
          columns={columns}
          data={vehicles}
          searchPlaceholder="Search vehicles by number, type, status..."
          searchFields={['number', 'type', 'status', 'gpsId']}
          onRowClick={(row) => navigate(`/vehicles/${row.id}`)}
        />
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editingVehicle ? 'Edit Asset Profile' : 'Register New Fleet Vehicle'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Vehicle Registration Number"
              placeholder="e.g. KA-03-MM-7890"
              required
              error={errors.number}
              {...register('number', { 
                required: 'Vehicle number is required',
                pattern: { value: /^[A-Z]{2}[ -]?[0-9]{2}[ -]?[A-Z]{1,2}[ -]?[0-9]{4}$/i, message: 'Invalid Indian Registration format (e.g. KA-03-MM-7890)' }
              })}
            />
            <Input
              label="Vehicle Model/Type"
              placeholder="e.g. Tata 407 / Container"
              required
              error={errors.type}
              {...register('type', { required: 'Vehicle type is required' })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Payload Cargo Capacity"
              placeholder="e.g. 5.0 Tons"
              required
              error={errors.capacity}
              {...register('capacity', { required: 'Capacity is required' })}
            />
            <Select
              label="Fuel Type"
              options={['Diesel', 'CNG', 'Electric', 'Petrol']}
              {...register('fuelType')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="RC Certificate Code"
              placeholder="RC-XXXXXXXX"
              required
              error={errors.rc}
              {...register('rc', { required: 'RC is required' })}
            />
            <Input
              label="Insurance Policy Code"
              placeholder="INS-XXXXXXXX"
              required
              error={errors.insurance}
              {...register('insurance', { required: 'Insurance policy is required' })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fitness Certificate Expiry Date"
              type="date"
              required
              error={errors.fitness}
              {...register('fitness', { required: 'Fitness expiry date is required' })}
            />
            <Input
              label="Pollution Certificate Expiry Date"
              type="date"
              required
              error={errors.pollution}
              {...register('pollution', { required: 'Pollution expiry is required' })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="GPS Telemetry Device ID"
              placeholder="GPS-XXXXXX"
              required
              error={errors.gpsId}
              {...register('gpsId', { required: 'GPS device ID is required' })}
            />
            <Select
              label="State Permit Type"
              options={['National', 'State', 'Local']}
              {...register('permit')}
            />
          </div>

          <Select
            label="Current Fleet Status"
            options={['Available', 'Running', 'Maintenance', 'Inactive']}
            {...register('status')}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editingVehicle ? 'Save Asset Changes' : 'Register Asset'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default VehicleList;
