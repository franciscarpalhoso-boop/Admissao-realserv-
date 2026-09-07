import { describe, expect, it } from 'vitest';
import { formatarData, formatarMoeda, parseDataISO, parseMoeda, sim } from '@/lib/formato';
import { cifrar, decifrar } from '@/lib/cripto';

describe('datas em dd/mm/aaaa', () => {
  it('formata sem deslocamento de fuso', () => {
    expect(formatarData(new Date(Date.UTC(2024, 8, 7)))).toBe('07/09/2024');
    expect(formatarData(new Date(Date.UTC(2024, 0, 1)))).toBe('01/01/2024');
  });

  it('devolve vazio para nulo e data inválida', () => {
    expect(formatarData(null)).toBe('');
    expect(formatarData('não é data')).toBe('');
  });

  it('faz o caminho de volta a partir do input type=date', () => {
    const data = parseDataISO('2024-09-07');
    expect(data).not.toBeNull();
    expect(formatarData(data)).toBe('07/09/2024');
    expect(parseDataISO('07/09/2024')).toBeNull();
    expect(parseDataISO('')).toBeNull();
  });
});

describe('moeda em R$', () => {
  it('formata com separadores brasileiros', () => {
    expect(formatarMoeda(1800)).toMatch(/R\$\s?1\.800,00/);
    expect(formatarMoeda('1450.5')).toMatch(/R\$\s?1\.450,50/);
  });

  it('interpreta os dois formatos de entrada', () => {
    expect(parseMoeda('1.800,00')).toBe(1800);
    expect(parseMoeda('1800.00')).toBe(1800);
    expect(parseMoeda('R$ 2.350,75')).toBe(2350.75);
    expect(parseMoeda('')).toBeNull();
    expect(parseMoeda(null)).toBeNull();
  });
});

describe('sim/não', () => {
  it('mostra travessão quando não respondido', () => {
    expect(sim(true)).toBe('Sim');
    expect(sim(false)).toBe('Não');
    expect(sim(null)).toBe('—');
    expect(sim(undefined)).toBe('—');
  });
});

describe('criptografia em repouso', () => {
  const chaveOriginal = process.env.ENCRYPTION_KEY;

  it('cifra e decifra dados sensíveis', () => {
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
    const cifrado = cifrar('52998224725');
    expect(cifrado).not.toBeNull();
    expect(cifrado).not.toContain('52998224725');
    expect(decifrar(cifrado)).toBe('52998224725');
    process.env.ENCRYPTION_KEY = chaveOriginal;
  });

  it('gera criptogramas diferentes para o mesmo valor (IV aleatório)', () => {
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
    expect(cifrar('12345678909')).not.toBe(cifrar('12345678909'));
    process.env.ENCRYPTION_KEY = chaveOriginal;
  });

  it('trata nulo e valor corrompido sem lançar', () => {
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
    expect(cifrar(null)).toBeNull();
    expect(cifrar('')).toBeNull();
    expect(decifrar(null)).toBeNull();
    expect(decifrar('valor-invalido')).toBeNull();
    expect(decifrar('v1:aaa:bbb:ccc')).toBeNull();
    process.env.ENCRYPTION_KEY = chaveOriginal;
  });
});
