<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmpregoAnterior extends Model
{
    protected $table = 'empregos_anteriores';

    protected $guarded = [];

    protected $casts = [
        'nao_possui' => 'boolean',
        'data_admissao' => 'date',
        'data_saida' => 'date',
        'ultimo_salario' => 'decimal:2',
    ];
}
