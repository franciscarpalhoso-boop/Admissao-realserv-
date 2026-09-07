'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import type { EtapaPipeline, Perfil } from '@prisma/client';
import { Aviso, Botao, Campo, Input, Select, Textarea } from '@/components/ui';
import { ETAPAS, rotuloEtapa } from '@/lib/labels';
import { moverEtapaAction, regerarLinkAction, type EstadoAcao } from '../actions';
import { CopiarLink } from '../copiar-link';

function BotaoConfirmar() {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" disabled={pending}>
      {pending ? 'Salvando...' : 'Confirmar'}
    </Botao>
  );
}

export function AcoesCandidato({
  candidatoId,
  etapaAtual,
  perfil,
  pendencias,
  link,
  whatsapp,
  tokenExpiraEm,
}: {
  candidatoId: string;
  etapaAtual: EtapaPipeline;
  perfil: Perfil;
  pendencias: Array<{ id: string; nome: string }>;
  link: string;
  whatsapp: string | null;
  tokenExpiraEm: string | null;
}) {
  const [modal, setModal] = useState<'etapa' | 'link' | null>(null);
  const [destino, setDestino] = useState<EtapaPipeline>(etapaAtual);
  const [estado, acao] = useActionState<EstadoAcao, FormData>(moverEtapaAction, {});

  const admitindoComPendencia = destino === 'ADMITIDO' && pendencias.length > 0;
  const podeForcar = perfil === 'ADMIN';

  return (
    <div className="nao-imprimir flex flex-wrap gap-2">
      <a href={`/api/candidatos/${candidatoId}/ficha`} target="_blank" rel="noopener noreferrer">
        <Botao variante="contorno" tamanho="sm">
          Ficha em PDF
        </Botao>
      </a>
      <a href={`/api/candidatos/${candidatoId}/dossie`}>
        <Botao tamanho="sm">Baixar dossiê (PDF único)</Botao>
      </a>
      <Botao variante="contorno" tamanho="sm" onClick={() => setModal('link')}>
        Link do candidato
      </Botao>
      <Botao variante="secundario" tamanho="sm" onClick={() => setModal('etapa')}>
        Mover etapa
      </Botao>

      {modal === 'link' && (
        <div className="fixed inset-0 z-40 flex items-start justify-center bg-slate-900/40 p-4">
          <div className="mt-16 w-full max-w-md rounded-lg bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Link público da ficha</h2>
              <Botao variante="fantasma" tamanho="sm" onClick={() => setModal(null)}>
                Fechar
              </Botao>
            </div>
            <CopiarLink link={link} whatsapp={whatsapp} />
            <p className="mt-3 text-xs text-slate-500">
              {tokenExpiraEm ? `Válido até ${tokenExpiraEm}.` : 'Sem data de expiração.'}
            </p>
            <form action={regerarLinkAction.bind(null, candidatoId)} className="mt-3">
              <Botao type="submit" variante="contorno" tamanho="sm">
                Gerar novo link (invalida o anterior)
              </Botao>
            </form>
          </div>
        </div>
      )}

      {modal === 'etapa' && (
        <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4">
          <div className="mt-16 w-full max-w-md rounded-lg bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Mover etapa</h2>
              <Botao variante="fantasma" tamanho="sm" onClick={() => setModal(null)}>
                Fechar
              </Botao>
            </div>

            <form action={acao} className="space-y-3">
              <input type="hidden" name="candidatoId" value={candidatoId} />
              {estado.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}
              {estado.sucesso && <Aviso tipo="sucesso">{estado.sucesso}</Aviso>}

              <Campo rotulo="Nova etapa">
                <Select
                  name="para"
                  value={destino}
                  onChange={(e) => setDestino(e.target.value as EtapaPipeline)}
                >
                  {ETAPAS.map((e) => (
                    <option key={e} value={e}>
                      {rotuloEtapa[e]}
                    </option>
                  ))}
                </Select>
              </Campo>

              {destino === 'ADMITIDO' && (
                <Campo
                  rotulo="Data da admissão"
                  ajuda="Define o mês do número ADM. Em branco, usa hoje."
                >
                  <Input name="dataAdmissao" type="date" />
                </Campo>
              )}

              {admitindoComPendencia && (
                <Aviso tipo="alerta">
                  <p className="font-medium">
                    {pendencias.length} documento(s) obrigatório(s) sem conferência.
                  </p>
                  <p className="mt-1 text-xs">{pendencias.map((p) => p.nome).join(', ')}.</p>
                  <p className="mt-1 text-xs">
                    {podeForcar
                      ? 'Como administrador, você pode forçar a admissão informando uma justificativa.'
                      : 'Conclua a conferência ou peça a um administrador para forçar a admissão.'}
                  </p>
                </Aviso>
              )}

              {admitindoComPendencia && podeForcar && (
                <Campo rotulo="Justificativa para forçar a admissão" obrigatorio>
                  <Textarea name="justificativaForcada" rows={3} required />
                </Campo>
              )}

              <Campo rotulo="Observação">
                <Textarea name="observacao" rows={2} />
              </Campo>

              <div className="flex justify-end gap-2">
                <Botao type="button" variante="contorno" onClick={() => setModal(null)}>
                  Cancelar
                </Botao>
                <BotaoConfirmar />
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
