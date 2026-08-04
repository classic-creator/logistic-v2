import { useMemo, useState } from 'react';
import {
  useFuelPrices,
  useCreateFuelPrice,
  useUpdateFuelPrice,
  useDeleteFuelPrice,
} from '../../services/fuelServices';
import { useCompanies } from '../../services/services';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import Table from '../../components/common/Table';
import { Fuel, PlusCircle, Pencil, Trash2 } from 'lucide-react';

const FUEL_TYPES = ['Diesel', 'Petrol', 'CNG', 'Electric'];
const CITIES = ['Pune', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Jaipur', 'Kolkata', 'Patna', 'Ahmedabad'];

const emptyForm = {
  company_id: '',
  city: '',
  fuel_type: 'Diesel',
  price_per_liter: '',
  effective_from: '',
  effective_to: '',
  is_active: true,
};

export const FuelPrices = () => {
  const { data: prices = [], isLoading } = useFuelPrices();
  const { data: companies } = useCompanies();
  const createMutation = useCreateFuelPrice();
  const updateMutation = useUpdateFuelPrice();
  const deleteMutation = useDeleteFuelPrice();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const companyOptions = useMemo(
    () => (companies?.data || []).map((c) => ({ value: c.id, label: c.name })),
    [companies]
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (price) => {
    setEditing(price);
    setForm({
      company_id: price.companyId || '',
      city: price.city || '',
      fuel_type: price.fuelType,
      price_per_liter: price.pricePerLiter,
      effective_from: price.effectiveFrom || '',
      effective_to: price.effectiveTo || '',
      is_active: price.isActive !== false,
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!form.price_per_liter || Number(form.price_per_liter) <= 0) return;
    const payload = {
      companyId: form.company_id || null,
      city: form.city || null,
      fuelType: form.fuel_type,
      pricePerLiter: Number(form.price_per_liter),
      effectiveFrom: form.effective_from || null,
      effectiveTo: form.effective_to || null,
      isActive: form.is_active,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload }, { onSuccess: () => setModalOpen(false) });
    } else {
      createMutation.mutate(payload, { onSuccess: () => setModalOpen(false) });
    }
  };

  const handleDelete = (price) => {
    if (window.confirm(`Delete the ${price.fuelType} price of ₹${price.pricePerLiter} for ${price.city || 'all cities'}?`)) {
      deleteMutation.mutate(price.id);
    }
  };

  return (
    <div className="space-y-6 select-none">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-slate-100 flex items-center gap-3">
            <Fuel size={26} className="text-accent-amber" />
            Fuel Prices
          </h1>
          <p className="text-sm text-slate-400">
            Maintain fuel prices by city and fuel type. Trips automatically use the price valid at trip start.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={openCreate} className="flex items-center gap-2">
          <PlusCircle size={16} />
          Add Price
        </Button>
      </div>

      <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
        {isLoading ? (
          <div className="h-40 flex items-center justify-center text-slate-500">Loading fuel prices...</div>
        ) : (
          <Table
            columns={[
              { header: 'City', accessor: 'city', render: (r) => <span className="font-bold text-slate-200">{r.city || 'All Cities'}</span> },
              { header: 'Fuel Type', accessor: 'fuelType', render: (r) => <span className="font-semibold text-amber-300">{r.fuelType}</span> },
              { header: 'Price / Liter', accessor: 'pricePerLiter', render: (r) => <span className="font-mono font-bold text-emerald-400">₹{Number(r.pricePerLiter).toFixed(2)}</span> },
              { header: 'Effective From', accessor: 'effectiveFrom', render: (r) => <span className="font-mono text-slate-400">{r.effectiveFrom || '—'}</span> },
              { header: 'Effective To', accessor: 'effectiveTo', render: (r) => <span className="font-mono text-slate-400">{r.effectiveTo || 'Open'}</span> },
              {
                header: 'Status',
                accessor: 'isActive',
                render: (r) => (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${r.isActive ? 'bg-emerald-500/15 text-accent-emerald' : 'bg-slate-800 text-slate-500'}`}>
                    {r.isActive ? 'Active' : 'Inactive'}
                  </span>
                ),
              },
              {
                header: 'Actions',
                accessor: 'actions',
                sortable: false,
                className: 'text-right',
                render: (r) => (
                  <div className="flex justify-end gap-1.5">
                    <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(r)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 cursor-pointer"><Trash2 size={14} /></button>
                  </div>
                ),
              },
            ]}
            data={prices}
            searchFields={['city', 'fuelType']}
            searchPlaceholder="Search by city or fuel type..."
          />
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Fuel Price' : 'Add Fuel Price'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Fuel Type"
              options={FUEL_TYPES}
              value={form.fuel_type}
              onChange={(e) => setForm((p) => ({ ...p, fuel_type: e.target.value }))}
            />
            <Input
              label="Price / Liter (₹)"
              type="number"
              inputMode="decimal"
              placeholder="e.g. 92.50"
              value={form.price_per_liter}
              onChange={(e) => setForm((p) => ({ ...p, price_per_liter: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="City"
              placeholder="All cities"
              options={CITIES}
              value={form.city}
              onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
            />
            <Select
              label="Customer"
              placeholder="All companies"
              options={companyOptions}
              value={form.company_id}
              onChange={(e) => setForm((p) => ({ ...p, company_id: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Effective From" type="date" value={form.effective_from} onChange={(e) => setForm((p) => ({ ...p, effective_from: e.target.value }))} />
            <Input label="Effective To (optional)" type="date" value={form.effective_to} onChange={(e) => setForm((p) => ({ ...p, effective_to: e.target.value }))} />
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
              className="accent-indigo-500"
            />
            Active price
          </label>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Update Price' : 'Save Price'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FuelPrices;
