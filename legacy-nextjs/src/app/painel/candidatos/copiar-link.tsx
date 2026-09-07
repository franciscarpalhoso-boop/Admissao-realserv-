'use client';

import { useState } from 'react';
import { Botao } from '@/components/ui';

const MENSAGEM =
  'Olá! Aqui é do Grupo Real Serv. Para dar andamento ao seu processo, preencha a ficha e envie os documentos pelo link abaixo. Leva cerca de 15 minutos e pode ser feito pelo celular.';

export function CopiarLink({ link, whatsapp }: { link: string; whatsapp: string | null }) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      window.prompt('Copie o link:', link);
    }
  };

  const urlWhatsapp = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(`${MENSAGEM}\n\n${link}`)}`
    : `https://wa.me/?text=${encodeURIComponent(`${MENSAGEM}\n\n${link}`)}`;

  return (
    <div className="space-y-2">
      <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
        <p className="break-all font-mono text-xs text-slate-700">{link}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Botao type="button" variante="contorno" tamanho="sm" onClick={copiar}>
          {copiado ? 'Link copiado!' : 'Copiar link'}
        </Botao>
        <a href={urlWhatsapp} target="_blank" rel="noopener noreferrer">
          <Botao type="button" tamanho="sm" className="bg-emerald-600 hover:bg-emerald-700">
            Enviar por WhatsApp
          </Botao>
        </a>
      </div>
    </div>
  );
}
