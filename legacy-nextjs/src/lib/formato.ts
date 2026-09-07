/** Formatação pt-BR: datas em dd/mm/aaaa e moeda em R$. */

export function formatarData(data: Date | string | null | undefined): string {
  if (!data) return '';
  const d = typeof data === 'string' ? new Date(data) : data;
  if (Number.isNaN(d.getTime())) return '';
  const dia = String(d.getUTCDate()).padStart(2, '0');
  const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${d.getUTCFullYear()}`;
}

export function formatarDataHora(data: Date | string | null | undefined): string {
  if (!data) return '';
  const d = typeof data === 'string' ? new Date(data) : data;
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(d);
}

/** Converte "aaaa-mm-dd" (input type=date) em Date UTC, evitando deslocamento de fuso. */
export function parseDataISO(valor: string | null | undefined): Date | null {
  if (!valor) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor.trim());
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Converte Date em "aaaa-mm-dd" para preencher input type=date. */
export function paraInputDate(data: Date | string | null | undefined): string {
  if (!data) return '';
  const d = typeof data === 'string' ? new Date(data) : data;
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export function paraInputDateTime(data: Date | string | null | undefined): string {
  if (!data) return '';
  const d = typeof data === 'string' ? new Date(data) : data;
  if (Number.isNaN(d.getTime())) return '';
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

export function formatarMoeda(valor: number | string | null | undefined): string {
  if (valor === null || valor === undefined || valor === '') return '';
  const n = typeof valor === 'string' ? Number(valor) : valor;
  if (Number.isNaN(n)) return '';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

/** Aceita "1.234,56" ou "1234.56" e devolve número. */
export function parseMoeda(valor: string | null | undefined): number | null {
  if (!valor) return null;
  const limpo = valor.replace(/[^\d,.-]/g, '');
  if (!limpo) return null;
  const normalizado = limpo.includes(',')
    ? limpo.replace(/\./g, '').replace(',', '.')
    : limpo;
  const n = Number(normalizado);
  return Number.isNaN(n) ? null : n;
}

export function formatarBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function sim(valor: boolean | null | undefined): string {
  if (valor === null || valor === undefined) return '—';
  return valor ? 'Sim' : 'Não';
}
