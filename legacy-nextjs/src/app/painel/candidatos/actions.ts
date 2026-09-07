'use server';

import { revalidatePath } from 'next/cache';
import type { EtapaPipeline, StatusDocumento } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { exigirSessao, permissoes } from '@/lib/auth';
import { gerarTokenPublico } from '@/lib/cripto';
import { parseDataISO, parseMoeda } from '@/lib/formato';
import { registrarAuditoria } from '@/server/auditoria';
import {
  ErroDeRegra,
  criarCandidatoComChecklist,
  linkPublico,
  moverEtapa,
} from '@/server/candidatos';

export type EstadoAcao = { erro?: string; sucesso?: string; link?: string };

function mensagem(erro: unknown): string {
  if (erro instanceof ErroDeRegra) return erro.message;
  console.error(erro);
  return 'Não foi possível concluir a operação. Tente novamente.';
}

// --------------------------------------------------------------------------
// Cadastro e link público
// --------------------------------------------------------------------------

export async function criarCandidatoAction(
  _estado: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const sessao = await exigirSessao();
  const nomeCompleto = String(formData.get('nomeCompleto') ?? '').trim();
  if (nomeCompleto.length < 3) return { erro: 'Informe o nome completo do candidato.' };

  try {
    const id = await criarCandidatoComChecklist({
      nomeCompleto,
      celularWhatsapp: String(formData.get('celularWhatsapp') ?? '').trim() || null,
      email: String(formData.get('email') ?? '').trim() || null,
      funcaoId: String(formData.get('funcaoId') ?? '') || null,
      observacoesTriagem: String(formData.get('observacoesTriagem') ?? '').trim() || null,
    });

    await registrarAuditoria({
      sessao,
      entidade: 'Candidato',
      entidadeId: id,
      acao: 'CRIACAO',
      detalhes: { nomeCompleto },
    });

    const candidato = await prisma.candidato.findUniqueOrThrow({ where: { id } });
    revalidatePath('/painel');
    revalidatePath('/painel/candidatos');
    return {
      sucesso: `Candidato cadastrado. Envie o link abaixo por WhatsApp.`,
      link: linkPublico(candidato.tokenPublico),
    };
  } catch (erro) {
    return { erro: mensagem(erro) };
  }
}

export async function regerarLinkAction(candidatoId: string): Promise<void> {
  const sessao = await exigirSessao();
  const dias = Number(process.env.DIAS_VALIDADE_LINK ?? 30);
  await prisma.candidato.update({
    where: { id: candidatoId },
    data: {
      tokenPublico: gerarTokenPublico(),
      tokenExpiraEm: new Date(Date.now() + dias * 24 * 60 * 60 * 1000),
    },
  });
  await registrarAuditoria({
    sessao,
    entidade: 'Candidato',
    entidadeId: candidatoId,
    acao: 'REGERAR_LINK_PUBLICO',
  });
  revalidatePath(`/painel/candidatos/${candidatoId}`);
}

// --------------------------------------------------------------------------
// Pipeline
// --------------------------------------------------------------------------

export async function moverEtapaAction(
  _estado: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const sessao = await exigirSessao();
  if (!permissoes.recrutar(sessao.perfil) && !permissoes.operarDp(sessao.perfil)) {
    return { erro: 'Seu perfil não pode movimentar candidatos.' };
  }

  const candidatoId = String(formData.get('candidatoId') ?? '');
  const para = String(formData.get('para') ?? '') as EtapaPipeline;
  if (!candidatoId || !para) return { erro: 'Dados incompletos.' };

  try {
    const { numeroAdmissao } = await moverEtapa({
      candidatoId,
      para,
      sessao,
      observacao: String(formData.get('observacao') ?? '').trim() || null,
      justificativaForcada: String(formData.get('justificativaForcada') ?? '').trim() || null,
      dataAdmissao: parseDataISO(String(formData.get('dataAdmissao') ?? '')),
    });
    revalidatePath('/painel');
    revalidatePath(`/painel/candidatos/${candidatoId}`);
    return {
      sucesso: numeroAdmissao
        ? `Candidato admitido. Número gerado: ${numeroAdmissao}.`
        : 'Etapa atualizada.',
    };
  } catch (erro) {
    return { erro: mensagem(erro) };
  }
}

