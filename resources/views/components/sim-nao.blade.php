@props(['rotulo', 'nome', 'valor' => null])
@php $atual = $valor === true ? 'sim' : ($valor === false ? 'nao' : old($nome)); @endphp

<div class="w-full">
    <p class="mb-1 text-xs font-medium text-slate-600">{{ $rotulo }}</p>
    <div class="flex gap-4 pt-0.5">
        @foreach (['sim' => 'Sim', 'nao' => 'Não'] as $opcao => $texto)
            <label class="flex items-center gap-1.5 text-sm text-slate-700">
                <input type="radio" name="{{ $nome }}" value="{{ $opcao }}"
                       @checked(old($nome, $atual) === $opcao) class="h-4 w-4 accent-marca-600">
                {{ $texto }}
            </label>
        @endforeach
    </div>
</div>
