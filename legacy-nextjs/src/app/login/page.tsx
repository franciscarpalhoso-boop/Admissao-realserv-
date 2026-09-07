import { redirect } from 'next/navigation';
import { sessaoAtual } from '@/lib/auth';
import { FormularioLogin } from './formulario';

export default async function PaginaLogin() {
  const sessao = await sessaoAtual();
  if (sessao) redirect('/painel');

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-marca-600 text-lg font-bold text-white">
            RS
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Grupo Real Serv</h1>
          <p className="text-sm text-slate-500">Sistema de entrevista e admissão</p>
        </div>
        <FormularioLogin />
        <p className="mt-6 text-center text-xs text-slate-400">
          Acesso restrito a colaboradores. Candidatos recebem um link próprio por WhatsApp.
        </p>
      </div>
    </main>
  );
}
