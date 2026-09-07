import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Primitivos de UI no padrão shadcn/ui (componentes copiados para o projeto,
 * sem dependência de runtime), com Tailwind.
 */

type BotaoVariante = 'primario' | 'secundario' | 'perigo' | 'fantasma' | 'contorno';
type BotaoTamanho = 'sm' | 'md' | 'lg';

const variantes: Record<BotaoVariante, string> = {
  primario: 'bg-marca-600 text-white hover:bg-marca-700 focus-visible:ring-marca-500',
  secundario: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-400',
  perigo: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
  fantasma: 'bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-400',
  contorno: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 focus-visible:ring-slate-400',
};

const tamanhos: Record<BotaoTamanho, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export function Botao({
  className,
  variante = 'primario',
  tamanho = 'md',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: BotaoVariante;
  tamanho?: BotaoTamanho;
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variantes[variante],
        tamanhos[tamanho],
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-lg border border-slate-200 bg-white shadow-sm', className)}
      {...props}
    />
  );
}

export function CardCabecalho({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('border-b border-slate-100 px-4 py-3', className)} {...props} />;
}

export function CardTitulo({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-sm font-semibold text-slate-900', className)} {...props} />;
}

export function CardCorpo({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-4 py-4', className)} {...props} />;
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900',
          'placeholder:text-slate-400 focus:border-marca-500 focus:outline-none focus:ring-1 focus:ring-marca-500',
          'disabled:bg-slate-50 disabled:text-slate-500',
          className,
        )}
        {...props}
      />
    );
  },
);

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900',
        'placeholder:text-slate-400 focus:border-marca-500 focus:outline-none focus:ring-1 focus:ring-marca-500',
        className,
      )}
      {...props}
    />
  );
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        'h-10 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-900',
        'focus:border-marca-500 focus:outline-none focus:ring-1 focus:ring-marca-500',
        className,
      )}
      {...props}
    />
  );
});

export function Rotulo({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('mb-1 block text-xs font-medium text-slate-600', className)}
      {...props}
    />
  );
}

export function Campo({
  rotulo,
  obrigatorio,
  ajuda,
  erro,
  children,
  className,
}: {
  rotulo: string;
  obrigatorio?: boolean;
  ajuda?: string;
  erro?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('w-full', className)}>
      <Rotulo>
        {rotulo}
        {obrigatorio && <span className="ml-0.5 text-red-500">*</span>}
      </Rotulo>
      {children}
      {ajuda && !erro && <p className="mt-1 text-[11px] text-slate-500">{ajuda}</p>}
      {erro && <p className="mt-1 text-[11px] font-medium text-red-600">{erro}</p>}
    </div>
  );
}

export function Selo({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Aviso({
  tipo = 'info',
  children,
  className,
}: {
  tipo?: 'info' | 'alerta' | 'erro' | 'sucesso';
  children: React.ReactNode;
  className?: string;
}) {
  const estilos = {
    info: 'border-sky-200 bg-sky-50 text-sky-900',
    alerta: 'border-amber-300 bg-amber-50 text-amber-900',
    erro: 'border-red-300 bg-red-50 text-red-900',
    sucesso: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  }[tipo];
  return (
    <div className={cn('rounded-md border px-3 py-2 text-sm', estilos, className)}>{children}</div>
  );
}

export function Vazio({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
      {children}
    </p>
  );
}
