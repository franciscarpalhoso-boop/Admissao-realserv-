/**
 * Manipulação do arquivo .env em funções puras, para o `npm run setup` poder
 * ser testado sem tocar no disco (tests/setup.test.ts).
 *
 * O formato aceito é o mesmo que o Next.js lê: `CHAVE=valor`, com ou sem
 * aspas, tolerando `export ` na frente e espaços em volta do `=`.
 */

function padraoDaChave(chave: string): RegExp {
  const escapada = chave.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^[ \\t]*(?:export[ \\t]+)?${escapada}[ \\t]*=.*$`, 'm');
}

function desempacotar(bruto: string): string {
  const valor = bruto.trim();
  if (valor.length >= 2) {
    const primeiro = valor[0];
    const ultimo = valor[valor.length - 1];
    if ((primeiro === '"' && ultimo === '"') || (primeiro === "'" && ultimo === "'")) {
      return valor.slice(1, -1);
    }
  }
  return valor;
}

/** Devolve o valor da variável, ou null se a linha não existir. */
export function lerVariavel(texto: string, chave: string): string | null {
  const linha = texto.match(padraoDaChave(chave))?.[0];
  if (linha === undefined) return null;
  const separador = linha.indexOf('=');
  return desempacotar(linha.slice(separador + 1));
}

/** True quando a variável não existe ou está vazia (caso do .env.example). */
export function variavelVazia(texto: string, chave: string): boolean {
  const valor = lerVariavel(texto, chave);
  return valor === null || valor.trim() === '';
}

/**
 * Grava a variável preservando o resto do arquivo. Se a linha existir, é
 * substituída no lugar (mantendo os comentários em volta); se não, é
 * acrescentada no fim.
 */
export function definirVariavel(texto: string, chave: string, valor: string): string {
  const linha = `${chave}="${valor}"`;
  if (padraoDaChave(chave).test(texto)) {
    return texto.replace(padraoDaChave(chave), linha);
  }
  const separador = texto.length === 0 || texto.endsWith('\n') ? '' : '\n';
  return `${texto}${separador}${linha}\n`;
}

/** A ENCRYPTION_KEY precisa ser exatamente 32 bytes em base64 (AES-256). */
export function chaveAes256Valida(valor: string | null | undefined): boolean {
  if (!valor) return false;
  const limpo = valor.trim();
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(limpo)) return false;
  try {
    return Buffer.from(limpo, 'base64').length === 32;
  } catch {
    return false;
  }
}

/** Marca os valores que o .env.example traz como exemplo e precisam ser trocados. */
const PLACEHOLDERS = [
  'postgresql://usuario:senha@localhost:5432/realserv_admissao?schema=public',
];

export function ehPlaceholder(valor: string | null | undefined): boolean {
  if (!valor) return false;
  return PLACEHOLDERS.includes(valor.trim());
}
