import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sessaoAtual } from '@/lib/auth';
import { lerArquivo } from '@/lib/storage';
import { registrarAcessoDossie } from '@/server/auditoria';

export const dynamic = 'force-dynamic';

/**
 * Único caminho de leitura dos documentos. Exige sessão interna, nunca expõe a
 * chave do storage e registra cada acesso — nenhum arquivo tem URL pública.
 */
export async function GET(_requisicao: Request, contexto: { params: Promise<{ id: string }> }) {
  const sessao = await sessaoAtual();
  if (!sessao) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 });

  const { id } = await contexto.params;
  const arquivo = await prisma.arquivoDocumento.findUnique({
    where: { id },
    include: { documento: { include: { candidato: { select: { id: true, anonimizadoEm: true } } } } },
  });

  if (!arquivo || arquivo.documento.candidato.anonimizadoEm) {
    return NextResponse.json({ erro: 'Arquivo não encontrado.' }, { status: 404 });
  }

  let conteudo: Buffer;
  try {
    conteudo = await lerArquivo(arquivo.chave);
  } catch {
    return NextResponse.json({ erro: 'Arquivo indisponível no storage.' }, { status: 410 });
  }

  await registrarAcessoDossie({
    candidatoId: arquivo.documento.candidato.id,
    sessao,
    tipo: 'DOCUMENTO',
    referencia: arquivo.nomeOriginal,
  });

  return new NextResponse(new Uint8Array(conteudo), {
    headers: {
      'Content-Type': arquivo.mimeType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(arquivo.nomeOriginal)}"`,
      'Cache-Control': 'no-store, private',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
