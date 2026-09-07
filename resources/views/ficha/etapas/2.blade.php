@php use App\Models\Candidato; use App\Suporte\Documentos; @endphp
<form method="POST" action="{{ route('ficha.etapa', ['token' => $token, 'etapa' => 2]) }}" class="space-y-4">
    @csrf

    <fieldset class="space-y-3">
        <legend class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">CPF e PIS</legend>
        <div class="grid gap-3 sm:grid-cols-2">
            <x-campo rotulo="CPF" nome="cpf" obrigatorio inputmode="numeric" placeholder="000.000.000-00"
                     :valor="old('cpf', Documentos::mascararCpf($candidato->cpf))" />
            <x-campo rotulo="Nº PIS/NIT" nome="pis_nit" inputmode="numeric" placeholder="000.00000.00-0"
                     :valor="old('pis_nit', Documentos::mascararPis($candidato->pis_nit))" />
        </div>
    </fieldset>

    <fieldset class="space-y-3">
        <legend class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">RG</legend>
        <div class="grid gap-3 sm:grid-cols-3">
            <x-campo rotulo="Número do RG" nome="rg_numero" :valor="old('rg_numero', $candidato->rg_numero)" />
            <x-campo rotulo="Data de emissão" nome="rg_data_emissao" tipo="date"
                     :valor="old('rg_data_emissao', $candidato->rg_data_emissao?->format('Y-m-d'))" />
            <x-campo rotulo="Órgão expedidor" nome="rg_orgao_expedidor" placeholder="SSP"
                     :valor="old('rg_orgao_expedidor', $candidato->rg_orgao_expedidor)" />
        </div>
        <div class="sm:max-w-[140px]">
            <x-select rotulo="UF do RG" nome="rg_uf" :opcoes="array_combine(Candidato::UFS, Candidato::UFS)"
                      :valor="old('rg_uf', $candidato->rg_uf)" />
        </div>
    </fieldset>

    <fieldset class="space-y-3">
        <legend class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">CNH</legend>
        @if ($candidato->funcao?->exige_cnh)
            <div class="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                A vaga escolhida exige CNH válida. Preencha os dados e anexe a CNH na etapa de documentos.
            </div>
        @endif
        <div class="grid gap-3 sm:grid-cols-3">
            <x-campo rotulo="Número da CNH" nome="cnh_numero" inputmode="numeric" :valor="old('cnh_numero', $candidato->cnh_numero)" />
            <x-campo rotulo="Nº de registro" nome="cnh_registro" inputmode="numeric" :valor="old('cnh_registro', $candidato->cnh_registro)" />
            <x-campo rotulo="Categoria" nome="cnh_categoria" placeholder="AB" :valor="old('cnh_categoria', $candidato->cnh_categoria)" />
        </div>
        <div class="grid gap-3 sm:grid-cols-3">
            <x-campo rotulo="Data de emissão" nome="cnh_data_emissao" tipo="date"
                     :valor="old('cnh_data_emissao', $candidato->cnh_data_emissao?->format('Y-m-d'))" />
            <x-campo rotulo="Validade" nome="cnh_validade" tipo="date"
                     :valor="old('cnh_validade', $candidato->cnh_validade?->format('Y-m-d'))" />
            <x-campo rotulo="Data da 1ª habilitação" nome="cnh_primeira_habilitacao" tipo="date"
                     :valor="old('cnh_primeira_habilitacao', $candidato->cnh_primeira_habilitacao?->format('Y-m-d'))" />
        </div>
        <div class="sm:max-w-[140px]">
            <x-select rotulo="UF da CNH" nome="cnh_uf" :opcoes="array_combine(Candidato::UFS, Candidato::UFS)"
                      :valor="old('cnh_uf', $candidato->cnh_uf)" />
        </div>
    </fieldset>

    <fieldset class="space-y-3">
        <legend class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">CTPS</legend>
        <label class="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="ctps_digital" value="1" @checked(old('ctps_digital', $candidato->ctps_digital))
                   class="h-4 w-4 accent-marca-600"> Tenho CTPS digital (aplicativo)
        </label>
        <div class="grid gap-3 sm:grid-cols-3">
            <x-campo rotulo="Número da CTPS" nome="ctps_numero" inputmode="numeric" :valor="old('ctps_numero', $candidato->ctps_numero)" />
            <x-campo rotulo="Série" nome="ctps_serie" inputmode="numeric" :valor="old('ctps_serie', $candidato->ctps_serie)" />
            <x-select rotulo="UF" nome="ctps_uf" :opcoes="array_combine(Candidato::UFS, Candidato::UFS)"
                      :valor="old('ctps_uf', $candidato->ctps_uf)" />
        </div>
    </fieldset>

    <fieldset class="space-y-3">
        <legend class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Título de eleitor e reservista</legend>
        <div class="grid gap-3 sm:grid-cols-3">
            <x-campo rotulo="Inscrição" nome="titulo_eleitor_numero" inputmode="numeric" :valor="old('titulo_eleitor_numero', $candidato->titulo_eleitor_numero)" />
            <x-campo rotulo="Zona" nome="titulo_eleitor_zona" inputmode="numeric" :valor="old('titulo_eleitor_zona', $candidato->titulo_eleitor_zona)" />
            <x-campo rotulo="Seção" nome="titulo_eleitor_secao" inputmode="numeric" :valor="old('titulo_eleitor_secao', $candidato->titulo_eleitor_secao)" />
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
            <x-campo rotulo="Certificado militar/reservista (nº)" nome="reservista_numero" :valor="old('reservista_numero', $candidato->reservista_numero)" />
            <x-select rotulo="Tipo sanguíneo" nome="tipo_sanguineo"
                      :opcoes="array_combine(Candidato::TIPOS_SANGUINEOS, Candidato::TIPOS_SANGUINEOS)"
                      :valor="old('tipo_sanguineo', $candidato->tipo_sanguineo)" />
        </div>
    </fieldset>

    <fieldset class="space-y-3">
        <legend class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Filhos</legend>
        <p class="text-xs text-slate-500">
            Informe os filhos para salário-família e imposto de renda. Deixe em branco se não tiver.
        </p>
        <div id="lista-filhos" class="space-y-3">
            @foreach ($candidato->filhos as $indice => $filho)
                <div class="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p class="mb-2 text-xs font-semibold text-slate-600">Filho {{ $indice + 1 }}</p>
                    <div class="space-y-2">
                        <x-campo rotulo="Nome completo" :nome="'filho_nome[' . $indice . ']'" :valor="$filho->nome" />
                        <div class="grid gap-2 sm:grid-cols-2">
                            <x-campo rotulo="Data de nascimento" :nome="'filho_nascimento[' . $indice . ']'" tipo="date"
                                     :valor="$filho->data_nascimento?->format('Y-m-d')" />
                            <x-campo rotulo="CPF" :nome="'filho_cpf[' . $indice . ']'" inputmode="numeric"
                                     :valor="\App\Suporte\Documentos::mascararCpf($filho->cpf)" />
                        </div>
                    </div>
                </div>
            @endforeach
        </div>
        <button type="button" id="adicionar-filho"
                class="h-8 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium hover:bg-slate-50">
            + Adicionar filho
        </button>
    </fieldset>

    <x-rodape-etapa :token="$token" :etapa="2" />