// --------------------------------------------------------------------------
// Documentos (conferência do DP)
// --------------------------------------------------------------------------

export async function conferirDocumentoAction(
  _estado: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const sessao = await exigirSessao();
  if (!permissoes.operarDp(sessao.perfil)) {
    return { erro: 'Somente o Departamento Pessoal pode conferir documentos.' };
  }

  const documentoId = String(formData.get('documentoId') ?? '');
  const status = String(formData.get('status') ?? '') as StatusDocumento;
  const observacaoDp = String(formData.get('observacaoDp') ?? '').trim() || null;
  if (!documentoId || !status) return { erro: 'Dados incompletos.' };

  const documento = await prisma.documentoCandidato.update({
    where: { id: documentoId },
    data: {
      status,
      observacaoDp,
      conferidoEm: status === 'CONFERIDO' ? new Date() : null,
      conferidoPor: status === 'CONFERIDO' ? sessao.nome : null,
    },
  });

  await registrarAuditoria({
    sessao,
    entidade: 'DocumentoCandidato',
    entidadeId: documentoId,
    acao: 'CONFERENCIA_DOCUMENTO',
    detalhes: { status, observacaoDp },
  });

  revalidatePath(`/painel/candidatos/${documento.candidatoId}`);
  return { sucesso: 'Documento atualizado.' };
}

export async function adicionarItemChecklistAction(
  _estado: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const sessao = await exigirSessao();
  if (!permissoes.operarDp(sessao.perfil)) {
    return { erro: 'Somente o Departamento Pessoal pode alterar o checklist.' };
  }

  const candidatoId = String(formData.get('candidatoId') ?? '');
  const nome = String(formData.get('nome') ?? '').trim();
  const obrigatorio = formData.get('obrigatorio') === 'on';
  if (!candidatoId || !nome) return { erro: 'Informe o nome do documento.' };

  const maior = await prisma.documentoCandidato.aggregate({
    where: { candidatoId },
    _max: { ordem: true },
  });

  await prisma.documentoCandidato.create({
    data: {
      candidatoId,
      nome,
      ordem: (maior._max.ordem ?? 0) + 1,
      exigencia: obrigatorio ? 'OBRIGATORIO' : 'OPCIONAL',
      regra: 'NENHUMA',
      extra: true,
    },
  });

  await registrarAuditoria({
    sessao,
    entidade: 'Candidato',
    entidadeId: candidatoId,
    acao: 'ITEM_CHECKLIST_ADICIONADO',
    detalhes: { nome, obrigatorio },
  });

  revalidatePath(`/painel/candidatos/${candidatoId}`);
  return { sucesso: `"${nome}" adicionado ao checklist.` };
}

export async function removerArquivoAction(arquivoId: string): Promise<void> {
  const sessao = await exigirSessao();
  if (!permissoes.operarDp(sessao.perfil)) return;

  const arquivo = await prisma.arquivoDocumento.findUnique({
    where: { id: arquivoId },
    include: { documento: true },
  });
  if (!arquivo) return;

  const { excluirArquivo } = await import('@/lib/storage');
  await excluirArquivo(arquivo.chave).catch(() => undefined);
  await prisma.arquivoDocumento.delete({ where: { id: arquivoId } });

  const { sincronizarStatusDocumento } = await import('@/server/candidatos');
  await sincronizarStatusDocumento(arquivo.documentoId);

  await registrarAuditoria({
    sessao,
    entidade: 'ArquivoDocumento',
    entidadeId: arquivoId,
    acao: 'EXCLUSAO_ARQUIVO',
    detalhes: { nomeOriginal: arquivo.nomeOriginal },
  });

  revalidatePath(`/painel/candidatos/${arquivo.documento.candidatoId}`);
}

