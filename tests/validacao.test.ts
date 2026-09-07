import { describe, expect, it } from 'vitest';
import {
  mascararCep,
  mascararCnpj,
  mascararCpf,
  mascararPis,
  mascararTelefone,
  normalizarWhatsapp,
  validarCnpj,
  validarCpf,
  validarPis,
} from '@/lib/validacao';

describe('validarCpf', () => {
  it('aceita CPFs com dígitos verificadores corretos', () => {
    expect(validarCpf('529.982.247-25')).toBe(true);
    expect(validarCpf('52998224725')).toBe(true);
    expect(validarCpf('11144477735')).toBe(true);
  });

  it('rejeita CPF com dígito verificador errado', () => {
    expect(validarCpf('529.982.247-26')).toBe(false);
    expect(validarCpf('11144477736')).toBe(false);
  });

  it('rejeita sequências repetidas', () => {
    for (const digito of '0123456789') {
      expect(validarCpf(digito.repeat(11))).toBe(false);
    }
  });

  it('rejeita tamanho inválido, vazio e nulo', () => {
    expect(validarCpf('123')).toBe(false);
    expect(validarCpf('529982247251')).toBe(false);
    expect(validarCpf('')).toBe(false);
    expect(validarCpf(null)).toBe(false);
    expect(validarCpf(undefined)).toBe(false);
  });

  it('ignora pontuação e espaços', () => {
    expect(validarCpf('  529.982.247-25  ')).toBe(true);
  });
});

describe('validarCnpj', () => {
  it('aceita CNPJs válidos', () => {
    expect(validarCnpj('11.222.333/0001-81')).toBe(true);
    expect(validarCnpj('11444777000161')).toBe(true);
  });

  it('rejeita CNPJ inválido e repetido', () => {
    expect(validarCnpj('11222333000182')).toBe(false);
    expect(validarCnpj('11111111111111')).toBe(false);
    expect(validarCnpj('123')).toBe(false);
  });
});

describe('validarPis', () => {
  it('aceita PIS válido', () => {
    // 1201234567 + dígito verificador 2 (módulo 11 com pesos 3,2,9,8,7,6,5,4,3,2).
    expect(validarPis('120.12345.67-2')).toBe(true);
    expect(validarPis('12012345672')).toBe(true);
  });

  it('rejeita PIS com dígito errado', () => {
    expect(validarPis('12012345679')).toBe(false);
    expect(validarPis('12012345678')).toBe(false);
    expect(validarPis('00000000000')).toBe(false);
    expect(validarPis('123')).toBe(false);
  });
});

describe('máscaras', () => {
  it('formata CPF progressivamente', () => {
    expect(mascararCpf('529')).toBe('529');
    expect(mascararCpf('529982')).toBe('529.982');
    expect(mascararCpf('52998224725')).toBe('529.982.247-25');
    expect(mascararCpf('529982247259999')).toBe('529.982.247-25');
  });

  it('formata CNPJ, CEP, telefone e PIS', () => {
    expect(mascararCnpj('11222333000181')).toBe('11.222.333/0001-81');
    expect(mascararCep('11045000')).toBe('11045-000');
    expect(mascararTelefone('1332221100')).toBe('(13) 3222-1100');
    expect(mascararTelefone('13998887766')).toBe('(13) 99888-7766');
    expect(mascararPis('12012345672')).toBe('120.12345.67-2');
  });

  it('devolve string vazia para nulo', () => {
    expect(mascararCpf(null)).toBe('');
    expect(mascararTelefone(undefined)).toBe('');
  });
});

describe('normalizarWhatsapp', () => {
  it('acrescenta o código do país quando falta', () => {
    expect(normalizarWhatsapp('(13) 99888-7766')).toBe('5513998887766');
    expect(normalizarWhatsapp('1332221100')).toBe('551332221100');
  });

  it('mantém números que já têm o 55', () => {
    expect(normalizarWhatsapp('5513998887766')).toBe('5513998887766');
  });

  it('devolve nulo para entrada inutilizável', () => {
    expect(normalizarWhatsapp('123')).toBeNull();
    expect(normalizarWhatsapp('')).toBeNull();
    expect(normalizarWhatsapp(null)).toBeNull();
  });
});