</form>

<script>
// Adiciona blocos de filho sem precisar de build de JavaScript.
(function () {
    const lista = document.getElementById('lista-filhos');
    let proximo = {{ $candidato->filhos->count() }};
    document.getElementById('adicionar-filho')?.addEventListener('click', () => {
        const i = proximo++;
        const bloco = document.createElement('div');
        bloco.className = 'rounded-md border border-slate-200 bg-slate-50 p-3';
        bloco.innerHTML = `
            <p class="mb-2 text-xs font-semibold text-slate-600">Filho ${i + 1}</p>
            <div class="space-y-2">
                <div>
                    <label class="mb-1 block text-xs font-medium text-slate-600">Nome completo</label>
                    <input name="filho_nome[${i}]" class="h-10 w-full rounded-md border border-slate-300 px-3 text-sm">
                </div>
                <div class="grid gap-2 sm:grid-cols-2">
                    <div>
                        <label class="mb-1 block text-xs font-medium text-slate-600">Data de nascimento</label>
                        <input type="date" name="filho_nascimento[${i}]" class="h-10 w-full rounded-md border border-slate-300 px-3 text-sm">
                    </div>
                    <div>
                        <label class="mb-1 block text-xs font-medium text-slate-600">CPF</label>
                        <input name="filho_cpf[${i}]" inputmode="numeric" class="h-10 w-full rounded-md border border-slate-300 px-3 text-sm">
                    </div>
                </div>
            </div>`;
        lista.appendChild(bloco);
    });
})();
</script>
