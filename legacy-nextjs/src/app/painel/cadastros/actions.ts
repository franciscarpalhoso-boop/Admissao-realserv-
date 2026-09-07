'use server';

import { revalidatePath } from 'next/cache';
import type { ExigenciaDocumento } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { exigirPerfil, hashSenha } from '@/lib/auth';
import { somenteDigitos, validarCnpj } from '@/lib/validacao';
import { registrarAuditoria } from '@/server/auditoria';
import { anonimizarVencidos } from '@/server/retencao';

export type EstadoCadastro = { erro?: string; sucesso?: string };

function texto(formData: FormData, campo: string): string | null {
  const v = String(formData.get(campo) ?? '').trim();
  return v === '' ? null : v;
}

export async function salvarEmpresaAction(
  _estado: EstadoCadastro,
  formData: FormData,
): Promise<EstadoCadastro> {
  const sessao = await exigirPerfil('ADMIN');
  const id = String(formData.get('id') ?? '');
  const nome = texto(formData, 'nome');
  const cnpj = somenteDigitos(texto(formData, 'cnpj'));

  if (!nome) return { erro: 'Informe o nome da empresa.' };
  if (!validarCnpj(cnpj)) return { erro: 'CNPJ inválido. Confira os dígitos.' };

  const dados = {
    nome,
    cnpj,
    logradouro: texto(formData, 'logradouro'),
    numero: texto(formData, 'numero'),
    bairro: texto(formData, 'bairro'),
    cidade: texto(formData, 'cidade'),
    uf: texto(formData, 'uf'),
    cep: somenteDigitos(texto(formData, 'cep')) || null,
    responsavel: texto(formData, 'responsavel'),
  };

  try {
    const empresa = id
      ? await prisma.empresa.update({ where: { id }, data: dados })
      : await prisma.empresa.create({ data: dados });
    await registrarAuditoria({
      sessao,
      entidade: 'Empresa',
      entidadeId: empresa.id,
      acao: id ? 'ATUALIZACAO' : 'CRIACAO',
      detalhes: { nome },
    });
  } catch (erro) {
    if ((erro as { code?: string }).code === 'P2002') {
      return { erro: 'Já existe uma empresa com esse nome ou CNPJ.' };
    }
    throw erro;
  }

  revalidatePath('/painel/cadastros');
  return { sucesso: 'Empresa salva.' };
}

export async function salvarPostoAction(
  _estado: EstadoCadastro,
  formData: FormData,
): Promise<EstadoCadastro> {
  const sessao = await exigirPerfil('ADMIN');
  const id = String(formData.get('id') ?? '');
  const nome = texto(formData, 'nome');
  if (!nome) return { erro: 'Informe o nome do posto (condomínio).' };

  const dados = {
    nome,
    logradouro: texto(formData, 'logradouro'),
    numero: texto(formData, 'numero'),
    bairro: texto(formData, 'bairro'),
    cidade: texto(formData, 'cidade'),
    uf: texto(formData, 'uf'),
    cep: somenteDigitos(texto(formData, 'cep')) || null,
    empresaId: texto(formData, 'empresaId'),
    supervisorId: texto(formData, 'supervisorId'),
  };

  const posto = id
    ? await prisma.posto.update({ where: { id }, data: dados })
    : await prisma.posto.create({ data: dados });

  await registrarAuditoria({
    sessao,
    entidade: 'Posto',
    entidadeId: posto.id,
    acao: id ? 'ATUALIZACAO' : 'CRIACAO',
    detalhes: { nome },
  });

  revalidatePath('/painel/cadastros');
  return { sucesso: 'Posto salvo.' };
}

export async function salvarSupervisorAction(
  _estado: EstadoCadastro,
  formData: FormData,
): Promise<EstadoCadastro> {
  const sessao = await exigirPerfil('ADMIN');
  const id = String(formData.get('id') ?? '');
  const nome = texto(formData, 'nome');
  if (!nome) return { erro: 'Informe o nome do supervisor.' };

  const dados = {
    nome,
    telefone: texto(formData, 'telefone'),
    email: texto(formData, 'email'),
  };

  const supervisor = id
    ? await prisma.supervisor.update({ where: { id }, data: dados })
    : await prisma.supervisor.create({ data: dados });

  await registrarAuditoria({
    sessao,
    entidade: 'Supervisor',
    entidadeId: supervisor.id,
    acao: id ? 'ATUALIZACAO' : 'CRIACAO',
  });

  revalidatePath('/painel/cadastros');
  return { sucesso: 'Supervisor salvo.' };
}

