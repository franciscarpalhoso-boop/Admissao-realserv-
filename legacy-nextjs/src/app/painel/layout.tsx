import Link from 'next/link';
import { exigirSessao, permissoes } from '@/lib/auth';
import { rotuloPerfil } from '@/lib/labels';
import { sairAction } from '@/app/login/actions';
import { Botao } from '@/components/ui';
import { NavegacaoPainel } from './navegacao';

export default async function LayoutPainel({ children }: { children: React.ReactNode }) {
  const sessao = await exigirSessao();

  const itens = [
    { href: '/painel', rotulo: 'Painel' },
    { href: '/painel/candidatos', rotulo: 'Candidatos' },
    ...(permissoes.operarDp(sessao.perfil)
      ? [{ href: '/painel/relatorios', rotulo: 'Relatórios' }]
      : []),
    ...(permissoes.administrar(sessao.perfil)
      ? [{ href: '/painel/cadastros', rotulo: 'Cadastros' }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="nao-imprimir sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5">
          <Link href="/painel" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-marca-600 text-xs font-bold text-white">
              RS
            </span>
            <span className="hidden text-sm font-semibold text-slate-900 sm:inline">
              Real Serv · Admissão
            </span>
          </Link>

          <NavegacaoPainel itens={itens} />

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-medium leading-tight text-slate-800">{sessao.nome}</p>
              <p className="text-[11px] leading-tight text-slate-500">
                {rotuloPerfil[sessao.perfil]}
              </p>
            </div>
            <form action={sairAction}>
              <Botao type="submit" variante="contorno" tamanho="sm">
                Sair
              </Botao>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
