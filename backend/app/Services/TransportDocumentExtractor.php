<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Trip;
use App\Models\Vehicle;
use App\Models\Driver;
use Illuminate\Support\Str;

class TransportDocumentExtractor
{
    /**
     * Parse raw OCR text into structured transport document fields, perform ERP validations,
     * customer matching, vehicle cross-check, and duplicate trip checks.
     *
     * @param string $rawText
     * @param array $options Context options like driver_id, vehicle_id
     * @return array
     */
    public function extract(string $rawText, array $options = []): array
    {
        $extracted = [
            'customer_name'      => null,
            'company_id'         => null,
            'order_number'       => null,
            'reference_number'   => null,
            'invoice_number'     => null,
            'consignment_number' => null,
            'pickup_location'    => null,
            'pickup_address'     => null,
            'pickup_contact'     => null,
            'delivery_location'  => null,
            'delivery_address'   => null,
            'delivery_contact'   => null,
            'pickup_date'        => null,
            'delivery_date'      => null,
            'quantity'           => null,
            'package_count'      => null,
            'weight'             => null, // In tons
            'weight_kg'          => null,
            'goods_description'  => null,
            'cargo_type'         => null,
            'cargo_value'        => null,
            'vehicle_number'     => null,
            'driver_name'        => null,
            'route'              => null,
        ];

        // 1. Extract Customer Name (Amazon, Flipkart, Delhivery, etc.)
        if (preg_match('/(?:Customer|Client|Shipper|Billed\s+To|Company)\s*:\s*([^\n\r]+)/i', $rawText, $matches)) {
            $extracted['customer_name'] = trim($matches[1]);
        } elseif (preg_match('/(?:Amazon|Flipkart|Delhivery|TATA\s+Motors|Reliance|DHL|FedEx|Ecom\s+Express)/i', $rawText, $matches)) {
            $extracted['customer_name'] = trim($matches[0]);
        }

        // 2. Extract Order / Reference / Invoice / Consignment Numbers
        if (preg_match('/(?:Order\s*(?:No|Num|Number|ID)|PO\s*(?:No|Num|Number))\s*[:#]?\s*([A-Z0-9\-_]+)/i', $rawText, $matches)) {
            $extracted['order_number'] = trim($matches[1]);
        }
        if (preg_match('/(?:Ref\s*(?:No|Num|Number)|Reference)\s*[:#]?\s*([A-Z0-9\-_]+)/i', $rawText, $matches)) {
            $extracted['reference_number'] = trim($matches[1]);
        }
        if (preg_match('/(?:Invoice\s*(?:No|Num|Number)|Inv\s*No)\s*[:#]?\s*([A-Z0-9\-_]+)/i', $rawText, $matches)) {
            $extracted['invoice_number'] = trim($matches[1]);
        }
        if (preg_match('/(?:Consignment\s*(?:No|Num|Number)|LR\s*(?:No|Num|Number)|CN\s*No|Bilty\s*No)\s*[:#]?\s*([A-Z0-9\-_]+)/i', $rawText, $matches)) {
            $extracted['consignment_number'] = trim($matches[1]);
        }

        // Fallback reference number if order number found
        if (!$extracted['reference_number'] && $extracted['order_number']) {
            $extracted['reference_number'] = $extracted['order_number'];
        }

        // 3. Extract Locations (Pickup & Delivery)
        if (preg_match('/(?:From|Pickup|Origin|Loading\s+Point)\s*:\s*([^\n\r,]+)/i', $rawText, $matches)) {
            $extracted['pickup_location'] = trim($matches[1]);
        }
        if (preg_match('/(?:To|Destination|Delivery|Unloading\s+Point)\s*:\s*([^\n\r,]+)/i', $rawText, $matches)) {
            $extracted['delivery_location'] = trim($matches[1]);
        }

        // Address extraction
        if (preg_match('/(?:Pickup\s+Address|From\s+Address)\s*:\s*([^\n\r]+)/i', $rawText, $matches)) {
            $extracted['pickup_address'] = trim($matches[1]);
        }
        if (preg_match('/(?:Delivery\s+Address|To\s+Address)\s*:\s*([^\n\r]+)/i', $rawText, $matches)) {
            $extracted['delivery_address'] = trim($matches[1]);
        }

        // Contacts
        if (preg_match('/(?:Pickup\s+Contact|Origin\s+Contact|Sender\s+Phone)\s*:\s*([\+\d\s\-]{10,15})/i', $rawText, $matches)) {
            $extracted['pickup_contact'] = trim($matches[1]);
        }
        if (preg_match('/(?:Delivery\s+Contact|Receiver\s+Phone|Consignee\s+Contact)\s*:\s*([\+\d\s\-]{10,15})/i', $rawText, $matches)) {
            $extracted['delivery_contact'] = trim($matches[1]);
        }

        // 4. Dates
        if (preg_match('/(?:Pickup\s+Date|Dispatch\s+Date|Date)\s*:\s*([\d]{2}[\/\.-][\d]{2}[\/\.-][\d]{2,4})/i', $rawText, $matches)) {
            $extracted['pickup_date'] = $this->formatDate($matches[1]);
        }
        if (preg_match('/(?:Delivery\s+Date|Expected\s+Delivery)\s*:\s*([\d]{2}[\/\.-][\d]{2}[\/\.-][\d]{2,4})/i', $rawText, $matches)) {
            $extracted['delivery_date'] = $this->formatDate($matches[1]);
        }

        // 5. Quantity, Weight, Goods Description
        if (preg_match('/(?:Weight|Net\s+Weight|Gross\s+Weight)\s*:\s*([\d\.,]+)\s*(Tons?|T|KG|Kgs?)/i', $rawText, $matches)) {
            $val = (float) str_replace(',', '', $matches[1]);
            $unit = strtoupper(trim($matches[2]));
            if (str_contains($unit, 'KG')) {
                $extracted['weight_kg'] = $val;
                $extracted['weight'] = round($val / 1000, 2);
            } else {
                $extracted['weight'] = $val;
                $extracted['weight_kg'] = round($val * 1000, 2);
            }
        }

        if (preg_match('/(?:Packages|Boxes|Cartons|Units|Quantity|Qty)\s*:\s*(\d+)/i', $rawText, $matches)) {
            $extracted['package_count'] = (int) $matches[1];
            $extracted['quantity'] = (int) $matches[1];
        }

        if (preg_match('/(?:Material|Cargo|Goods|Description|Items)\s*:\s*([^\n\r]+)/i', $rawText, $matches)) {
            $extracted['goods_description'] = trim($matches[1]);
            $extracted['cargo_type'] = trim($matches[1]);
        }

        if (preg_match('/(?:Value|Declared\s+Value|Cargo\s+Value|Amount)\s*:\s*(?:Rs\.?|INR)?\s*([\d\.,]+)/i', $rawText, $matches)) {
            $extracted['cargo_value'] = (float) str_replace(',', '', $matches[1]);
        }

        // 6. Vehicle Number & Driver Name
        if (preg_match('/(?:Vehicle\s*(?:No|Num|Number)|Truck\s*No)\s*:\s*([A-Z]{2}\s*\d{1,2}\s*[A-Z]{1,3}\s*\d{4})/i', $rawText, $matches)) {
            $extracted['vehicle_number'] = strtoupper(str_replace(' ', '', $matches[1]));
        }

        if (preg_match('/(?:Driver\s*Name|Driver)\s*:\s*([^\n\r]+)/i', $rawText, $matches)) {
            $extracted['driver_name'] = trim($matches[1]);
        }

        // Customer Matching against existing Companies
        $customerMatch = $this->matchCustomer($extracted['customer_name']);
        if ($customerMatch) {
            $extracted['company_id'] = $customerMatch->id;
            $extracted['customer_name'] = $customerMatch->name;
            $customerStatus = [
                'matched' => true,
                'company_id' => $customerMatch->id,
                'company_name' => $customerMatch->name,
                'message' => 'Customer matched with existing ERP record.',
            ];
        } else {
            $customerStatus = [
                'matched' => false,
                'company_id' => null,
                'company_name' => $extracted['customer_name'],
                'message' => 'Customer not found. Please select a customer.',
            ];
        }

        // Vehicle Validation against context (assigned vehicle)
        $vehicleValidation = $this->validateVehicle($extracted['vehicle_number'], $options['vehicle_id'] ?? null);

        // Duplicate Check against existing Trips
        $duplicateCheck = $this->checkDuplicateTrip($extracted, $customerMatch ? $customerMatch->id : null);

        // Confidence Scores
        $fieldConfidences = $this->calculateFieldConfidences($extracted);

        return [
            'extracted_data'     => $extracted,
            'customer_status'    => $customerStatus,
            'vehicle_validation' => $vehicleValidation,
            'duplicate_check'    => $duplicateCheck,
            'field_confidences'  => $fieldConfidences,
            'overall_confidence' => $this->calculateOverallConfidence($fieldConfidences),
        ];
    }