export async function salvarFuncaoAction(
  _estado: EstadoCadastro,
  formData: FormData,
): Promise<EstadoCadastro> {
  const sessao = await exigirPerfil('ADMIN');
  const id = String(formData.get('id') ?? '');
  const nome = texto(formData, 'nome');
  if (!nome) return { erro: 'Informe o nome da função.' };

  const dados = {
    nome,
    descricao: texto(formData, 'descricao'),
    exigeCnh: formData.get('exigeCnh') === 'on',
    exigeSapatoPreto: formData.get('exigeSapatoPreto') === 'on',
    avisoEspecifico: texto(formData, 'avisoEspecifico'),
    requisitos: String(formData.get('requisitos') ?? '')
      .split('\n')
      .map((r) => r.trim())
      .filter(Boolean),
  };

  try {
    const funcao = id
      ? await prisma.funcao.update({ where: { id }, data: dados })
      : await prisma.funcao.create({ data: dados });
    await registrarAuditoria({
      sessao,
      entidade: 'Funcao',
      entidadeId: funcao.id,
      acao: id ? 'ATUALIZACAO' : 'CRIACAO',
      detalhes: { nome, exigeCnh: dados.exigeCnh },
    });
  } catch (erro) {
    if ((erro as { code?: string }).code === 'P2002') {
      return { erro: 'Já existe uma função com esse nome.' };
    }
    throw erro;
  }

  revalidatePath('/painel/cadastros');
  return { sucesso: 'Função salva.' };
}

export async function salvarEscalaAction(
  _estado: EstadoCadastro,
  formData: FormData,
): Promise<EstadoCadastro> {
  const sessao = await exigirPerfil('ADMIN');
  const id = String(formData.get('id') ?? '');
  const nome = texto(formData, 'nome');
  if (!nome) return { erro: 'Informe o nome da escala.' };

  const dados = {
    nome,
    descricao: texto(formData, 'descricao'),
    horarioInicio: texto(formData, 'horarioInicio'),
    horarioFim: texto(formData, 'horarioFim'),
  };

  try {
    const escala = id
      ? await prisma.escala.update({ where: { id }, data: dados })
      : await prisma.escala.create({ data: dados });
    await registrarAuditoria({
      sessao,
      entidade: 'Escala',
      entidadeId: escala.id,
      acao: id ? 'ATUALIZACAO' : 'CRIACAO',
    });
  } catch (erro) {
    if ((erro as { code?: string }).code === 'P2002') {
      return { erro: 'Já existe uma escala com esse nome.' };
    }
    throw erro;
  }

  revalidatePath('/painel/cadastros');
  return { sucesso: 'Escala salva.' };
}

export async function salvarItemChecklistAction(
  _estado: EstadoCadastro,
  formData: FormData,
): Promise<EstadoCadastro> {
  const sessao = await exigirPerfil('ADMIN');
  const id = String(formData.get('id') ?? '');
  const nome = texto(formData, 'nome');
  if (!nome) return { erro: 'Informe o nome do documento.' };

  const exigenciaBruta = String(formData.get('exigencia') ?? 'OBRIGATORIO');
  const exigencia: ExigenciaDocumento =
    exigenciaBruta === 'OPCIONAL' || exigenciaBruta === 'CONDICIONAL' ? exigenciaBruta : 'OBRIGATORIO';

  const maior = await prisma.itemChecklistPadrao.aggregate({ _max: { ordem: true } });

  const dados = {
    nome,
    descricao: texto(formData, 'descricao'),
    exigencia,
    ativo: formData.get('ativo') === 'on',
  };

  const item = id
    ? await prisma.itemChecklistPadrao.update({ where: { id }, data: dados })
    : await prisma.itemChecklistPadrao.create({
        data: { ...dados, ordem: (maior._max.ordem ?? 0) + 1, regra: 'NENHUMA' },
      });

  await registrarAuditoria({
    sessao,
    entidade: 'ItemChecklistPadrao',
    entidadeId: item.id,
    acao: id ? 'ATUALIZACAO' : 'CRIACAO',
    detalhes: { nome, exigencia },
  });

  revalidatePath('/painel/cadastros');
  return {
    sucesso: id
      ? 'Item atualizado. Candidatos já cadastrados mantêm o checklist original.'
      : 'Item criado. Ele passa a valer para os próximos candidatos cadastrados.',
  };
}

