import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { exigirSessao } from '@/lib/auth';
import { buscarCandidatoCompleto, linkPublico, pendenciasDoCandidato } from '@/server/candidatos';
import { corEtapa, rotuloEtapa, rotuloStatusFicha } from '@/lib/labels';
import { formatarData } from '@/lib/formato';
import { mascararCpf, mascararTelefone, normalizarWhatsapp } from '@/lib/validacao';
import { Aviso, Card, CardCorpo, Selo } from '@/components/ui';
import { Abas } from './abas';
import { AcoesCandidato } from './acoes-candidato';

export const dynamic = 'force-dynamic';

export default async function PaginaCandidato({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aba?: string }>;
}) {
  const sessao = await exigirSessao();
  const { id } = await params;
  const { aba } = await searchParams;

  const candidato = await buscarCandidatoCompleto(id);
  if (!candidato) notFound();

  if (candidato.anonimizadoEm) {
    return (
      <Aviso tipo="alerta">
        Este candidato foi anonimizado em {formatarData(candidato.anonimizadoEm)} pela política de
        retenção de dados (LGPD). Os dados pessoais não estão mais disponíveis.
      </Aviso>
    );
  }

  const [empresas, postos, escalas, supervisores, usuarios] = await Promise.all([
    prisma.empresa.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' } }),
    prisma.posto.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' } }),
    prisma.escala.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' } }),
    prisma.supervisor.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' } }),
    prisma.usuario.findMany({
      where: { ativo: true, perfil: { in: ['ADMIN', 'RECRUTADOR'] } },
      orderBy: { nome: 'asc' },
    }),
  ]);

  const pendencias = pendenciasDoCandidato(candidato);
  const whatsapp = normalizarWhatsapp(candidato.celularWhatsapp);

  return (
    <div className="space-y-4">
      <div>
        <Link href="/painel/candidatos" className="text-xs text-slate-500 hover:underline">
          ← Voltar para candidatos
        </Link>
      </div>

      <Card>
        <CardCorpo>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-semibold text-slate-900">{candidato.nomeCompleto}</h1>
                <Selo className={corEtapa[candidato.etapa]}>{rotuloEtapa[candidato.etapa]}</Selo>
                {candidato.informacoesInternas?.numeroAdmissao && (
                  <Selo className="border-green-300 bg-green-50 text-green-800">
                    {candidato.informacoesInternas.numeroAdmissao}
                  </Selo>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-600">
                {candidato.funcao?.nome ?? 'Vaga não informada'}
                {candidato.cpf && ` · CPF ${mascararCpf(candidato.cpf)}`}
                {candidato.celularWhatsapp && ` · ${mascararTelefone(candidato.celularWhatsapp)}`}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Ficha: {rotuloStatusFicha[candidato.statusFicha]}
                {candidato.assinaturaData && ` · assinada em ${formatarData(candidato.assinaturaData)}`}
              </p>
            </div>

            <AcoesCandidato
              candidatoId={candidato.id}
              etapaAtual={candidato.etapa}
              perfil={sessao.perfil}
              pendencias={pendencias}
              link={linkPublico(candidato.tokenPublico)}
              whatsapp={whatsapp}
              tokenExpiraEm={candidato.tokenExpiraEm ? formatarData(candidato.tokenExpiraEm) : null}
            />
          </div>

          {pendencias.length > 0 && (
            <Aviso tipo="alerta" className="mt-3">
              <span className="font-medium">
                {pendencias.length} documento(s) obrigatório(s) sem conferência:
              </span>{' '}
              {pendencias.map((p) => p.nome).join(', ')}.
            </Aviso>
          )}
        </CardCorpo>
      </Card>

      <Abas
        candidato={JSON.parse(JSON.stringify(candidato))}
        abaAtiva={aba ?? 'ficha'}
        perfil={sessao.perfil}
        opcoes={{
          empresas: empresas.map((e) => ({ id: e.id, nome: e.nome })),
          postos: postos.map((p) => ({ id: p.id, nome: p.nome })),
          escalas: escalas.map((e) => ({ id: e.id, nome: e.nome })),
          supervisores: supervisores.map((s) => ({ id: s.id, nome: s.nome })),
          entrevistadores: usuarios.map((u) => ({ id: u.id, nome: u.nome })),
        }}
      />
    </div>
  );
}
