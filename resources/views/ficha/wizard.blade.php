@extends('layouts.publico')

@php
    $titulos = [
        1 => 'Dados pessoais',
        2 => 'Documentação',
        3 => 'Cursos e referências',
        4 => 'Empregos anteriores',
        5 => 'Uniforme',
        6 => 'Questionário',
        7 => 'Declaração e assinatura',
        8 => 'Envio de documentos',
    ];
    $enviada = $candidato->status_ficha === 'ENVIADA';
@endphp

@section('titulo', $titulos[$etapa])

@section('conteudo')
    <div class="mb-4 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div class="mb-2 flex items-center justify-between">
            <p class="text-sm font-semibold">Etapa {{ $etapa }} de 8 · {{ $titulos[$etapa] }}</p>
            <span class="text-xs text-slate-500">{{ round($etapa / 8 * 100) }}%</span>
        </div>
        <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div class="h-full rounded-full bg-marca-600" style="width: {{ $etapa / 8 * 100 }}%"></div>
        </div>
        <div class="mt-3 flex flex-wrap gap-1">
            @foreach ($titulos as $numero => $titulo)
                @php $bloqueado = $enviada && $numero < 8; @endphp
                @if ($bloqueado)
                    <span class="flex h-6 w-6 items-center justify-center rounded bg-slate-100 text-[11px] text-slate-300">{{ $numero }}</span>
                @else
                    <a href="{{ route('ficha.mostrar', ['token' => $token, 'etapa' => $numero]) }}" title="{{ $titulo }}"
                       class="flex h-6 w-6 items-center justify-center rounded text-[11px] font-medium {{ $numero === $etapa ? 'bg-marca-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200' }}">{{ $numero }}</a>
                @endif
            @endforeach
        </div>
    </div>

    @include('componentes.alertas')

    @if ($enviada && $etapa === 8)
        <div class="mb-4 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            <p class="font-medium">Ficha enviada com sucesso.</p>
            <p class="mt-1">Agora envie os documentos abaixo. Você pode fechar esta página e voltar
                pelo mesmo link quando quiser.</p>
        </div>
    @endif

    <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        @include('ficha.etapas.' . $etapa)
    </div>
@endsection
