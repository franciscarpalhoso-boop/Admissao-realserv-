import type { ExigenciaDocumento, RegraCondicional, StatusDocumento, Sexo } from '@prisma/client';

/**
 * Regras de obrigatoriedade do checklist admissional.
 * Funções puras para permitir teste isolado (tests/checklist.test.ts).
 */

export type PerfilCandidato = {
  sexo: Sexo;
  funcaoExigeCnh: boolean;
  estadoCivilCasadoOuUniao: boolean;
  /** Idades dos filhos em anos completos na data de referência. */
  idadesFilhos: number[];
};

export type ItemAvaliavel = {
  id: string;
  nome: string;
  exigencia: ExigenciaDocumento;
  regra: RegraCondicional;
  status: StatusDocumento;
};

export function calcularIdade(nascimento: Date | null | undefined, referencia = new Date()): number | null {
  if (!nascimento) return null;
  let idade = referencia.getUTCFullYear() - nascimento.getUTCFullYear();
  const mes = referencia.getUTCMonth() - nascimento.getUTCMonth();
  if (mes < 0 || (mes === 0 && referencia.getUTCDate() < nascimento.getUTCDate())) idade -= 1;
  return idade;
}

/**
 * Um item é exigido para este candidato quando é OBRIGATORIO, ou quando é
 * CONDICIONAL e a condição correspondente se aplica ao candidato.
 */
export function itemEhExigido(
  item: Pick<ItemAvaliavel, 'exigencia' | 'regra'>,
  perfil: PerfilCandidato,
): boolean {
  if (item.exigencia === 'OPCIONAL') return false;
  if (item.exigencia === 'OBRIGATORIO' && item.regra === 'NENHUMA') return true;

  switch (item.regra) {
    case 'NENHUMA':
      return item.exigencia === 'OBRIGATORIO';
    case 'EXIGE_CNH':
      return perfil.funcaoExigeCnh;
    case 'SEXO_MASCULINO':
      return perfil.sexo === 'MASCULINO';
    case 'POSSUI_FILHOS':
      return perfil.idadesFilhos.length > 0;
    case 'FILHOS_ATE_6':
      return perfil.idadesFilhos.some((i) => i <= 6);
    case 'FILHOS_7_A_14':
      return perfil.idadesFilhos.some((i) => i >= 7 && i <= 14);
    case 'CASADO_OU_UNIAO':
      return perfil.estadoCivilCasadoOuUniao;
    default:
      return false;
  }
}

export type PendenciaChecklist = { id: string; nome: string; status: StatusDocumento };

/** Itens exigidos que ainda não estão CONFERIDO. */
export function pendenciasDeAdmissao(
  itens: ItemAvaliavel[],
  perfil: PerfilCandidato,
): PendenciaChecklist[] {
  return itens
    .filter((item) => itemEhExigido(item, perfil))
    .filter((item) => item.status !== 'CONFERIDO')
    .map(({ id, nome, status }) => ({ id, nome, status }));
}

export function podeAdmitir(itens: ItemAvaliavel[], perfil: PerfilCandidato): boolean {
  return pendenciasDeAdmissao(itens, perfil).length === 0;
}
