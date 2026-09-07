'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Aviso, Botao, Selo } from '@/components/ui';
import { corStatusDocumento, rotuloStatusDocumento } from '@/lib/labels';
import { formatarBytes } from '@/lib/formato';
import { enviarDocumentoAction, type EstadoFicha } from '../actions';
import type { FichaCandidato } from '../tipos';

type Documento = FichaCandidato['documentos'][number];

function BotaoUpload() {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" tamanho="sm" disabled={pending}>
      {pending ? 'Enviando...' : 'Enviar'}
    </Botao>
  );
}

function ItemDocumento({ token, documento }: { token: string; documento: Documento }) {
  const router = useRouter();
  const [estado, acao] = useActionState<EstadoFicha, FormData>(enviarDocumentoAction, {});
  const [selecionados, setSelecionados] = useState<File[]>([]);
  const anterior = useRef(estado);

  useEffect(() => {
    if (estado !== anterior.current) {
      anterior.current = estado;
      if (estado.sucesso) {
        setSelecionados([]);
        router.refresh();
      }
    }
  }, [estado, router]);

  const conferido = documento.status === 'CONFERIDO';
  const obrigatorio = documento.exigencia === 'OBRIGATORIO';

  return (
    <div className="rounded-md border border-slate-200 p-3">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900">
            {documento.nome}
            {obrigatorio && <span className="ml-1 text-red-500">*</span>}
          </p>
          {documento.observacaoDp && (
            <p className="mt-0.5 text-xs font-medium text-red-600">
              RH: {documento.observacaoDp}
            </p>
          )}
        </div>
        <Selo className={corStatusDocumento[documento.status]}>
          {rotuloStatusDocumento[documento.status]}
        </Selo>
      </div>

      {documento.arquivos.length > 0 && (
        <ul className="mb-2 space-y-1">
          {documento.arquivos.map((arquivo) => (
            <li key={arquivo.id} className="truncate text-xs text-slate-500">
              📎 {arquivo.nomeOriginal} · {formatarBytes(arquivo.tamanho)}
            </li>
          ))}
        </ul>
      )}

      {conferido ? (
        <p className="text-xs text-emerald-700">Conferido pelo RH. Nada mais a fazer aqui.</p>
      ) : (
        <form action={acao} className="space-y-2">
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="documentoId" value={documento.id} />
          {estado.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}
          <input
            type="file"
            name="arquivo"
            multiple
            accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
            capture="environment"
            onChange={(e) => setSelecionados(Array.from(e.target.files ?? []))}
            className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-marca-50 file:px-3 file:py-2 file:text-xs file:font-medium file:text-marca-700"
          />
          {selecionados.length > 0 && <BotaoUpload />}
        </form>
      )}
    </div>
  );
}

export function EtapaDocumentos({
  token,
  candidato,
  voltar,
}: {
  token: string;
  candidato: FichaCandidato;
  voltar: () => void;
}) {
  const obrigatorios = candidato.documentos.filter((d) => d.exigencia === 'OBRIGATORIO');
  const enviados = obrigatorios.filter((d) => d.status !== 'PENDENTE').length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">Envio de documentos</h2>
        <p className="mt-1 text-xs text-slate-500">
          Tire a foto direto pelo celular ou anexe um PDF. Aceitamos JPG, PNG e PDF de até 15 MB.
          Os itens marcados com <span className="text-red-500">*</span> são obrigatórios.
        </p>
        <p className="mt-2 text-xs font-medium text-slate-700">
          {enviados} de {obrigatorios.length} documentos obrigatórios enviados
        </p>
      </div>

      {candidato.statusFicha !== 'ENVIADA' && (
        <Aviso tipo="alerta">
          Você ainda não enviou a ficha. Volte às etapas anteriores e finalize o preenchimento — os
          documentos podem ser enviados agora ou depois, pelo mesmo link.
        </Aviso>
      )}

      <div className="space-y-2">
        {candidato.documentos.map((documento) => (
          <ItemDocumento key={documento.id} token={token} documento={documento} />
        ))}
      </div>

      <Botao type="button" variante="contorno" onClick={voltar} className="w-full">
        Voltar
      </Botao>
    </div>
  );
}
