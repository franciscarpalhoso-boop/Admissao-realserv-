<?php

namespace Tests\Unit;

use App\Suporte\Admissao;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

class AdmissaoTest extends TestCase
{
    public function test_primeira_admissao_de_setembro_vira_adm_01_09(): void
    {
        $this->assertSame('ADM 01/09', Admissao::formatarNumero(1, 9));
    }

    public function test_preenche_com_zero_a_esquerda(): void
    {
        $this->assertSame('ADM 09/01', Admissao::formatarNumero(9, 1));
        $this->assertSame('ADM 10/12', Admissao::formatarNumero(10, 12));
        $this->assertSame('ADM 99/10', Admissao::formatarNumero(99, 10));
    }

    public function test_nao_trunca_sequencial_acima_de_99(): void
    {
        $this->assertSame('ADM 123/03', Admissao::formatarNumero(123, 3));
    }

    public function test_rejeita_sequencial_invalido(): void
    {
        $this->expectException(InvalidArgumentException::class);
        Admissao::formatarNumero(0, 9);
    }

    public function test_rejeita_mes_invalido(): void
    {
        $this->expectException(InvalidArgumentException::class);
        Admissao::formatarNumero(1, 13);
    }

    public function test_sequencial_comeca_em_1_e_reinicia_a_cada_mes(): void
    {
        $this->assertSame(1, Admissao::proximoSequencial(null));
        $this->assertSame(1, Admissao::proximoSequencial(0));
        $this->assertSame(43, Admissao::proximoSequencial(42));

        // Setembro terminou no 12; outubro começa do 1 porque a busca é por mês.
        $this->assertSame('ADM 13/09', Admissao::formatarNumero(Admissao::proximoSequencial(12), 9));
        $this->assertSame('ADM 01/10', Admissao::formatarNumero(Admissao::proximoSequencial(null), 10));
    }

    public function test_faz_o_caminho_de_volta(): void
    {
        $this->assertSame(['sequencial' => 1, 'mes' => 9], Admissao::parseNumero('ADM 01/09'));
        $this->assertSame(['sequencial' => 13, 'mes' => 12], Admissao::parseNumero('  ADM 13/12  '));
        $this->assertNull(Admissao::parseNumero('ADM 1/9'));
        $this->assertNull(Admissao::parseNumero('ADM 01/13'));
    }
}
