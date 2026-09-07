import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import type { Perfil } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const COOKIE = 'realserv_sessao';
const DURACAO_SEGUNDOS = 60 * 60 * 8; // 8 horas

export type Sessao = {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
};

function segredo(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error('AUTH_SECRET não configurada. Gere com: openssl rand -base64 32');
  return new TextEncoder().encode(s);
}

export async function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, 10);
}

export async function conferirSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}

export async function autenticar(email: string, senha: string): Promise<Sessao | null> {
  const usuario = await prisma.usuario.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!usuario || !usuario.ativo) return null;
  if (!(await conferirSenha(senha, usuario.senhaHash))) return null;
  return { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil };
}

export async function criarSessao(sessao: Sessao): Promise<void> {
  const token = await new SignJWT({ ...sessao })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${DURACAO_SEGUNDOS}s`)
    .sign(segredo());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: DURACAO_SEGUNDOS,
  });
}

export async function encerrarSessao(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function sessaoAtual(): Promise<Sessao | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, segredo());
    const { id, nome, email, perfil } = payload as Record<string, unknown>;
    if (typeof id !== 'string' || typeof email !== 'string') return null;
    return { id, nome: String(nome ?? ''), email, perfil: perfil as Perfil };
  } catch {
    return null;
  }
}

/** Usa em páginas/actions internas: redireciona ao login quando não autenticado. */
export async function exigirSessao(): Promise<Sessao> {
  const sessao = await sessaoAtual();
  if (!sessao) redirect('/login');
  return sessao;
}

export async function exigirPerfil(...perfis: Perfil[]): Promise<Sessao> {
  const sessao = await exigirSessao();
  if (!perfis.includes(sessao.perfil)) redirect('/painel?erro=sem-permissao');
  return sessao;
}

// A matriz de permissões vive em um módulo sem 'server-only' para poder ser
// reaproveitada pelos componentes de cliente. O servidor usa a mesma fonte.
export { permissoes } from '@/lib/permissoes-cliente';