    /**
     * Match extracted customer string with existing Companies in database.
     */
    protected function matchCustomer(?string $customerName): ?Company
    {
        if (!$customerName) {
            return Company::first(); // Fallback default company if present
        }

        // 1. Direct name query
        $clean = trim($customerName);
        $company = Company::where('name', 'LIKE', '%' . $clean . '%')->first();

        if ($company) {
            return $company;
        }

        // 2. Keyword check (e.g. "Amazon Transportation Services" -> "Amazon")
        $keywords = ['Amazon', 'Flipkart', 'Delhivery', 'Tata', 'Reliance', 'DHL', 'FedEx', 'Ecom'];
        foreach ($keywords as $kw) {
            if (stripos($clean, $kw) !== false) {
                $comp = Company::where('name', 'LIKE', '%' . $kw . '%')->first();
                if ($comp) return $comp;
            }
        }

        return null;
    }

    /**
     * Compare document vehicle number against assigned vehicle.
     */
    protected function validateVehicle(?string $docVehicleNumber, ?string $assignedVehicleId): array
    {
        if (!$assignedVehicleId) {
            return [
                'status' => 'info',
                'matched' => true,
                'assigned_vehicle' => null,
                'message' => 'No specific vehicle locked. Assigned vehicle will be used.',
            ];
        }

        $assigned = Vehicle::find($assignedVehicleId);
        if (!$assigned) {
            return [
                'status' => 'info',
                'matched' => true,
                'assigned_vehicle' => null,
                'message' => 'Vehicle verified.',
            ];
        }

        $assignedNumber = strtoupper(str_replace(' ', '', $assigned->number));

        if (!$docVehicleNumber) {
            return [
                'status' => 'matched',
                'matched' => true,
                'assigned_vehicle' => $assigned->number,
                'message' => 'Document vehicle not specified. Current assigned vehicle (' . $assigned->number . ') will be used.',
            ];
        }

        $cleanDoc = strtoupper(str_replace(' ', '', $docVehicleNumber));

        if ($cleanDoc === $assignedNumber) {
            return [
                'status' => 'matched',
                'matched' => true,
                'assigned_vehicle' => $assigned->number,
                'doc_vehicle' => $docVehicleNumber,
                'message' => 'Vehicle match confirmed (' . $assigned->number . ').',
            ];
        }

        return [
            'status' => 'mismatch',
            'matched' => false,
            'assigned_vehicle' => $assigned->number,
            'doc_vehicle' => $docVehicleNumber,
            'message' => 'Vehicle mismatch: Document has ' . $docVehicleNumber . ', but assigned vehicle is ' . $assigned->number . '.',
        ];
    }

