<?php

return [
    /*
    |--------------------------------------------------------------------------
    | OCR Provider Selection
    |--------------------------------------------------------------------------
    |
    | Supported providers: "mock", "tesseract", "aws_textract", "google_vision"
    |
    */
    'provider' => env('OCR_PROVIDER', 'mock'),

    'tesseract' => [
        'binary_path' => env('TESSERACT_PATH', 'tesseract'),
        'language' => env('TESSERACT_LANG', 'eng'),
    ],

    'aws_textract' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'google_vision' => [
        'key_file' => env('GOOGLE_VISION_KEY_FILE'),
    ],
];
