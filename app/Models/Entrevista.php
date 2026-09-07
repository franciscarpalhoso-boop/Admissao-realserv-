<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Entrevista extends Model
{
    protected $table = 'entrevistas';

    protected $guarded = [];

    protected $casts = [
        'data_hora' => 'datetime',
        'realizada' => 'boolean',
        'realizada_em' => 'datetime',
        'disponibilidade_domingos' => 'boolean',
        'restricao_horario_filhos' => 'boolean',
        'possui_cnh' => 'boolean',
        'experiencia_manobra' => 'boolean',
        'conhecimento_informatica' => 'boolean',
        'experiencia_militar_seguranca' => 'boolean',
        'interesse_cursos' => 'boolean',
    ];

    public function candidato(): BelongsTo
    {
        return $this->belongsTo(Candidato::class);
    }

    public function entrevistador(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'entrevistador_id');
    }

    public function postoSugerido(): BelongsTo
    {
        return $this->belongsTo(Posto::class, 'posto_sugerido_id');
    }
}
