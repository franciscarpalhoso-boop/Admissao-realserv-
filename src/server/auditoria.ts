import 'server-only';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import type { Sessao } from '@/lib/auth';

export async function ipDaRequisicao(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return h.get('x-real-ip');
}

export async function userAgentDaRequisicao(): Promise<string | null> {
  const h = await headers();
  return h.get('user-agent');
}

type EntradaAuditoria = {
  sessao?: Sessao | null;
  autorLabel?: string;
  entidade: string;
  entidadeId: string;
  acao: string;
  detalhes?: Record<string, unknown>;
};

export async function registrarAuditoria(entrada: EntradaAuditoria): Promise<void> {
  const ip = await ipDaRequisicao();
  await prisma.logAuditoria.create({
    data: {
      usuarioId: entrada.sessao?.id ?? null,
      autorLabel: entrada.autorLabel ?? entrada.sessao?.nome ?? 'Candidato (link público)',
      entidade: entrada.entidade,
      entidadeId: entrada.entidadeId,
      acao: entrada.acao,
      detalhes: (entrada.detalhes ?? {}) as object,
      ip,
    },
  });
}

export async function registrarAcessoDossie(params: {
  candidatoId: string;
  sessao?: Sessao | null;
  tipo: 'FICHA_PDF' | 'DOSSIE_PDF' | 'DOCUMENTO' | 'EXPORTACAO';
  referencia?: string;
}): Promise<void> {
  const ip = await ipDaRequisicao();
  await prisma.acessoDossie.create({
    data: {
      candidatoId: params.candidatoId,
      usuarioId: params.sessao?.id ?? null,
      tipo: params.tipo,
      referencia: params.referencia ?? null,
      ip,
    },
  });
}
