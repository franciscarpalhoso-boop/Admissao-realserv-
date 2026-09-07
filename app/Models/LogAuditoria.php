<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LogAuditoria extends Model
{
    protected $table = 'logs_auditoria';

    protected $guarded = [];

    protected $casts = ['detalhes' => 'array'];
}
