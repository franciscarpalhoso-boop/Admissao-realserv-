<?php

namespace Tests\Unit;

use App\Suporte\Checklist;
use DateTimeImmutable;
use PHPUnit\Framework\TestCase;

class ChecklistTest extends TestCase
{
    private array $perfilBase = [
        'sexo' => 'FEMININO',
        'funcao_exige_cnh' => false,
        'casado_ou_uniao' => false,
        'idades_filhos' => [],
    ];

    private function item(array $parcial = []): array
    {
        return array_merge([
            'id' => 1, 'nome' => 'Documento',
            'exigencia' => 'OBRIGATORIO', 'regra' => 'NENHUMA', 'status' => 'PENDENTE',
        ], $parcial);
    }

    public function test_calcula_idade_em_anos_completos(): void
    {
        $hoje = new DateTimeImmutable('2024-09-07');
        $this->assertSame(6, Checklist::calcularIdade(new DateTimeImmutable('2018-09-07'), $hoje));
        $this->assertSame(5, Checklist::calcularIdade(new DateTimeImmutable('2018-09-08'), $hoje));
        $this->assertSame(14, Checklist::calcularIdade(new DateTimeImmutable('2010-01-01'), $hoje));
        $this->assertNull(Checklist::calcularIdade(null, $hoje));
    }

    public function test_item_opcional_nunca_e_exigido(): void
    {
        $this->assertFalse(Checklist::itemEhExigido('OPCIONAL', 'NENHUMA', $this->perfilBase));
        $this->assertFalse(Checklist::itemEhExigido('OPCIONAL', 'SEXO_MASCULINO',
            ['sexo' => 'MASCULINO'] + $this->perfilBase));
    }

    public function test_cnh_so_e_exigida_quando_a_funcao_pede(): void
    {
        $this->assertFalse(Checklist::itemEhExigido('CONDICIONAL', 'EXIGE_CNH', $this->perfilBase));
        $this->assertTrue(Checklist::itemEhExigido('CONDICIONAL', 'EXIGE_CNH',
            ['funcao_exige_cnh' => true] + $this->perfilBase));
    }

    public function test_reservista_so_para_sexo_masculino(): void
    {
        $this->assertFalse(Checklist::itemEhExigido('CONDICIONAL', 'SEXO_MASCULINO', $this->perfilBase));
        $this->assertTrue(Checklist::itemEhExigido('CONDICIONAL', 'SEXO_MASCULINO',
            ['sexo' => 'MASCULINO'] + $this->perfilBase));
        $this->assertFalse(Checklist::itemEhExigido('CONDICIONAL', 'SEXO_MASCULINO',
            ['sexo' => 'NAO_INFORMADO'] + $this->perfilBase));
    }

    public function test_certidao_de_casamento_so_para_casado_ou_uniao(): void
    {
        $this->assertFalse(Checklist::itemEhExigido('CONDICIONAL', 'CASADO_OU_UNIAO', $this->perfilBase));
        $this->assertTrue(Checklist::itemEhExigido('CONDICIONAL', 'CASADO_OU_UNIAO',
            ['casado_ou_uniao' => true] + $this->perfilBase));
    }

    public function test_faixas_etarias_do_salario_familia(): void
    {
        $com = fn (array $idades) => ['idades_filhos' => $idades] + $this->perfilBase;

        $this->assertFalse(Checklist::itemEhExigido('CONDICIONAL', 'POSSUI_FILHOS', $this->perfilBase));
        $this->assertTrue(Checklist::itemEhExigido('CONDICIONAL', 'POSSUI_FILHOS', $com([17])));

        // Vacinação: até 6 anos.
        $this->assertTrue(Checklist::itemEhExigido('CONDICIONAL', 'FILHOS_ATE_6', $com([6])));
        $this->assertFalse(Checklist::itemEhExigido('CONDICIONAL', 'FILHOS_ATE_6', $com([7])));

        // Frequência escolar: de 7 a 14.
        $this->assertTrue(Checklist::itemEhExigido('CONDICIONAL', 'FILHOS_7_A_14', $com([7])));
        $this->assertTrue(Checklist::itemEhExigido('CONDICIONAL', 'FILHOS_7_A_14', $com([14])));
        $this->assertFalse(Checklist::itemEhExigido('CONDICIONAL', 'FILHOS_7_A_14', $com([15])));
        $this->assertFalse(Checklist::itemEhExigido('CONDICIONAL', 'FILHOS_7_A_14', $com([4])));

        // Dois filhos em faixas diferentes acionam os dois itens.
        $this->assertTrue(Checklist::itemEhExigido('CONDICIONAL', 'FILHOS_ATE_6', $com([3, 12])));
        $this->assertTrue(Checklist::itemEhExigido('CONDICIONAL', 'FILHOS_7_A_14', $com([3, 12])));
    }

    public function test_impede_admitir_com_obrigatorio_sem_conferencia(): void
    {
        $itens = [
            $this->item(['id' => 1, 'nome' => 'CPF', 'status' => 'CONFERIDO']),
            $this->item(['id' => 2, 'nome' => 'Foto 3x4', 'status' => 'ENVIADO']),
        ];
        $pendentes = Checklist::pendencias($itens, $this->perfilBase);

        $this->assertCount(1, $pendentes);
        $this->assertSame('Foto 3x4', $pendentes[0]['nome']);
        $this->assertFalse(Checklist::podeAdmitir($itens, $this->perfilBase));
    }

    public function test_libera_quando_todos_os_exigidos_estao_conferidos(): void
    {
        $itens = [
            $this->item(['id' => 1, 'status' => 'CONFERIDO']),
            $this->item(['id' => 2, 'status' => 'CONFERIDO']),
            $this->item(['id' => 3, 'exigencia' => 'OPCIONAL', 'status' => 'PENDENTE']),
        ];

        $this->assertSame([], Checklist::pendencias($itens, $this->perfilBase));
        $this->assertTrue(Checklist::podeAdmitir($itens, $this->perfilBase));
    }

    public function test_documento_com_pendencia_bloqueia(): void
    {
        $itens = [$this->item(['nome' => 'RG', 'status' => 'COM_PENDENCIA'])];
        $this->assertFalse(Checklist::podeAdmitir($itens, $this->perfilBase));
    }

    public function test_ignora_condicionais_que_nao_se_aplicam(): void
    {
        $itens = [
            $this->item(['id' => 1, 'nome' => 'CPF', 'status' => 'CONFERIDO']),
            $this->item(['id' => 2, 'nome' => 'CNH', 'exigencia' => 'CONDICIONAL', 'regra' => 'EXIGE_CNH']),
            $this->item(['id' => 3, 'nome' => 'Reservista', 'exigencia' => 'CONDICIONAL', 'regra' => 'SEXO_MASCULINO']),
        ];

        // Candidata mulher em vaga sem CNH: nenhum condicional bloqueia.
        $this->assertTrue(Checklist::podeAdmitir($itens, $this->perfilBase));

        // Manobrista homem: os dois passam a bloquear.
        $manobrista = ['sexo' => 'MASCULINO', 'funcao_exige_cnh' => true] + $this->perfilBase;
        $nomes = array_column(Checklist::pendencias($itens, $manobrista), 'nome');
        sort($nomes);
        $this->assertSame(['CNH', 'Reservista'], $nomes);
    }

    public function test_checklist_vazio_esta_liberado(): void
    {
        $this->assertTrue(Checklist::podeAdmitir([], $this->perfilBase));
    }
}
