<?php

namespace App\Http\Controllers;

use App\Models\Candidato;
use App\Servicos\Auditoria;
use App\Servicos\GeradorDossie;
use App\Servicos\GeradorFicha;
use Symfony\Component\HttpFoundation\Response;

class PdfController extends Controller
{
    public function ficha(Candidato $candidato): Response
    {
        abort_if($candidato->anonimizado_em !== null, 404);

        $pdf = GeradorFicha::gerar($candidato);
        Auditoria::registrarAcesso($candidato->id, 'FICHA_PDF');
        Auditoria::registrar('Candidato', $candidato->id, 'DOWNLOAD_FICHA_PDF');

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="'.GeradorFicha::nomeArquivo($candidato, 'ficha').'"',
            'Cache-Control' => 'no-store, private',
        ]);
    }

    /** O PDF único: ficha + todos os anexos, na ordem do checklist. */
    public function dossie(Candidato $candidato): Response
    {
        abort_if($candidato->anonimizado_em !== null, 404);
        abort_unless(auth()->user()->podeOperarDp() || auth()->user()->podeRecrutar(), 403);

        // A hospedagem tem ~342 MB; um dossiê grande precisa de folga.
        @ini_set('memory_limit', '320M');
        @set_time_limit(180);

        $pdf = GeradorDossie::gerar($candidato);

        Auditoria::registrarAcesso($candidato->id, 'DOSSIE_PDF');
        Auditoria::registrar('Candidato', $candidato->id, 'DOWNLOAD_DOSSIE_PDF', [
            'documentos' => $candidato->documentos()->has('arquivos')->count(),
        ]);

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.GeradorFicha::nomeArquivo($candidato, 'dossie').'"',
            'Cache-Control' => 'no-store, private',
        ]);
    }
}