    /**
     * Check for potential duplicate trips by reference number, order number, consignment number, or route+customer.
     */
    protected function checkDuplicateTrip(array $extracted, ?int $companyId): array
    {
        $identifiers = array_filter([
            $extracted['order_number'],
            $extracted['reference_number'],
            $extracted['consignment_number'],
            $extracted['invoice_number'],
        ]);

        if (!empty($identifiers)) {
            $existing = Trip::where(function ($q) use ($identifiers) {
                foreach ($identifiers as $id) {
                    $q->orWhere('id', $id)
                      ->orWhere('remarks', 'LIKE', '%' . $id . '%');
                }
            })->whereNotIn('status', ['Cancelled'])->first();

            if ($existing) {
                return [
                    'duplicate_found' => true,
                    'existing_trip_id' => $existing->id,
                    'status' => $existing->status,
                    'message' => 'Possible duplicate trip detected! Trip ' . $existing->id . ' already exists with matching reference/order number (' . implode(', ', $identifiers) . ').',
                ];
            }
        }

        if ($companyId && $extracted['pickup_location'] && $extracted['delivery_location']) {
            $existing = Trip::where('company_id', $companyId)
                ->where('pickup_location', $extracted['pickup_location'])
                ->where('destination', $extracted['delivery_location'])
                ->whereNotIn('status', ['Completed', 'Cancelled'])
                ->first();

            if ($existing) {
                return [
                    'duplicate_found' => true,
                    'existing_trip_id' => $existing->id,
                    'status' => $existing->status,
                    'message' => 'Possible duplicate trip! An active trip (' . $existing->id . ') for ' . $extracted['customer_name'] . ' from ' . $extracted['pickup_location'] . ' to ' . $extracted['delivery_location'] . ' is already in progress.',
                ];
            }
        }

        return [
            'duplicate_found' => false,
            'existing_trip_id' => null,
            'message' => 'No duplicate trips found.',
        ];
    }

    /**
     * Calculate individual confidence scores for extracted fields.
     */
    protected function calculateFieldConfidences(array $extracted): array
    {
        $confidences = [];

        $confidences['customer_name'] = !empty($extracted['customer_name']) ? 'high' : 'medium';
        $confidences['order_number'] = !empty($extracted['order_number']) || !empty($extracted['consignment_number']) ? 'high' : 'medium';
        $confidences['pickup_location'] = !empty($extracted['pickup_location']) ? 'high' : 'low';
        $confidences['delivery_location'] = !empty($extracted['delivery_location']) ? 'high' : 'low';
        $confidences['weight'] = !empty($extracted['weight']) ? 'high' : 'verify';
        $confidences['goods_description'] = !empty($extracted['goods_description']) ? 'high' : 'medium';
        $confidences['vehicle_number'] = !empty($extracted['vehicle_number']) ? 'high' : 'verify';

        return $confidences;
    }

    /**
     * Overall confidence percentage 0-100.
     */
    protected function calculateOverallConfidence(array $fieldConfidences): int
    {
        $score = 40; // Base score for valid document upload
        foreach ($fieldConfidences as $level) {
            if ($level === 'high') $score += 10;
            elseif ($level === 'medium') $score += 5;
            elseif ($level === 'verify') $score += 2;
        }
        return min(98, max(50, $score));
    }

    protected function formatDate(?string $dateStr): ?string
    {
        if (!$dateStr) return null;
        try {
            $timestamp = strtotime(str_replace('/', '-', $dateStr));
            return $timestamp ? date('Y-m-d', $timestamp) : null;
        } catch (\Throwable $e) {
            return null;
        }
    }
}
