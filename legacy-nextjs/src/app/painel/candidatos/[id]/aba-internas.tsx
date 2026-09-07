'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import type { Perfil } from '@prisma/client';
import { Aviso, Botao, Campo, Input, Select, Textarea } from '@/components/ui';
import { paraInputDate } from '@/lib/formato';
import { permissoes } from '@/lib/permissoes-cliente';
import type { CandidatoCompleto } from '@/server/candidatos';
import { salvarInformacoesInternasAction, type EstadoAcao } from '../actions';
import type { OpcoesCadastro } from './abas';

function BotaoSalvar() {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" disabled={pending}>
      {pending ? 'Salvando...' : 'Salvar informações internas'}
    </Botao>
  );
}

export function AbaInternas({
  candidato,
  perfil,
  opcoes,
}: {
  candidato: CandidatoCompleto;
  perfil: Perfil;
  opcoes: OpcoesCadastro;
}) {
  const router = useRouter();
  const podeEditar = permissoes.operarDp(perfil);
  const internas = candidato.informacoesInternas;
  const [acumulo, setAcumulo] = useState(internas?.acumuloFuncao ?? false);
  const [estado, acao] = useActionState<EstadoAcao, FormData>(
    salvarInformacoesInternasAction,
    {},
  );
  const anterior = useRef(estado);

  useEffect(() => {
    if (estado !== anterior.current) {
      anterior.current = estado;
      if (estado.sucesso) router.refresh();
    }
  }, [estado, router]);

  if (!podeEditar) {
    return (
      <Aviso tipo="info">
        Somente o Departamento Pessoal e a administração editam as informações internas.
      </Aviso>
    );
  }

  return (
    <form action={acao} className="space-y-5">
      <input type="hidden" name="candidatoId" value={candidato.id} />
      {estado.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}
      {estado.sucesso && <Aviso tipo="sucesso">{estado.sucesso}</Aviso>}

      {internas?.numeroAdmissao && (
        <Aviso tipo="sucesso">
          Número da admissão gerado: <strong>{internas.numeroAdmissao}</strong>
        </Aviso>
      )}
      {internas?.justificativaForcada && (
        <Aviso tipo="alerta">
          Admissão registrada com documentação pendente. Justificativa:{' '}
          {internas.justificativaForcada}
        </Aviso>
      )}

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Alocação</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Empresa contratante">
            <Select name="empresaId" defaultValue={internas?.empresaId ?? ''}>
              <option value="">Selecione...</option>
              {opcoes.empresas.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome}
                </option>
              ))}
            </Select>
          </Campo>
          <Campo rotulo="Posto de trabalho">
            <Select name="postoId" defaultValue={internas?.postoId ?? ''}>
              <option value="">Selecione...</option>
              {opcoes.postos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </Select>
          </Campo>
          <Campo rotulo="Supervisor">
            <Select name="supervisorId" defaultValue={internas?.supervisorId ?? ''}>
              <option value="">Selecione...</option>
              {opcoes.supervisores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </Select>
          </Campo>
          <Campo rotulo="Escala">
            <Select name="escalaId" defaultValue={internas?.escalaId ?? ''}>
              <option value="">Selecione...</option>
              {opcoes.escalas.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome}
                </option>
              ))}
            </Select>
          </Campo>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="acumuloFuncao"
            checked={acumulo}
            onChange={(e) => setAcumulo(e.target.checked)}
            className="h-4 w-4 accent-marca-600"
          />
          Acúmulo de função
        </label>
        {acumulo && (
          <Campo rotulo="Qual função acumulada?">
            <Input name="acumuloFuncaoQual" defaultValue={internas?.acumuloFuncaoQual ?? ''} />
          </Campo>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Remuneração e benefícios
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Base salarial (R$)">
            <Input
              name="baseSalarial"
              inputMode="decimal"
              placeholder="1.800,00"
              defaultValue={internas?.baseSalarial ? String(internas.baseSalarial) : ''}
            />
          </Campo>
          <Campo rotulo="Outros benefícios">
            <Input name="outrosBeneficios" defaultValue={internas?.outrosBeneficios ?? ''} />
          </Campo>
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="valeTransporte"
              defaultChecked={internas?.valeTransporte ?? false}
              className="h-4 w-4 accent-marca-600"
            />
            Vale-transporte
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="premioAssiduidade"
              defaultChecked={internas?.premioAssiduidade ?? false}
              className="h-4 w-4 accent-marca-600"
            />
            Prêmio assiduidade
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Datas e aprovação
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Data de início">
            <Input name="dataInicio" type="date" defaultValue={paraInputDate(internas?.dataInicio)} />
          </Campo>
          <Campo rotulo="Data do treinamento/integração">
            <Input
              name="dataTreinamento"
              type="date"
              defaultValue={paraInputDate(internas?.dataTreinamento)}
            />
          </Campo>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Responsável pela aprovação">
            <Input name="responsavelAprovacao" defaultValue={internas?.responsavelAprovacao ?? ''} />
          </Campo>
          <Campo
            rotulo="Assinatura digital do responsável"
            ajuda="Nome digitado equivale à assinatura eletrônica interna."
          >
            <Input
              name="assinaturaResponsavel"
              defaultValue={internas?.assinaturaResponsavel ?? ''}
            />
          </Campo>
        </div>
      </section>

      <BotaoSalvar />
    </form>
  );
}
