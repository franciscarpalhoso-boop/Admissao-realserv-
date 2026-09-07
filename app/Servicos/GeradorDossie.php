<?php

namespace App\Servicos;

use App\Models\ArquivoDocumento;
use App\Models\Candidato;
use App\Models\DocumentoCandidato;
use setasign\Fpdi\Fpdi;
use setasign\Fpdi\PdfParser\CrossReference\CrossReferenceException;
use setasign\Fpdi\PdfParser\PdfParserException;
use Throwable;

/**
 * Dossiê de admissão em PDF único: capa + índice + ficha + todos os anexos,
 * na ordem do checklist, cada bloco com sua página separadora.
 *
 * LIMITE CONHECIDO — o parser gratuito do FPDI só importa PDF até a versão
 * 1.4. Scans de celular, CTPS digital e sites do governo costumam sair em
 * 1.5+ (com cross-reference stream) e não podem ser mesclados. Em vez de
 * quebrar a geração, esses arquivos viram uma página de aviso pedindo o
 * reenvio em JPG. Instalando o setasign/fpdi-pdf-parser (licença comercial),
 * o FPDI passa a importar esses PDFs sem precisar mudar este código.
 *
 * Imagens são reduzidas antes de entrar: o php-fpm da hospedagem tem ~342 MB
 * e um processo só; embutir fotos de 12 MP em tamanho original estoura.
 */
class GeradorDossie
{
    private const A4_LARGURA = 210.0;

    private const A4_ALTURA = 297.0;

    private const MARGEM = 12.0;

    public static function gerar(Candidato $candidato): string
    {
        $candidato->loadMissing([
            'funcao', 'filhos', 'documentos.arquivos',
            'informacoesInternas.empresa', 'informacoesInternas.posto', 'informacoesInternas.escala',
        ]);

        $comArquivos = $candidato->documentos
            ->filter(fn (DocumentoCandidato $doc) => $doc->arquivos->isNotEmpty())
            ->sortBy('ordem')
            ->values();

        $pdf = new Fpdi;
        $pdf->SetAutoPageBreak(false);
        $pdf->SetTitle(GeradorFicha::semAcento("Dossie de admissao - {$candidato->nome_completo}"));
        $pdf->SetCreator('Sistema de Admissao - Grupo Real Serv');

        self::capaEIndice($pdf, $candidato, $comArquivos);

        // A ficha é gerada pelo dompdf (PDF 1.4, importável pelo FPDI livre).
        $ficha = GeradorFicha::gerar($candidato);
        $avisosFicha = self::anexarPdf($pdf, $ficha, 'Ficha de Solicitacao de Emprego');
        if ($avisosFicha !== null) {
            self::paginaAviso($pdf, 'Ficha de Solicitação de Emprego', $avisosFicha);
        }

        $numero = 2;
        foreach ($comArquivos as $documento) {
            self::separador($pdf, $documento->nome, $numero, $documento->observacao_dp);
            $numero++;

            foreach ($documento->arquivos as $arquivo) {
                self::anexarArquivo($pdf, $documento, $arquivo);
            }
        }

        return (string) $pdf->Output('S');
    }

    // ------------------------------------------------------------------
    // Anexos
    // ------------------------------------------------------------------

    private static function anexarArquivo(Fpdi $pdf, DocumentoCandidato $documento, ArquivoDocumento $arquivo): void
    {
        $absoluto = ArmazenamentoDocumentos::caminhoAbsoluto($arquivo->caminho);

        if ($absoluto === null) {
            self::paginaAviso(
                $pdf,
                $documento->nome.' — arquivo indisponível',
                "O arquivo \"{$arquivo->nome_original}\" não foi encontrado no servidor no momento da geração."
            );

            return;
        }

        if ($arquivo->mime_type === 'application/pdf') {
            $aviso = self::anexarPdf($pdf, file_get_contents($absoluto), $documento->nome);
            if ($aviso !== null) {
                self::paginaAviso($pdf, $documento->nome.' — '.$arquivo->nome_original, $aviso);
            }

            return;
        }

        self::anexarImagem($pdf, $documento, $arquivo, $absoluto);
    }

