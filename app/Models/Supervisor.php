<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supervisor extends Model
{
    protected $table = 'supervisores';

    protected $guarded = [];

    protected $casts = ['ativo' => 'boolean'];
}
