import { prisma } from '@/lib/prisma';
import { exigirPerfil } from '@/lib/auth';
import { PainelCadastros } from './painel-cadastros';

export const dynamic = 'force-dynamic';

export default async function PaginaCadastros() {
  await exigirPerfil('ADMIN');

  const [empresas, postos, supervisores, funcoes, escalas, checklist, usuarios, configuracoes] =
    await Promise.all([
      prisma.empresa.findMany({ orderBy: { nome: 'asc' } }),
      prisma.posto.findMany({ include: { empresa: true, supervisor: true }, orderBy: { nome: 'asc' } }),
      prisma.supervisor.findMany({ orderBy: { nome: 'asc' } }),
      prisma.funcao.findMany({ orderBy: { nome: 'asc' } }),
      prisma.escala.findMany({ orderBy: { nome: 'asc' } }),
      prisma.itemChecklistPadrao.findMany({ orderBy: { ordem: 'asc' } }),
      prisma.usuario.findMany({ orderBy: { nome: 'asc' } }),
      prisma.configuracao.findMany(),
    ]);

  return (
    <PainelCadastros
      empresas={JSON.parse(JSON.stringify(empresas))}
      postos={JSON.parse(JSON.stringify(postos))}
      supervisores={JSON.parse(JSON.stringify(supervisores))}
      funcoes={JSON.parse(JSON.stringify(funcoes))}
      escalas={JSON.parse(JSON.stringify(escalas))}
      checklist={JSON.parse(JSON.stringify(checklist))}
      usuarios={JSON.parse(JSON.stringify(usuarios.map(({ senhaHash: _, ...u }) => u)))}
      configuracoes={Object.fromEntries(configuracoes.map((c) => [c.chave, c.valor]))}
    />
  );
}
