import { prisma } from '@/lib/prisma';
import { exigirPerfil } from '@/lib/auth';
import { ETAPAS, rotuloEtapa } from '@/lib/labels';
import { formatarData } from '@/lib/formato';
import { Card, CardCabecalho, CardCorpo, CardTitulo, Vazio } from '@/components/ui';
import { Exportacao } from './exportacao';

export const dynamic = 'force-dynamic';

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

export default async function PaginaRelatorios() {
  await exigirPerfil('ADMIN', 'DP');

  const [porEtapa, empresas, admissoes, pendencias, bancoTalentos, tempos] = await Promise.all([
    prisma.candidato.groupBy({
      by: ['etapa'],
      _count: true,
      where: { anonimizadoEm: null },
    }),
    prisma.empresa.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' } }),
    prisma.informacoesInternas.findMany({
      where: { numeroAdmissao: { not: null } },
      include: { empresa: true, candidato: { select: { nomeCompleto: true } } },
      orderBy: [{ admissaoAno: 'desc' }, { admissaoMes: 'desc' }, { admissaoSequencial: 'desc' }],
    }),
    prisma.documentoCandidato.findMany({
      where: {
        exigencia: 'OBRIGATORIO',
        status: { in: ['PENDENTE', 'COM_PENDENCIA'] },
        candidato: {
          anonimizadoEm: null,
          etapa: { in: ['APROVADO', 'DOCUMENTACAO', 'EXAME_ADMISSIONAL'] },
        },
      },
      include: { candidato: { select: { id: true, nomeCompleto: true } } },
      orderBy: { candidatoId: 'asc' },
    }),
    prisma.candidato.findMany({
      where: { etapa: 'BANCO_TALENTOS', anonimizadoEm: null },
      include: { funcao: true },
      orderBy: { nomeCompleto: 'asc' },
    }),
    prisma.entrevista.findMany({
      where: { realizada: true, candidato: { etapa: 'ADMITIDO' } },
      select: { realizadaEm: true, candidato: { select: { informacoesInternas: { select: { dataInicio: true } } } } },
    }),
  ]);

  // Admissões por mês/ano e por empresa.
  const porMes = new Map<string, number>();
  const porEmpresa = new Map<string, number>();
  for (const admissao of admissoes) {
    if (admissao.admissaoAno && admissao.admissaoMes) {
      const chave = `${admissao.admissaoAno}-${String(admissao.admissaoMes).padStart(2, '0')}`;
      porMes.set(chave, (porMes.get(chave) ?? 0) + 1);
    }
    const nomeEmpresa = admissao.empresa?.nome ?? 'Sem empresa definida';
    porEmpresa.set(nomeEmpresa, (porEmpresa.get(nomeEmpresa) ?? 0) + 1);
  }

  // Tempo médio entre entrevista realizada e data de início da admissão.
  const intervalos = tempos
    .map((t) => {
      const inicio = t.candidato.informacoesInternas?.dataInicio;
      if (!t.realizadaEm || !inicio) return null;
      const dias = (inicio.getTime() - t.realizadaEm.getTime()) / (1000 * 60 * 60 * 24);
      return dias >= 0 ? dias : null;
    })
    .filter((d): d is number => d !== null);
  const tempoMedio =
    intervalos.length > 0
      ? Math.round(intervalos.reduce((s, d) => s + d, 0) / intervalos.length)
      : null;

  // Banco de talentos por função e cidade.
  const talentosAgrupados = new Map<string, number>();
  for (const candidato of bancoTalentos) {
    const chave = `${candidato.funcao?.nome ?? 'Sem função'} — ${candidato.cidade ?? 'cidade não informada'}`;
    talentosAgrupados.set(chave, (talentosAgrupados.get(chave) ?? 0) + 1);
  }

  // Documentos pendentes agrupados por candidato.
  const pendenciasPorCandidato = new Map<string, { nome: string; itens: string[] }>();
  for (const pendencia of pendencias) {
    const atual = pendenciasPorCandidato.get(pendencia.candidato.id) ?? {
      nome: pendencia.candidato.nomeCompleto,
      itens: [],
    };
    atual.itens.push(pendencia.nome);
    pendenciasPorCandidato.set(pendencia.candidato.id, atual);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Relatórios</h1>
        <p className="text-sm text-slate-500">
          Indicadores do processo e exportação para a contabilidade.
        </p>
      </div>

      <Exportacao empresas={empresas.map((e) => ({ id: e.id, nome: e.nome }))} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardCabecalho>
            <CardTitulo>Candidatos por etapa</CardTitulo>
          </CardCabecalho>
          <CardCorpo className="space-y-1.5">
            {ETAPAS.map((etapa) => {
              const total = porEtapa.find((p) => p.etapa === etapa)?._count ?? 0;
              const maximo = Math.max(...porEtapa.map((p) => p._count), 1);
              return (
                <div key={etapa} className="flex items-center gap-2">
                  <span className="w-44 shrink-0 text-xs text-slate-600">{rotuloEtapa[etapa]}</span>
                  <div className="h-3 flex-1 overflow-hidden rounded bg-slate-100">
                    <div
                      className="h-full rounded bg-marca-500"
                      style={{ width: `${(total / maximo) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-xs font-medium text-slate-700">
                    {total}
                  </span>
                </div>
              );
            })}
          </CardCorpo>
        </Card>

        <Card>
          <CardCabecalho>
            <CardTitulo>Tempo médio entre entrevista e admissão</CardTitulo>
          </CardCabecalho>
          <CardCorpo>
            {tempoMedio === null ? (
              <Vazio>Ainda não há admissões com entrevista e data de início registradas.</Vazio>
            ) : (
              <div>
                <p className="text-3xl font-semibold text-slate-900">{tempoMedio} dias</p>
                <p className="mt-1 text-xs text-slate-500">
                  Média de {intervalos.length} admissão(ões) com as duas datas preenchidas.
                </p>
              </div>
            )}
          </CardCorpo>
        </Card>

        <Card>
          <CardCabecalho>
            <CardTitulo>Admissões por mês</CardTitulo>
          </CardCabecalho>
          <CardCorpo>
            {porMes.size === 0 ? (
              <Vazio>Nenhuma admissão registrada.</Vazio>
            ) : (
              <ul className="space-y-1 text-sm">
                {[...porMes.entries()]
                  .sort((a, b) => b[0].localeCompare(a[0]))
                  .map(([chave, total]) => {
                    const [ano, mes] = chave.split('-');
                    return (
                      <li key={chave} className="flex justify-between border-b border-slate-100 py-1">
                        <span className="text-slate-700">
                          {MESES[Number(mes) - 1]} de {ano}
                        </span>
                        <span className="font-medium text-slate-900">{total}</span>
                      </li>
                    );
                  })}
              </ul>
            )}
          </CardCorpo>
        </Card>

        <Card>
          <CardCabecalho>
            <CardTitulo>Admissões por empresa</CardTitulo>
          </CardCabecalho>
          <CardCorpo>
            {porEmpresa.size === 0 ? (
              <Vazio>Nenhuma admissão registrada.</Vazio>
            ) : (
              <ul className="space-y-1 text-sm">
                {[...porEmpresa.entries()]
                  .sort((a, b) => b[1] - a[1])
                  .map(([nome, total]) => (
                    <li key={nome} className="flex justify-between border-b border-slate-100 py-1">
                      <span className="text-slate-700">{nome}</span>
                      <span className="font-medium text-slate-900">{total}</span>
                    </li>
                  ))}
              </ul>
            )}
          </CardCorpo>
        </Card>

        <Card>
          <CardCabecalho>
            <CardTitulo>Documentos pendentes</CardTitulo>
          </CardCabecalho>
          <CardCorpo>
            {pendenciasPorCandidato.size === 0 ? (
              <Vazio>Nenhuma pendência nos candidatos em fase de documentação.</Vazio>
            ) : (
              <ul className="space-y-2 text-sm">
                {[...pendenciasPorCandidato.entries()].map(([id, dados]) => (
                  <li key={id}>
                    <a
                      href={`/painel/candidatos/${id}?aba=documentos`}
                      className="font-medium text-marca-700 hover:underline"
                    >
                      {dados.nome}
                    </a>
                    <p className="text-xs text-slate-500">{dados.itens.join(', ')}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardCorpo>
        </Card>

        <Card>
          <CardCabecalho>
            <CardTitulo>Banco de talentos por função e cidade</CardTitulo>
          </CardCabecalho>
          <CardCorpo>
            {talentosAgrupados.size === 0 ? (
              <Vazio>Nenhum candidato no banco de talentos.</Vazio>
            ) : (
              <ul className="space-y-1 text-sm">
                {[...talentosAgrupados.entries()]
                  .sort((a, b) => b[1] - a[1])
                  .map(([chave, total]) => (
                    <li key={chave} className="flex justify-between border-b border-slate-100 py-1">
                      <span className="text-slate-700">{chave}</span>
                      <span className="font-medium text-slate-900">{total}</span>
                    </li>
                  ))}
              </ul>
            )}
          </CardCorpo>
        </Card>
      </div>

      <Card>
        <CardCabecalho>
          <CardTitulo>Últimas admissões</CardTitulo>
        </CardCabecalho>
        <CardCorpo className="p-0">
          {admissoes.length === 0 ? (
            <div className="p-4">
              <Vazio>Nenhuma admissão registrada.</Vazio>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Nº</th>
                    <th className="px-4 py-2 font-medium">Candidato</th>
                    <th className="px-4 py-2 font-medium">Empresa</th>
                    <th className="px-4 py-2 font-medium">Início</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {admissoes.slice(0, 20).map((admissao) => (
                    <tr key={admissao.id}>
                      <td className="px-4 py-2 font-medium text-slate-900">
                        {admissao.numeroAdmissao}
                      </td>
                      <td className="px-4 py-2 text-slate-700">{admissao.candidato.nomeCompleto}</td>
                      <td className="px-4 py-2 text-slate-700">{admissao.empresa?.nome ?? '—'}</td>
                      <td className="px-4 py-2 text-slate-600">{formatarData(admissao.dataInicio)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardCorpo>
      </Card>
    </div>
  );
}
