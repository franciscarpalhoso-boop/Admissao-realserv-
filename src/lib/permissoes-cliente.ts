import type { Perfil } from '@prisma/client';

/**
 * Matriz de permissões pura, sem dependência de servidor, para que os
 * componentes de cliente possam esconder ações que o perfil não pode executar.
 * A checagem que vale continua sendo a do servidor (src/lib/auth.ts), que
 * importa exatamente estas funções.
 */
export const permissoes = {
  /** Cadastros mestres, exclusão, configurações e retenção LGPD. */
  administrar: (p: Perfil) => p === 'ADMIN',
  /** Conferir documentos, informações internas, gerar dossiê e exportar. */
  operarDp: (p: Perfil) => p === 'ADMIN' || p === 'DP',
  /** Agendar/conduzir entrevistas e movimentar o pipeline. */
  recrutar: (p: Perfil) => p === 'ADMIN' || p === 'RECRUTADOR',
  /** Qualquer usuário interno enxerga o painel e os candidatos. */
  verCandidatos: (_p: Perfil) => true,
  /** Só o admin pode admitir com documentação pendente, mediante justificativa. */
  forcarAdmissao: (p: Perfil) => p === 'ADMIN',
};
