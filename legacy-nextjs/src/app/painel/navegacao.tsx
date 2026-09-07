'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function NavegacaoPainel({ itens }: { itens: Array<{ href: string; rotulo: string }> }) {
  const caminho = usePathname();

  return (
    <nav className="flex items-center gap-1 overflow-x-auto">
      {itens.map((item) => {
        const ativo =
          item.href === '/painel' ? caminho === '/painel' : caminho.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              ativo ? 'bg-marca-50 text-marca-700' : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            {item.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
