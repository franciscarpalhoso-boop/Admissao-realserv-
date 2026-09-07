<?php

namespace App\Suporte;

use DateTimeInterface;

/**
 * Regras de obrigatoriedade do checklist admissional, em funções puras.
 * É o mesmo cálculo que alimenta a tela, o bloqueio da admissão e o aviso
 * no topo da página do candidato.
 */
class Checklist
{
    public const EXIGENCIA_OBRIGATORIO = 'OBRIGATORIO';

    public const EXIGENCIA_OPCIONAL = 'OPCIONAL';

    public const EXIGENCIA_CONDICIONAL = 'CONDICIONAL';

    public static function calcularIdade(?DateTimeInterface $nascimento, ?DateTimeInterface $referencia = null): ?int
    {
        if ($nascimento === null) {
            return null;
        }
        $referencia ??= new \DateTimeImmutable('today');

        return (int) $nascimento->diff($referencia)->y;
    }

    /**
     * O item é exigido quando é OBRIGATORIO, ou quando é CONDICIONAL e a
     * condição correspondente se aplica ao candidato.
     *
     * @param  array{sexo:string,funcao_exige_cnh:bool,casado_ou_uniao:bool,idades_filhos:array<int,int>}  $perfil
     */
    public static function itemEhExigido(string $exigencia, string $regra, array $perfil): bool
    {
        if ($exigencia === self::EXIGENCIA_OPCIONAL) {
            return false;
        }
        if ($exigencia === self::EXIGENCIA_OBRIGATORIO && $regra === 'NENHUMA') {
            return true;
        }

        return match ($regra) {
            'NENHUMA' => $exigencia === self::EXIGENCIA_OBRIGATORIO,
            'EXIGE_CNH' => $perfil['funcao_exige_cnh'],
            'SEXO_MASCULINO' => $perfil['sexo'] === 'MASCULINO',
            'POSSUI_FILHOS' => count($perfil['idades_filhos']) > 0,
            'FILHOS_ATE_6' => self::algumaIdade($perfil['idades_filhos'], fn (int $i) => $i <= 6),
            'FILHOS_7_A_14' => self::algumaIdade($perfil['idades_filhos'], fn (int $i) => $i >= 7 && $i <= 14),
            'CASADO_OU_UNIAO' => $perfil['casado_ou_uniao'],
            default => false,
        };
    }

    /** @param  array<int,int>  $idades */
    private static function algumaIdade(array $idades, callable $condicao): bool
    {
        foreach ($idades as $idade) {
            if ($condicao($idade)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Itens exigidos que ainda não estão CONFERIDO.
     *
     * @param  array<int,array{id:mixed,nome:string,exigencia:string,regra:string,status:string}>  $itens
     * @param  array{sexo:string,funcao_exige_cnh:bool,casado_ou_uniao:bool,idades_filhos:array<int,int>}  $perfil
     * @return array<int,array{id:mixed,nome:string,status:string}>
     */
    public static function pendencias(array $itens, array $perfil): array
    {
        $pendentes = [];
        foreach ($itens as $item) {
            if (! self::itemEhExigido($item['exigencia'], $item['regra'], $perfil)) {
                continue;
            }
            if ($item['status'] === 'CONFERIDO') {
                continue;
            }
            $pendentes[] = ['id' => $item['id'], 'nome' => $item['nome'], 'status' => $item['status']];
        }

        return $pendentes;
    }

    /**
     * @param  array<int,array{id:mixed,nome:string,exigencia:string,regra:string,status:string}>  $itens
     * @param  array{sexo:string,funcao_exige_cnh:bool,casado_ou_uniao:bool,idades_filhos:array<int,int>}  $perfil
     */
    public static function podeAdmitir(array $itens, array $perfil): bool
    {
        return self::pendencias($itens, $perfil) === [];
    }
}
