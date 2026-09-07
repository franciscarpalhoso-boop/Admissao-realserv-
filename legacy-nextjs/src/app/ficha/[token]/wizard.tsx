'use client';

import { useState } from 'react';
import { Aviso, Card, CardCorpo } from '@/components/ui';
import { cn } from '@/lib/utils';
import { EtapaDadosPessoais } from './etapas/dados-pessoais';
import { EtapaDocumentacao } from './etapas/documentacao';
import { EtapaCursos } from './etapas/cursos';
import { EtapaEmpregos } from './etapas/empregos';
import { EtapaUniforme } from './etapas/uniforme';
import { EtapaQuestionario } from './etapas/questionario';
import { EtapaDeclaracao } from './etapas/declaracao';
import { EtapaDocumentos } from './etapas/documentos';
import type { FichaCandidato, FuncaoResumo } from './tipos';

const TITULOS = [
  'Dados pessoais',
  'Documentação',
  'Cursos e referências',
  'Empregos anteriores',
  'Uniforme',
  'Questionário',
  'Declaração e assinatura',
  'Envio de documentos',
];

export function Wizard({
  token,
  candidato,
  funcoes,
  termoVeracidade,
  termoLgpd,
  localAssinatura,
}: {
  token: string;
  candidato: FichaCandidato;
  funcoes: FuncaoResumo[];
  termoVeracidade: string;
  termoLgpd: string;
  localAssinatura: string;
}) {
  const fichaEnviada = candidato.statusFicha === 'ENVIADA';
  const [etapa, setEtapa] = useState(fichaEnviada ? 8 : 1);
  const [funcaoId, setFuncaoId] = useState(candidato.funcaoId ?? '');

  const funcaoSelecionada = funcoes.find((f) => f.id === funcaoId) ?? null;
  const avancar = () => setEtapa((e) => Math.min(e + 1, 8));
  const voltar = () => setEtapa((e) => Math.max(e - 1, 1));

  const props = { token, candidato, avancar, voltar };

  return (
    <div className="space-y-4">
      <Card>
        <CardCorpo className="py-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">
              Etapa {etapa} de 8 · {TITULOS[etapa - 1]}
            </p>
            <span className="text-xs text-slate-500">{Math.round((etapa / 8) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-marca-600 transition-all"
              style={{ width: `${(etapa / 8) * 100}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {TITULOS.map((titulo, i) => {
              const numero = i + 1;
              const bloqueado = fichaEnviada && numero < 8;
              return (
                <button
                  key={titulo}
                  type="button"
                  disabled={bloqueado}
                  onClick={() => setEtapa(numero)}
                  className={cn(
                    'h-6 w-6 rounded text-[11px] font-medium transition-colors',
                    numero === etapa
                      ? 'bg-marca-600 text-white'
                      : bloqueado
                        ? 'bg-slate-100 text-slate-300'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                  )}
                  title={titulo}
                >
                  {numero}
                </button>
              );
            })}
          </div>
        </CardCorpo>
      </Card>

      {fichaEnviada && etapa === 8 && (
        <Aviso tipo="sucesso">
          <p className="font-medium">Ficha enviada com sucesso.</p>
          <p className="mt-1">
            Agora envie os documentos abaixo. Você pode fechar esta página e voltar pelo mesmo link
            a qualquer momento.
          </p>
        </Aviso>
      )}

      <Card>
        <CardCorpo>
          {etapa === 1 && (
            <EtapaDadosPessoais
              {...props}
              funcoes={funcoes}
              funcaoId={funcaoId}
              onFuncaoChange={setFuncaoId}
            />
          )}
          {etapa === 2 && <EtapaDocumentacao {...props} exigeCnh={funcaoSelecionada?.exigeCnh ?? false} />}
          {etapa === 3 && <EtapaCursos {...props} />}
          {etapa === 4 && <EtapaEmpregos {...props} />}
          {etapa === 5 && <EtapaUniforme {...props} funcao={funcaoSelecionada} />}
          {etapa === 6 && <EtapaQuestionario {...props} />}
          {etapa === 7 && (
            <EtapaDeclaracao
              {...props}
              termoVeracidade={termoVeracidade}
              termoLgpd={termoLgpd}
              localAssinatura={localAssinatura}
            />
          )}
          {etapa === 8 && <EtapaDocumentos token={token} candidato={candidato} voltar={voltar} />}
        </CardCorpo>
      </Card>

      <p className="px-1 text-center text-[11px] leading-relaxed text-slate-400">
        Seus dados são usados apenas para o processo de recrutamento e admissão do Grupo Real Serv,
        conforme a Lei nº 13.709/2018 (LGPD).
      </p>
    </div>
  );
}
