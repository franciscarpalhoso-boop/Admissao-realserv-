import { NextResponse } from 'next/server';
import { sessaoAtual, permissoes } from '@/lib/auth';
import { buscarAdmitidos, gerarCsvAdmissoes, gerarPlanilhaAdmissoes } from '@/server/exportacao';
import { registrarAuditoria } from '@/server/auditoria';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function GET(requisicao: Request) {
  const sessao = await sessaoAtual();
  if (!sessao) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 });
  if (!permissoes.operarDp(sessao.perfil)) {
    return NextResponse.json({ erro: 'Sem permissão.' }, { status: 403 });
  }

  const url = new URL(requisicao.url);
  const formato = url.searchParams.get('formato') === 'csv' ? 'csv' : 'xlsx';
  const mes = Number(url.searchParams.get('mes')) || undefined;
  const ano = Number(url.searchParams.get('ano')) || undefined;
  const empresaId = url.searchParams.get('empresaId') || undefined;

  const candidatos = await buscarAdmitidos({ mes, ano, empresaId });

  await registrarAuditoria({
    sessao,
    entidade: 'Exportacao',
    entidadeId: `${ano ?? 'todos'}-${mes ?? 'todos'}`,
    acao: 'EXPORTACAO_CONTABILIDADE',
    detalhes: { formato, mes, ano, empresaId, registros: candidatos.length },
  });

  const sufixo = [ano, mes ? String(mes).padStart(2, '0') : null].filter(Boolean).join('-') || 'completo';

  if (formato === 'csv') {
    return new NextResponse(gerarCsvAdmissoes(candidatos), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="admissoes-${sufixo}.csv"`,
        'Cache-Control': 'no-store, private',
      },
    });
  }

  const planilha = await gerarPlanilhaAdmissoes(candidatos);
  return new NextResponse(new Uint8Array(planilha), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="admissoes-${sufixo}.xlsx"`,
      'Cache-Control': 'no-store, private',
    },
  });
}
