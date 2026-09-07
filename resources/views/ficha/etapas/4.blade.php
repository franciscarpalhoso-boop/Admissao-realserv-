@php use App\Suporte\Documentos; $titulos = ['Último emprego', 'Penúltimo emprego', 'Antepenúltimo emprego']; @endphp
<form method="POST" action="{{ route('ficha.etapa', ['token' => $token, 'etapa' => 4]) }}" class="space-y-4">
    @csrf
    <p class="text-xs text-slate-500">
        Preencha os três últimos empregos. Se não tiver algum deles, marque &ldquo;não possui&rdquo;.
    </p>

    @for ($i = 0; $i < 3; $i++)
        @php $e = $candidato->empregosAnteriores->firstWhere('ordem', $i); @endphp
        <fieldset class="space-y-3">
            <legend class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{{ $titulos[$i] }}</legend>
            <label class="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" name="emprego[{{ $i }}][nao_possui]" value="1"
                       @checked($e?->nao_possui) class="h-4 w-4 accent-marca-600"> Não possui
            </label>
            <div class="space-y-3 rounded-md border border-slate-200 p-3">
                <x-campo rotulo="Empresa" :nome="'emprego[' . $i . '][empresa]'" :valor="$e?->empresa" />
                <div class="grid gap-2 sm:grid-cols-2">
                    <x-campo rotulo="Telefone" :nome="'emprego[' . $i . '][telefone]'" inputmode="tel"
                             :valor="Documentos::mascararTelefone($e?->telefone)" />
                    <x-campo rotulo="Contato (pessoa)" :nome="'emprego[' . $i . '][contato]'" :valor="$e?->contato" />
                </div>
                <div class="grid gap-2 sm:grid-cols-2">
                    <x-campo rotulo="Setor" :nome="'emprego[' . $i . '][setor]'" :valor="$e?->setor" />
                    <x-campo rotulo="Cargo" :nome="'emprego[' . $i . '][cargo]'" :valor="$e?->cargo" />
                </div>
                <div class="grid gap-2 sm:grid-cols-3">
                    <x-campo rotulo="Data de admissão" :nome="'emprego[' . $i . '][data_admissao]'" tipo="date"
                             :valor="$e?->data_admissao?->format('Y-m-d')" />
                    <x-campo rotulo="Data de saída" :nome="'emprego[' . $i . '][data_saida]'" tipo="date"
                             :valor="$e?->data_saida?->format('Y-m-d')" />
                    <x-campo rotulo="Último salário (R$)" :nome="'emprego[' . $i . '][ultimo_salario]'"
                             inputmode="decimal" placeholder="1.800,00" :valor="$e?->ultimo_salario" />
                </div>
                <x-area-texto rotulo="Motivo da saída" :nome="'emprego[' . $i . '][motivo_saida]'" :linhas="2" :valor="$e?->motivo_saida" />
            </div>
        </fieldset>
    @endfor

    <x-rodape-etapa :token="$token" :etapa="4" />
</form>
