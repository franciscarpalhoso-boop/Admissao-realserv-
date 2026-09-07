import { NextResponse } from 'next/server';
import { sessaoAtual } from '@/lib/auth';
import { buscarCandidatoCompleto } from '@/server/candidatos';
import { registrarAcessoDossie, registrarAuditoria } from '@/server/auditoria';
import { gerarFichaPdf } from '@/server/pdf/ficha';

export const dynamic = 'force-dynamic';

function nomeArquivo(nome: string, sufixo: string): string {
  const limpo = nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  return `${limpo || 'candidato'}-${sufixo}.pdf`;
}

export async function GET(_requisicao: Request, contexto: { params: Promise<{ id: string }> }) {
  const sessao = await sessaoAtual();
  if (!sessao) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 });

  const { id } = await contexto.params;
  const candidato = await buscarCandidatoCompleto(id);
  if (!candidato || candidato.anonimizadoEm) {
    return NextResponse.json({ erro: 'Candidato não encontrado.' }, { status: 404 });
  }

  const pdf = await gerarFichaPdf(candidato);

  await registrarAcessoDossie({ candidatoId: candidato.id, sessao, tipo: 'FICHA_PDF' });
  await registrarAuditoria({
    sessao,
    entidade: 'Candidato',
    entidadeId: candidato.id,
    acao: 'DOWNLOAD_FICHA_PDF',
  });

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${nomeArquivo(candidato.nomeCompleto, 'ficha')}"`,
      'Cache-Control': 'no-store, private',
    },
  });
}
