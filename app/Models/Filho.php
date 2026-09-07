<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Filho extends Model
{
    protected $table = 'filhos';

    protected $guarded = [];

    protected $casts = ['data_nascimento' => 'date'];

    public function candidato(): BelongsTo
    {
        return $this->belongsTo(Candidato::class);
    }
}
