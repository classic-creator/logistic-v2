<?php

namespace App\Contracts;

interface OcrScannerInterface
{
    /**
     * Scan an image and extract raw text.
     *
     * @param string $imagePath
     * @return string The extracted raw text.
     */
    public function scan(string $imagePath): string;
}
