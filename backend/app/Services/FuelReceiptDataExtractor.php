<?php

namespace App\Services;

class FuelReceiptDataExtractor
{
    /**
     * Extract structured data from raw OCR text.
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
            'odometer' => null,
            'confidence_score' => 0, // Confidence score (0-100) based on fields found and validation
        ];

        // 1. Extract Quantity (e.g. 120.50 Ltr or Volume :13.90Lts.)
        if (preg_match('/(?:Quantity|Volume)\s*:\s*([\d\.]+)/i', $rawText, $matches)) {
            $data['quantity'] = (float) $matches[1];
        } elseif (preg_match('/([\d\.]+)\s*Lts?/i', $rawText, $matches)) {
            $data['quantity'] = (float) $matches[1];
        }

        // 2. Extract Unit Price / Rate (e.g. 92.50 INR/Ltr or Rate :Rs.71.94)
        if (preg_match('/(?:Rate|Price)\s*:\s*(?:Rs\.?\s*)?([\d\.]+)/i', $rawText, $matches)) {
            $data['unit_price'] = (float) $matches[1];
        }

        // 3. Extract Total Cost / Amount (e.g. Amount: 11146.25 INR or Sale :Rs.1000.00)
        if (preg_match('/(?:Amount|Total|Sale)\s*:\s*(?:Rs\.?\s*)?([\d\.]+)/i', $rawText, $matches)) {
            $data['total_cost'] = (float) $matches[1];
        }

        // 4. Extract Odometer (e.g. Odometer: 45200)
        if (preg_match('/Odometer\s*:\s*([\d\.]+)/i', $rawText, $matches)) {
            $data['odometer'] = (float) $matches[1];
        }

        // 5. Extract Station Name
        if (preg_match('/Dealer\s*:\s*(.+)/i', $rawText, $matches)) {
            $data['station_name'] = trim($matches[1]);
        } elseif (preg_match('/(.+(?:FILLING STATION|PETROL PUMP).*)/i', $rawText, $matches)) {
            $data['station_name'] = trim($matches[1]);
        } else {
            // Fallback to first or second line
            $lines = array_values(array_filter(explode("\n", trim($rawText))));
            if (count($lines) > 1) {
                $firstLine = strtolower(trim($lines[0]));
                $brands = ['indianoil', 'indian oil', 'bharat petroleum', 'hpcl', 'reliance'];
                
                $isBrand = false;
                foreach ($brands as $brand) {
                    if (strpos($firstLine, $brand) !== false) {
                        $isBrand = true;
                        break;
                    }
                }
                
                if ($isBrand) {
                    $data['station_name'] = trim($lines[1]);
                } else {
                    $data['station_name'] = trim($lines[0]);
                }
            } elseif (count($lines) > 0) {
                $data['station_name'] = trim($lines[0]);
            }
        }

        $data['confidence_score'] = $this->calculateConfidence($data);

        return $data;
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
        if ($data['station_name']) $score += 20;
        if ($data['odometer']) $score += 10;

        // Validation Rule: Quantity * Unit Price = Total Cost (with small margin for rounding)
        if ($data['quantity'] && $data['unit_price'] && $data['total_cost']) {
            $calculatedTotal = $data['quantity'] * $data['unit_price'];
            if (abs($calculatedTotal - $data['total_cost']) < 1.0) {
                $score += 10; // Extra points for mathematical consistency
            } else {
                $score -= 20; // Penalty for inconsistency
            }
        }

        return max(0, min(100, $score)); // Ensure between 0 and 100
    }
}
