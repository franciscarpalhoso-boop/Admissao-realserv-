'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Aviso, Botao } from '@/components/ui';
import { formatarData } from '@/lib/formato';
import { enviarFichaAction, type EstadoFicha } from '../actions';
import { Assinatura } from './assinatura';
import type { PropsEtapa } from '../tipos';

function BotaoEnviar({ habilitado }: { habilitado: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" className="flex-1" disabled={pending || !habilitado}>
      {pending ? 'Enviando...' : 'Enviar ficha'}
    </Botao>
  );
}

export function EtapaDeclaracao({
  token,
  candidato,
  avancar,
  voltar,
  termoVeracidade,
  termoLgpd,
  localAssinatura,
}: PropsEtapa & { termoVeracidade: string; termoLgpd: string; localAssinatura: string }) {
  const [assinatura, setAssinatura] = useState<string | null>(null);
  const [veracidade, setVeracidade] = useState(false);
  const [lgpd, setLgpd] = useState(false);
  const [estado, acao] = useActionState<EstadoFicha, FormData>(enviarFichaAction, {});
  const anterior = useRef(estado);

  useEffect(() => {
    if (estado !== anterior.current) {
      anterior.current = estado;
      if (estado.sucesso) {
        avancar();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [estado, avancar]);

  const pronto = Boolean(assinatura) && veracidade && lgpd;

  return (
    <form action={acao} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="assinaturaBase64" value={assinatura ?? ''} />

      {estado.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Termo de veracidade
        </p>
        <div className="max-h-40 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
          {termoVeracidade}
        </div>
        <label className="mt-2 flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="aceiteVeracidade"
            checked={veracidade}
            onChange={(e) => setVeracidade(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-marca-600"
          />
          Li e declaro que as informações prestadas são verdadeiras.
        </label>
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Consentimento de dados (LGPD)
        </p>
        <div className="max-h-40 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
          {termoLgpd}
        </div>
        <label className="mt-2 flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="aceiteLgpd"
            checked={lgpd}
            onChange={(e) => setLgpd(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-marca-600"
          />
          Autorizo o tratamento dos meus dados para fins de recrutamento e admissão.
        </label>
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Assinatura
        </p>
        <Assinatura onChange={setAssinatura} />
        <p className="mt-2 text-xs text-slate-500">
          {localAssinatura}, {formatarData(new Date())} · {candidato.nomeCompleto}
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          Seu endereço de IP e o horário do aceite são registrados junto com a assinatura.
        </p>
      </div>

      <div className="sticky bottom-0 -mx-4 flex gap-2 border-t border-slate-100 bg-white px-4 py-3">
        <Botao type="button" variante="contorno" onClick={voltar}>
          Voltar
        </Botao>
        <BotaoEnviar habilitado={pronto} />
      </div>
    </form>
  );
}
