import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Um arquivo 'use server' só pode exportar funções async — exportar uma
 * constante derruba a página em tempo de execução com
 * "A 'use server' file can only export async functions".
 *
 * Nem o `tsc` nem o `next build` acusam isso: o erro só aparece quando a
 * action é de fato invocada pelo navegador. Este teste varre os arquivos e
 * falha antes de chegar ao usuário.
 *
 * Exportar `type` e `interface` é permitido — some na compilação.
 */

const RAIZ = path.resolve(import.meta.dirname, '..', 'src');

function listarArquivos(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = path.join(dir, entrada.name);
    if (entrada.isDirectory()) return listarArquivos(caminho);
    return /\.tsx?$/.test(entrada.name) ? [caminho] : [];
  });
}

function ehUseServer(conteudo: string): boolean {
  const primeiraLinha = conteudo.trimStart().split('\n')[0].trim();
  return primeiraLinha === "'use server';" || primeiraLinha === '"use server";';
}

/** Exports que não são `async function` nem `type`/`interface`. */
function exportsProibidos(conteudo: string): string[] {
  const proibidos: string[] = [];
  const linhas = conteudo.split('\n');
  for (const linha of linhas) {
    if (!linha.startsWith('export')) continue;
    if (/^export\s+(type|interface)\b/.test(linha)) continue;
    if (/^export\s+async\s+function\b/.test(linha)) continue;
    if (/^export\s+\{[^}]*\}\s+from/.test(linha)) continue; // re-export de tipos
    proibidos.push(linha.trim());
  }
  return proibidos;
}

const arquivosUseServer = listarArquivos(RAIZ).filter((caminho) =>
  ehUseServer(fs.readFileSync(caminho, 'utf8')),
);

describe("arquivos 'use server'", () => {
  it('existem e foram encontrados pela varredura', () => {
    expect(arquivosUseServer.length).toBeGreaterThan(0);
  });

  it.each(arquivosUseServer.map((c) => path.relative(RAIZ, c)))(
    '%s exporta apenas funções async (e tipos)',
    (relativo) => {
      const conteudo = fs.readFileSync(path.join(RAIZ, relativo), 'utf8');
      expect(exportsProibidos(conteudo)).toEqual([]);
    },
  );
});

describe('detector de exports proibidos', () => {
  it('acusa uma constante exportada', () => {
    expect(exportsProibidos("export const A = 'x';")).toEqual(["export const A = 'x';"]);
  });

  it('acusa função síncrona exportada', () => {
    expect(exportsProibidos('export function f() {}')).toHaveLength(1);
  });

  it('aceita async function, type e interface', () => {
    expect(exportsProibidos('export async function f() {}')).toEqual([]);
    expect(exportsProibidos('export type A = { b: string };')).toEqual([]);
    expect(exportsProibidos('export interface A { b: string }')).toEqual([]);
  });
});
