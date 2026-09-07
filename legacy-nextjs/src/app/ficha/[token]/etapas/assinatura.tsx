'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Botao } from '@/components/ui';

/**
 * Assinatura por desenho, com suporte a toque (celular) e mouse.
 * Emite o PNG em data URL para o campo escondido do formulário.
 */
export function Assinatura({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const desenhando = useRef(false);
  const temTraco = useRef(false);
  const [assinou, setAssinou] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const proporcao = window.devicePixelRatio || 1;
    const largura = canvas.clientWidth;
    const altura = canvas.clientHeight;
    canvas.width = largura * proporcao;
    canvas.height = altura * proporcao;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(proporcao, proporcao);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, largura, altura);
  }, []);

  const posicao = (evento: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const retangulo = canvas.getBoundingClientRect();
    return { x: evento.clientX - retangulo.left, y: evento.clientY - retangulo.top };
  };

  const iniciar = (evento: React.PointerEvent<HTMLCanvasElement>) => {
    evento.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    canvasRef.current?.setPointerCapture(evento.pointerId);
    desenhando.current = true;
    const { x, y } = posicao(evento);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const mover = (evento: React.PointerEvent<HTMLCanvasElement>) => {
    if (!desenhando.current) return;
    evento.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = posicao(evento);
    ctx.lineTo(x, y);
    ctx.stroke();
    temTraco.current = true;
  };

  const finalizar = useCallback(() => {
    if (!desenhando.current) return;
    desenhando.current = false;
    if (temTraco.current) {
      setAssinou(true);
      onChange(canvasRef.current?.toDataURL('image/png') ?? null);
    }
  }, [onChange]);

  const limpar = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    temTraco.current = false;
    setAssinou(false);
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        onPointerDown={iniciar}
        onPointerMove={mover}
        onPointerUp={finalizar}
        onPointerLeave={finalizar}
        onPointerCancel={finalizar}
        className="h-40 w-full touch-none rounded-md border-2 border-dashed border-slate-300 bg-white"
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {assinou ? 'Assinatura registrada.' : 'Desenhe sua assinatura no quadro acima.'}
        </p>
        <Botao type="button" variante="fantasma" tamanho="sm" onClick={limpar}>
          Limpar
        </Botao>
      </div>
    </div>
  );
}
