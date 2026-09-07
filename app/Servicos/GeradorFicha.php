<?php

namespace App\Servicos;

use App\Models\Candidato;
use Dompdf\Dompdf;
use Dompdf\Options;

/**
 * Ficha de Solicitação de Emprego em PDF, no layout equivalente ao papel.
 * Renderiza uma view Blade e converte com dompdf (PHP puro, sem binário
 * externo — requisito da hospedagem compartilhada).
 */
class GeradorFicha
{
    public static function gerar(Candidato $candidato): string
    {
        $candidato->loadMissing([
            'funcao', 'filhos', 'cursos', 'referencias', 'empregosAnteriores',
            'informacoesInternas.empresa', 'informacoesInternas.posto',
            'informacoesInternas.escala', 'informacoesInternas.supervisor',
        ]);

        $html = view('pdf.ficha', ['candidato' => $candidato])->render();

        $opcoes = new Options;
        $opcoes->set('isRemoteEnabled', false);       // nada de buscar recurso externo
        $opcoes->set('isHtml5ParserEnabled', true);
        $opcoes->set('defaultFont', 'DejaVu Sans');    // acentos do português
        $opcoes->set('chroot', base_path());

        $dompdf = new Dompdf($opcoes);
        $dompdf->loadHtml($html, 'UTF-8');
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return (string) $dompdf->output();
    }

    public static function nomeArquivo(Candidato $candidato, string $sufixo): string
    {
        $limpo = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', self::semAcento($candidato->nome_completo)) ?? '');
        $limpo = trim($limpo, '-') ?: 'candidato';

        $prefixo = '';
        if ($numero = $candidato->informacoesInternas?->numero_admissao) {
            $prefixo = trim(preg_replace('/[^A-Za-z0-9]+/', '-', $numero) ?? '', '-').'-';
        }

        return "{$prefixo}{$limpo}-{$sufixo}.pdf";
    }

    public static function semAcento(string $texto): string
    {
        $convertido = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $texto);

        return $convertido === false ? $texto : $convertido;
    }
}
