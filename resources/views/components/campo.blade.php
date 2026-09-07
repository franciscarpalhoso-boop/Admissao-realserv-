@props([
    'rotulo',
    'nome',
    'tipo' => 'text',
    'valor' => null,
    'obrigatorio' => false,
    'ajuda' => null,
    'placeholder' => null,
    'inputmode' => null,
    'id' => null,
])
@php $identificador = $id ?? 'campo_' . str_replace(['[', ']', '.'], '_', $nome); @endphp

<div class="w-full">
    <label for="{{ $identificador }}" class="mb-1 block text-xs font-medium text-slate-600">
        {{ $rotulo }}@if ($obrigatorio)<span class="ml-0.5 text-red-500">*</span>@endif
    </label>
    <input
        type="{{ $tipo }}"
        id="{{ $identificador }}"
        name="{{ $nome }}"
        value="{{ $valor }}"
        @if ($obrigatorio) required @endif
        @if ($placeholder) placeholder="{{ $placeholder }}" @endif
        @if ($inputmode) inputmode="{{ $inputmode }}" @endif
        {{ $attributes->merge(['class' => 'h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-marca-500 focus:outline-none focus:ring-1 focus:ring-marca-500']) }}
    >
    @error($nome)
        <p class="mt-1 text-[11px] font-medium text-red-600">{{ $message }}</p>
    @enderror
    @if ($ajuda)
        <p class="mt-1 text-[11px] text-slate-500">{{ $ajuda }}</p>
    @endif
</div>
