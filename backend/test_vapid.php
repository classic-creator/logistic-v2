<?php

// 65 bytes starting with 0x04 for uncompressed EC public key
$pubBytes = pack('C*', 
  4, 227, 203, 18, 5, 226, 20, 24, 76, 252, 97, 85, 222, 19, 137, 244, 
  251, 80, 2, 70, 78, 17, 220, 68, 77, 253, 90, 80, 85, 30, 24, 119, 
  189, 74, 150, 77, 107, 102, 132, 219, 90, 39, 194, 212, 139, 138, 7, 230, 
  161, 84, 194, 130, 16, 218, 116, 12, 108, 171, 70, 70, 203, 11, 23, 174
);

// 32 bytes for private key
$privBytes = pack('C*',
  12, 34, 56, 78, 90, 12, 34, 56, 78, 90, 12, 34, 56, 78, 90, 12,
  34, 56, 78, 90, 12, 34, 56, 78, 90, 12, 34, 56, 78, 90, 12, 34
);

function base64url_encode($data) {
  return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

$pubBase64 = base64url_encode($pubBytes);
$privBase64 = base64url_encode($privBytes);

echo "Public Key (Length " . strlen($pubBase64) . "): " . $pubBase64 . "\n";
echo "Private Key (Length " . strlen($privBase64) . "): " . $privBase64 . "\n";
