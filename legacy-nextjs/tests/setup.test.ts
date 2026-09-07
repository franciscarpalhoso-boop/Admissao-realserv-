import { describe, expect, it } from 'vitest';
import {
  chaveAes256Valida,
  definirVariavel,
  ehPlaceholder,
  lerVariavel,
  variavelVazia,
} from '../scripts/env-arquivo';

const EXEMPLO = `# Comentário no topo
DATABASE_URL="postgresql://usuario:senha@localhost:5432/realserv_admissao?schema=public"

# Segredos
AUTH_SECRET=""
ENCRYPTION_KEY=""

APP_URL="http://localhost:3000"
STORAGE_DRIVER="local"
`;

describe('lerVariavel', () => {
  it('lê valores com aspas duplas, simples e sem aspas', () => {
    expect(lerVariavel('A="um"', 'A')).toBe('um');
    expect(lerVariavel("A='um'", 'A')).toBe('um');
    expect(lerVariavel('A=um', 'A')).toBe('um');
  });

  it('tolera espaços e o prefixo export', () => {
    expect(lerVariavel('  A = "um" ', 'A')).toBe('um');
    expect(lerVariavel('export A="um"', 'A')).toBe('um');
  });

  it('devolve string vazia para a linha em branco do .env.example', () => {
    expect(lerVariavel(EXEMPLO, 'AUTH_SECRET')).toBe('');
  });

  it('devolve null quando a linha não existe', () => {
    expect(lerVariavel(EXEMPLO, 'NAO_EXISTE')).toBeNull();
  });

  it('não confunde chaves com prefixo em comum', () => {
    const texto = 'S3_BUCKET="balde"\nS3_BUCKET_EXTRA="outro"';
    expect(lerVariavel(texto, 'S3_BUCKET')).toBe('balde');
    expect(lerVariavel(texto, 'S3_BUCKET_EXTRA')).toBe('outro');
  });

  it('preserva o valor de uma URL com = e ? dentro', () => {
    const url = 'postgresql://u:s@host:5432/db?schema=public&sslmode=require';
    expect(lerVariavel(`DATABASE_URL="${url}"`, 'DATABASE_URL')).toBe(url);
  });
});

describe('variavelVazia', () => {
  it('trata ausente, vazia e só com espaços como vazia', () => {
    expect(variavelVazia(EXEMPLO, 'AUTH_SECRET')).toBe(true);
    expect(variavelVazia(EXEMPLO, 'NAO_EXISTE')).toBe(true);
    expect(variavelVazia('A="   "', 'A')).toBe(true);
  });

  it('reconhece variável preenchida', () => {
    expect(variavelVazia(EXEMPLO, 'APP_URL')).toBe(false);
  });
});

describe('definirVariavel', () => {
  it('substitui no lugar, preservando o resto do arquivo', () => {
    const resultado = definirVariavel(EXEMPLO, 'AUTH_SECRET', 'segredo123');
    expect(lerVariavel(resultado, 'AUTH_SECRET')).toBe('segredo123');
    expect(resultado).toContain('# Comentário no topo');
    expect(resultado).toContain('# Segredos');
    expect(lerVariavel(resultado, 'APP_URL')).toBe('http://localhost:3000');
    // Não duplica a linha.
    expect(resultado.match(/AUTH_SECRET/g)).toHaveLength(1);
  });

  it('acrescenta a variável quando a linha não existe', () => {
    const resultado = definirVariavel('A="1"\n', 'B', '2');
    expect(lerVariavel(resultado, 'A')).toBe('1');
    expect(lerVariavel(resultado, 'B')).toBe('2');
  });

  it('não gruda a linha nova quando falta a quebra final', () => {
    const resultado = definirVariavel('A="1"', 'B', '2');
    expect(resultado.split('\n').filter(Boolean)).toEqual(['A="1"', 'B="2"']);
  });

  it('lida com arquivo vazio', () => {
    expect(lerVariavel(definirVariavel('', 'A', '1'), 'A')).toBe('1');
  });

  it('sobrevive a um round-trip com base64 (que contém + / e =)', () => {
    const chave = Buffer.alloc(32, 200).toString('base64');
    expect(chave).toMatch(/[+/=]/);
    const resultado = definirVariavel(EXEMPLO, 'ENCRYPTION_KEY', chave);
    expect(lerVariavel(resultado, 'ENCRYPTION_KEY')).toBe(chave);
  });
});

describe('chaveAes256Valida', () => {
  it('aceita exatamente 32 bytes em base64', () => {
    expect(chaveAes256Valida(Buffer.alloc(32, 1).toString('base64'))).toBe(true);
    expect(chaveAes256Valida(Buffer.alloc(32, 255).toString('base64'))).toBe(true);
  });

  it('recusa chave de tamanho errado', () => {
    expect(chaveAes256Valida(Buffer.alloc(16).toString('base64'))).toBe(false);
    expect(chaveAes256Valida(Buffer.alloc(64).toString('base64'))).toBe(false);
  });

  it('recusa vazio, nulo e texto que não é base64', () => {
    expect(chaveAes256Valida('')).toBe(false);
    expect(chaveAes256Valida(null)).toBe(false);
    expect(chaveAes256Valida(undefined)).toBe(false);
    expect(chaveAes256Valida('troque-esta-chave-por-favor!!!!!')).toBe(false);
  });
});

describe('ehPlaceholder', () => {
  it('reconhece a DATABASE_URL de exemplo', () => {
    expect(ehPlaceholder(lerVariavel(EXEMPLO, 'DATABASE_URL'))).toBe(true);
  });

  it('aceita uma URL real', () => {
    expect(ehPlaceholder('postgresql://realserv:senha@db.interno:5432/admissao')).toBe(false);
    expect(ehPlaceholder('')).toBe(false);
    expect(ehPlaceholder(null)).toBe(false);
  });
});
