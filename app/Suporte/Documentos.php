<?php

namespace App\Suporte;

/**
 * Validações e máscaras brasileiras. Funções puras, cobertas por
 * tests/Unit/DocumentosTest.php.
 */
class Documentos
{
    public static function somenteDigitos(?string $valor): string
    {
        return preg_replace('/\D/', '', (string) $valor) ?? '';
    }

    /** Valida CPF pelos dígitos verificadores. Rejeita sequências repetidas. */
    public static function validarCpf(?string $valor): bool
    {
        $cpf = self::somenteDigitos($valor);
        if (strlen($cpf) !== 11) {
            return false;
        }
        if (preg_match('/^(\d)\1{10}$/', $cpf)) {
            return false;
        }

        for ($posicao = 9; $posicao < 11; $posicao++) {
            $soma = 0;
            for ($i = 0; $i < $posicao; $i++) {
                $soma += (int) $cpf[$i] * (($posicao + 1) - $i);
            }
            $resto = ($soma * 10) % 11;
            $digito = ($resto === 10 || $resto === 11) ? 0 : $resto;
            if ($digito !== (int) $cpf[$posicao]) {
                return false;
            }
        }

        return true;
    }

    /** Valida CNPJ pelos dígitos verificadores. */
    public static function validarCnpj(?string $valor): bool
    {
        $cnpj = self::somenteDigitos($valor);
        if (strlen($cnpj) !== 14) {
            return false;
        }
        if (preg_match('/^(\d)\1{13}$/', $cnpj)) {
            return false;
        }

        foreach ([12, 13] as $posicao) {
            $peso = $posicao - 7;
            $soma = 0;
            for ($i = 0; $i < $posicao; $i++) {
                $soma += (int) $cnpj[$i] * $peso;
                $peso--;
                if ($peso < 2) {
                    $peso = 9;
                }
            }
            $resto = $soma % 11;
            $digito = $resto < 2 ? 0 : 11 - $resto;
            if ($digito !== (int) $cnpj[$posicao]) {
                return false;
            }
        }

        return true;
    }

    /** Valida PIS/PASEP/NIT (módulo 11 com pesos 3,2,9,8,7,6,5,4,3,2). */
    public static function validarPis(?string $valor): bool
    {
        $pis = self::somenteDigitos($valor);
        if (strlen($pis) !== 11) {
            return false;
        }
        if (preg_match('/^(\d)\1{10}$/', $pis)) {
            return false;
        }

        $pesos = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        $soma = 0;
        for ($i = 0; $i < 10; $i++) {
            $soma += (int) $pis[$i] * $pesos[$i];
        }
        $resto = $soma % 11;
        $digito = $resto < 2 ? 0 : 11 - $resto;

        return $digito === (int) $pis[10];
    }

    // ----------------------------------------------------------------------
    // Máscaras
    // ----------------------------------------------------------------------

    public static function mascararCpf(?string $valor): string
    {
        $d = substr(self::somenteDigitos($valor), 0, 11);
        if (strlen($d) !== 11) {
            return $d;
        }

        return sprintf('%s.%s.%s-%s', substr($d, 0, 3), substr($d, 3, 3), substr($d, 6, 3), substr($d, 9, 2));
    }

    public static function mascararCnpj(?string $valor): string
    {
        $d = substr(self::somenteDigitos($valor), 0, 14);
        if (strlen($d) !== 14) {
            return $d;
        }

        return sprintf(
            '%s.%s.%s/%s-%s',
            substr($d, 0, 2), substr($d, 2, 3), substr($d, 5, 3), substr($d, 8, 4), substr($d, 12, 2)
        );
    }

    public static function mascararCep(?string $valor): string
    {
        $d = substr(self::somenteDigitos($valor), 0, 8);
        if (strlen($d) !== 8) {
            return $d;
        }

        return substr($d, 0, 5).'-'.substr($d, 5, 3);
    }

    public static function mascararTelefone(?string $valor): string
    {
        $d = substr(self::somenteDigitos($valor), 0, 11);
        if (strlen($d) === 11) {
            return sprintf('(%s) %s-%s', substr($d, 0, 2), substr($d, 2, 5), substr($d, 7, 4));
        }
        if (strlen($d) === 10) {
            return sprintf('(%s) %s-%s', substr($d, 0, 2), substr($d, 2, 4), substr($d, 6, 4));
        }

        return $d;
    }

    public static function mascararPis(?string $valor): string
    {
        $d = substr(self::somenteDigitos($valor), 0, 11);
        if (strlen($d) !== 11) {
            return $d;
        }

        return sprintf('%s.%s.%s-%s', substr($d, 0, 3), substr($d, 3, 5), substr($d, 8, 2), substr($d, 10, 1));
    }

    /** Normaliza um celular brasileiro para o formato do wa.me (55 + DDD + número). */
    public static function normalizarWhatsapp(?string $valor): ?string
    {
        $d = self::somenteDigitos($valor);
        if ($d === '') {
            return null;
        }
        if (str_starts_with($d, '55') && (strlen($d) === 12 || strlen($d) === 13)) {
            return $d;
        }
        if (strlen($d) === 10 || strlen($d) === 11) {
            return '55'.$d;
        }

        return null;
    }
}
