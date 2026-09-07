<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MovimentacaoEtapa extends Model
{
    protected $table = 'movimentacoes_etapa';

    protected $guarded = [];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class);
    }
}
