<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Services\Ocr\MockOcrScanner;
use App\Services\TransportDocumentExtractor;

class DocumentReaderController extends Controller
{
    protected MockOcrScanner $scanner;
    protected TransportDocumentExtractor $extractor;

    public function __construct(MockOcrScanner $scanner, TransportDocumentExtractor $extractor)
    {
        $this->scanner = $scanner;
        $this->extractor = $extractor;
    }

    /**
     * Handle transport document upload (PDF/Image) and OCR parsing for Trip Acceptance & Creation.
     */
    public function parseTransportDocument(Request $request)
    {
        $request->validate([
            'document' => 'required|file|mimes:jpg,jpeg,png,webp,pdf|max:10240', // Max 10MB
            'vehicle_id' => 'nullable|string',
            'driver_id' => 'nullable|string',
        ]);

        $file = $request->file('document');
        
        // Store the uploaded document in transport_documents disk
        $path = $file->store('transport_documents', 'public');
        $fullPath = Storage::disk('public')->path($path);

        // 1. Scan image/document to get raw text (Reusing existing OCR scanner interface)
        $rawText = $this->scanner->scan($fullPath);

        // Enhance OCR output for Transport Document sample if raw text is standard mock
        if (str_contains($rawText, 'LEO FILLING STATION')) {
            $rawText = <<<TEXT
AMAZON TRANSPORTATION SERVICES INDIA PVT LTD
Consignment Note / Lorry Receipt (LR)
LR No: AMZ-LR-884920
Order ID: AMZ9842104
Invoice No: INV-2026-9921
Customer: Amazon
Pickup Location: Guwahati Hub, Assam
Pickup Address: Plot 42, Logistics Park, Guwahati
Pickup Contact: +91 98765 43210
Delivery Location: Siliguri Hub, West Bengal
Delivery Address: Gate 3, Amazon Fulfillment Center, Siliguri
Delivery Contact: +91 98123 45678
Date: 12/08/2026
Material: Retail & Electronics Consignment
Packages: 240 Boxes
Weight: 1.25 Tons
Declared Value: Rs. 450,000.00
Vehicle No: AS 01 AB 1234
Driver: Ramesh Kumar
TEXT;
        }

        // 2. Extract structured transport fields, perform customer match & ERP validations
        $result = $this->extractor->extract($rawText, [
            'vehicle_id' => $request->input('vehicle_id'),
            'driver_id'  => $request->input('driver_id'),
        ]);

        // 3. Attach file URL and original filename to response
        $documentUrl = Storage::disk('public')->url($path);
        
        return response()->json([
            'success' => true,
            'message' => 'Transport document processed successfully',
            'data'    => array_merge($result, [
                'document_path' => $path,
                'document_url'  => $documentUrl,
                'file_name'     => $file->getClientOriginalName(),
                'raw_text'      => $rawText,
            ]),
        ]);
    }
}
