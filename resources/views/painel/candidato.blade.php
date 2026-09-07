@extends('layouts.painel')
@section('titulo', $candidato->nome_completo)

@php
    use App\Models\Candidato;
    use App\Suporte\Documentos;
    $usuario = auth()->user();
    $abas = [
        'ficha' => 'Ficha',
        'documentos' => 'Documentos',
        'entrevista' => 'Entrevista',
        'internas' => 'Informações Internas',
        'historico' => 'Histórico',
    ];
    $aba = array_key_exists($aba, $abas) ? $aba : 'ficha';
    $pendentesDoc = $candidato->documentos->where('exigencia', 'OBRIGATORIO')->where('status', '!=', 'CONFERIDO')->count();
    $whatsapp = Documentos::normalizarWhatsapp($candidato->celular_whatsapp);
    $mensagem = "Olá! Aqui é do Grupo Real Serv. Para dar andamento ao seu processo, preencha a ficha e envie os documentos pelo link abaixo. Leva cerca de 15 minutos e pode ser feito pelo celular.\n\n" . $candidato->linkPublico();
@endphp

@section('conteudo')
<a href="{{ route('candidatos') }}" class="text-xs text-slate-500 hover:underline">← Voltar para candidatos</a>

<div class="mt-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
                <h1 class="text-lg font-semibold">{{ $candidato->nome_completo }}</h1>
                <span class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                    {{ $candidato->rotuloEtapa() }}
                </span>
                @if ($candidato->informacoesInternas?->numero_admissao)
                    <span class="inline-flex items-center rounded-full border border-green-300 bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-800">
                        {{ $candidato->informacoesInternas->numero_admissao }}
                    </span>
                @endif
            </div>
            <p class="mt-1 text-sm text-slate-600">
                {{ $candidato->funcao?->nome ?? 'Vaga não informada' }}
                @if ($candidato->cpf) · CPF {{ Documentos::mascararCpf($candidato->cpf) }} @endif
                @if ($candidato->celular_whatsapp) · {{ Documentos::mascararTelefone($candidato->celular_whatsapp) }} @endif
            </p>
        </div>

        <div class="nao-imprimir flex flex-wrap gap-2">
            <a href="{{ route('pdf.ficha', $candidato) }}" target="_blank" rel="noopener"
               class="inline-flex h-8 items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-medium hover:bg-slate-50">Ficha em PDF</a>
            <a href="{{ route('pdf.dossie', $candidato) }}"
               class="inline-flex h-8 items-center rounded-md bg-marca-600 px-3 text-xs font-medium text-white hover:bg-marca-700">Baixar dossiê (PDF único)</a>
        </div>
    </div>

    @if ($pendencias)
        <div class="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <span class="font-medium">{{ count($pendencias) }} documento(s) obrigatório(s) sem conferência:</span>
            {{ implode(', ', array_column($pendencias, 'nome')) }}.
        </div>
    @endif

    {{-- Link público --}}
    <details class="mt-3" @if (session('mostrar_link')) open @endif>
        <summary class="cursor-pointer text-xs font-medium text-marca-700">Link do candidato</summary>
        <div class="mt-2 space-y-2">
            <div class="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p class="break-all font-mono text-xs text-slate-700">{{ $candidato->linkPublico() }}</p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
                <a href="https://wa.me/{{ $whatsapp }}?text={{ rawurlencode($mensagem) }}" target="_blank" rel="noopener"
                   class="inline-flex h-8 items-center rounded-md bg-emerald-600 px-3 text-xs font-medium text-white hover:bg-emerald-700">
                    Enviar por WhatsApp
                </a>
                <form method="POST" action="{{ route('candidatos.link', $candidato) }}">
                    @csrf
                    <button class="h-8 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium hover:bg-slate-50">
                        Gerar novo link (invalida o anterior)
                    </button>
                </form>
                <span class="text-xs text-slate-500">
                    {{ $candidato->token_expira_em ? 'Válido até ' . $candidato->token_expira_em->format('d/m/Y') : 'Sem expiração' }}
                </span>
            </div>
        </div>
    </details>
</div>

{{-- Abas --}}
<div class="nao-imprimir mt-4 flex gap-1 overflow-x-auto border-b border-slate-200">
    @foreach ($abas as $chave => $rotulo)
        <a href="{{ route('candidatos.mostrar', ['candidato' => $candidato, 'aba' => $chave]) }}"
           class="whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium {{ $aba === $chave ? 'border-marca-600 text-marca-700' : 'border-transparent text-slate-500 hover:text-slate-800' }}">
            {{ $rotulo }}
            @if ($chave === 'documentos' && $pendentesDoc > 0)
                <span class="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">{{ $pendentesDoc }}</span>
            @endif
        </a>
    @endforeach
</div>

<div class="mt-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    @include('painel.abas.' . $aba)
</div>

{{-- Mover etapa --}}
<div class="nao-imprimir mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <h2 class="mb-3 text-sm font-semibold">Mover etapa</h2>
    <form method="POST" action="{{ route('candidatos.etapa', $candidato) }}" class="space-y-3">
        @csrf
        <div class="grid gap-3 sm:grid-cols-3">
            <x-select rotulo="Nova etapa" nome="para" :opcoes="Candidato::ETAPAS" :valor="$candidato->etapa" :semVazio="true" />
            <x-campo rotulo="Data da admissão" nome="data_admissao" tipo="date"
                     ajuda="Define o mês do número ADM. Em branco, usa hoje." />
            <x-campo rotulo="Observação" nome="observacao" />
        </div>
        @if ($pendencias && $usuario->podeAdministrar())
            <x-area-texto rotulo="Justificativa para forçar a admissão (com documentos pendentes)"
                          nome="justificativa_forcada" :linhas="2" />
        @endif
        <button class="h-10 rounded-md bg-slate-100 px-4 text-sm font-medium text-slate-900 hover:bg-slate-200">
            Confirmar
        </button>
    </form>
</div>
@endsection
