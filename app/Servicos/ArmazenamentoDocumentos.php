<?php

namespace App\Servicos;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Documentos ficam em storage/app/documentos — fora de public/, portanto sem
 * URL direta. O download passa sempre pela rota autenticada, que registra o
 * acesso. Em hospedagem compartilhada isso é o que impede alguém de adivinhar
 * o caminho de um RG.
 */
class ArmazenamentoDocumentos
{
    public const DISCO = 'documentos';

    public const MIMES_ACEITOS = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/heic',
        'application/pdf',
    ];

    /** 15 MB — acima disso o php-fpm da hospedagem compartilhada sofre. */
    public const TAMANHO_MAXIMO = 15 * 1024 * 1024;

    public static function validar(UploadedFile $arquivo): ?string
    {
        if (! $arquivo->isValid()) {
            return 'Falha no envio do arquivo. Tente de novo.';
        }
        $mime = $arquivo->getMimeType() ?: '';
        if (! in_array($mime, self::MIMES_ACEITOS, true)) {
            return sprintf('Formato não aceito (%s). Envie JPG, PNG ou PDF.', $mime ?: 'desconhecido');
        }
        if ($arquivo->getSize() > self::TAMANHO_MAXIMO) {
            return sprintf('Arquivo muito grande (máximo %d MB).', self::TAMANHO_MAXIMO / 1024 / 1024);
        }
        if ($arquivo->getSize() === 0) {
            return 'Arquivo vazio.';
        }

        return null;
    }

    /** Grava o arquivo e devolve o caminho relativo ao disco privado. */
    public static function guardar(UploadedFile $arquivo, int $candidatoId): string
    {
        $extensao = strtolower($arquivo->getClientOriginalExtension() ?: 'bin');
        $nome = Str::uuid()->toString().'.'.substr($extensao, 0, 10);
        $caminho = "candidatos/{$candidatoId}/{$nome}";

        Storage::disk(self::DISCO)->put($caminho, file_get_contents($arquivo->getRealPath()));

        return $caminho;
    }

    public static function ler(string $caminho): ?string
    {
        $disco = Storage::disk(self::DISCO);

        return $disco->exists($caminho) ? $disco->get($caminho) : null;
    }

    public static function caminhoAbsoluto(string $caminho): ?string
    {
        $absoluto = Storage::disk(self::DISCO)->path($caminho);

        return is_file($absoluto) ? $absoluto : null;
    }

    public static function excluir(string $caminho): void
    {
        Storage::disk(self::DISCO)->delete($caminho);
    }
}
