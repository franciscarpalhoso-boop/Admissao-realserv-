<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5">
    <meta name="robots" content="noindex, nofollow">
    <title>@yield('titulo', 'Ficha de Solicitação de Emprego') — Grupo Real Serv</title>
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">
</head>
<body class="bg-slate-100 text-slate-900 antialiased">
    <main class="mx-auto max-w-lg px-4 py-8">
        <div class="mb-5 flex items-center gap-3">
            <span class="flex h-10 w-10 items-center justify-center rounded-lg bg-marca-600 text-sm font-bold text-white">RS</span>
            <div>
                <p class="text-sm font-semibold text-slate-900">Grupo Real Serv</p>
                <p class="text-xs text-slate-500">Ficha de Solicitação de Emprego</p>
            </div>
        </div>

        @yield('conteudo')

        <p class="mt-6 px-1 text-center text-[11px] leading-relaxed text-slate-400">
            Seus dados são usados apenas para o processo de recrutamento e admissão do Grupo
            Real Serv, conforme a Lei nº 13.709/2018 (LGPD).
        </p>
    </main>
</body>
</html>
