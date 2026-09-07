<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Entrar — Admissão Real Serv</title>
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">
</head>
<body class="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 text-slate-900 antialiased">
    <div class="w-full max-w-sm">
        <div class="mb-6 text-center">
            <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-marca-600 text-lg font-bold text-white">RS</div>
            <h1 class="text-xl font-semibold">Grupo Real Serv</h1>
            <p class="text-sm text-slate-500">Sistema de entrevista e admissão</p>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            @include('componentes.alertas')

            <form method="POST" action="{{ route('login.entrar') }}" class="space-y-4">
                @csrf
                <div>
                    <label class="mb-1 block text-xs font-medium text-slate-600" for="email">E-mail <span class="text-red-500">*</span></label>
                    <input id="email" name="email" type="email" required autofocus autocomplete="username"
                           value="{{ old('email') }}" placeholder="voce@realserv.com.br"
                           class="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-marca-500 focus:outline-none focus:ring-1 focus:ring-marca-500">
                </div>
                <div>
                    <label class="mb-1 block text-xs font-medium text-slate-600" for="senha">Senha <span class="text-red-500">*</span></label>
                    <input id="senha" name="senha" type="password" required autocomplete="current-password"
                           class="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-marca-500 focus:outline-none focus:ring-1 focus:ring-marca-500">
                </div>
                <label class="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" name="lembrar" value="1" class="h-4 w-4 accent-marca-600"> Manter conectado
                </label>
                <button type="submit"
                        class="h-10 w-full rounded-md bg-marca-600 text-sm font-medium text-white hover:bg-marca-700">Entrar</button>
            </form>
        </div>

        <p class="mt-6 text-center text-xs text-slate-400">
            Acesso restrito a colaboradores. Candidatos recebem um link próprio por WhatsApp.
        </p>
    </div>
</body>
</html>
