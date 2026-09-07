import { prisma } from '@/lib/prisma';
import { buscarCandidatoPorToken } from '@/server/candidatos';
import { Aviso } from '@/components/ui';
import { Wizard } from './wizard';

export const dynamic = 'force-dynamic';

function Moldura({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-marca-600 text-sm font-bold text-white">
            RS
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">Grupo Real Serv</p>
            <p className="text-xs text-slate-500">Ficha de Solicitação de Emprego</p>
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}

export default async function PaginaFichaPublica({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const candidato = await buscarCandidatoPorToken(token);

  if (!candidato) {
    return (
      <Moldura>
        <Aviso tipo="erro">
          <p className="font-medium">Link inválido ou expirado.</p>
          <p className="mt-1">
            Entre em contato com o Departamento Pessoal do Grupo Real Serv para receber um novo link.
          </p>
        </Aviso>
      </Moldura>
    );
  }

  const [funcoes, configuracoes] = await Promise.all([
    prisma.funcao.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' } }),
    prisma.configuracao.findMany({
      where: { chave: { in: ['TERMO_VERACIDADE', 'TERMO_LGPD', 'LOCAL_ASSINATURA'] } },
    }),
  ]);

  const config = Object.fromEntries(configuracoes.map((c) => [c.chave, c.valor]));

  return (
    <Moldura>
      <Wizard
        token={token}
        candidato={JSON.parse(JSON.stringify(candidato))}
        funcoes={funcoes.map((f) => ({
          id: f.id,
          nome: f.nome,
          exigeCnh: f.exigeCnh,
          exigeSapatoPreto: f.exigeSapatoPreto,
          avisoEspecifico: f.avisoEspecifico,
        }))}
        termoVeracidade={config.TERMO_VERACIDADE ?? ''}
        termoLgpd={config.TERMO_LGPD ?? ''}
        localAssinatura={config.LOCAL_ASSINATURA ?? 'Santos/SP'}
      />
    </Moldura>
  );
}
