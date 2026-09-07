import { describe, expect, it } from 'vitest';
import {
  calcularIdade,
  itemEhExigido,
  pendenciasDeAdmissao,
  podeAdmitir,
  type ItemAvaliavel,
  type PerfilCandidato,
} from '@/lib/checklist';

const perfilBase: PerfilCandidato = {
  sexo: 'FEMININO',
  funcaoExigeCnh: false,
  estadoCivilCasadoOuUniao: false,
  idadesFilhos: [],
};

function item(parcial: Partial<ItemAvaliavel>): ItemAvaliavel {
  return {
    id: parcial.id ?? 'x',
    nome: parcial.nome ?? 'Documento',
    exigencia: parcial.exigencia ?? 'OBRIGATORIO',
    regra: parcial.regra ?? 'NENHUMA',
    status: parcial.status ?? 'PENDENTE',
  };
}

describe('calcularIdade', () => {
  const hoje = new Date(Date.UTC(2024, 8, 7)); // 07/09/2024

  it('conta anos completos', () => {
    expect(calcularIdade(new Date(Date.UTC(2018, 8, 7)), hoje)).toBe(6);
    expect(calcularIdade(new Date(Date.UTC(2018, 8, 8)), hoje)).toBe(5);
    expect(calcularIdade(new Date(Date.UTC(2010, 0, 1)), hoje)).toBe(14);
  });

  it('devolve nulo sem data de nascimento', () => {
    expect(calcularIdade(null, hoje)).toBeNull();
    expect(calcularIdade(undefined, hoje)).toBeNull();
  });
});

describe('itemEhExigido', () => {
  it('nunca exige item opcional', () => {
    expect(itemEhExigido(item({ exigencia: 'OPCIONAL' }), perfilBase)).toBe(false);
    expect(
      itemEhExigido(item({ exigencia: 'OPCIONAL', regra: 'SEXO_MASCULINO' }), {
        ...perfilBase,
        sexo: 'MASCULINO',
      }),
    ).toBe(false);
  });

  it('sempre exige item obrigatório sem regra', () => {
    expect(itemEhExigido(item({}), perfilBase)).toBe(true);
  });

  it('exige CNH apenas quando a função pede (regra do manobrista)', () => {
    const cnh = item({ nome: 'CNH', exigencia: 'CONDICIONAL', regra: 'EXIGE_CNH' });
    expect(itemEhExigido(cnh, perfilBase)).toBe(false);
    expect(itemEhExigido(cnh, { ...perfilBase, funcaoExigeCnh: true })).toBe(true);
  });

  it('exige reservista apenas para candidatos do sexo masculino', () => {
    const reservista = item({ exigencia: 'CONDICIONAL', regra: 'SEXO_MASCULINO' });
    expect(itemEhExigido(reservista, perfilBase)).toBe(false);
    expect(itemEhExigido(reservista, { ...perfilBase, sexo: 'MASCULINO' })).toBe(true);
    expect(itemEhExigido(reservista, { ...perfilBase, sexo: 'NAO_INFORMADO' })).toBe(false);
  });

  it('exige certidão de casamento apenas para casado/união estável', () => {
    const certidao = item({ exigencia: 'CONDICIONAL', regra: 'CASADO_OU_UNIAO' });
    expect(itemEhExigido(certidao, perfilBase)).toBe(false);
    expect(itemEhExigido(certidao, { ...perfilBase, estadoCivilCasadoOuUniao: true })).toBe(true);
  });

  it('exige documentos de filhos conforme a faixa etária do salário-família', () => {
    const nascimento = item({ exigencia: 'CONDICIONAL', regra: 'POSSUI_FILHOS' });
    const vacinacao = item({ exigencia: 'CONDICIONAL', regra: 'FILHOS_ATE_6' });
    const escolar = item({ exigencia: 'CONDICIONAL', regra: 'FILHOS_7_A_14' });

    const semFilhos = perfilBase;
    const filhoDe4 = { ...perfilBase, idadesFilhos: [4] };
    const filhoDe10 = { ...perfilBase, idadesFilhos: [10] };
    const filhoDe17 = { ...perfilBase, idadesFilhos: [17] };
    const doisFilhos = { ...perfilBase, idadesFilhos: [3, 12] };

    expect(itemEhExigido(nascimento, semFilhos)).toBe(false);
    expect(itemEhExigido(nascimento, filhoDe17)).toBe(true);

    expect(itemEhExigido(vacinacao, filhoDe4)).toBe(true);
    expect(itemEhExigido(vacinacao, filhoDe10)).toBe(false);

    expect(itemEhExigido(escolar, filhoDe10)).toBe(true);
    expect(itemEhExigido(escolar, filhoDe4)).toBe(false);
    expect(itemEhExigido(escolar, filhoDe17)).toBe(false);

    expect(itemEhExigido(vacinacao, doisFilhos)).toBe(true);
    expect(itemEhExigido(escolar, doisFilhos)).toBe(true);
  });

  it('trata o limite de 6 e 7 anos exatamente', () => {
    const vacinacao = item({ exigencia: 'CONDICIONAL', regra: 'FILHOS_ATE_6' });
    const escolar = item({ exigencia: 'CONDICIONAL', regra: 'FILHOS_7_A_14' });
    expect(itemEhExigido(vacinacao, { ...perfilBase, idadesFilhos: [6] })).toBe(true);
    expect(itemEhExigido(vacinacao, { ...perfilBase, idadesFilhos: [7] })).toBe(false);
    expect(itemEhExigido(escolar, { ...perfilBase, idadesFilhos: [7] })).toBe(true);
    expect(itemEhExigido(escolar, { ...perfilBase, idadesFilhos: [14] })).toBe(true);
    expect(itemEhExigido(escolar, { ...perfilBase, idadesFilhos: [15] })).toBe(false);
  });
});

