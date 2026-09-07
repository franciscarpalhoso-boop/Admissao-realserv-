<?php

namespace App\Suporte;

use InvalidArgumentException;

/**
 * Numeração da admissão no formato "ADM nn/mm" — sequencial reiniciado a cada
 * mês. Ex.: primeira admissão de setembro = "ADM 01/09".
 */
class Admissao
{
    public static function formatarNumero(int $sequencial, int $mes): string
    {
        if ($sequencial < 1) {
            throw new InvalidArgumentException('Sequencial de admissão deve ser maior ou igual a 1.');
        }
        if ($mes < 1 || $mes > 12) {
            throw new InvalidArgumentException('Mês da admissão deve estar entre 1 e 12.');
        }

        return sprintf('ADM %02d/%02d', $sequencial, $mes);
    }

    /** Próximo sequencial dado o maior já usado no mês (null quando não há nenhum). */
    public static function proximoSequencial(?int $maiorDoMes): int
    {
        return ($maiorDoMes ?? 0) + 1;
    }

    /** @return array{sequencial:int,mes:int}|null */
    public static function parseNumero(string $numero): ?array
    {
        if (! preg_match('/^ADM\s+(\d{2})\/(\d{2})$/', trim($numero), $partes)) {
            return null;
        }
        $sequencial = (int) $partes[1];
        $mes = (int) $partes[2];
        if ($sequencial < 1 || $mes < 1 || $mes > 12) {
            return null;
        }

        return ['sequencial' => $sequencial, 'mes' => $mes];
    }
}
