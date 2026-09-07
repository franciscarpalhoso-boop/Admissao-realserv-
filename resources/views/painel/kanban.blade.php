@extends('layouts.painel')
@section('titulo', 'Painel')

@section('conteudo')
@php
    use App\Models\Candidato;
    $porEtapa = $candidatos->groupBy('etapa');
    $cores = [
        'TRIAGEM' => 'bg-slate-100 text-slate-700 border-slate-200',
        'ENTREVISTA_AGENDADA' => 'bg-sky-100 text-sky-800 border-sky-200',
        'ENTREVISTADO' => 'bg-indigo-100 text-indigo-800 border-indigo-200',
        'APROVADO' => 'bg-emerald-100 text-emerald-800 border-emerald-200',
        'DOCUMENTACAO' => 'bg-amber-100 text-amber-800 border-amber-200',
        'EXAME_ADMISSIONAL' => 'bg-purple-100 text-purple-800 border-purple-200',
        'ADMITIDO' => 'bg-green-600 text-white border-green-700',
        'REPROVADO' => 'bg-red-100 text-red-800 border-red-200',
        'DESISTIU' => 'bg-zinc-200 text-zinc-700 border-zinc-300',
        'BANCO_TALENTOS' => 'bg-teal-100 text-teal-800 border-teal-200',
    ];
@endphp

<div class="mb-5 flex flex-wrap items-center justify-between gap-3">
    <div>
        <h1 class="text-lg font-semibold">Pipeline de candidatos</h1>
        <p class="text-sm text-slate-500">{{ $candidatos->count() }} candidato(s) ativo(s)</p>
    </div>
    @include('componentes.novo-candidato')
</div>

<div class="flex gap-3 overflow-x-auto pb-3">
    @foreach (Candidato::ETAPAS_KANBAN as $etapa)
        @php $lista = $porEtapa->get($etapa, collect()); @endphp
        <div class="w-72 shrink-0">
            <div class="h-full rounded-lg border border-slate-200 bg-white shadow-sm">
                <div class="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <h2 class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ Candidato::ETAPAS[$etapa] }}</h2>
                    <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium {{ $cores[$etapa] }}">{{ $lista->count() }}</span>
                </div>
                <div class="space-y-2 px-2 py-2">
                    @forelse ($lista as $candidato)
                        <a href="{{ route('candidatos.mostrar', $candidato) }}"
                           class="block rounded-md border border-slate-200 px-3 py-2 hover:border-marca-300 hover:bg-marca-50/40">
                            <p class="truncate text-sm font-medium">{{ $candidato->nome_completo }}</p>
                            <p class="truncate text-xs text-slate-500">{{ $candidato->funcao?->nome ?? 'Vaga não informada' }}</p>
                            <div class="mt-1.5 flex flex-wrap items-center gap-1">
                                <span class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">
                                    Ficha: {{ ['NAO_INICIADA' => 'Não iniciada', 'EM_PREENCHIMENTO' => 'Em preenchimento', 'ENVIADA' => 'Enviada'][$candidato->status_ficha] }}
                                </span>
                                @if ($candidato->informacoesInternas?->numero_admissao)
                                    <span class="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                                        {{ $candidato->informacoesInternas->numero_admissao }}
                                    </span>
                                @endif
                            </div>
                            <p class="mt-1 text-[11px] text-slate-400">{{ $candidato->etapa_atualizada_em?->format('d/m/Y H:i') }}</p>
                        </a>
                    @empty
                        <p class="px-2 py-4 text-center text-xs text-slate-400">Nenhum candidato</p>
                    @endforelse
                </div>
            </div>
        </div>
    @endforeach
</div>

<h2 class="mb-2 mt-6 text-sm font-semibold text-slate-700">Encerrados</h2>
<div class="grid gap-3 sm:grid-cols-3">
    @foreach (Candidato::ETAPAS_ENCERRAMENTO as $etapa)
        @php $lista = $porEtapa->get($etapa, collect()); @endphp
        <div class="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div class="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ Candidato::ETAPAS[$etapa] }}</h3>
                <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium {{ $cores[$etapa] }}">{{ $lista->count() }}</span>
            </div>
            <div class="space-y-1 px-2 py-2">
                @forelse ($lista->take(5) as $candidato)
                    <a href="{{ route('candidatos.mostrar', $candidato) }}" class="block truncate rounded px-2 py-1 text-sm text-slate-700 hover:bg-slate-50">{{ $candidato->nome_completo }}</a>
                @empty
                    <p class="px-2 text-xs text-slate-400">Nenhum</p>
                @endforelse
            </div>
        </div>
    @endforeach
</div>
@endsection
