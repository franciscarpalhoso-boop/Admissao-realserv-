<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DocumentoCandidato extends Model
{
    protected $table = 'documentos_candidato';

    protected $guarded = [];

    protected $casts = ['extra' => 'boolean', 'conferido_em' => 'datetime'];

    public function candidato(): BelongsTo
    {
        return $this->belongsTo(Candidato::class);
    }

    public function arquivos(): HasMany
    {
        return $this->hasMany(ArquivoDocumento::class, 'documento_id')->orderBy('created_at');
    }

    public const STATUS = [
        'PENDENTE' => 'Pendente',
        'ENVIADO' => 'Enviado',
        'CONFERIDO' => 'Conferido',
        'COM_PENDENCIA' => 'Com pendência',
    ];

    public function rotuloStatus(): string
    {
        return self::STATUS[$this->status] ?? $this->status;
    }

    public function corStatus(): string
    {
        return match ($this->status) {
            'CONFERIDO' => 'bg-emerald-100 text-emerald-800 border-emerald-200',
            'ENVIADO' => 'bg-sky-100 text-sky-800 border-sky-200',
            'COM_PENDENCIA' => 'bg-red-100 text-red-800 border-red-200',
            default => 'bg-slate-100 text-slate-600 border-slate-200',
        };
    }
}
