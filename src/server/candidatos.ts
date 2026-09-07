import 'server-only';
import type { EtapaPipeline, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { gerarTokenPublico } from '@/lib/cripto';
import { calcularIdade, pendenciasDeAdmissao, type ItemAvaliavel, type PerfilCandidato } from '@/lib/checklist';
import { formatarNumeroAdmissao, proximoSequencial } from '@/lib/admissao';
import type { Sessao } from '@/lib/auth';
import { registrarAuditoria } from '@/server/auditoria';

/** Inclui tudo que a página de detalhe e os PDFs precisam. */
export const candidatoCompletoInclude = {
  funcao: true,
  filhos: { orderBy: { ordem: 'asc' } },
  cursos: { orderBy: { ordem: 'asc' } },
  referencias: { orderBy: { ordem: 'asc' } },
  empregosAnteriores: { orderBy: { ordem: 'asc' } },
  documentos: { orderBy: { ordem: 'asc' }, include: { arquivos: { orderBy: { enviadoEm: 'asc' } } } },
  entrevistas: { orderBy: { dataHora: 'desc' }, include: { entrevistador: true, postoSugerido: true } },
  informacoesInternas: { include: { empresa: true, posto: true, escala: true, supervisor: true } },
  movimentacoes: { orderBy: { criadoEm: 'desc' }, include: { usuario: true } },
} satisfies Prisma.CandidatoInclude;

export type CandidatoCompleto = Prisma.CandidatoGetPayload<{
  include: typeof candidatoCompletoInclude;
}>;

export async function buscarCandidatoCompleto(id: string): Promise<CandidatoCompleto | null> {
  return prisma.candidato.findUnique({ where: { id }, include: candidatoCompletoInclude });
}

export async function buscarCandidatoPorToken(token: string): Promise<CandidatoCompleto | null> {
  const candidato = await prisma.candidato.findUnique({
    where: { tokenPublico: token },
    include: candidatoCompletoInclude,
  });
  if (!candidato) return null;
  if (candidato.tokenExpiraEm && candidato.tokenExpiraEm < new Date()) return null;
  if (candidato.anonimizadoEm) return null;
  return candidato;
}

/** Cria o candidato já com o checklist padrão materializado. */
export async function criarCandidatoComChecklist(dados: {
  nomeCompleto: string;
  celularWhatsapp?: string | null;
  email?: string | null;
  funcaoId?: string | null;
  observacoesTriagem?: string | null;
  diasValidadeToken?: number;
}): Promise<string> {
  const itens = await prisma.itemChecklistPadrao.findMany({
    where: { ativo: true },
    orderBy: { ordem: 'asc' },
  });

  const dias = dados.diasValidadeToken ?? Number(process.env.DIAS_VALIDADE_LINK ?? 30);
  const candidato = await prisma.candidato.create({
    data: {
      nomeCompleto: dados.nomeCompleto.trim(),
      celularWhatsapp: dados.celularWhatsapp ?? null,
      email: dados.email ?? null,
      funcaoId: dados.funcaoId ?? null,
      observacoesTriagem: dados.observacoesTriagem ?? null,
      tokenPublico: gerarTokenPublico(),
      tokenExpiraEm: new Date(Date.now() + dias * 24 * 60 * 60 * 1000),
      documentos: {
        create: itens.map((item) => ({
          itemChecklistId: item.id,
          nome: item.nome,
          ordem: item.ordem,
          exigencia: item.exigencia,
          regra: item.regra,
        })),
      },
      movimentacoes: {
        create: { para: 'TRIAGEM', autorLabel: 'Sistema', observacao: 'Candidato cadastrado' },
      },
    },
  });
  return candidato.id;
}

/** Monta o perfil usado pelas regras condicionais do checklist. */
export function perfilDoCandidato(candidato: CandidatoCompleto): PerfilCandidato {
  return {
    sexo: candidato.sexo,
    funcaoExigeCnh: candidato.funcao?.exigeCnh ?? false,
    estadoCivilCasadoOuUniao:
      candidato.estadoCivil === 'CASADO' || candidato.estadoCivil === 'UNIAO_ESTAVEL',
    idadesFilhos: candidato.filhos
      .map((f) => calcularIdade(f.dataNascimento))
      .filter((i): i is number => i !== null),
  };
}

export function itensAvaliaveis(candidato: CandidatoCompleto): ItemAvaliavel[] {
  return candidato.documentos.map((d) => ({
    id: d.id,
    nome: d.nome,
    exigencia: d.exigencia,
    regra: d.regra,
    status: d.status,
  }));
}

export function pendenciasDoCandidato(candidato: CandidatoCompleto) {
  return pendenciasDeAdmissao(itensAvaliaveis(candidato), perfilDoCandidato(candidato));
}

export class ErroDeRegra extends Error {}

/**
 * Move o candidato de etapa registrando o histórico.
 * A transição para ADMITIDO exige checklist completo e gera o número ADM nn/mm.
 */
export async function moverEtapa(params: {
  candidatoId: string;
  para: EtapaPipeline;
  sessao: Sessao;
  observacao?: string | null;
  justificativaForcada?: string | null;
  dataAdmissao?: Date | null;
}): Promise<{ numeroAdmissao?: string }> {
  const candidato = await buscarCandidatoCompleto(params.candidatoId);
  if (!candidato) throw new ErroDeRegra('Candidato não encontrado.');
  if (candidato.etapa === params.para) return {};

  let numeroAdmissao: string | undefined;

  if (params.para === 'ADMITIDO') {
    const pendentes = pendenciasDoCandidato(candidato);
    if (pendentes.length > 0) {
      if (params.sessao.perfil !== 'ADMIN') {
        throw new ErroDeRegra(
          `Não é possível admitir: ${pendentes.length} documento(s) obrigatório(s) sem conferência — ${pendentes
            .map((p) => p.nome)
            .join(', ')}.`,
        );
      }
      if (!params.justificativaForcada?.trim()) {
        throw new ErroDeRegra(
          'Há documentos obrigatórios pendentes. Informe uma justificativa para forçar a admissão.',
        );
      }
    }
    numeroAdmissao = await gerarNumeroAdmissao(
      candidato.id,
      params.dataAdmissao ?? new Date(),
      params.justificativaForcada ?? null,
    );
  }

  await prisma.$transaction([
    prisma.candidato.update({
      where: { id: candidato.id },
      data: { etapa: params.para, etapaAtualizadaEm: new Date() },
    }),
    prisma.movimentacaoEtapa.create({
      data: {
        candidatoId: candidato.id,
        de: candidato.etapa,
        para: params.para,
        usuarioId: params.sessao.id,
        autorLabel: params.sessao.nome,
        observacao:
          params.justificativaForcada?.trim()
            ? `Admissão forçada: ${params.justificativaForcada.trim()}`
            : (params.observacao ?? null),
      },
    }),
  ]);

  await registrarAuditoria({
    sessao: params.sessao,
    entidade: 'Candidato',
    entidadeId: candidato.id,
    acao: 'MOVIMENTACAO_ETAPA',
    detalhes: { de: candidato.etapa, para: params.para, numeroAdmissao },
  });

  return { numeroAdmissao };
}

/**
 * Gera "ADM nn/mm" com sequencial por mês. A unicidade é garantida pelo índice
 * @@unique([admissaoAno, admissaoMes, admissaoSequencial]); em caso de corrida
 * a operação é repetida com o próximo sequencial.
 */
export async function gerarNumeroAdmissao(
  candidatoId: string,
  dataReferencia: Date,
  justificativaForcada: string | null,
): Promise<string> {
  const existente = await prisma.informacoesInternas.findUnique({ where: { candidatoId } });
  if (existente?.numeroAdmissao) return existente.numeroAdmissao;

  const mes = dataReferencia.getUTCMonth() + 1;
  const ano = dataReferencia.getUTCFullYear();

  for (let tentativa = 0; tentativa < 10; tentativa++) {
    const maior = await prisma.informacoesInternas.aggregate({
      where: { admissaoAno: ano, admissaoMes: mes },
      _max: { admissaoSequencial: true },
    });
    const sequencial = proximoSequencial(maior._max.admissaoSequencial) + tentativa;
    const numero = formatarNumeroAdmissao(sequencial, mes);
    try {
      await prisma.informacoesInternas.upsert({
        where: { candidatoId },
        create: {
          candidatoId,
          numeroAdmissao: numero,
          admissaoSequencial: sequencial,
          admissaoMes: mes,
          admissaoAno: ano,
          justificativaForcada,
        },
        update: {
          numeroAdmissao: numero,
          admissaoSequencial: sequencial,
          admissaoMes: mes,
          admissaoAno: ano,
          justificativaForcada: justificativaForcada ?? undefined,
        },
      });
      return numero;
    } catch (erro) {
      const codigo = (erro as { code?: string }).code;
      if (codigo !== 'P2002') throw erro;
    }
  }
  throw new ErroDeRegra('Não foi possível gerar o número de admissão. Tente novamente.');
}

/** Recalcula o status do documento após upload/remoção de arquivos. */
export async function sincronizarStatusDocumento(documentoId: string): Promise<void> {
  const documento = await prisma.documentoCandidato.findUnique({
    where: { id: documentoId },
    include: { arquivos: true },
  });
  if (!documento) return;
  if (documento.status === 'CONFERIDO' || documento.status === 'COM_PENDENCIA') return;
  const novoStatus = documento.arquivos.length > 0 ? 'ENVIADO' : 'PENDENTE';
  if (novoStatus !== documento.status) {
    await prisma.documentoCandidato.update({
      where: { id: documentoId },
      data: { status: novoStatus },
    });
  }
}

export function linkPublico(token: string): string {
  const base = process.env.APP_URL ?? 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}/ficha/${token}`;
}