// --------------------------------------------------------------------------
// Entrevista
// --------------------------------------------------------------------------

function numeroOuNulo(valor: FormDataEntryValue | null): number | null {
  const n = Number(String(valor ?? ''));
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
}

function boolOuNulo(valor: FormDataEntryValue | null): boolean | null {
  const v = String(valor ?? '');
  if (v === 'sim') return true;
  if (v === 'nao') return false;
  return null;
}

export async function agendarEntrevistaAction(
  _estado: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const sessao = await exigirSessao();
  if (!permissoes.recrutar(sessao.perfil)) {
    return { erro: 'Seu perfil não pode agendar entrevistas.' };
  }

  const candidatoId = String(formData.get('candidatoId') ?? '');
  const dataHoraTexto = String(formData.get('dataHora') ?? '');
  if (!candidatoId || !dataHoraTexto) return { erro: 'Informe a data e a hora da entrevista.' };

  const dataHora = new Date(dataHoraTexto);
  if (Number.isNaN(dataHora.getTime())) return { erro: 'Data/hora inválida.' };

  const entrevista = await prisma.entrevista.create({
    data: {
      candidatoId,
      dataHora,
      modalidade: String(formData.get('modalidade') ?? 'PRESENCIAL') === 'ONLINE' ? 'ONLINE' : 'PRESENCIAL',
      local: String(formData.get('local') ?? '').trim() || null,
      linkOnline: String(formData.get('linkOnline') ?? '').trim() || null,
      entrevistadorId: String(formData.get('entrevistadorId') ?? '') || sessao.id,
    },
  });

  const candidato = await prisma.candidato.findUnique({ where: { id: candidatoId } });
  if (candidato && candidato.etapa === 'TRIAGEM') {
    await moverEtapa({
      candidatoId,
      para: 'ENTREVISTA_AGENDADA',
      sessao,
      observacao: 'Entrevista agendada',
    });
  }

  await registrarAuditoria({
    sessao,
    entidade: 'Entrevista',
    entidadeId: entrevista.id,
    acao: 'AGENDAMENTO',
    detalhes: { candidatoId, dataHora: dataHora.toISOString() },
  });

  revalidatePath(`/painel/candidatos/${candidatoId}`);
  return { sucesso: 'Entrevista agendada.' };
}

export async function registrarEntrevistaAction(
  _estado: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const sessao = await exigirSessao();
  if (!permissoes.recrutar(sessao.perfil)) {
    return { erro: 'Seu perfil não pode registrar entrevistas.' };
  }

  const entrevistaId = String(formData.get('entrevistaId') ?? '');
  if (!entrevistaId) return { erro: 'Entrevista não informada.' };

  const parecerBruto = String(formData.get('parecer') ?? '');
  const parecer =
    parecerBruto === 'APROVADO' || parecerBruto === 'REPROVADO' || parecerBruto === 'BANCO_TALENTOS'
      ? parecerBruto
      : null;

  const entrevista = await prisma.entrevista.update({
    where: { id: entrevistaId },
    data: {
      realizada: true,
      realizadaEm: new Date(),
      entrevistadorId: sessao.id,
      horarioChegada: String(formData.get('horarioChegada') ?? '').trim() || null,
      notaPontualidade: numeroOuNulo(formData.get('notaPontualidade')),
      notaApresentacao: numeroOuNulo(formData.get('notaApresentacao')),
      notaComunicacao: numeroOuNulo(formData.get('notaComunicacao')),
      notaExperiencia: numeroOuNulo(formData.get('notaExperiencia')),
      notaDisponibilidade: numeroOuNulo(formData.get('notaDisponibilidade')),
      disponibilidadeDomingos: boolOuNulo(formData.get('disponibilidadeDomingos')),
      restricaoHorarioFilhos: boolOuNulo(formData.get('restricaoHorarioFilhos')),
      restricaoHorarioDetalhe: String(formData.get('restricaoHorarioDetalhe') ?? '').trim() || null,
      tempoDeslocamento: String(formData.get('tempoDeslocamento') ?? '').trim() || null,
      possuiCnh: boolOuNulo(formData.get('possuiCnh')),
      experienciaManobra: boolOuNulo(formData.get('experienciaManobra')),
      conhecimentoInformatica: boolOuNulo(formData.get('conhecimentoInformatica')),
      experienciaMilitarSeguranca: boolOuNulo(formData.get('experienciaMilitarSeguranca')),
      interesseCursos: boolOuNulo(formData.get('interesseCursos')),
      parecer,
      postoSugeridoId: String(formData.get('postoSugeridoId') ?? '') || null,
      vagasIndicadas: String(formData.get('vagasIndicadas') ?? '')
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
      observacoes: String(formData.get('observacoes') ?? '').trim() || null,
    },
  });

  const destino: EtapaPipeline | null =
    parecer === 'APROVADO'
      ? 'APROVADO'
      : parecer === 'REPROVADO'
        ? 'REPROVADO'
        : parecer === 'BANCO_TALENTOS'
          ? 'BANCO_TALENTOS'
          : 'ENTREVISTADO';

  if (destino) {
    await moverEtapa({
      candidatoId: entrevista.candidatoId,
      para: destino,
      sessao,
      observacao: 'Parecer da entrevista registrado',
    }).catch(() => undefined);
  }

  await registrarAuditoria({
    sessao,
    entidade: 'Entrevista',
    entidadeId: entrevistaId,
    acao: 'REGISTRO_AVALIACAO',
    detalhes: { parecer },
  });

  revalidatePath(`/painel/candidatos/${entrevista.candidatoId}`);
  return { sucesso: 'Avaliação da entrevista registrada.' };
}

