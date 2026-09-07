<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Funcao extends Model
{
    protected $table = 'funcoes';

    protected $guarded = [];

    protected $casts = [
        'exige_cnh' => 'boolean',
        'exige_sapato_preto' => 'boolean',
        'ativo' => 'boolean',
    ];

    /** @return array<int,string> */
    public function listaRequisitos(): array
    {
        return array_values(array_filter(array_map('trim', explode("\n", (string) $this->requisitos))));
    }
}
