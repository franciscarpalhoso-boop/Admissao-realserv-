@props(['rotulo', 'nome', 'valor' => null, 'linhas' => 3, 'ajuda' => null, 'max' => null, 'placeholder' => null])
@php $identificador = 'campo_' . str_replace(['[', ']', '.'], '_', $nome); @endphp

<div class="w-full">
    <label for="{{ $identificador }}" class="mb-1 block text-xs font-medium text-slate-600">{{ $rotulo }}</label>
    <textarea id="{{ $identificador }}" name="{{ $nome }}" rows="{{ $linhas }}"
        @if ($max) maxlength="{{ $max }}" @endif
        @if ($placeholder) placeholder="{{ $placeholder }}" @endif
        class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-marca-500 focus:outline-none focus:ring-1 focus:ring-marca-500">{{ $valor }}</textarea>
    @error($nome)
        <p class="mt-1 text-[11px] font-medium text-red-600">{{ $message }}</p>
    @enderror
    @if ($ajuda)
        <p class="mt-1 text-[11px] text-slate-500">{{ $ajuda }}</p>
    @endif
</div>
