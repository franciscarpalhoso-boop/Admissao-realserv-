'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import type { Perfil } from '@prisma/client';
import { Aviso, Botao, Campo, Input, Select, Selo, Textarea, Vazio } from '@/components/ui';
import { rotuloModalidade, rotuloParecer } from '@/lib/labels';
import { formatarDataHora } from '@/lib/formato';
import { normalizarWhatsapp } from '@/lib/validacao';
import { permissoes } from '@/lib/permissoes-cliente';
import type { CandidatoCompleto } from '@/server/candidatos';
import { agendarEntrevistaAction, registrarEntrevistaAction, type EstadoAcao } from '../actions';
import type { OpcoesCadastro } from './abas';

function BotaoSalvar({ rotulo }: { rotulo: string }) {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" disabled={pending}>
      {pending ? 'Salvando...' : rotulo}
    </Botao>
  );
}

function Nota({ nome, rotulo, padrao }: { nome: string; rotulo: string; padrao: number | null }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-slate-600">{rotulo}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer">
            <input
              type="radio"
              name={nome}
              value={n}
              defaultChecked={padrao === n}
              className="peer sr-only"
            />
            <span className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-sm text-slate-600 peer-checked:border-marca-500 peer-checked:bg-marca-600 peer-checked:text-white">
              {n}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function SimNaoLinha({
  nome,
  rotulo,
  padrao,
}: {
  nome: string;
  rotulo: string;
  padrao: boolean | null;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-1.5">
      <span className="text-sm text-slate-700">{rotulo}</span>
      <div className="flex shrink-0 gap-3">
        {[
          { v: 'sim', r: 'Sim' },
          { v: 'nao', r: 'Não' },
        ].map((o) => (
          <label key={o.v} className="flex items-center gap-1 text-xs text-slate-600">
            <input
              type="radio"
              name={nome}
              value={o.v}
              defaultChecked={padrao === (o.v === 'sim')}
              className="h-3.5 w-3.5 accent-marca-600"
            />
            {o.r}
          </label>
        ))}
      </div>
    </div>
  );
}

export function AbaEntrevista({
  candidato,
  perfil,
  opcoes,
}: {
  candidato: CandidatoCompleto;
  perfil: Perfil;
  opcoes: OpcoesCadastro;
}) {
  const router = useRouter();
  const podeRecrutar = permissoes.recrutar(perfil);
  const [agendando, setAgendando] = useState(false);
  const [modalidade, setModalidade] = useState<'PRESENCIAL' | 'ONLINE'>('PRESENCIAL');

  const [estadoAgenda, acaoAgenda] = useActionState<EstadoAcao, FormData>(
    agendarEntrevistaAction,
    {},
  );
  const [estadoRegistro, acaoRegistro] = useActionState<EstadoAcao, FormData>(
    registrarEntrevistaAction,
    {},
  );

  const refAgenda = useRef(estadoAgenda);
  const refRegistro = useRef(estadoRegistro);

  useEffect(() => {
    if (estadoAgenda !== refAgenda.current) {
      refAgenda.current = estadoAgenda;
      if (estadoAgenda.sucesso) {
        setAgendando(false);
        router.refresh();
      }
    }
  }, [estadoAgenda, router]);

  useEffect(() => {
    if (estadoRegistro !== refRegistro.current) {
      refRegistro.current = estadoRegistro;
      if (estadoRegistro.sucesso) router.refresh();
    }
  }, [estadoRegistro, router]);

  const pendente = candidato.entrevistas.find((e) => !e.realizada);
  const whatsapp = normalizarWhatsapp(candidato.celularWhatsapp);

  const mensagemConfirmacao = pendente
    ? `Olá ${candidato.nomeCompleto}! Confirmamos sua entrevista no Grupo Real Serv em ${formatarDataHora(
        pendente.dataHora,
      )}${pendente.modalidade === 'ONLINE' ? ` (online: ${pendente.linkOnline ?? 'link a enviar'})` : ` na ${pendente.local ?? 'nossa sede'}`}. Leve um documento com foto e o currículo. Até lá!`
    : '';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">Entrevistas</h3>
        {podeRecrutar && !agendando && (
          <Botao tamanho="sm" onClick={() => setAgendando(true)}>
            Agendar entrevista
          </Botao>
        )}
      </div>

      {agendando && (
        <form action={acaoAgenda} className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <input type="hidden" name="candidatoId" value={candidato.id} />
          {estadoAgenda.erro && <Aviso tipo="erro">{estadoAgenda.erro}</Aviso>}
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo rotulo="Data e hora" obrigatorio>
              <Input name="dataHora" type="datetime-local" required />
            </Campo>
            <Campo rotulo="Modalidade">
              <Select
                name="modalidade"
                value={modalidade}
                onChange={(e) => setModalidade(e.target.value as typeof modalidade)}
              >
                <option value="PRESENCIAL">Presencial (sede)</option>
                <option value="ONLINE">Online</option>
              </Select>
            </Campo>
          </div>
          {modalidade === 'PRESENCIAL' ? (
            <Campo rotulo="Local">
              <Input name="local" defaultValue="Sede — Santos/SP" />
            </Campo>
          ) : (
            <Campo rotulo="Link da reunião">
              <Input name="linkOnline" type="url" placeholder="https://meet.google.com/..." />
            </Campo>
          )}
          <Campo rotulo="Entrevistador">
            <Select name="entrevistadorId" defaultValue="">
              <option value="">Eu mesmo</option>
              {opcoes.entrevistadores.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </Select>
          </Campo>
          <div className="flex gap-2">
            <Botao type="button" variante="contorno" onClick={() => setAgendando(false)}>
              Cancelar
            </Botao>
            <BotaoSalvar rotulo="Agendar" />
          </div>
        </form>
      )}

      {candidato.entrevistas.length === 0 && !agendando && (
        <Vazio>Nenhuma entrevista agendada para este candidato.</Vazio>
      )}

      {candidato.entrevistas.map((entrevista) => (
        <div key={entrevista.id} className="rounded-md border border-slate-200 p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-slate-900">
                {formatarDataHora(entrevista.dataHora)} ·{' '}
                {rotuloModalidade[entrevista.modalidade]}
              </p>
              <p className="text-xs text-slate-500">
                {entrevista.local ?? entrevista.linkOnline ?? '—'}
                {entrevista.entrevistador && ` · ${entrevista.entrevistador.nome}`}
              </p>
            </div>
            {entrevista.realizada ? (
              <Selo className="border-emerald-200 bg-emerald-50 text-emerald-800">
                Realizada
                {entrevista.parecer && ` · ${rotuloParecer[entrevista.parecer]}`}
              </Selo>
            ) : (
              <div className="flex gap-2">
                <Selo className="border-sky-200 bg-sky-50 text-sky-800">Agendada</Selo>
                {whatsapp && (
                  <a
                    href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(mensagemConfirmacao)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-emerald-700 hover:underline"
                  >
                    Confirmar por WhatsApp
                  </a>
                )}
                {candidato.email && (
                  <a
                    href={`mailto:${candidato.email}?subject=${encodeURIComponent(
                      'Confirmação de entrevista — Grupo Real Serv',
                    )}&body=${encodeURIComponent(mensagemConfirmacao)}`}
                    className="text-xs font-medium text-marca-700 hover:underline"
                  >
                    Enviar e-mail
                  </a>
                )}
              </div>
            )}
          </div>

          {entrevista.realizada && (
            <div className="mt-3 space-y-1 border-t border-slate-100 pt-2 text-xs text-slate-600">
              <p>
                Notas — pontualidade {entrevista.notaPontualidade ?? '—'}, apresentação{' '}
                {entrevista.notaApresentacao ?? '—'}, comunicação {entrevista.notaComunicacao ?? '—'},
                experiência {entrevista.notaExperiencia ?? '—'}, disponibilidade{' '}
                {entrevista.notaDisponibilidade ?? '—'}
              </p>
              {entrevista.horarioChegada && <p>Horário de chegada: {entrevista.horarioChegada}</p>}
              {entrevista.tempoDeslocamento && (
                <p>Deslocamento até o posto: {entrevista.tempoDeslocamento}</p>
              )}
              {entrevista.postoSugerido && <p>Posto sugerido: {entrevista.postoSugerido.nome}</p>}
              {entrevista.vagasIndicadas.length > 0 && (
                <p>Vagas indicadas: {entrevista.vagasIndicadas.join(', ')}</p>
              )}
              {entrevista.observacoes && (
                <p className="whitespace-pre-line text-slate-700">{entrevista.observacoes}</p>
              )}
            </div>
          )}

          {podeRecrutar && !entrevista.realizada && (
            <form action={acaoRegistro} className="mt-3 space-y-4 border-t border-slate-100 pt-3">
              <input type="hidden" name="entrevistaId" value={entrevista.id} />
              {estadoRegistro.erro && <Aviso tipo="erro">{estadoRegistro.erro}</Aviso>}

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Roteiro da entrevista
              </p>

              <Campo rotulo="Horário de chegada" className="sm:max-w-[160px]">
                <Input name="horarioChegada" type="time" />
              </Campo>

              <div className="grid gap-3 sm:grid-cols-2">
                <Nota nome="notaPontualidade" rotulo="Pontualidade" padrao={entrevista.notaPontualidade} />
                <Nota nome="notaApresentacao" rotulo="Apresentação pessoal" padrao={entrevista.notaApresentacao} />
                <Nota nome="notaComunicacao" rotulo="Comunicação" padrao={entrevista.notaComunicacao} />
                <Nota nome="notaExperiencia" rotulo="Experiência na função" padrao={entrevista.notaExperiencia} />
                <Nota
                  nome="notaDisponibilidade"
                  rotulo="Disponibilidade de horário"
                  padrao={entrevista.notaDisponibilidade}
                />
              </div>

              <div>
                <SimNaoLinha
                  nome="disponibilidadeDomingos"
                  rotulo="Disponível para domingos e feriados"
                  padrao={entrevista.disponibilidadeDomingos}
                />
                <SimNaoLinha
                  nome="restricaoHorarioFilhos"
                  rotulo="Tem restrição de horário por filhos menores"
                  padrao={entrevista.restricaoHorarioFilhos}
                />
                <SimNaoLinha nome="possuiCnh" rotulo="Possui CNH" padrao={entrevista.possuiCnh} />
                <SimNaoLinha
                  nome="experienciaManobra"
                  rotulo="Experiência em estacionamento/manobra"
                  padrao={entrevista.experienciaManobra}
                />
                <SimNaoLinha
                  nome="conhecimentoInformatica"
                  rotulo="Conhecimento básico de informática"
                  padrao={entrevista.conhecimentoInformatica}
                />
                <SimNaoLinha
                  nome="experienciaMilitarSeguranca"
                  rotulo="Experiência militar ou em segurança"
                  padrao={entrevista.experienciaMilitarSeguranca}
                />
                <SimNaoLinha
                  nome="interesseCursos"
                  rotulo="Interesse em fazer cursos"
                  padrao={entrevista.interesseCursos}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Campo rotulo="Detalhe da restrição de horário">
                  <Input name="restricaoHorarioDetalhe" />
                </Campo>
                <Campo rotulo="Distância/tempo até o posto">
                  <Input name="tempoDeslocamento" placeholder="Ex.: 40 min de ônibus" />
                </Campo>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Campo rotulo="Parecer final" obrigatorio>
                  <Select name="parecer" defaultValue="" required>
                    <option value="">Selecione...</option>
                    <option value="APROVADO">Aprovado</option>
                    <option value="REPROVADO">Reprovado</option>
                    <option value="BANCO_TALENTOS">Banco de talentos</option>
                  </Select>
                </Campo>
                <Campo rotulo="Posto sugerido">
                  <Select name="postoSugeridoId" defaultValue="">
                    <option value="">—</option>
                    {opcoes.postos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </Select>
                </Campo>
              </div>

              <Campo rotulo="Vagas indicadas" ajuda="Separe por vírgula.">
                <Input name="vagasIndicadas" placeholder="Porteiro, Controlador de acesso" />
              </Campo>

              <Campo rotulo="Observações">
                <Textarea name="observacoes" rows={3} />
              </Campo>

              <BotaoSalvar rotulo="Registrar avaliação" />
            </form>
          )}
        </div>
      ))}
    </div>
  );
}
