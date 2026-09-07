'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Botao, Input, Select } from '@/components/ui';
import { ETAPAS, rotuloEtapa } from '@/lib/labels';

export function FiltrosCandidatos({ funcoes }: { funcoes: Array<{ id: string; nome: string }> }) {
  const router = useRouter();
  const params = useSearchParams();

  const aplicar = (formData: FormData) => {
    const novo = new URLSearchParams();
    for (const chave of ['busca', 'etapa', 'funcaoId']) {
      const valor = String(formData.get(chave) ?? '').trim();
      if (valor) novo.set(chave, valor);
    }
    router.push(`/painel/candidatos?${novo.toString()}`);
  };

  return (
    <form action={aplicar} className="flex flex-wrap items-end gap-2">
      <div className="min-w-[220px] flex-1">
        <Input
          name="busca"
          placeholder="Buscar por nome, CPF, e-mail ou telefone"
          defaultValue={params.get('busca') ?? ''}
        />
      </div>
      <Select name="etapa" defaultValue={params.get('etapa') ?? ''} className="w-52">
        <option value="">Todas as etapas</option>
        {ETAPAS.map((e) => (
          <option key={e} value={e}>
            {rotuloEtapa[e]}
          </option>
        ))}
      </Select>
      <Select name="funcaoId" defaultValue={params.get('funcaoId') ?? ''} className="w-52">
        <option value="">Todas as vagas</option>
        {funcoes.map((f) => (
          <option key={f.id} value={f.id}>
            {f.nome}
          </option>
        ))}
      </Select>
      <Botao type="submit" variante="contorno">
        Filtrar
      </Botao>
    </form>
  );
}
