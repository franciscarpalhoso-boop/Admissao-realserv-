<?php

namespace App\Servicos;

use App\Models\AcessoDossie;
use App\Models\LogAuditoria;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class Auditoria
{
    public static function registrar(
        string $entidade,
        string|int $entidadeId,
        string $acao,
        array $detalhes = [],
        ?string $autorLabel = null,
    ): void {
        $usuario = Auth::user();

        LogAuditoria::create([
            'usuario_id' => $usuario?->id,
            'autor_label' => $autorLabel ?? $usuario?->nome ?? 'Candidato (link público)',
            'entidade' => $entidade,
            'entidade_id' => (string) $entidadeId,
            'acao' => $acao,
            'detalhes' => $detalhes,
            'ip' => Request::ip(),
        ]);
    }

    /** Registra todo acesso ao dossiê, à ficha e aos documentos (exigência de LGPD). */
    public static function registrarAcesso(int $candidatoId, string $tipo, ?string $referencia = null): void
    {
        AcessoDossie::create([
            'candidato_id' => $candidatoId,
            'usuario_id' => Auth::id(),
            'tipo' => $tipo,
            'referencia' => $referencia,
            'ip' => Request::ip(),
        ]);
    }
}
