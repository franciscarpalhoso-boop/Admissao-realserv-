<?php

namespace App\Http\Controllers;

use App\Models\ArquivoDocumento;
use App\Servicos\ArmazenamentoDocumentos;
use App\Servicos\Auditoria;
use Symfony\Component\HttpFoundation\Response;

class ArquivoController extends Controller
{
    /**
     * Único caminho de leitura dos documentos: exige sessão, nunca expõe o
     * caminho em disco e registra o acesso.
     */
    public function baixar(ArquivoDocumento $arquivo): Response
    {
        $arquivo->load('documento.candidato');
        abort_if($arquivo->documento->candidato->anonimizado_em !== null, 404);

        $conteudo = ArmazenamentoDocumentos::ler($arquivo->caminho);
        abort_if($conteudo === null, 410, 'Arquivo indisponível no servidor.');

        Auditoria::registrarAcesso(
            $arquivo->documento->candidato_id,
            'DOCUMENTO',
            $arquivo->nome_original
        );

        return response($conteudo, 200, [
            'Content-Type' => $arquivo->mime_type,
            'Content-Disposition' => 'inline; filename="'.addslashes($arquivo->nome_original).'"',
            'Cache-Control' => 'no-store, private',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
