import React, { useState } from 'react';
import { 
  useCompanies, 
  useCreateCompany, 
  useUpdateCompany, 
  useDeleteCompany 
} from '../../services/services';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import { Plus, Edit2, Trash2, Building2, User, Phone, Mail, Award } from 'lucide-react';
import { useForm } from 'react-hook-form';

export const CompanyList = () => {
  const { data: companies, isLoading } = useCompanies();
  const createMutation = useCreateCompany();
  const updateMutation = useUpdateCompany();
  const deleteMutation = useDeleteCompany();

  const [isOpen, setIsOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const handleOpenAdd = () => {
    setEditingCompany(null);
    reset({
      name: '',
      gst: '',
      address: '',
      contactPerson: '',
      phone: '',
      email: '',
      paymentTerms: 'Net 30',
      status: 'Active'
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (company) => {
    setEditingCompany(company);
    reset(company);
    setIsOpen(true);
  };

  const onSubmit = (data) => {
    if (editingCompany) {
      updateMutation.mutate({ id: editingCompany.id, data }, {
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

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this customer account? All history will remain archived.')) {
      deleteMutation.mutate(id);
    }
  };

  const columns = [
    {
      header: 'Company Details',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-accent-indigo">
            <Building2 size={16} />
          </div>
          <div>
            <span className="font-bold text-slate-200 block">{row.name}</span>
            <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase block">GST: {row.gst}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Contact Person',
      accessor: 'contactPerson',
      render: (row) => (
        <div className="space-y-0.5">
          <span className="font-semibold text-slate-300 block">{row.contactPerson}</span>
          <span className="text-xs text-slate-500 block">{row.email}</span>
        </div>
      )
    },
    {
      header: 'Phone',
      accessor: 'phone',
      render: (row) => <span className="text-xs font-mono text-slate-400">{row.phone}</span>
    },
    {
      header: 'Payment Terms',
      accessor: 'paymentTerms',
      render: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700/60">
          {row.paymentTerms}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
          row.status === 'Active' ? 'bg-emerald-500/15 text-accent-emerald' : 'bg-rose-500/15 text-accent-rose'
        }`}>
          {row.status}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      sortable: false,
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end gap-1.5">
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
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
      {/* Header toolbar */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-slate-100">
            Account Management
          </h1>
          <p className="text-sm text-slate-400">
            Manage logistics contracting clients and corporate partners.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={handleOpenAdd} className="flex items-center gap-1.5">
          <Plus size={16} />
          <span>Add Company</span>
        </Button>
      </div>

      {/* Main Table View */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-slate-500">Loading clients...</div>
      ) : (
        <Table
          columns={columns}
          data={companies}
          searchPlaceholder="Search by name, GST, contact..."
          searchFields={['name', 'gst', 'contactPerson', 'email', 'phone']}
        />
      )}

      {/* CRUD Creation/Edit Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editingCompany ? 'Edit Company Profile' : 'Add Corporate Client'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Company Legal Name"
              placeholder="e.g. Amazon India"
              required
              error={errors.name}
              {...register('name', { required: 'Company name is required' })}
            />
            <Input
              label="GST Registration Number"
              placeholder="15-digit alpha-numeric"
              required
              error={errors.gst}
              {...register('gst', { 
                required: 'GST number is required',
                pattern: { value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, message: 'Invalid Indian GSTIN format' }
              })}
            />
          </div>

          <Input
            label="Corporate Address"
            placeholder="Full physical address..."
            required
            error={errors.address}
            {...register('address', { required: 'Address is required' })}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Contact Person Name"
              placeholder="e.g. John Doe"
              required
              error={errors.contactPerson}
              icon={User}
              {...register('contactPerson', { required: 'Contact name is required' })}
            />
            <Input
              label="Phone Number"
              placeholder="10-digit mobile"
              required
              error={errors.phone}
              icon={Phone}
              {...register('phone', { 
                required: 'Phone is required',
                pattern: { value: /^[6-9]\d{9}$/, message: 'Invalid Indian phone number' }
              })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              placeholder="shipping@company.com"
              required
              error={errors.email}
              icon={Mail}
              {...register('email', { 
                required: 'Email is required',
                pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
              })}
            />
            <Select
              label="Payment Terms"
              options={[
                { value: 'Net 15', label: 'Net 15 Days' },
                { value: 'Net 30', label: 'Net 30 Days' },
                { value: 'Net 45', label: 'Net 45 Days' },
                { value: 'Net 60', label: 'Net 60 Days' },
                { value: 'COD', label: 'Cash on Delivery' }
              ]}
              {...register('paymentTerms')}
            />
          </div>

          <Select
            label="Account Status"
            options={['Active', 'Inactive']}
            {...register('status')}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editingCompany ? 'Save Changes' : 'Register Account'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CompanyList;