    /** @return string|null null quando importou; mensagem de aviso quando não deu. */
    private static function anexarPdf(Fpdi $pdf, string $conteudo, string $rotulo): ?string
    {
        $temporario = tempnam(sys_get_temp_dir(), 'dossie_');
        file_put_contents($temporario, $conteudo);

        try {
            $paginas = $pdf->setSourceFile($temporario);
            for ($i = 1; $i <= $paginas; $i++) {
                $id = $pdf->importPage($i);
                $tamanho = $pdf->getTemplateSize($id);
                $pdf->AddPage($tamanho['orientation'], [$tamanho['width'], $tamanho['height']]);
                $pdf->useTemplate($id);
            }

            return null;
        } catch (CrossReferenceException|PdfParserException $erro) {
            return 'Este PDF usa uma compressão que o leitor gratuito do sistema não abre '
                .'(comum em documentos gerados por celular ou por sites do governo). '
                .'Peça ao candidato para reenviar o documento como foto (JPG) — '
                .'ou instale o FPDI PDF-Parser no servidor para mesclar PDFs deste tipo.';
        } catch (Throwable $erro) {
            return 'Não foi possível incorporar este PDF ('.class_basename($erro).'). '
                .'Pode estar protegido por senha ou corrompido.';
        } finally {
            @unlink($temporario);
        }
    }

    private static function anexarImagem(
        Fpdi $pdf,
        DocumentoCandidato $documento,
        ArquivoDocumento $arquivo,
        string $absoluto,
    ): void {
        $reduzido = self::reduzirImagem($absoluto, $arquivo->mime_type);

        if ($reduzido === null) {
            self::paginaAviso(
                $pdf,
                $documento->nome.' — formato não suportado',
                "O arquivo \"{$arquivo->nome_original}\" ({$arquivo->mime_type}) não pôde ser convertido "
                .'para PDF. Peça ao candidato para reenviar em JPG, PNG ou PDF.'
            );

            return;
        }

        [$caminho, $largura, $altura] = $reduzido;

        try {
            $pdf->AddPage('P', [self::A4_LARGURA, self::A4_ALTURA]);

            $maxLargura = self::A4_LARGURA - self::MARGEM * 2;
            $maxAltura = self::A4_ALTURA - self::MARGEM * 2 - 8;
            $escala = min($maxLargura / $largura, $maxAltura / $altura);
            $l = $largura * $escala;
            $a = $altura * $escala;

            $pdf->Image($caminho, (self::A4_LARGURA - $l) / 2, (self::A4_ALTURA - $a) / 2, $l, $a);

            $pdf->SetFont('Helvetica', '', 7);
            $pdf->SetTextColor(110, 110, 120);
            $pdf->SetXY(self::MARGEM, self::A4_ALTURA - 10);
            $pdf->Cell(0, 4, GeradorFicha::semAcento("{$documento->nome} - {$arquivo->nome_original}"), 0, 0, 'L');
        } finally {
            if ($caminho !== $absoluto) {
                @unlink($caminho);
            }
        }
    }

    /**
     * Reduz a imagem para caber na memória do php-fpm e devolve um JPEG
     * temporário. Devolve null para formatos que o GD não abre (HEIC).
     *
     * @return array{0:string,1:int,2:int}|null
     */
    private static function reduzirImagem(string $absoluto, string $mime): ?array
    {
        $maximo = (int) config('admissao.dossie_max_px', 1600);
        $qualidade = (int) config('admissao.dossie_qualidade_jpeg', 78);

        $origem = match ($mime) {
            'image/jpeg' => @imagecreatefromjpeg($absoluto),
            'image/png' => @imagecreatefrompng($absoluto),
            'image/webp' => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($absoluto) : false,
            default => false,
        };

        if ($origem === false || $origem === null) {
            return null;
        }

        $largura = imagesx($origem);
        $altura = imagesy($origem);
        $escala = min(1, $maximo / max($largura, $altura));

        if ($escala >= 1 && $mime === 'image/jpeg') {
            imagedestroy($origem);

            return [$absoluto, $largura, $altura];
        }

        $novaLargura = max(1, (int) round($largura * $escala));
        $novaAltura = max(1, (int) round($altura * $escala));

        $destino = imagecreatetruecolor($novaLargura, $novaAltura);
        // Fundo branco: PNG com transparência viraria preto no JPEG.
        imagefill($destino, 0, 0, imagecolorallocate($destino, 255, 255, 255));
        imagecopyresampled($destino, $origem, 0, 0, 0, 0, $novaLargura, $novaAltura, $largura, $altura);
        imagedestroy($origem);

        $temporario = tempnam(sys_get_temp_dir(), 'img_').'.jpg';
        imagejpeg($destino, $temporario, $qualidade);
        imagedestroy($destino);

        return [$temporario, $novaLargura, $novaAltura];
    }

    // ------------------------------------------------------------------
    // Páginas geradas
    // ------------------------------------------------------------------

