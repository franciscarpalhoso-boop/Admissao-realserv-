@props(['token', 'etapa'])

<div class="sticky bottom-0 -mx-4 mt-6 flex gap-2 border-t border-slate-100 bg-white px-4 py-3">
    @if ($etapa > 1)
        <a href="{{ route('ficha.mostrar', ['token' => $token, 'etapa' => $etapa - 1]) }}"
           class="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium hover:bg-slate-50">
            Voltar
        </a>
    @endif
    <button type="submit" class="h-10 flex-1 rounded-md bg-marca-600 text-sm font-medium text-white hover:bg-marca-700">
        Salvar e continuar
    </button>
</div>
