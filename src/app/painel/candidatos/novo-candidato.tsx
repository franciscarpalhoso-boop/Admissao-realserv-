'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Aviso, Botao, Campo, Input, Select, Textarea } from '@/components/ui';
import { normalizarWhatsapp, mascararTelefone } from '@/lib/validacao';
import { criarCandidatoAction, type EstadoAcao } from './actions';
import { CopiarLink } from './copiar-link';

function BotaoSalvar() {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" disabled={pending}>
      {pending ? 'Cadastrando...' : 'Cadastrar e gerar link'}
    </Botao>
  );
}

export function NovoCandidato({ funcoes }: { funcoes: Array<{ id: string; nome: string }> }) {
  const [aberto, setAberto] = useState(false);
  const [celular, setCelular] = useState('');
  const [estado, acao] = useActionState<EstadoAcao, FormData>(criarCandidatoAction, {});

  if (!aberto) {
    return <Botao onClick={() => setAberto(true)}>Novo candidato</Botao>;
  }

  const whatsapp = normalizarWhatsapp(celular);

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4">
      <div className="mt-10 w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Novo candidato</h2>
          <Botao variante="fantasma" tamanho="sm" onClick={() => setAberto(false)}>
            Fechar
          </Botao>
        </div>

        <div className="px-4 py-4">
          {estado.link ? (
            <div className="space-y-3">
              <Aviso tipo="sucesso">{estado.sucesso}</Aviso>
              <CopiarLink link={estado.link} whatsapp={whatsapp} />
              <div className="flex gap-2">
                <Botao variante="contorno" onClick={() => window.location.reload()}>
                  Concluir
                </Botao>
              </div>
            </div>
          ) : (
            <form action={acao} className="space-y-3">
              {estado.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}
              <Campo rotulo="Nome completo" obrigatorio>
                <Input name="nomeCompleto" required autoFocus />
              </Campo>
              <div className="grid gap-3 sm:grid-cols-2">
                <Campo rotulo="Celular (WhatsApp)" ajuda="Usado para enviar o link da ficha.">
                  <Input
                    name="celularWhatsapp"
                    inputMode="tel"
                    value={celular}
                    onChange={(e) => setCelular(mascararTelefone(e.target.value))}
                    placeholder="(13) 99999-0000"
                  />
                </Campo>
                <Campo rotulo="E-mail">
                  <Input name="email" type="email" />
                </Campo>
              </div>
              <Campo rotulo="Vaga pretendida">
                <Select name="funcaoId" defaultValue="">
                  <option value="">Selecione...</option>
                  {funcoes.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome}
                    </option>
                  ))}
                </Select>
              </Campo>
              <Campo rotulo="Observações da triagem">
                <Textarea name="observacoesTriagem" rows={3} />
              </Campo>
              <div className="flex justify-end gap-2 pt-1">
                <Botao variante="contorno" type="button" onClick={() => setAberto(false)}>
                  Cancelar
                </Botao>
                <BotaoSalvar />
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