    private static function capaEIndice(Fpdi $pdf, Candidato $candidato, $documentos): void
    {
        $pdf->AddPage('P', [self::A4_LARGURA, self::A4_ALTURA]);
        $t = fn (?string $s) => GeradorFicha::semAcento((string) $s);

        $pdf->SetFillColor(31, 71, 214);
        $pdf->Rect(self::MARGEM, self::MARGEM, 22, 15, 'F');
        $pdf->SetFont('Helvetica', 'B', 13);
        $pdf->SetTextColor(255, 255, 255);
        $pdf->SetXY(self::MARGEM, self::MARGEM + 4);
        $pdf->Cell(22, 7, 'RS', 0, 0, 'C');

        $pdf->SetTextColor(20, 25, 35);
        $pdf->SetFont('Helvetica', 'B', 16);
        $pdf->SetXY(self::MARGEM + 27, self::MARGEM + 2);
        $pdf->Cell(0, 7, 'GRUPO REAL SERV', 0, 1);
        $pdf->SetFont('Helvetica', '', 10);
        $pdf->SetTextColor(110, 110, 120);
        $pdf->SetX(self::MARGEM + 27);
        $pdf->Cell(0, 5, $t('Dossiê de admissão'), 0, 1);

        $pdf->SetDrawColor(31, 71, 214);
        $pdf->SetLineWidth(0.6);
        $pdf->Line(self::MARGEM, 34, self::A4_LARGURA - self::MARGEM, 34);

        $y = 44;
        if ($numero = $candidato->informacoesInternas?->numero_admissao) {
            $pdf->SetFont('Helvetica', 'B', 22);
            $pdf->SetTextColor(31, 71, 214);
            $pdf->SetXY(self::MARGEM, $y);
            $pdf->Cell(0, 10, $numero, 0, 1);
            $y += 13;
        }

        $pdf->SetFont('Helvetica', 'B', 15);
        $pdf->SetTextColor(20, 25, 35);
        $pdf->SetXY(self::MARGEM, $y);
        $pdf->Cell(0, 8, $t($candidato->nome_completo), 0, 1);
        $y += 12;

        $interna = $candidato->informacoesInternas;
        $campos = [
            ['CPF', \App\Suporte\Documentos::mascararCpf($candidato->cpf)],
            ['Data de nascimento', $candidato->data_nascimento?->format('d/m/Y')],
            ['Vaga', $candidato->funcao?->nome],
            ['Empresa contratante', $interna?->empresa?->nome],
            ['Posto', $interna?->posto?->nome],
            ['Escala', $interna?->escala?->nome],
            ['Data de inicio', $interna?->data_inicio?->format('d/m/Y')],
            ['Etapa atual', $candidato->rotuloEtapa()],
        ];

        $coluna = 0;
        $larguraColuna = (self::A4_LARGURA - self::MARGEM * 2) / 2;
        foreach ($campos as [$rotulo, $valor]) {
            $x = self::MARGEM + $coluna * $larguraColuna;
            $pdf->SetFont('Helvetica', '', 7);
            $pdf->SetTextColor(120, 120, 130);
            $pdf->SetXY($x, $y);
            $pdf->Cell($larguraColuna, 4, $t($rotulo), 0, 0);
            $pdf->SetFont('Helvetica', '', 10);
            $pdf->SetTextColor(20, 25, 35);
            $pdf->SetXY($x, $y + 4);
            $pdf->Cell($larguraColuna, 5, $t($valor ?: '—'), 0, 0);
            $coluna++;
            if ($coluna === 2) {
                $coluna = 0;
                $y += 13;
            }
        }
        if ($coluna === 1) {
            $y += 13;
        }

        $y += 8;
        $pdf->SetFont('Helvetica', 'B', 9);
        $pdf->SetTextColor(31, 71, 214);
        $pdf->SetXY(self::MARGEM, $y);
        $pdf->Cell(0, 6, $t('ÍNDICE DO DOSSIÊ'), 0, 1);
        $y += 9;

        $colunas = [12, 105, 40, 20];
        $pdf->SetFont('Helvetica', 'B', 7);
        $pdf->SetTextColor(120, 120, 130);
        foreach ([['#', 0], ['Documento', 1], ['Status', 2], ['Arquivos', 3]] as [$titulo, $i]) {
            $pdf->SetXY(self::MARGEM + array_sum(array_slice($colunas, 0, $i)), $y);
            $pdf->Cell($colunas[$i], 5, $t($titulo), 0, 0);
        }
        $y += 6;

        $linhas = [['1', 'Ficha de Solicitacao de Emprego', 'Gerada pelo sistema', '1']];
        foreach ($documentos as $i => $documento) {
            $linhas[] = [
                (string) ($i + 2),
                $documento->nome,
                $documento->rotuloStatus(),
                (string) $documento->arquivos->count(),
            ];
        }

        $pdf->SetFont('Helvetica', '', 8);
        $pdf->SetTextColor(20, 25, 35);
        foreach ($linhas as $linha) {
            if ($y > self::A4_ALTURA - 40) {
                break;
            }
            foreach ($linha as $i => $celula) {
                $pdf->SetXY(self::MARGEM + array_sum(array_slice($colunas, 0, $i)), $y);
                $pdf->Cell($colunas[$i], 5, $t(mb_strimwidth($celula, 0, 58, '...')), 0, 0);
            }
            $pdf->SetDrawColor(225, 228, 233);
            $pdf->SetLineWidth(0.1);
            $pdf->Line(self::MARGEM, $y + 5.5, self::A4_LARGURA - self::MARGEM, $y + 5.5);
            $y += 7;
        }

        $pdf->SetFont('Helvetica', '', 7);
        $pdf->SetTextColor(120, 120, 130);
        $pdf->SetXY(self::MARGEM, self::A4_ALTURA - 22);
        $pdf->MultiCell(
            self::A4_LARGURA - self::MARGEM * 2,
            3.5,
            $t(sprintf(
                'Dossiê gerado em %s. Documento de uso interno do Grupo Real Serv, contendo dados '
                .'pessoais protegidos pela Lei nº 13.709/2018 (LGPD). O acesso a este arquivo foi '
                .'registrado no log de auditoria do sistema.',
                now()->format('d/m/Y H:i')
            ))
        );
    }

