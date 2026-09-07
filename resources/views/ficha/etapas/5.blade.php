<form method="POST" action="{{ route('ficha.etapa', ['token' => $token, 'etapa' => 5]) }}" class="space-y-4">
    @csrf
    <fieldset class="space-y-3">
        <legend class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Uniforme</legend>

        @php
            $aviso = $candidato->funcao?->aviso_especifico
                ?: ($candidato->funcao?->exige_sapato_preto
                    ? 'Candidatos à vaga de portaria devem providenciar sapato preto.'
                    : null);
        @endphp
        @if ($aviso)
            <div class="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">{{ $aviso }}</div>
        @endif

        <div class="grid gap-3 sm:grid-cols-3">
            <x-campo rotulo="Nº do sapato" nome="numero_sapato" inputmode="numeric" placeholder="41"
                     :valor="old('numero_sapato', $candidato->numero_sapato)" />
            <x-select rotulo="Camisa/blusa" nome="tamanho_camisa"
                      :opcoes="['PP' => 'PP', 'P' => 'P', 'M' => 'M', 'G' => 'G', 'GG' => 'GG', 'XG' => 'XG']"
                      :valor="old('tamanho_camisa', $candidato->tamanho_camisa)" />
            <x-campo rotulo="Nº da calça" nome="numero_calca" inputmode="numeric" placeholder="42"
                     :valor="old('numero_calca', $candidato->numero_calca)" />
        </div>
    </fieldset>
    <x-rodape-etapa :token="$token" :etapa="5" />
</form>
