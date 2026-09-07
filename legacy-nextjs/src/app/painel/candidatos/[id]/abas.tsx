'use client';

import { useState } from 'react';
import type { Perfil } from '@prisma/client';
import { Card, CardCorpo } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { CandidatoCompleto } from '@/server/candidatos';
import { AbaFicha } from './aba-ficha';
import { AbaDocumentos } from './aba-documentos';
import { AbaEntrevista } from './aba-entrevista';
import { AbaInternas } from './aba-internas';
import { AbaHistorico } from './aba-historico';

export type OpcoesCadastro = {
  empresas: Array<{ id: string; nome: string }>;
  postos: Array<{ id: string; nome: string }>;
  escalas: Array<{ id: string; nome: string }>;
  supervisores: Array<{ id: string; nome: string }>;
  entrevistadores: Array<{ id: string; nome: string }>;
};

const ABAS = [
  { chave: 'ficha', rotulo: 'Ficha' },
  { chave: 'documentos', rotulo: 'Documentos' },
  { chave: 'entrevista', rotulo: 'Entrevista' },
  { chave: 'internas', rotulo: 'Informações Internas' },
  { chave: 'historico', rotulo: 'Histórico' },
] as const;

export function Abas({
  candidato,
  abaAtiva,
  perfil,
  opcoes,
}: {
  candidato: CandidatoCompleto;
  abaAtiva: string;
  perfil: Perfil;
  opcoes: OpcoesCadastro;
}) {
  const [aba, setAba] = useState(
    ABAS.some((a) => a.chave === abaAtiva) ? abaAtiva : 'ficha',
  );

  const pendentes = candidato.documentos.filter(
    (d) => d.exigencia === 'OBRIGATORIO' && d.status !== 'CONFERIDO',
  ).length;

  return (
    <div className="space-y-3">
      <div className="nao-imprimir flex gap-1 overflow-x-auto border-b border-slate-200">
        {ABAS.map((item) => (
          <button
            key={item.chave}
            type="button"
            onClick={() => setAba(item.chave)}
            className={cn(
              'whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              aba === item.chave
                ? 'border-marca-600 text-marca-700'
                : 'border-transparent text-slate-500 hover:text-slate-800',
            )}
          >
            {item.rotulo}
            {item.chave === 'documentos' && pendentes > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                {pendentes}
              </span>
            )}
          </button>
        ))}
      </div>

      <Card>
        <CardCorpo>
          {aba === 'ficha' && <AbaFicha candidato={candidato} />}
          {aba === 'documentos' && <AbaDocumentos candidato={candidato} perfil={perfil} />}
          {aba === 'entrevista' && (
            <AbaEntrevista candidato={candidato} perfil={perfil} opcoes={opcoes} />
          )}
          {aba === 'internas' && (
            <AbaInternas candidato={candidato} perfil={perfil} opcoes={opcoes} />
          )}
          {aba === 'historico' && <AbaHistorico candidato={candidato} />}
        </CardCorpo>
      </Card>
    </div>
  );
}
