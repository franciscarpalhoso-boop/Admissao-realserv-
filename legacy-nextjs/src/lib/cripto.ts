import crypto from 'node:crypto';

/**
 * Criptografia em repouso de dados sensíveis (CPF, RG).
 * AES-256-GCM. A chave vem de ENCRYPTION_KEY (base64 de 32 bytes).
 */

const PREFIXO = 'v1';

function obterChave(): Buffer {
  const bruto = process.env.ENCRYPTION_KEY;
  if (!bruto) {
    throw new Error('ENCRYPTION_KEY não configurada. Gere com: openssl rand -base64 32');
  }
  const chave = Buffer.from(bruto, 'base64');
  if (chave.length !== 32) {
    throw new Error('ENCRYPTION_KEY deve ter 32 bytes em base64 (openssl rand -base64 32).');
  }
  return chave;
}

export function cifrar(texto: string | null | undefined): string | null {
  if (texto === null || texto === undefined || texto === '') return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', obterChave(), iv);
  const dados = Buffer.concat([cipher.update(texto, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [PREFIXO, iv.toString('base64'), tag.toString('base64'), dados.toString('base64')].join(':');
}

export function decifrar(valor: string | null | undefined): string | null {
  if (!valor) return null;
  const partes = valor.split(':');
  if (partes.length !== 4 || partes[0] !== PREFIXO) return null;
  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      obterChave(),
      Buffer.from(partes[1], 'base64'),
    );
    decipher.setAuthTag(Buffer.from(partes[2], 'base64'));
    const texto = Buffer.concat([
      decipher.update(Buffer.from(partes[3], 'base64')),
      decipher.final(),
    ]);
    return texto.toString('utf8');
  } catch {
    return null;
  }
}

/** Token opaco para o link público do candidato. */
export function gerarTokenPublico(): string {
  return crypto.randomBytes(24).toString('base64url');
}

/** Token assinado e com validade para downloads de arquivos. */
export function assinarDownload(chave: string, expiraEmSegundos: number): string {
  const expira = Date.now() + expiraEmSegundos * 1000;
  const payload = `${chave}|${expira}`;
  const assinatura = crypto
    .createHmac('sha256', process.env.AUTH_SECRET ?? 'sem-segredo')
    .update(payload)
    .digest('base64url');
  return `${Buffer.from(payload).toString('base64url')}.${assinatura}`;
}

export function verificarDownload(token: string): string | null {
  const [corpo, assinatura] = token.split('.');
  if (!corpo || !assinatura) return null;
  const payload = Buffer.from(corpo, 'base64url').toString('utf8');
  const esperada = crypto
    .createHmac('sha256', process.env.AUTH_SECRET ?? 'sem-segredo')
    .update(payload)
    .digest('base64url');
  const a = Buffer.from(assinatura);
  const b = Buffer.from(esperada);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const [chave, expira] = payload.split('|');
  if (!chave || !expira || Number(expira) < Date.now()) return null;
  return chave;
}
