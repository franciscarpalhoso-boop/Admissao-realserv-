/**
 * Validações e máscaras brasileiras usadas em toda a aplicação.
 * Funções puras — cobertas por testes em tests/validacao.test.ts.
 */

export function somenteDigitos(valor: string | null | undefined): string {
  return (valor ?? '').replace(/\D/g, '');
}

/** Valida CPF pelos dígitos verificadores. Rejeita sequências repetidas. */
export function validarCpf(valor: string | null | undefined): boolean {
  const cpf = somenteDigitos(valor);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const digito = (base: string, pesoInicial: number): number => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) {
      soma += Number(base[i]) * (pesoInicial - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 || resto === 11 ? 0 : resto;
  };

  if (digito(cpf.slice(0, 9), 10) !== Number(cpf[9])) return false;
  if (digito(cpf.slice(0, 10), 11) !== Number(cpf[10])) return false;
  return true;
}

/** Valida CNPJ pelos dígitos verificadores. */
export function validarCnpj(valor: string | null | undefined): boolean {
  const cnpj = somenteDigitos(valor);
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const calcular = (base: string): number => {
    let peso = base.length - 7;
    let soma = 0;
    for (let i = 0; i < base.length; i++) {
      soma += Number(base[i]) * peso;
      peso -= 1;
      if (peso < 2) peso = 9;
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  if (calcular(cnpj.slice(0, 12)) !== Number(cnpj[12])) return false;
  if (calcular(cnpj.slice(0, 13)) !== Number(cnpj[13])) return false;
  return true;
}

/** Valida PIS/PASEP/NIT (11 dígitos, módulo 11 com pesos 3..2). */
export function validarPis(valor: string | null | undefined): boolean {
  const pis = somenteDigitos(valor);
  if (pis.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(pis)) return false;

  const pesos = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let soma = 0;
  for (let i = 0; i < 10; i++) soma += Number(pis[i]) * pesos[i];
  const resto = soma % 11;
  const dv = resto < 2 ? 0 : 11 - resto;
  return dv === Number(pis[10]);
}

// --------------------------------------------------------------------------
// Máscaras
// --------------------------------------------------------------------------

export function mascararCpf(valor: string | null | undefined): string {
  const d = somenteDigitos(valor).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
}

export function mascararCnpj(valor: string | null | undefined): string {
  const d = somenteDigitos(valor).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5');
}

export function mascararCep(valor: string | null | undefined): string {
  const d = somenteDigitos(valor).slice(0, 8);
  return d.replace(/^(\d{5})(\d)/, '$1-$2');
}

export function mascararTelefone(valor: string | null | undefined): string {
  const d = somenteDigitos(valor).slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  }
  return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
}

export function mascararPis(valor: string | null | undefined): string {
  const d = somenteDigitos(valor).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{5})(\d)/, '$1.$2.$3')
    .replace(/^(\d{3})\.(\d{5})\.(\d{2})(\d)/, '$1.$2.$3-$4');
}

/** Normaliza um celular brasileiro para o formato do wa.me (55 + DDD + número). */
export function normalizarWhatsapp(valor: string | null | undefined): string | null {
  const d = somenteDigitos(valor);
  if (d.length === 0) return null;
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) return d;
  if (d.length === 10 || d.length === 11) return `55${d}`;
  return null;
}
