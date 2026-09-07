import Link from 'next/link';
import type { EtapaPipeline, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { exigirSessao } from '@/lib/auth';
import { ETAPAS, corEtapa, rotuloEtapa, rotuloStatusFicha } from '@/lib/labels';
import { formatarData, formatarDataHora } from '@/lib/formato';
import { mascararCpf } from '@/lib/validacao';
import { Card, CardCorpo, Selo, Vazio } from '@/components/ui';
import { NovoCandidato } from './novo-candidato';
import { FiltrosCandidatos } from './filtros';

export const dynamic = 'force-dynamic';

export default async function PaginaCandidatos({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; etapa?: string; funcaoId?: string }>;
}) {
  await exigirSessao();
  const { busca, etapa, funcaoId } = await searchParams;

  const where: Prisma.CandidatoWhereInput = { anonimizadoEm: null };
  if (etapa && ETAPAS.includes(etapa as EtapaPipeline)) where.etapa = etapa as EtapaPipeline;
  if (funcaoId) where.funcaoId = funcaoId;
  if (busca?.trim()) {
    const termo = busca.trim();
    where.OR = [
      { nomeCompleto: { contains: termo, mode: 'insensitive' } },
      { cpf: { contains: termo.replace(/\D/g, '') } },
      { email: { contains: termo, mode: 'insensitive' } },
      { celularWhatsapp: { contains: termo } },
    ];
  }

  const [candidatos, funcoes] = await Promise.all([
    prisma.candidato.findMany({
      where,
      include: { funcao: true, informacoesInternas: true, documentos: { select: { status: true, exigencia: true } } },
      orderBy: { criadoEm: 'desc' },
      take: 200,
    }),
    prisma.funcao.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' } }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Candidatos</h1>
          <p className="text-sm text-slate-500">{candidatos.length} resultado(s)</p>
        </div>
        <NovoCandidato funcoes={funcoes.map((f) => ({ id: f.id, nome: f.nome }))} />
      </div>

      <FiltrosCandidatos funcoes={funcoes.map((f) => ({ id: f.id, nome: f.nome }))} />

      {candidatos.length === 0 ? (
        <Vazio>Nenhum candidato encontrado com esses filtros.</Vazio>
      ) : (
        <Card className="overflow-hidden">
          <CardCorpo className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Candidato</th>
                    <th className="px-4 py-2.5 font-medium">Vaga</th>
                    <th className="px-4 py-2.5 font-medium">Etapa</th>
                    <th className="px-4 py-2.5 font-medium">Ficha</th>
                    <th className="px-4 py-2.5 font-medium">Documentos</th>
                    <th className="px-4 py-2.5 font-medium">ADM</th>
                    <th className="px-4 py-2.5 font-medium">Cadastro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {candidatos.map((candidato) => {
                    const obrigatorios = candidato.documentos.filter(
                      (d) => d.exigencia === 'OBRIGATORIO',
                    );
                    const conferidos = obrigatorios.filter((d) => d.status === 'CONFERIDO').length;
                    return (
                      <tr key={candidato.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5">
                          <Link
                            href={`/painel/candidatos/${candidato.id}`}
                            className="font-medium text-marca-700 hover:underline"
                          >
                            {candidato.nomeCompleto}
                          </Link>
                          <p className="text-xs text-slate-500">
                            {candidato.cpf ? mascararCpf(candidato.cpf) : 'CPF não informado'}
                            {candidato.dataNascimento
                              ? ` · ${formatarData(candidato.dataNascimento)}`
                              : ''}
                          </p>
                        </td>
                        <td className="px-4 py-2.5 text-slate-700">
                          {candidato.funcao?.nome ?? '—'}
                        </td>
                        <td className="px-4 py-2.5">
                          <Selo className={corEtapa[candidato.etapa]}>
                            {rotuloEtapa[candidato.etapa]}
                          </Selo>
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">
                          {rotuloStatusFicha[candidato.statusFicha]}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">
                          {conferidos}/{obrigatorios.length} conferidos
                        </td>
                        <td className="px-4 py-2.5 text-slate-700">
                          {candidato.informacoesInternas?.numeroAdmissao ?? '—'}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-500">
                          {formatarDataHora(candidato.criadoEm)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardCorpo>
        </Card>
      )}
    </div>
  );
}
