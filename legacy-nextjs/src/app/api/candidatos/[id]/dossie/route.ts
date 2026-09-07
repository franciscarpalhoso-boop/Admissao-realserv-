import { NextResponse } from 'next/server';
import { sessaoAtual, permissoes } from '@/lib/auth';
import { buscarCandidatoCompleto } from '@/server/candidatos';
import { registrarAcessoDossie, registrarAuditoria } from '@/server/auditoria';
import { gerarDossiePdf } from '@/server/pdf/dossie';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function nomeArquivo(candidatoNome: string, numeroAdmissao: string | null | undefined): string {
  const limpo = candidatoNome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  const prefixo = numeroAdmissao ? `${numeroAdmissao.replace(/[^A-Za-z0-9]+/g, '-')}-` : '';
  return `${prefixo}${limpo || 'candidato'}-dossie.pdf`;
}

export async function GET(_requisicao: Request, contexto: { params: Promise<{ id: string }> }) {
  const sessao = await sessaoAtual();
  if (!sessao) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 });
  if (!permissoes.operarDp(sessao.perfil) && !permissoes.recrutar(sessao.perfil)) {
    return NextResponse.json({ erro: 'Sem permissão.' }, { status: 403 });
  }

  const { id } = await contexto.params;
  const candidato = await buscarCandidatoCompleto(id);
  if (!candidato || candidato.anonimizadoEm) {
    return NextResponse.json({ erro: 'Candidato não encontrado.' }, { status: 404 });
  }

  const pdf = await gerarDossiePdf(candidato);

  await registrarAcessoDossie({ candidatoId: candidato.id, sessao, tipo: 'DOSSIE_PDF' });
  await registrarAuditoria({
    sessao,
    entidade: 'Candidato',
    entidadeId: candidato.id,
    acao: 'DOWNLOAD_DOSSIE_PDF',
    detalhes: { documentos: candidato.documentos.filter((d) => d.arquivos.length > 0).length },
  });

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${nomeArquivo(
        candidato.nomeCompleto,
        candidato.informacoesInternas?.numeroAdmissao,
      )}"`,
      'Cache-Control': 'no-store, private',
    },
  });
}
