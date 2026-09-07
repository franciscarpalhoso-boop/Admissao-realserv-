<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Escala extends Model
{
    protected $table = 'escalas';

    protected $guarded = [];

    protected $casts = ['ativo' => 'boolean'];
}
