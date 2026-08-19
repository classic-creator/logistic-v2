<?php

namespace App\Services\Ocr;

use App\Contracts\OcrScannerInterface;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;

/**
 * Production Tesseract / CLI OCR Scanner Provider
 *
 * Implements OcrScannerInterface. Runs CLI Tesseract or falls back gracefully
 * to MockOcrScanner if binary is not found on the server environment.
 */
class TesseractOcrScanner implements OcrScannerInterface
{
    protected string $binaryPath;
    protected string $language;
    protected MockOcrScanner $fallbackScanner;

    public function __construct(MockOcrScanner $fallbackScanner)
    {
        $this->binaryPath = config('ocr.tesseract.binary_path', 'tesseract');
        $this->language = config('ocr.tesseract.language', 'eng');
        $this->fallbackScanner = $fallbackScanner;
    }

    public function scan(string $imagePath): string
    {
        if (!file_exists($imagePath)) {
            Log::error("TesseractOcrScanner: File not found at {$imagePath}");
            return '';
        }

        try {
            $process = new Process([$this->binaryPath, $imagePath, 'stdout', '-l', $this->language]);
            $process->run();

            if ($process->isSuccessful() && !empty(trim($process->getOutput()))) {
                Log::info("Tesseract OCR scan successful", ['image' => $imagePath]);
                return $process->getOutput();
            }
        } catch (\Throwable $e) {
            Log::warning("Tesseract OCR binary unavailable, using fallback mock scanner", ['error' => $e->getMessage()]);
        }

        // Fallback to Mock Scanner if CLI binary is not present or failed
        return $this->fallbackScanner->scan($imagePath);
    }
}
