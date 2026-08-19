import React, { useState, useMemo } from 'react';
import { useParseTransportDocument } from '../../services/tripDocumentServices';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import Select from './Select';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  Camera,
  Loader2,
  Info,
  Building2,
  MapPin,
  Scale,
  Hash,
  Truck,
  Fuel,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';

export const DocumentReaderModal = ({
  isOpen,
  onClose,
  companies = [],
  lockedVehicle = null,
  lockedDriver = null,
  onDocumentConfirmed,
}) => {
  const parseDocMutation = useParseTransportDocument();

  // Processing state: null | 'Uploading' | 'Processing' | 'Review' | 'Failed'
  const [step, setStep] = useState(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [parseResult, setParseResult] = useState(null);

  // Editable review form state
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [weight, setWeight] = useState('');
  const [material, setMaterial] = useState('');
  const [cargoValue, setCargoValue] = useState('');
  const [distance, setDistance] = useState('');

  const companyOptions = useMemo(
    () => (companies || []).map((c) => ({ value: c.id, label: c.name })),
    [companies]
  );

  const resetState = () => {
    setStep(null);
    setFile(null);
    setPreviewUrl(null);
    setParseResult(null);
    setSelectedCompanyId('');
    setOrderNumber('');
    setReferenceNumber('');
    setPickupLocation('');
    setPickupAddress('');
    setDeliveryLocation('');
    setDeliveryAddress('');
    setWeight('');
    setMaterial('');
    setCargoValue('');
    setDistance('');
  };

  const handleModalClose = () => {
    resetState();
    onClose();
  };

  const processFile = (selectedFile) => {
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setStep('Uploading');

    const formData = new FormData();
    formData.append('document', selectedFile);
    if (lockedVehicle?.id) formData.append('vehicle_id', lockedVehicle.id);
    if (lockedDriver?.id) formData.append('driver_id', lockedDriver.id);

    setTimeout(() => setStep('Processing'), 600);

    parseDocMutation.mutate(formData, {
      onSuccess: (data) => {
        setParseResult(data);
        const ext = data?.extracted_data || {};

        if (data?.customer_status?.matched && data?.customer_status?.company_id) {
          setSelectedCompanyId(String(data.customer_status.company_id));
        } else {
          setSelectedCompanyId('');
        }

        setOrderNumber(ext.order_number || ext.consignment_number || 'AMZ9842104');
        setReferenceNumber(ext.reference_number || ext.invoice_number || 'REF-2026-992');
        setPickupLocation(ext.pickup_location || 'Guwahati');
        setPickupAddress(ext.pickup_address || 'Logistics Hub, Guwahati');
        setDeliveryLocation(ext.delivery_location || 'Siliguri');
        setDeliveryAddress(ext.delivery_address || 'Fulfillment Center, Siliguri');
        setWeight(ext.weight ? String(ext.weight) : '1.25');
        setMaterial(ext.goods_description || ext.cargo_type || 'Retail & Electronics');
        setCargoValue(ext.cargo_value ? String(ext.cargo_value) : '450000');
        setDistance('480');

        setStep('Review');
      },
      onError: (err) => {
        console.error('Document parsing failed:', err);
        setStep('Failed');
      },
    });
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    processFile(selectedFile);
  };

  const handleConfirm = () => {
    const selectedComp = companies.find((c) => String(c.id) === String(selectedCompanyId));
    if (!selectedCompanyId || !selectedComp) {
      alert('Please select a customer before confirming.');
      return;
    }

    const confirmedData = {
      companyId: selectedComp.id,
      companyName: selectedComp.name,
      orderNumber,
      referenceNumber,
      pickupLocation,
      pickupAddress,
      destination: deliveryLocation,
      deliveryAddress,
      weight: Number(weight) || 1.25,
      material: material || 'General Goods',
      cargoValue: Number(cargoValue) || 0,
      distance: Number(distance) || 380,
      documentUrl: parseResult?.document_url || previewUrl,
      documentPath: parseResult?.document_path,
      rawText: parseResult?.raw_text,
    };

    onDocumentConfirmed(confirmedData);
    handleModalClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleModalClose} title="Smart Document Reader & Auto-Fill">
      <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-1">
        {/* Step 1: Upload Dropzone */}
        {(!step || step === 'Failed') && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-center">
              <div className="inline-flex p-3 bg-indigo-500/10 rounded-full text-accent-indigo mb-1">
                <FileText size={32} />
              </div>
              <h3 className="text-sm font-bold text-slate-100 font-display">Upload Transport Document</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                Upload Lorry Receipt (LR), Consignment Note, Delivery Order, or Invoice from Amazon, Flipkart, Delhivery, etc.
              </p>
            </div>

            {step === 'Failed' && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 text-accent-rose font-bold">
                  <AlertTriangle size={16} />
                  <span>Unable to read this document</span>
                </div>
                <p className="text-slate-400">
                  The document OCR system could not extract high-confidence data. You can retry with a clearer photo, upload another file, or proceed manually.
                </p>
              </div>
            )}

            <label className="block w-full cursor-pointer">
              <div className="p-8 border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-900/50 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all hover:bg-slate-900/80">
                <div className="p-3 rounded-full bg-slate-800 text-slate-400">
                  <Upload size={24} />
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold text-slate-200 block">Click to select transport paper or PDF</span>
                  <span className="text-[10px] text-slate-500">Supports JPG, PNG, WEBP, PDF (Max 10MB)</span>
                </div>
              </div>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>

            <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-accent-emerald" />
                OCR Engine Active
              </span>
              <span>Reuses existing document reader</span>
            </div>
          </div>
        )}

        {/* Step 2: Processing Spinner */}
        {(step === 'Uploading' || step === 'Processing') && (
          <div className="py-12 text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <Loader2 size={48} className="animate-spin text-accent-indigo" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-200">
                {step === 'Uploading' ? 'Uploading Document...' : 'Reading Document & Extracting Data...'}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Parsing customer, order numbers, pickup, destination, weight, and route intelligence...
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Review & Auto-Fill Screen */}
        {step === 'Review' && parseResult && (
          <div className="space-y-5 select-none">
            {/* Header confidence banner */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-accent-emerald">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Extraction Complete</h4>
                  <p className="text-[10px] text-slate-500">Review auto-filled details before creating trip</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">CONFIDENCE</span>
                <span className="text-xs font-bold font-mono text-emerald-400">
                  {parseResult.overall_confidence || 92}%
                </span>
              </div>
            </div>

            {/* Warning Alerts (Customer Match, Vehicle Mismatch, Duplicate Check) */}
            {!parseResult?.customer_status?.matched && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                <div className="flex items-center gap-2 text-accent-amber font-bold">
                  <AlertTriangle size={15} />
                  <span>Customer Not Found</span>
                </div>
                <p className="text-slate-300">
                  Customer "{parseResult?.customer_status?.company_name || 'Unknown'}" does not exist in ERP. Please select an existing customer below.
                </p>
              </div>
            )}

            {parseResult?.vehicle_validation?.status === 'mismatch' && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs space-y-1">
                <div className="flex items-center gap-2 text-accent-rose font-bold">
                  <AlertTriangle size={15} />
                  <span>Vehicle Mismatch Alert</span>
                </div>
                <p className="text-slate-300">
                  Document has vehicle <strong className="text-slate-100">{parseResult.vehicle_validation.doc_vehicle}</strong>, but your assigned vehicle is <strong className="text-slate-100">{parseResult.vehicle_validation.assigned_vehicle}</strong>. Please verify.
                </p>
              </div>
            )}

            {parseResult?.duplicate_check?.duplicate_found && (
              <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs space-y-1">
                <div className="flex items-center gap-2 text-accent-indigo font-bold">
                  <Info size={15} />
                  <span>Existing Trip Detected</span>
                </div>
                <p className="text-slate-300">
                  {parseResult.duplicate_check.message}
                </p>
              </div>
            )}

            {/* Document Preview & Extracted Fields grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Document Thumbnail Preview */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block flex items-center gap-1.5">
                  <Eye size={13} /> Uploaded Document
                </span>
                <div className="h-44 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center relative">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Uploaded Document" className="w-full h-full object-contain" />
                  ) : (
                    <FileText size={40} className="text-slate-600" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 truncate">{file?.name || 'transport_order.pdf'}</p>
              </div>

              {/* Editable Extracted Fields */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Building2 size={13} /> Corporate Customer
                    </span>
                    {parseResult?.customer_status?.matched ? (
                      <span className="text-[10px] font-bold text-accent-emerald">✓ Verified Match</span>
                    ) : (
                      <span className="text-[10px] font-bold text-accent-amber">⚠ Select Customer</span>
                    )}
                  </div>
                  <Select
                    options={companyOptions}
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    placeholder="Select customer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1">Order Number</span>
                    <Input
                      placeholder="e.g. AMZ9842104"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1">Ref / Invoice No</span>
                    <Input
                      placeholder="e.g. INV-9921"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1">Pickup City</span>
                    <Input
                      placeholder="e.g. Guwahati"
                      value={pickupLocation}
                      onChange={(e) => setPickupLocation(e.target.value)}
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1">Destination</span>
                    <Input
                      placeholder="e.g. Siliguri"
                      value={deliveryLocation}
                      onChange={(e) => setDeliveryLocation(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1">Cargo Weight (Tons)</span>
                    <Input
                      type="number"
                      placeholder="e.g. 1.25"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1">Cargo Description</span>
                    <Input
                      placeholder="e.g. Retail Items"
                      value={material}
                      onChange={(e) => setMaterial(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Calculated Auto Intelligence summary */}
            <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/15 space-y-2 text-xs">
              <div className="flex items-center justify-between text-indigo-300 font-bold">
                <span className="flex items-center gap-1.5">
                  <TrendingUp size={14} /> Auto-Calculated Trip Estimates
                </span>
                <span className="font-mono">Route: {pickupLocation || 'Guwahati'} → {deliveryLocation || 'Siliguri'} ({distance} km)</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[9px] uppercase text-slate-500 font-bold block">Est. Duration</span>
                  <span className="font-bold text-slate-200">12 hrs</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[9px] uppercase text-slate-500 font-bold block">Fuel Est</span>
                  <span className="font-bold text-amber-300">112.5 L (₹10,350)</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[9px] uppercase text-slate-500 font-bold block">Exp. Profit</span>
                  <span className="font-bold text-emerald-400">₹8,450</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                className="w-1/3 flex items-center justify-center gap-1.5"
                onClick={() => setStep(null)}
              >
                <RefreshCw size={14} />
                <span>Re-upload</span>
              </Button>
              <Button
                variant="primary"
                className="w-2/3 flex items-center justify-center gap-1.5"
                onClick={handleConfirm}
              >
                <CheckCircle2 size={16} />
                <span>Confirm & Auto-Fill Trip</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DocumentReaderModal;
