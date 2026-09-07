@extends('layouts.painel')
@section('titulo', 'Candidatos')

@section('conteudo')
@php use App\Models\Candidato; use App\Suporte\Documentos; @endphp

<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
    <div>
        <h1 class="text-lg font-semibold">Candidatos</h1>
        <p class="text-sm text-slate-500">{{ $candidatos->total() }} resultado(s)</p>
    </div>
    @include('componentes.novo-candidato')
</div>

<form method="GET" class="mb-4 flex flex-wrap items-end gap-2">
    <input name="busca" value="{{ request('busca') }}" placeholder="Buscar por nome, CPF, e-mail ou telefone"
           class="h-10 min-w-[220px] flex-1 rounded-md border border-slate-300 px-3 text-sm focus:border-marca-500 focus:outline-none focus:ring-1 focus:ring-marca-500">
    <select name="etapa" class="h-10 w-52 rounded-md border border-slate-300 px-2 text-sm">
        <option value="">Todas as etapas</option>
        @foreach (Candidato::ETAPAS as $chave => $rotulo)
            <option value="{{ $chave }}" @selected(request('etapa') === $chave)>{{ $rotulo }}</option>
        @endforeach
    </select>
    <select name="funcao_id" class="h-10 w-52 rounded-md border border-slate-300 px-2 text-sm">
        <option value="">Todas as vagas</option>
        @foreach ($funcoes as $funcao)
            <option value="{{ $funcao->id }}" @selected((string) request('funcao_id') === (string) $funcao->id)>{{ $funcao->nome }}</option>
        @endforeach
    </select>
    <button class="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium hover:bg-slate-50">Filtrar</button>
</form>

@if ($candidatos->isEmpty())
    <p class="rounded-md border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
        Nenhum candidato encontrado com esses filtros.
    </p>
@else
    <div class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div class="overflow-x-auto">
            <table class="w-full min-w-[900px] text-sm">
                <thead class="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                        <th class="px-4 py-2.5 font-medium">Candidato</th>
                        <th class="px-4 py-2.5 font-medium">Vaga</th>
                        <th class="px-4 py-2.5 font-medium">Etapa</th>
                        <th class="px-4 py-2.5 font-medium">Ficha</th>
                        <th class="px-4 py-2.5 font-medium">Documentos</th>
                        <th class="px-4 py-2.5 font-medium">ADM</th>
                        <th class="px-4 py-2.5 font-medium">Cadastro</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    @foreach ($candidatos as $candidato)
                        <tr class="hover:bg-slate-50">
                            <td class="px-4 py-2.5">
                                <a href="{{ route('candidatos.mostrar', $candidato) }}" class="font-medium text-marca-700 hover:underline">
                                    {{ $candidato->nome_completo }}
                                </a>
                                <p class="text-xs text-slate-500">
                                    {{ $candidato->cpf ? Documentos::mascararCpf($candidato->cpf) : 'CPF não informado' }}
                                </p>
                            </td>
                            <td class="px-4 py-2.5 text-slate-700">{{ $candidato->funcao?->nome ?? '—' }}</td>
                            <td class="px-4 py-2.5 text-slate-700">{{ $candidato->rotuloEtapa() }}</td>
                            <td class="px-4 py-2.5 text-slate-600">
                                {{ ['NAO_INICIADA' => 'Não iniciada', 'EM_PREENCHIMENTO' => 'Em preenchimento', 'ENVIADA' => 'Enviada'][$candidato->status_ficha] }}
                            </td>
                            <td class="px-4 py-2.5 text-slate-600">{{ $candidato->conferidos }}/{{ $candidato->obrigatorios }} conferidos</td>
                            <td class="px-4 py-2.5 text-slate-700">{{ $candidato->informacoesInternas?->numero_admissao ?? '—' }}</td>
                            <td class="px-4 py-2.5 text-xs text-slate-500">{{ $candidato->created_at?->format('d/m/Y H:i') }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
    <div class="mt-4">{{ $candidatos->links() }}</div>
@endif
@endsection
