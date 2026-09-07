'use client';

import { Selo, Vazio } from '@/components/ui';
import { corEtapa, rotuloEtapa } from '@/lib/labels';
import { formatarDataHora } from '@/lib/formato';
import type { CandidatoCompleto } from '@/server/candidatos';

export function AbaHistorico({ candidato }: { candidato: CandidatoCompleto }) {
  if (candidato.movimentacoes.length === 0) {
    return <Vazio>Sem movimentações registradas.</Vazio>;
  }

  return (
    <ol className="space-y-3">
      {candidato.movimentacoes.map((movimentacao) => (
        <li key={movimentacao.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-marca-500" />
            <span className="w-px flex-1 bg-slate-200" />
          </div>
          <div className="pb-2">
            <div className="flex flex-wrap items-center gap-2">
              {movimentacao.de && (
                <>
                  <Selo className={corEtapa[movimentacao.de]}>{rotuloEtapa[movimentacao.de]}</Selo>
                  <span className="text-xs text-slate-400">→</span>
                </>
              )}
              <Selo className={corEtapa[movimentacao.para]}>{rotuloEtapa[movimentacao.para]}</Selo>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {formatarDataHora(movimentacao.criadoEm)} ·{' '}
              {movimentacao.usuario?.nome ?? movimentacao.autorLabel}
            </p>
            {movimentacao.observacao && (
              <p className="mt-1 text-sm text-slate-700">{movimentacao.observacao}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