export async function salvarUsuarioAction(
  _estado: EstadoCadastro,
  formData: FormData,
): Promise<EstadoCadastro> {
  const sessao = await exigirPerfil('ADMIN');
  const id = String(formData.get('id') ?? '');
  const nome = texto(formData, 'nome');
  const email = texto(formData, 'email')?.toLowerCase();
  const senha = String(formData.get('senha') ?? '');
  const perfilBruto = String(formData.get('perfil') ?? '');
  const perfil =
    perfilBruto === 'ADMIN' || perfilBruto === 'RECRUTADOR' || perfilBruto === 'DP'
      ? perfilBruto
      : null;

  if (!nome || !email || !perfil) return { erro: 'Preencha nome, e-mail e perfil.' };
  if (!id && senha.length < 8) return { erro: 'A senha deve ter pelo menos 8 caracteres.' };
  if (id && senha && senha.length < 8) return { erro: 'A nova senha deve ter pelo menos 8 caracteres.' };

  try {
    const usuario = id
      ? await prisma.usuario.update({
          where: { id },
          data: {
            nome,
            email,
            perfil,
            ativo: formData.get('ativo') === 'on',
            ...(senha ? { senhaHash: await hashSenha(senha) } : {}),
          },
        })
      : await prisma.usuario.create({
          data: { nome, email, perfil, senhaHash: await hashSenha(senha) },
        });

    await registrarAuditoria({
      sessao,
      entidade: 'Usuario',
      entidadeId: usuario.id,
      acao: id ? 'ATUALIZACAO' : 'CRIACAO',
      detalhes: { email, perfil, senhaAlterada: Boolean(senha) },
    });
  } catch (erro) {
    if ((erro as { code?: string }).code === 'P2002') {
      return { erro: 'Já existe um usuário com esse e-mail.' };
    }
    throw erro;
  }

  revalidatePath('/painel/cadastros');
  return { sucesso: 'Usuário salvo.' };
}

export async function salvarConfiguracaoAction(
  _estado: EstadoCadastro,
  formData: FormData,
): Promise<EstadoCadastro> {
  const sessao = await exigirPerfil('ADMIN');

  for (const chave of ['TERMO_VERACIDADE', 'TERMO_LGPD', 'RETENCAO_MESES', 'LOCAL_ASSINATURA']) {
    const valor = String(formData.get(chave) ?? '').trim();
    if (!valor) continue;
    if (chave === 'RETENCAO_MESES' && !/^\d{1,3}$/.test(valor)) {
      return { erro: 'O prazo de retenção deve ser um número de meses.' };
    }
    await prisma.configuracao.upsert({
      where: { chave },
      create: { chave, valor },
      update: { valor },
    });
  }

  await registrarAuditoria({
    sessao,
    entidade: 'Configuracao',
    entidadeId: 'geral',
    acao: 'ATUALIZACAO',
  });

  revalidatePath('/painel/cadastros');
  return { sucesso: 'Configurações salvas.' };
}

export async function executarRetencaoAction(): Promise<EstadoCadastro> {
  const sessao = await exigirPerfil('ADMIN');
  const total = await anonimizarVencidos();
  await registrarAuditoria({
    sessao,
    entidade: 'Retencao',
    entidadeId: 'lgpd',
    acao: 'ANONIMIZACAO_MANUAL',
    detalhes: { total },
  });
  revalidatePath('/painel/cadastros');
  return { sucesso: `${total} candidato(s) anonimizado(s) pela política de retenção.` };
}
