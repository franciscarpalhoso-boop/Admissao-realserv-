@if (! auth()->user()->podeOperarDp())
    <div class="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
        Somente o Departamento Pessoal e a administração editam as informações internas.
    </div>
@else
    @php $i = $candidato->informacoesInternas; @endphp

    @if ($i?->numero_admissao)
        <div class="mb-4 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            Número da admissão gerado: <strong>{{ $i->numero_admissao }}</strong>
        </div>
    @endif
    @if ($i?->justificativa_forcada)
        <div class="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Admissão registrada com documentação pendente. Justificativa: {{ $i->justificativa_forcada }}
        </div>
    @endif

    <form method="POST" action="{{ route('candidatos.internas', $candidato) }}" class="space-y-5">
        @csrf
        <section class="space-y-3">
            <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500">Alocação</h3>
            <div class="grid gap-3 sm:grid-cols-2">
                <x-select rotulo="Empresa contratante" nome="empresa_id" :opcoes="$empresas->pluck('nome', 'id')->all()" :valor="$i?->empresa_id" />
                <x-select rotulo="Posto de trabalho" nome="posto_id" :opcoes="$postos->pluck('nome', 'id')->all()" :valor="$i?->posto_id" />
                <x-select rotulo="Supervisor" nome="supervisor_id" :opcoes="$supervisores->pluck('nome', 'id')->all()" :valor="$i?->supervisor_id" />
                <x-select rotulo="Escala" nome="escala_id" :opcoes="$escalas->pluck('nome', 'id')->all()" :valor="$i?->escala_id" />
            </div>
            <label class="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" name="acumulo_funcao" value="1" @checked($i?->acumulo_funcao) class="h-4 w-4 accent-marca-600">
                Acúmulo de função
            </label>
            <x-campo rotulo="Qual função acumulada?" nome="acumulo_funcao_qual" :valor="$i?->acumulo_funcao_qual" />
        </section>

        <section class="space-y-3">
            <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500">Remuneração e benefícios</h3>
            <div class="grid gap-3 sm:grid-cols-2">
                <x-campo rotulo="Base salarial (R$)" nome="base_salarial" inputmode="decimal" placeholder="1.800,00" :valor="$i?->base_salarial" />
                <x-campo rotulo="Outros benefícios" nome="outros_beneficios" :valor="$i?->outros_beneficios" />
            </div>
            <div class="flex flex-wrap gap-4">
                <label class="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" name="vale_transporte" value="1" @checked($i?->vale_transporte) class="h-4 w-4 accent-marca-600"> Vale-transporte
                </label>
                <label class="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" name="premio_assiduidade" value="1" @checked($i?->premio_assiduidade) class="h-4 w-4 accent-marca-600"> Prêmio assiduidade
                </label>
            </div>
        </section>

        <section class="space-y-3">
            <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500">Datas e aprovação</h3>
            <div class="grid gap-3 sm:grid-cols-2">
                <x-campo rotulo="Data de início" nome="data_inicio" tipo="date" :valor="$i?->data_inicio?->format('Y-m-d')" />
                <x-campo rotulo="Data do treinamento/integração" nome="data_treinamento" tipo="date" :valor="$i?->data_treinamento?->format('Y-m-d')" />
                <x-campo rotulo="Responsável pela aprovação" nome="responsavel_aprovacao" :valor="$i?->responsavel_aprovacao" />
                <x-campo rotulo="Assinatura digital do responsável" nome="assinatura_responsavel"
                         ajuda="Nome digitado equivale à assinatura eletrônica interna." :valor="$i?->assinatura_responsavel" />
            </div>
        </section>

        <button class="h-10 rounded-md bg-marca-600 px-4 text-sm font-medium text-white hover:bg-marca-700">
            Salvar informações internas
        </button>
    </form>
@endif
