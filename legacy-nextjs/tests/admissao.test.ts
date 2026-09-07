import { describe, expect, it } from 'vitest';
import {
  formatarNumeroAdmissao,
  parseNumeroAdmissao,
  partesDaData,
  proximoSequencial,
} from '@/lib/admissao';

describe('formatarNumeroAdmissao', () => {
  it('formata a primeira admissão de setembro como "ADM 01/09"', () => {
    expect(formatarNumeroAdmissao(1, 9)).toBe('ADM 01/09');
  });

  it('preenche com zero à esquerda até 9 e mantém dois dígitos depois', () => {
    expect(formatarNumeroAdmissao(9, 1)).toBe('ADM 09/01');
    expect(formatarNumeroAdmissao(10, 12)).toBe('ADM 10/12');
    expect(formatarNumeroAdmissao(99, 10)).toBe('ADM 99/10');
  });

  it('não trunca sequenciais acima de 99', () => {
    expect(formatarNumeroAdmissao(123, 3)).toBe('ADM 123/03');
  });

  it('rejeita sequencial e mês inválidos', () => {
    expect(() => formatarNumeroAdmissao(0, 9)).toThrow();
    expect(() => formatarNumeroAdmissao(-1, 9)).toThrow();
    expect(() => formatarNumeroAdmissao(1.5, 9)).toThrow();
    expect(() => formatarNumeroAdmissao(1, 0)).toThrow();
    expect(() => formatarNumeroAdmissao(1, 13)).toThrow();
  });
});

describe('proximoSequencial', () => {
  it('começa em 1 quando o mês ainda não tem admissões', () => {
    expect(proximoSequencial(null)).toBe(1);
    expect(proximoSequencial(undefined)).toBe(1);
    expect(proximoSequencial(0)).toBe(1);
  });

  it('incrementa a partir do maior sequencial do mês', () => {
    expect(proximoSequencial(1)).toBe(2);
    expect(proximoSequencial(42)).toBe(43);
  });

  it('reinicia a contagem em cada mês', () => {
    // Setembro terminou em 12; outubro começa do 1 porque a consulta é por mês.
    const setembro = proximoSequencial(12);
    const outubro = proximoSequencial(null);
    expect(formatarNumeroAdmissao(setembro, 9)).toBe('ADM 13/09');
    expect(formatarNumeroAdmissao(outubro, 10)).toBe('ADM 01/10');
  });
});

describe('partesDaData', () => {
  it('extrai mês e ano em UTC', () => {
    expect(partesDaData(new Date(Date.UTC(2024, 8, 15)))).toEqual({ mes: 9, ano: 2024 });
    expect(partesDaData(new Date(Date.UTC(2024, 0, 1)))).toEqual({ mes: 1, ano: 2024 });
    expect(partesDaData(new Date(Date.UTC(2024, 11, 31)))).toEqual({ mes: 12, ano: 2024 });
  });
});

describe('parseNumeroAdmissao', () => {
  it('faz o caminho de volta do número formatado', () => {
    expect(parseNumeroAdmissao('ADM 01/09')).toEqual({ sequencial: 1, mes: 9 });
    expect(parseNumeroAdmissao('  ADM 13/12  ')).toEqual({ sequencial: 13, mes: 12 });
  });

  it('devolve nulo para formatos inesperados', () => {
    expect(parseNumeroAdmissao('ADM 1/9')).toBeNull();
    expect(parseNumeroAdmissao('01/09')).toBeNull();
    expect(parseNumeroAdmissao('ADM 01/13')).toBeNull();
  });
});
