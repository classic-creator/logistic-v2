<?php

namespace App\Services;

class FuelReceiptDataExtractor
{
    /**
     * Extract structured data and field-level metadata from raw OCR text.
     *
     * @param string $rawText
     * @return array
     */
    public function extract(string $rawText): array
    {
        $data = [
            'quantity' => null,
            'unit_price' => null,
            'total_cost' => null,
            'station_name' => null,
            'station_address' => null,
            'odometer' => null,
            'fuel_type' => 'Diesel',
            'receipt_number' => null,
            'invoice_number' => null,
            'date' => null,
            'time' => null,
            'gst' => null,
            'vehicle_number' => null,
            'payment_method' => 'Cash',
            'confidence_score' => 0,
            'field_metadata' => [],
        ];

        // 1. Quantity
        if (preg_match('/(?:Quantity|Volume|Qty)\s*:\s*([\d\.]+)/i', $rawText, $m)) {
            $data['quantity'] = (float) $m[1];
        } elseif (preg_match('/([\d\.]+)\s*Lts?/i', $rawText, $m)) {
            $data['quantity'] = (float) $m[1];
        }

        // 2. Unit Price / Rate
        if (preg_match('/(?:Rate|Price|Unit Price)\s*:\s*(?:Rs\.?\s*)?([\d\.]+)/i', $rawText, $m)) {
            $data['unit_price'] = (float) $m[1];
        }

        // 3. Total Cost / Sale Amount
        if (preg_match('/(?:Amount|Total|Sale|Net Amount)\s*:\s*(?:Rs\.?\s*)?([\d\.]+)/i', $rawText, $m)) {
            $data['total_cost'] = (float) $m[1];
        }

        // 4. Odometer
        if (preg_match('/(?:Odometer|Odo|KM Reading)\s*:\s*([\d\.]+)/i', $rawText, $m)) {
            $data['odometer'] = (float) $m[1];
        }

        // 5. Fuel Type
        if (preg_match('/(?:Fuel Type|Product)\s*:\s*(Diesel|Petrol|CNG)/i', $rawText, $m)) {
            $data['fuel_type'] = ucfirst(strtolower($m[1]));
        } elseif (preg_match('/\b(Diesel|Petrol|CNG)\b/i', $rawText, $m)) {
            $data['fuel_type'] = ucfirst(strtolower($m[1]));
        }

        // 6. Receipt / Invoice Number
        if (preg_match('/(?:Invoice No|Bill No|Receipt No|Txn ID)\s*:\s*([A-Z0-9\-]+)/i', $rawText, $m)) {
            $data['invoice_number'] = trim($m[1]);
            $data['receipt_number'] = trim($m[1]);
        }

        // 7. Date & Time
        if (preg_match('/(?:Date)\s*:\s*([\d]{2}[\/\-\.][\d]{2}[\/\-\.][\d]{2,4})/i', $rawText, $m)) {
            $data['date'] = $m[1];
        }
        if (preg_match('/(?:Time)\s*:\s*([\d]{2}:[\d]{2}(?::[\d]{2})?)/i', $rawText, $m)) {
            $data['time'] = $m[1];
        }

        // 8. GSTIN
        if (preg_match('/(?:GSTIN|GST No)\s*:\s*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})/i', $rawText, $m)) {
            $data['gst'] = strtoupper($m[1]);
        }

        // 9. Vehicle Number
        if (preg_match('/(?:Vehicle|Reg No|Veh No)\s*:\s*([A-Z]{2}[ -]?[0-9]{2}[ -]?[A-Z]{1,2}[ -]?[0-9]{4})/i', $rawText, $m)) {
            $data['vehicle_number'] = strtoupper(str_replace(' ', '', $m[1]));
        }

        // 10. Payment Method
        if (preg_match('/(?:Payment|Paid Via|Mode)\s*:\s*(Card|UPI|Cash|Fastag|Fleet Card)/i', $rawText, $m)) {
            $data['payment_method'] = ucfirst(strtolower($m[1]));
        }

        // 11. Station Name & Address
        if (preg_match('/Dealer\s*:\s*(.+)/i', $rawText, $m)) {
            $data['station_name'] = trim($m[1]);
        } elseif (preg_match('/(.+(?:FILLING STATION|PETROL PUMP|FUELS).*)/i', $rawText, $m)) {
            $data['station_name'] = trim($m[1]);
        } else {
            $lines = array_values(array_filter(explode("\n", trim($rawText))));
            if (count($lines) > 0) {
                $data['station_name'] = trim($lines[0]);
                if (count($lines) > 1) {
                    $data['station_address'] = trim($lines[1]);
                }
            }
        }

        // Compute total confidence & field-level confidence metadata
        $data['confidence_score'] = $this->calculateConfidence($data);
        $data['field_metadata'] = $this->buildFieldMetadata($data);

        return $data;
    }

    /**
     * Build rich field metadata with value, confidence, source, and validation status.
     */
    protected function buildFieldMetadata(array $data): array
    {
        $mathValid = false;
        if ($data['quantity'] && $data['unit_price'] && $data['total_cost']) {
            $calculatedTotal = $data['quantity'] * $data['unit_price'];
            $mathValid = abs($calculatedTotal - $data['total_cost']) < 1.0;
        }

        return [
            'quantity' => [
                'value' => $data['quantity'],
                'confidence' => $data['quantity'] ? 90 : 0,
                'source' => 'ocr_regex',
                'validation_status' => $data['quantity'] && $data['quantity'] > 0 ? 'VALID' : 'MISSING',
            ],
            'unit_price' => [
                'value' => $data['unit_price'],
                'confidence' => $data['unit_price'] ? 85 : 0,
                'source' => 'ocr_regex',
                'validation_status' => $data['unit_price'] && $data['unit_price'] > 0 ? 'VALID' : 'MISSING',
            ],
            'total_cost' => [
                'value' => $data['total_cost'],
                'confidence' => $data['total_cost'] ? 95 : 0,
                'source' => 'ocr_regex',
                'validation_status' => $mathValid ? 'VERIFIED_MATH' : ($data['total_cost'] ? 'UNVERIFIED' : 'MISSING'),
            ],
            'station_name' => [
                'value' => $data['station_name'],
                'confidence' => $data['station_name'] ? 80 : 0,
                'source' => 'ocr_header',
                'validation_status' => $data['station_name'] ? 'VALID' : 'MISSING',
            ],
            'odometer' => [
                'value' => $data['odometer'],
                'confidence' => $data['odometer'] ? 85 : 0,
                'source' => 'ocr_regex',
                'validation_status' => $data['odometer'] ? 'VALID' : 'MISSING',
            ],
        ];
    }

    /**
     * Calculate confidence score based on found fields and validation rules.
     */
    protected function calculateConfidence(array $data): int
    {
        $score = 0;

        if ($data['quantity']) $score += 20;
        if ($data['unit_price']) $score += 20;
        if ($data['total_cost']) $score += 20;
        if ($data['station_name']) $score += 15;
        if ($data['odometer']) $score += 10;
        if ($data['invoice_number']) $score += 5;

        // Validation Rule: Quantity * Unit Price = Total Cost
        if ($data['quantity'] && $data['unit_price'] && $data['total_cost']) {
            $calculatedTotal = $data['quantity'] * $data['unit_price'];
            if (abs($calculatedTotal - $data['total_cost']) < 1.0) {
                $score += 10; // Bonus points for mathematical consistency
            } else {
                $score -= 15; // Penalty for discrepancy
            }
        }

        return max(0, min(100, $score));
    }
}