// --------------------------------------------------------------------------
// Informações internas (DP)
// --------------------------------------------------------------------------

export async function salvarInformacoesInternasAction(
  _estado: EstadoAcao,
  formData: FormData,
): Promise<EstadoAcao> {
  const sessao = await exigirSessao();
  if (!permissoes.operarDp(sessao.perfil)) {
    return { erro: 'Somente o Departamento Pessoal pode editar as informações internas.' };
  }

  const candidatoId = String(formData.get('candidatoId') ?? '');
  if (!candidatoId) return { erro: 'Candidato não informado.' };

  const dados = {
    supervisorId: String(formData.get('supervisorId') ?? '') || null,
    postoId: String(formData.get('postoId') ?? '') || null,
    escalaId: String(formData.get('escalaId') ?? '') || null,
    empresaId: String(formData.get('empresaId') ?? '') || null,
    acumuloFuncao: formData.get('acumuloFuncao') === 'on',
    acumuloFuncaoQual: String(formData.get('acumuloFuncaoQual') ?? '').trim() || null,
    baseSalarial: parseMoeda(String(formData.get('baseSalarial') ?? '')),
    valeTransporte: formData.get('valeTransporte') === 'on',
    premioAssiduidade: formData.get('premioAssiduidade') === 'on',
    outrosBeneficios: String(formData.get('outrosBeneficios') ?? '').trim() || null,
    dataInicio: parseDataISO(String(formData.get('dataInicio') ?? '')),
    dataTreinamento: parseDataISO(String(formData.get('dataTreinamento') ?? '')),
    responsavelAprovacao: String(formData.get('responsavelAprovacao') ?? '').trim() || sessao.nome,
    assinaturaResponsavel: String(formData.get('assinaturaResponsavel') ?? '').trim() || null,
  };

  await prisma.informacoesInternas.upsert({
    where: { candidatoId },
    create: { candidatoId, ...dados },
    update: dados,
  });

  await registrarAuditoria({
    sessao,
    entidade: 'InformacoesInternas',
    entidadeId: candidatoId,
    acao: 'ATUALIZACAO',
    detalhes: { ...dados, baseSalarial: dados.baseSalarial ?? undefined, dataInicio: undefined, dataTreinamento: undefined },
  });

  revalidatePath(`/painel/candidatos/${candidatoId}`);
  return { sucesso: 'Informações internas salvas.' };
}