describe('bloqueio de admissão com documentos pendentes', () => {
  it('impede admitir enquanto houver obrigatório sem conferência', () => {
    const itens = [
      item({ id: '1', nome: 'CPF', status: 'CONFERIDO' }),
      item({ id: '2', nome: 'Foto 3x4', status: 'ENVIADO' }),
    ];
    const pendentes = pendenciasDeAdmissao(itens, perfilBase);
    expect(pendentes).toHaveLength(1);
    expect(pendentes[0].nome).toBe('Foto 3x4');
    expect(podeAdmitir(itens, perfilBase)).toBe(false);
  });

  it('libera a admissão quando todos os exigidos estão conferidos', () => {
    const itens = [
      item({ id: '1', nome: 'CPF', status: 'CONFERIDO' }),
      item({ id: '2', nome: 'Foto 3x4', status: 'CONFERIDO' }),
      item({ id: '3', nome: 'Certificados de cursos', exigencia: 'OPCIONAL', status: 'PENDENTE' }),
    ];
    expect(pendenciasDeAdmissao(itens, perfilBase)).toEqual([]);
    expect(podeAdmitir(itens, perfilBase)).toBe(true);
  });

  it('conta documento com pendência como bloqueio', () => {
    const itens = [item({ id: '1', nome: 'RG', status: 'COM_PENDENCIA' })];
    expect(podeAdmitir(itens, perfilBase)).toBe(false);
  });

  it('ignora condicionais que não se aplicam ao candidato', () => {
    const itens = [
      item({ id: '1', nome: 'CPF', status: 'CONFERIDO' }),
      item({ id: '2', nome: 'CNH', exigencia: 'CONDICIONAL', regra: 'EXIGE_CNH', status: 'PENDENTE' }),
      item({
        id: '3',
        nome: 'Reservista',
        exigencia: 'CONDICIONAL',
        regra: 'SEXO_MASCULINO',
        status: 'PENDENTE',
      }),
    ];
    // Candidata mulher em vaga que não exige CNH: nenhum dos condicionais bloqueia.
    expect(podeAdmitir(itens, perfilBase)).toBe(true);

    // Manobrista homem: os dois condicionais passam a bloquear.
    const perfilManobrista: PerfilCandidato = {
      ...perfilBase,
      sexo: 'MASCULINO',
      funcaoExigeCnh: true,
    };
    const pendentes = pendenciasDeAdmissao(itens, perfilManobrista);
    expect(pendentes.map((p) => p.nome).sort()).toEqual(['CNH', 'Reservista']);
    expect(podeAdmitir(itens, perfilManobrista)).toBe(false);
  });

  it('trata checklist vazio como liberado', () => {
    expect(podeAdmitir([], perfilBase)).toBe(true);
  });
});
