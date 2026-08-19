import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  useDrivers, 
  useCreateDriver, 
  useUpdateDriver, 
  useDeleteDriver 
} from '../../services/services';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import { Plus, Edit2, Trash2, User, Phone, ShieldAlert, Award, Star } from 'lucide-react';
import { useForm } from 'react-hook-form';

export const DriverList = () => {
  const navigate = useNavigate();
  const [queryParams, setQueryParams] = useState({
    page: 1,
    per_page: 25,
    search: '',
    sort: 'created_at',
    sort_direction: 'desc'
  });

  const { data: drivers, isLoading } = useDrivers(queryParams);
  const createMutation = useCreateDriver();
  const updateMutation = useUpdateDriver();
  const deleteMutation = useDeleteDriver();

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
  const [editingDriver, setEditingDriver] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const handleOpenAdd = () => {
    setEditingDriver(null);
    reset({
      name: '',
      mobile: '',
      license: '',
      licenseExpiry: '',
      aadhaar: '',
      emergencyContact: '',
      assignedVehicle: '',
      status: 'Available'
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (e, driver) => {
    e.stopPropagation(); // prevent row click routing
    setEditingDriver(driver);
    reset(driver);
    setIsOpen(true);
  };

  const onSubmit = (data) => {
    if (editingDriver) {
      updateMutation.mutate({ id: editingDriver.id, data }, {
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
    if (window.confirm('Remove this driver record? Historical data will be preserved.')) {
      deleteMutation.mutate(id);
    }
  };

  const columns = [
    {
      header: 'Driver Details',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 font-bold text-sm uppercase">
            {row.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <span className="font-bold text-slate-200 block">{row.name}</span>
            <span className="text-[10px] text-slate-500 font-medium block">ID: {row.id}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Contact & Aadhaar',
      accessor: 'mobile',
      render: (row) => (
        <div className="text-xs space-y-0.5">
          <span className="text-slate-300 font-mono block">{row.mobile}</span>
          <span className="text-[10px] text-slate-500 block">UIDAI: {row.aadhaar}</span>
        </div>
      )
    },
    {
      header: 'Assigned Vehicle',
      accessor: 'assignedVehicle',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-400">
          {row.assignedVehicle || '—'}
        </span>
      )
    },
    {
      header: 'Rating',
      accessor: 'rating',
      render: (row) => (
        <div className="flex items-center gap-1 text-xs text-amber-400">
          <Star size={12} fill="currentColor" />
          <span className="font-bold">{row.rating || '5.0'}</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        const statusColors = {
          Available: 'bg-emerald-500/15 text-accent-emerald',
          'On Trip': 'bg-sky-500/15 text-accent-sky',
          Leave: 'bg-amber-500/15 text-accent-amber',
          Offline: 'bg-slate-800 text-slate-500'
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
            Driver Directory
          </h1>
          <p className="text-sm text-slate-400">
            Manage company drivers, licensing validations, safety ratings, and log sheets.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={handleOpenAdd} className="flex items-center gap-1.5">
          <Plus size={16} />
          <span>Register Driver</span>
        </Button>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-slate-500">Loading drivers...</div>
      ) : (
        <Table
          columns={columns}
          data={drivers || []}
          serverPagination={true}
          totalRows={drivers?.meta?.total || (drivers || []).length}
          onFetchData={handleFetchData}
          initialPageSize={25}
          searchPlaceholder="Search drivers by name, phone, status..."
          searchFields={['name', 'mobile', 'status', 'assignedVehicle']}
          onRowClick={(row) => navigate(`/drivers/${row.id}`)}
        />
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editingDriver ? 'Edit Driver Profile' : 'Register New Company Driver'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Driver Name"
              placeholder="e.g. Rajesh Kumar"
              required
              error={errors.name}
              icon={User}
              {...register('name', { required: 'Driver name is required' })}
            />
            <Input
              label="Mobile Number"
              placeholder="10-digit phone"
              required
              error={errors.mobile}
              icon={Phone}
              {...register('mobile', { 
                required: 'Mobile is required',
                pattern: { value: /^[6-9]\d{9}$/, message: 'Invalid phone number' }
              })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="License Number"
              placeholder="DL-XXXXXXXXXXXXX"
              required
              error={errors.license}
              {...register('license', { required: 'License is required' })}
            />
            <Input
              label="License Expiry Date"
              type="date"
              required
              error={errors.licenseExpiry}
              {...register('licenseExpiry', { required: 'Expiry date is required' })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Aadhaar UID"
              placeholder="12-digit UIDAI number"
              required
              error={errors.aadhaar}
              {...register('aadhaar', { 
                required: 'Aadhaar is required',
                pattern: { value: /^\d{4}-\d{4}-\d{4}$|^\d{12}$/, message: 'Aadhaar must be 12 digits (e.g. XXXXXXXXXXXX or XXXX-XXXX-XXXX)' }
              })}
            />
            <Input
              label="Emergency Contact Info"
              placeholder="Name & Relationship (Phone)"
              required
              error={errors.emergencyContact}
              {...register('emergencyContact', { required: 'Emergency contact is required' })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Assigned Vehicle Registration"
              placeholder="e.g. KA-03-MM-7890"
              {...register('assignedVehicle')}
            />
            <Select
              label="Duty Status"
              options={['Available', 'On Trip', 'Leave', 'Offline']}
              {...register('status')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editingDriver ? 'Save Changes' : 'Register Driver'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DriverList;
