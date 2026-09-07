'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Aviso, Botao } from '@/components/ui';
import { salvarEtapaAction, type EstadoFicha } from '../actions';

function Rodape({ voltar, primeiraEtapa }: { voltar: () => void; primeiraEtapa: boolean }) {
  const { pending } = useFormStatus();
  return (
    <div className="sticky bottom-0 -mx-4 mt-6 flex gap-2 border-t border-slate-100 bg-white px-4 py-3">
      {!primeiraEtapa && (
        <Botao type="button" variante="contorno" onClick={voltar} disabled={pending}>
          Voltar
        </Botao>
      )}
      <Botao type="submit" className="flex-1" disabled={pending}>
        {pending ? 'Salvando...' : 'Salvar e continuar'}
      </Botao>
    </div>
  );
}

/**
 * Casca comum das etapas 1 a 6: envia para salvarEtapaAction, mostra o erro
 * e avança automaticamente quando o salvamento parcial dá certo.
 */
export function FormularioEtapa({
  token,
  etapa,
  avancar,
  voltar,
  children,
}: {
  token: string;
  etapa: number;
  avancar: () => void;
  voltar: () => void;
  children: React.ReactNode;
}) {
  const [estado, acao] = useActionState<EstadoFicha, FormData>(salvarEtapaAction, {});
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

  return (
    <form action={acao} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="etapa" value={etapa} />
      {estado.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}
      {children}
      <Rodape voltar={voltar} primeiraEtapa={etapa === 1} />
    </form>
  );
}

export function Grade({ children, colunas = 2 }: { children: React.ReactNode; colunas?: 1 | 2 | 3 }) {
  const classe =
    colunas === 1 ? 'grid gap-3' : colunas === 3 ? 'grid gap-3 sm:grid-cols-3' : 'grid gap-3 sm:grid-cols-2';
  return <div className={classe}>{children}</div>;
}

export function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {titulo}
      </legend>
      {children}
    </fieldset>
  );
}

/** Grupo de rádio Sim/Não com opção "não respondido". */
export function SimNao({
  name,
  padrao,
}: {
  name: string;
  padrao: boolean | null | undefined;
}) {
  const valor = padrao === true ? 'sim' : padrao === false ? 'nao' : '';
  return (
    <div className="flex gap-4 pt-1.5">
      {[
        { v: 'sim', r: 'Sim' },
        { v: 'nao', r: 'Não' },
      ].map((opcao) => (
        <label key={opcao.v} className="flex items-center gap-1.5 text-sm text-slate-700">
          <input
            type="radio"
            name={name}
            value={opcao.v}
            defaultChecked={valor === opcao.v}
            className="h-4 w-4 accent-marca-600"
          />
          {opcao.r}
        </label>
      ))}
    </div>
  );
}
