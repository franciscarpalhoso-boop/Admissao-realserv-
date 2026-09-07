import type { CandidatoCompleto } from '@/server/candidatos';

/** O candidato chega ao cliente serializado (Decimal/Date viram string). */
export type FichaCandidato = Omit<CandidatoCompleto, never>;

export type FuncaoResumo = {
  id: string;
  nome: string;
  exigeCnh: boolean;
  exigeSapatoPreto: boolean;
  avisoEspecifico: string | null;
};

export type PropsEtapa = {
  token: string;
  candidato: FichaCandidato;
  avancar: () => void;
  voltar: () => void;
};
