<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Services\Ocr\MockOcrScanner;
use App\Services\FuelReceiptDataExtractor;

class FuelReceiptScannerController extends Controller
{
    protected MockOcrScanner $scanner;
    protected FuelReceiptDataExtractor $extractor;

    public function __construct(MockOcrScanner $scanner, FuelReceiptDataExtractor $extractor)
    {
        $this->scanner = $scanner;
        $this->extractor = $extractor;
    }

    /**
     * Handle the receipt upload and parsing.
     */
    public function scan(Request $request)
    {
        $request->validate([
            'receipt' => 'required|image|max:10240', // Max 10MB
        ]);

        $file = $request->file('receipt');
        
        // Store the file temporarily (or permanently in a secure disk)
        $path = $file->store('fuel_receipts', 'public');
        $fullPath = Storage::disk('public')->path($path);

        // 1. Scan the image to get raw text
        $rawText = $this->scanner->scan($fullPath);

        // 2. Extract structured data from raw text
        $extractedData = $this->extractor->extract($rawText);

        // 3. Return the data along with the saved file path
        return response()->json([
            'success' => true,
            'message' => 'Receipt scanned successfully',
            'data' => array_merge($extractedData, [
                'receipt_path' => $path, // Pass back to frontend so it can be saved with the FuelEntry
                'raw_text' => $rawText // Optional: useful for debugging or driver manual verification
            ])
        ]);
    }
}
