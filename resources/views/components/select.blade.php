@props([
    'rotulo',
    'nome',
    'opcoes' => [],
    'valor' => null,
    'obrigatorio' => false,
    'ajuda' => null,
    'semVazio' => false,
    'id' => null,
])
@php $identificador = $id ?? 'campo_' . str_replace(['[', ']', '.'], '_', $nome); @endphp

<div class="w-full">
    <label for="{{ $identificador }}" class="mb-1 block text-xs font-medium text-slate-600">
        {{ $rotulo }}@if ($obrigatorio)<span class="ml-0.5 text-red-500">*</span>@endif
    </label>
    <select
        id="{{ $identificador }}"
        name="{{ $nome }}"
        @if ($obrigatorio) required @endif
        {{ $attributes->merge(['class' => 'h-10 w-full rounded-md border border-slate-300 px-2 text-sm text-slate-900 focus:border-marca-500 focus:outline-none focus:ring-1 focus:ring-marca-500']) }}
    >
        @unless ($semVazio)
            <option value="">Selecione...</option>
        @endunless
        @foreach ($opcoes as $chave => $texto)
            <option value="{{ $chave }}" @selected((string) $valor === (string) $chave)>{{ $texto }}</option>
        @endforeach
    </select>
    @error($nome)
        <p class="mt-1 text-[11px] font-medium text-red-600">{{ $message }}</p>
    @enderror
    @if ($ajuda)
        <p class="mt-1 text-[11px] text-slate-500">{{ $ajuda }}</p>
    @endif
</div>
