<?php

namespace App\Services\Ocr;

use App\Contracts\OcrScannerInterface;

class MockOcrScanner implements OcrScannerInterface
{
    /**
     * Simulate scanning an image by returning predefined text.
     * In a real implementation, this would call Google Cloud Vision or Tesseract.
     *
     * @param string $imagePath
     * @return string
     */
    public function scan(string $imagePath): string
    {
        // Simulate network/processing delay
        sleep(2);

        return <<<TEXT
IndianOil
LEO FILLING STATION
SEC.18 ROHINI DELHI 85
PH.NO.27898282.27295502
TIN.NO.07860224457

Bill No:Feb-58854-ORGNL
Trns.ID:
Atnd.ID:
Receipt:Physical Receipt
Vehi.No:NotEntered
Mob.No :NotEntered
Date   :15/02/2020
Time   :20:44:36
FP. ID :3
Nozl No:3
Fuel   :PETROL
Preset :Rs.1000
Rate   :Rs.71.94
Sale   :Rs.1000.00
Volume :13.90Lts.
TEXT;
    }
}
