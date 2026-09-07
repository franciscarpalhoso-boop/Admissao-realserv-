'use server';

import { redirect } from 'next/navigation';
import { autenticar, criarSessao, encerrarSessao } from '@/lib/auth';
import { registrarAuditoria } from '@/server/auditoria';

export type EstadoLogin = { erro?: string };

export async function entrarAction(
  _estado: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  const email = String(formData.get('email') ?? '').trim();
  const senha = String(formData.get('senha') ?? '');

  if (!email || !senha) return { erro: 'Informe e-mail e senha.' };

  const sessao = await autenticar(email, senha);
  if (!sessao) {
    return { erro: 'E-mail ou senha inválidos.' };
  }

  await criarSessao(sessao);
  await registrarAuditoria({
    sessao,
    entidade: 'Usuario',
    entidadeId: sessao.id,
    acao: 'LOGIN',
  });
  redirect('/painel');
}

export async function sairAction(): Promise<void> {
  await encerrarSessao();
  redirect('/login');
}
