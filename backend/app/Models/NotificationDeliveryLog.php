<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NotificationDeliveryLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'notification_id',
        'channel',
        'status',
        'recipient_target',
        'retry_count',
        'error_message',
        'sent_at',
        'delivered_at',
        'clicked_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'delivered_at' => 'datetime',
        'clicked_at' => 'datetime',
        'retry_count' => 'integer',
    ];

    public function notification()
    {
        return $this->belongsTo(Notification::class);
    }
}
