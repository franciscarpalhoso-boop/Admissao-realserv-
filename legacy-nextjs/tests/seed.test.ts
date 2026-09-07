import { describe, expect, it } from 'vitest';

/**
 * O .env.example traz SENHA_ADMIN="" e o README manda copiá-lo como está.
 * Com `??`, a string vazia passaria adiante e os usuários iniciais seriam
 * criados com senha em branco. Estes testes travam a regra usada no seed.
 */
function senhaInicial(
  valorDaVariavel: string | undefined,
  padrao: string,
  nome = 'SENHA_ADMIN',
): string {
  const bruta = (valorDaVariavel ?? '').trim();
  if (bruta === '') return padrao;
  if (bruta.length < 8) {
    throw new Error(`${nome} deve ter pelo menos 8 caracteres (recebeu ${bruta.length}).`);
  }
  return bruta;
}

describe('senha inicial dos usuários do seed', () => {
  it('usa o padrão quando a variável não existe', () => {
    expect(senhaInicial(undefined, 'Admin@2024')).toBe('Admin@2024');
  });

  it('usa o padrão quando a variável vem vazia (caso do .env.example)', () => {
    expect(senhaInicial('', 'Admin@2024')).toBe('Admin@2024');
  });

  it('usa o padrão quando a variável só tem espaços', () => {
    expect(senhaInicial('   ', 'Admin@2024')).toBe('Admin@2024');
  });

  it('nunca devolve senha vazia', () => {
    for (const entrada of [undefined, '', '  ', '\t\n']) {
      expect(senhaInicial(entrada, 'Admin@2024').length).toBeGreaterThan(0);
    }
  });

  it('respeita a senha informada quando ela é forte o bastante', () => {
    expect(senhaInicial('SenhaForte#2024', 'Admin@2024')).toBe('SenhaForte#2024');
  });

  it('recusa senha curta em vez de aceitar em silêncio', () => {
    expect(() => senhaInicial('123', 'Admin@2024')).toThrow(/pelo menos 8 caracteres/);
    expect(() => senhaInicial('1234567', 'Admin@2024', 'SENHA_DP')).toThrow(/SENHA_DP/);
  });
});