    private static function separador(Fpdi $pdf, string $titulo, int $numero, ?string $observacao): void
    {
        $pdf->AddPage('P', [self::A4_LARGURA, self::A4_ALTURA]);
        $t = fn (?string $s) => GeradorFicha::semAcento((string) $s);

        $pdf->SetFont('Helvetica', 'B', 30);
        $pdf->SetTextColor(220, 224, 230);
        $pdf->SetXY(self::MARGEM, self::A4_ALTURA / 2 - 30);
        $pdf->Cell(0, 14, sprintf('%02d', $numero), 0, 1);

        $pdf->SetFont('Helvetica', 'B', 15);
        $pdf->SetTextColor(20, 25, 35);
        $pdf->SetX(self::MARGEM);
        $pdf->MultiCell(self::A4_LARGURA - self::MARGEM * 2, 8, $t(mb_strtoupper($titulo)));

        $pdf->SetDrawColor(31, 71, 214);
        $pdf->SetLineWidth(0.5);
        $y = $pdf->GetY() + 2;
        $pdf->Line(self::MARGEM, $y, self::A4_LARGURA - self::MARGEM, $y);

        if ($observacao) {
            $pdf->SetFont('Helvetica', '', 9);
            $pdf->SetTextColor(110, 110, 120);
            $pdf->SetXY(self::MARGEM, $y + 5);
            $pdf->MultiCell(self::A4_LARGURA - self::MARGEM * 2, 5, $t('Observação do DP: '.$observacao));
        }
    }

    private static function paginaAviso(Fpdi $pdf, string $titulo, string $mensagem): void
    {
        $pdf->AddPage('P', [self::A4_LARGURA, self::A4_ALTURA]);
        $t = fn (?string $s) => GeradorFicha::semAcento((string) $s);

        $pdf->SetFillColor(255, 246, 230);
        $pdf->SetDrawColor(230, 170, 60);
        $pdf->SetLineWidth(0.4);
        $pdf->Rect(self::MARGEM, self::A4_ALTURA / 2 - 35, self::A4_LARGURA - self::MARGEM * 2, 60, 'FD');

        $pdf->SetFont('Helvetica', 'B', 12);
        $pdf->SetTextColor(140, 90, 10);
        $pdf->SetXY(self::MARGEM + 6, self::A4_ALTURA / 2 - 28);
        $pdf->MultiCell(self::A4_LARGURA - self::MARGEM * 2 - 12, 6, $t($titulo));

        $pdf->SetFont('Helvetica', '', 9);
        $pdf->SetTextColor(90, 70, 30);
        $pdf->SetX(self::MARGEM + 6);
        $pdf->MultiCell(self::A4_LARGURA - self::MARGEM * 2 - 12, 5, $t($mensagem));
    }
}
