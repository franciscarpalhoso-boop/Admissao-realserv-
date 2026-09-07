import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

/**
 * Camada de storage com dois drivers:
 *  - "local": grava em disco (LOCAL_STORAGE_DIR). Bom para desenvolvimento.
 *  - "s3": qualquer storage S3-compatível — AWS S3, Cloudflare R2 ou MinIO.
 *
 * Nenhum arquivo é servido por URL pública: o download passa sempre pela rota
 * autenticada /api/arquivos/[id], que registra o acesso.
 */

export type Driver = 'local' | 's3';

export function driverAtual(): Driver {
  return (process.env.STORAGE_DRIVER as Driver) === 's3' ? 's3' : 'local';
}

function diretorioLocal(): string {
  return path.resolve(process.cwd(), process.env.LOCAL_STORAGE_DIR ?? './.uploads');
}

export function gerarChave(candidatoId: string, nomeOriginal: string): string {
  const ext = path.extname(nomeOriginal).toLowerCase().slice(0, 10);
  return `candidatos/${candidatoId}/${crypto.randomUUID()}${ext}`;
}

async function clienteS3() {
  const { S3Client } = await import('@aws-sdk/client-s3');
  return new S3Client({
    region: process.env.S3_REGION ?? 'auto',
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    credentials:
      process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
          }
        : undefined,
  });
}

function bucket(): string {
  const b = process.env.S3_BUCKET;
  if (!b) throw new Error('S3_BUCKET não configurado para STORAGE_DRIVER=s3.');
  return b;
}

export async function salvarArquivo(
  chave: string,
  conteudo: Buffer,
  mimeType: string,
): Promise<void> {
  if (driverAtual() === 'local') {
    const destino = path.join(diretorioLocal(), chave);
    await fs.mkdir(path.dirname(destino), { recursive: true });
    await fs.writeFile(destino, conteudo);
    return;
  }
  const { PutObjectCommand } = await import('@aws-sdk/client-s3');
  const cliente = await clienteS3();
  await cliente.send(
    new PutObjectCommand({ Bucket: bucket(), Key: chave, Body: conteudo, ContentType: mimeType }),
  );
}

export async function lerArquivo(chave: string): Promise<Buffer> {
  if (driverAtual() === 'local') {
    return fs.readFile(path.join(diretorioLocal(), chave));
  }
  const { GetObjectCommand } = await import('@aws-sdk/client-s3');
  const cliente = await clienteS3();
  const resposta = await cliente.send(new GetObjectCommand({ Bucket: bucket(), Key: chave }));
  const corpo = resposta.Body as unknown as AsyncIterable<Uint8Array>;
  const partes: Uint8Array[] = [];
  for await (const parte of corpo) partes.push(parte);
  return Buffer.concat(partes);
}

export async function excluirArquivo(chave: string): Promise<void> {
  if (driverAtual() === 'local') {
    await fs.rm(path.join(diretorioLocal(), chave), { force: true });
    return;
  }
  const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
  const cliente = await clienteS3();
  await cliente.send(new DeleteObjectCommand({ Bucket: bucket(), Key: chave }));
}

export const MIMES_ACEITOS = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/pdf',
] as const;

export const TAMANHO_MAXIMO_BYTES = 15 * 1024 * 1024; // 15 MB

export function validarUpload(arquivo: { type: string; size: number; name: string }): string | null {
  if (!MIMES_ACEITOS.includes(arquivo.type as (typeof MIMES_ACEITOS)[number])) {
    return `Formato não aceito (${arquivo.type || 'desconhecido'}). Envie JPG, PNG ou PDF.`;
  }
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
    return `Arquivo muito grande (máximo ${TAMANHO_MAXIMO_BYTES / 1024 / 1024} MB).`;
  }
  if (arquivo.size === 0) return 'Arquivo vazio.';
  return null;
}
