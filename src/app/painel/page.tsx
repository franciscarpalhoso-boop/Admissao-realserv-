import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { exigirSessao } from '@/lib/auth';
import {
  ETAPAS_KANBAN,
  ETAPAS_ENCERRAMENTO,
  corEtapa,
  rotuloEtapa,
  rotuloStatusFicha,
} from '@/lib/labels';
import { formatarDataHora } from '@/lib/formato';
import { Aviso, Card, CardCabecalho, CardCorpo, CardTitulo, Selo } from '@/components/ui';
import { NovoCandidato } from './candidatos/novo-candidato';

export const dynamic = 'force-dynamic';

export default async function PaginaPainel({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  await exigirSessao();
  const { erro } = await searchParams;

  const [candidatos, funcoes, contagens] = await Promise.all([
    prisma.candidato.findMany({
      where: { anonimizadoEm: null },
      include: { funcao: true, informacoesInternas: true },
      orderBy: { etapaAtualizadaEm: 'desc' },
      take: 400,
    }),
    prisma.funcao.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' } }),
    prisma.candidato.groupBy({
      by: ['etapa'],
      _count: true,
      where: { anonimizadoEm: null },
    }),
  ]);

  const total = contagens.reduce((soma, c) => soma + c._count, 0);
  const porEtapa = (etapa: (typeof ETAPAS_KANBAN)[number] | (typeof ETAPAS_ENCERRAMENTO)[number]) =>
    candidatos.filter((c) => c.etapa === etapa);

  const documentosPendentes = await prisma.documentoCandidato.count({
    where: {
      status: { in: ['PENDENTE', 'COM_PENDENCIA'] },
      exigencia: 'OBRIGATORIO',
      candidato: { anonimizadoEm: null, etapa: { in: ['APROVADO', 'DOCUMENTACAO', 'EXAME_ADMISSIONAL'] } },
    },
  });

  return (
    <div className="space-y-6">
      {erro === 'sem-permissao' && (
        <Aviso tipo="erro">Você não tem permissão para acessar essa área.</Aviso>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Pipeline de candidatos</h1>
          <p className="text-sm text-slate-500">
            {total} candidato(s) ativo(s) · {documentosPendentes} documento(s) obrigatório(s)
            pendente(s)
          </p>
        </div>
        <NovoCandidato funcoes={funcoes.map((f) => ({ id: f.id, nome: f.nome }))} />
      </div>

      <div className="flex gap-3 overflow-x-auto pb-3">
        {ETAPAS_KANBAN.map((etapa) => {
          const lista = porEtapa(etapa);
          return (
            <div key={etapa} className="w-72 shrink-0">
              <Card className="h-full">
                <CardCabecalho className="flex items-center justify-between gap-2">
                  <CardTitulo className="text-xs uppercase tracking-wide text-slate-500">
                    {rotuloEtapa[etapa]}
                  </CardTitulo>
                  <Selo className={corEtapa[etapa]}>{lista.length}</Selo>
                </CardCabecalho>
                <CardCorpo className="space-y-2 px-2 py-2">
                  {lista.length === 0 && (
                    <p className="px-2 py-4 text-center text-xs text-slate-400">Nenhum candidato</p>
                  )}
                  {lista.map((candidato) => (
                    <Link
                      key={candidato.id}
                      href={`/painel/candidatos/${candidato.id}`}
                      className="block rounded-md border border-slate-200 bg-white px-3 py-2 transition-colors hover:border-marca-300 hover:bg-marca-50/40"
                    >
                      <p className="truncate text-sm font-medium text-slate-900">
                        {candidato.nomeCompleto}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {candidato.funcao?.nome ?? 'Vaga não informada'}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1">
                        <Selo className="border-slate-200 bg-slate-50 text-slate-600">
                          Ficha: {rotuloStatusFicha[candidato.statusFicha]}
                        </Selo>
                        {candidato.informacoesInternas?.numeroAdmissao && (
                          <Selo className="border-green-200 bg-green-50 text-green-700">
                            {candidato.informacoesInternas.numeroAdmissao}
                          </Selo>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {formatarDataHora(candidato.etapaAtualizadaEm)}
                      </p>
                    </Link>
                  ))}
                </CardCorpo>
              </Card>
            </div>
          );
        })}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Encerrados</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {ETAPAS_ENCERRAMENTO.map((etapa) => {
            const lista = porEtapa(etapa);
            return (
              <Card key={etapa}>
                <CardCabecalho className="flex items-center justify-between">
                  <CardTitulo className="text-xs uppercase tracking-wide text-slate-500">
                    {rotuloEtapa[etapa]}
                  </CardTitulo>
                  <Selo className={corEtapa[etapa]}>{lista.length}</Selo>
                </CardCabecalho>
                <CardCorpo className="space-y-1 py-2">
                  {lista.slice(0, 5).map((c) => (
                    <Link
                      key={c.id}
                      href={`/painel/candidatos/${c.id}`}
                      className="block truncate rounded px-2 py-1 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      {c.nomeCompleto}
                    </Link>
                  ))}
                  {lista.length === 0 && <p className="px-2 text-xs text-slate-400">Nenhum</p>}
                  {lista.length > 5 && (
                    <Link
                      href={`/painel/candidatos?etapa=${etapa}`}
                      className="block px-2 pt-1 text-xs font-medium text-marca-700 hover:underline"
                    >
                      Ver todos ({lista.length})
                    </Link>
                  )}
                </CardCorpo>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
