<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArquivoDocumento extends Model
{
    protected $table = 'arquivos_documento';

    protected $guarded = [];

    public function documento(): BelongsTo
    {
        return $this->belongsTo(DocumentoCandidato::class, 'documento_id');
    }

    public function ehImagem(): bool
    {
        return str_starts_with($this->mime_type, 'image/');
    }

    /** Formatos que o dossiê consegue incorporar diretamente. */
    public function entraNoDossie(): bool
    {
        return in_array($this->mime_type, ['image/jpeg', 'image/png', 'application/pdf'], true);
    }
}
