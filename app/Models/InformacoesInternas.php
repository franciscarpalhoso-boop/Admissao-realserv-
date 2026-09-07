<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InformacoesInternas extends Model
{
    protected $table = 'informacoes_internas';

    protected $guarded = [];

    protected $casts = [
        'acumulo_funcao' => 'boolean',
        'vale_transporte' => 'boolean',
        'premio_assiduidade' => 'boolean',
        'base_salarial' => 'decimal:2',
        'data_inicio' => 'date',
        'data_treinamento' => 'date',
    ];

    public function candidato(): BelongsTo
    {
        return $this->belongsTo(Candidato::class);
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function posto(): BelongsTo
    {
        return $this->belongsTo(Posto::class);
    }

    public function escala(): BelongsTo
    {
        return $this->belongsTo(Escala::class);
    }

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(Supervisor::class);
    }
}
