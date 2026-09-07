'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import type { Perfil, StatusDocumento } from '@prisma/client';
import { Aviso, Botao, Campo, Input, Selo, Textarea } from '@/components/ui';
import { corStatusDocumento, rotuloExigencia, rotuloStatusDocumento } from '@/lib/labels';
import { formatarBytes, formatarDataHora } from '@/lib/formato';
import { permissoes } from '@/lib/permissoes-cliente';
import type { CandidatoCompleto } from '@/server/candidatos';
import {
  adicionarItemChecklistAction,
  conferirDocumentoAction,
  removerArquivoAction,
  type EstadoAcao,
} from '../actions';

type Documento = CandidatoCompleto['documentos'][number];

/** Formatos que o pdf-lib consegue incorporar no dossiê. HEIC fica de fora. */
const FORMATOS_NO_DOSSIE = ['image/jpeg', 'image/png', 'application/pdf'];

function BotaoSalvar({ rotulo = 'Salvar' }: { rotulo?: string }) {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" tamanho="sm" disabled={pending}>
      {pending ? 'Salvando...' : rotulo}
    </Botao>
  );
}

function Conferencia({ documento }: { documento: Documento }) {
  const router = useRouter();
  const [estado, acao] = useActionState<EstadoAcao, FormData>(conferirDocumentoAction, {});
  const anterior = useRef(estado);
  const [status, setStatus] = useState<StatusDocumento>(documento.status);

  useEffect(() => {
    if (estado !== anterior.current) {
      anterior.current = estado;
      if (estado.sucesso) router.refresh();
    }
  }, [estado, router]);

  return (
    <form action={acao} className="mt-2 space-y-2 border-t border-slate-100 pt-2">
      <input type="hidden" name="documentoId" value={documento.id} />
      {estado.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex gap-1">
          {(['ENVIADO', 'CONFERIDO', 'COM_PENDENCIA', 'PENDENTE'] as StatusDocumento[]).map((s) => (
            <label key={s} className="cursor-pointer">
              <input
                type="radio"
                name="status"
                value={s}
                checked={status === s}
                onChange={() => setStatus(s)}
                className="peer sr-only"
              />
              <span className="inline-block rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 peer-checked:border-marca-500 peer-checked:bg-marca-50 peer-checked:font-medium peer-checked:text-marca-700">
                {rotuloStatusDocumento[s]}
              </span>
            </label>
          ))}
        </div>
        <BotaoSalvar rotulo="Registrar conferência" />
      </div>

      {status === 'COM_PENDENCIA' && (
        <Campo rotulo="O que está errado? (o candidato verá esta observação)">
          <Textarea
            name="observacaoDp"
            rows={2}
            defaultValue={documento.observacaoDp ?? ''}
            placeholder="Ex.: a foto do RG está cortada, reenvie o verso."
          />
        </Campo>
      )}
    </form>
  );
}

function ItemDocumento({ documento, podeConferir }: { documento: Documento; podeConferir: boolean }) {
  const [expandido, setExpandido] = useState(false);
  const router = useRouter();

  return (
    <div className="rounded-md border border-slate-200 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900">
            {documento.nome}
            {documento.extra && (
              <span className="ml-1.5 text-[10px] font-normal text-slate-400">(item extra)</span>
            )}
          </p>
          <p className="text-xs text-slate-500">
            {rotuloExigencia[documento.exigencia]}
            {documento.conferidoEm &&
              ` · conferido por ${documento.conferidoPor} em ${formatarDataHora(documento.conferidoEm)}`}
          </p>
          {documento.observacaoDp && (
            <p className="mt-1 text-xs font-medium text-red-600">{documento.observacaoDp}</p>
          )}
        </div>
        <Selo className={corStatusDocumento[documento.status]}>
          {rotuloStatusDocumento[documento.status]}
        </Selo>
      </div>

      {documento.arquivos.some((a) => !FORMATOS_NO_DOSSIE.includes(a.mimeType)) && (
        <Aviso tipo="alerta" className="mt-2">
          Há arquivo em formato que não entra no dossiê (HEIC, do iPhone). Peça ao candidato
          para reenviar em JPG, PNG ou PDF — no PDF único ele sairia como página de aviso.
        </Aviso>
      )}

      {documento.arquivos.length > 0 && (
        <ul className="mt-2 space-y-1">
          {documento.arquivos.map((arquivo) => (
            <li key={arquivo.id} className="flex items-center gap-2 text-xs">
              <a
                href={`/api/arquivos/${arquivo.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-marca-700 hover:underline"
              >
                📎 {arquivo.nomeOriginal}
              </a>
              <span className="shrink-0 text-slate-400">{formatarBytes(arquivo.tamanho)}</span>
              {podeConferir && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm(`Remover "${arquivo.nomeOriginal}"?`)) return;
                    await removerArquivoAction(arquivo.id);
                    router.refresh();
                  }}
                  className="shrink-0 text-slate-400 hover:text-red-600"
                >
                  remover
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {documento.arquivos.length > 0 && (
        <button
          type="button"
          onClick={() => setExpandido((v) => !v)}
          className="mt-2 text-xs font-medium text-marca-700 hover:underline"
        >
          {expandido ? 'Ocultar visualização' : 'Visualizar aqui'}
        </button>
      )}

      {expandido && (
        <div className="mt-2 space-y-2">
          {documento.arquivos.map((arquivo) => {
            if (arquivo.mimeType === 'application/pdf') {
              return (
                <iframe
                  key={arquivo.id}
                  src={`/api/arquivos/${arquivo.id}`}
                  title={arquivo.nomeOriginal}
                  className="h-96 w-full rounded-md border border-slate-200"
                />
              );
            }
            // O navegador também não renderiza HEIC: oferece o download direto.
            if (arquivo.mimeType === 'image/heic') {
              return (
                <div
                  key={arquivo.id}
                  className="rounded-md border border-dashed border-slate-300 px-4 py-6 text-center text-xs text-slate-500"
                >
                  <p>Formato HEIC não é exibido pelo navegador.</p>
                  <a
                    href={`/api/arquivos/${arquivo.id}`}
                    download
                    className="mt-1 inline-block font-medium text-marca-700 hover:underline"
                  >
                    Baixar {arquivo.nomeOriginal}
                  </a>
                </div>
              );
            }
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={arquivo.id}
                src={`/api/arquivos/${arquivo.id}`}
                alt={arquivo.nomeOriginal}
                className="max-h-96 w-full rounded-md border border-slate-200 object-contain"
              />
            );
          })}
        </div>
      )}

      {podeConferir && documento.arquivos.length > 0 && <Conferencia documento={documento} />}
    </div>
  );
}

function AdicionarItem({ candidatoId }: { candidatoId: string }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [estado, acao] = useActionState<EstadoAcao, FormData>(adicionarItemChecklistAction, {});
  const anterior = useRef(estado);

  useEffect(() => {
    if (estado !== anterior.current) {
      anterior.current = estado;
      if (estado.sucesso) {
        setAberto(false);
        router.refresh();
      }
    }
  }, [estado, router]);

  if (!aberto) {
    return (
      <Botao variante="contorno" tamanho="sm" onClick={() => setAberto(true)}>
        + Adicionar documento ao checklist
      </Botao>
    );
  }

  return (
    <form action={acao} className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
      <input type="hidden" name="candidatoId" value={candidatoId} />
      {estado.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}
      <Campo rotulo="Nome do documento" obrigatorio>
        <Input name="nome" required autoFocus placeholder="Ex.: Declaração de dependentes" />
      </Campo>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" name="obrigatorio" defaultChecked className="h-4 w-4 accent-marca-600" />
        Obrigatório para admitir
      </label>
      <div className="flex gap-2">
        <Botao type="button" variante="contorno" tamanho="sm" onClick={() => setAberto(false)}>
          Cancelar
        </Botao>
        <BotaoSalvar rotulo="Adicionar" />
      </div>
    </form>
  );
}

export function AbaDocumentos({
  candidato,
  perfil,
}: {
  candidato: CandidatoCompleto;
  perfil: Perfil;
}) {
  const podeConferir = permissoes.operarDp(perfil);
  const obrigatorios = candidato.documentos.filter((d) => d.exigencia === 'OBRIGATORIO');
  const conferidos = obrigatorios.filter((d) => d.status === 'CONFERIDO').length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-slate-900">
            {conferidos} de {obrigatorios.length} documentos obrigatórios conferidos
          </p>
          <p className="text-xs text-slate-500">
            Itens condicionais (CNH, reservista, documentos dos filhos) só são exigidos conforme o
            perfil do candidato.
          </p>
        </div>
        {podeConferir && <AdicionarItem candidatoId={candidato.id} />}
      </div>

      <div className="space-y-2">
        {candidato.documentos.map((documento) => (
          <ItemDocumento key={documento.id} documento={documento} podeConferir={podeConferir} />
        ))}
      </div>
    </div>
  );
}
