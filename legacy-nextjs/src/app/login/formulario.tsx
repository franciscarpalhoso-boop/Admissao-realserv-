'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Aviso, Botao, Campo, Card, CardCorpo, Input } from '@/components/ui';
import { entrarAction, type EstadoLogin } from './actions';

function BotaoEntrar() {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" className="w-full" disabled={pending}>
      {pending ? 'Entrando...' : 'Entrar'}
    </Botao>
  );
}

export function FormularioLogin() {
  const [estado, acao] = useActionState<EstadoLogin, FormData>(entrarAction, {});

  return (
    <Card>
      <CardCorpo>
        <form action={acao} className="space-y-4">
          {estado.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}
          <Campo rotulo="E-mail" obrigatorio>
            <Input
              name="email"
              type="email"
              autoComplete="username"
              placeholder="voce@realserv.com.br"
              required
              autoFocus
            />
          </Campo>
          <Campo rotulo="Senha" obrigatorio>
            <Input name="senha" type="password" autoComplete="current-password" required />
          </Campo>
          <BotaoEntrar />
        </form>
      </CardCorpo>
    </Card>
  );
}
