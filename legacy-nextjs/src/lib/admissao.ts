/**
 * Numeração da admissão no formato "ADM nn/mm" — sequencial reiniciado a cada mês.
 * Ex.: primeira admissão de setembro = "ADM 01/09".
 */

export function formatarNumeroAdmissao(sequencial: number, mes: number): string {
  if (!Number.isInteger(sequencial) || sequencial < 1) {
    throw new Error('Sequencial de admissão deve ser um inteiro maior ou igual a 1.');
  }
  if (!Number.isInteger(mes) || mes < 1 || mes > 12) {
    throw new Error('Mês da admissão deve estar entre 1 e 12.');
  }
  return `ADM ${String(sequencial).padStart(2, '0')}/${String(mes).padStart(2, '0')}`;
}

/** Próximo sequencial dado o maior sequencial já usado no mês (0 ou null se nenhum). */
export function proximoSequencial(maiorSequencialDoMes: number | null | undefined): number {
  return (maiorSequencialDoMes ?? 0) + 1;
}

export function partesDaData(data: Date): { mes: number; ano: number } {
  return { mes: data.getUTCMonth() + 1, ano: data.getUTCFullYear() };
}

export function parseNumeroAdmissao(numero: string): { sequencial: number; mes: number } | null {
  const m = /^ADM\s+(\d{2})\/(\d{2})$/.exec(numero.trim());
  if (!m) return null;
  const sequencial = Number(m[1]);
  const mes = Number(m[2]);
  if (sequencial < 1 || mes < 1 || mes > 12) return null;
  return { sequencial, mes };
}
