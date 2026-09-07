<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>@yield('titulo', 'Painel') — Admissão Real Serv</title>
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">
</head>
<body class="min-h-screen bg-slate-50 text-slate-900 antialiased">
    <header class="nao-imprimir sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div class="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5">
            <a href="{{ route('painel') }}" class="flex items-center gap-2">
                <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-marca-600 text-xs font-bold text-white">RS</span>
                <span class="hidden text-sm font-semibold sm:inline">Real Serv · Admissão</span>
            </a>

            <nav class="flex items-center gap-1 overflow-x-auto">
                @php $rota = request()->route()?->getName(); @endphp
                <a href="{{ route('painel') }}"
                   class="whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium {{ $rota === 'painel' ? 'bg-marca-50 text-marca-700' : 'text-slate-600 hover:bg-slate-100' }}">Painel</a>
                <a href="{{ route('candidatos') }}"
                   class="whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium {{ str_starts_with((string) $rota, 'candidatos') ? 'bg-marca-50 text-marca-700' : 'text-slate-600 hover:bg-slate-100' }}">Candidatos</a>
            </nav>

            <div class="ml-auto flex items-center gap-3">
                <div class="hidden text-right sm:block">
                    <p class="text-xs font-medium leading-tight">{{ auth()->user()->nome }}</p>
                    <p class="text-[11px] leading-tight text-slate-500">{{ auth()->user()->rotuloPerfil() }}</p>
                </div>
                <form method="POST" action="{{ route('sair') }}">
                    @csrf
                    <button class="h-8 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium hover:bg-slate-50">Sair</button>
                </form>
            </div>
        </div>
    </header>

    <main class="mx-auto max-w-7xl px-4 py-6">
        @include('componentes.alertas')
        @yield('conteudo')
    </main>
</body>
</html>
