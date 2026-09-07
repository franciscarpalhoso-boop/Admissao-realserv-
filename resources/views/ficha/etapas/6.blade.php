<form method="POST" action="{{ route('ficha.etapa', ['token' => $token, 'etapa' => 6]) }}" class="space-y-5">
    @csrf

    <fieldset class="space-y-3">
        <legend class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Disponibilidade</legend>
        <x-sim-nao rotulo="Concorda em trabalhar em escala de revezamento, inclusive domingos e feriados?"
                   nome="aceita_escala_revezamento" :valor="$candidato->aceita_escala_revezamento" />
    </fieldset>

    <fieldset class="space-y-3">
        <legend class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Vínculo com a empresa</legend>
        <x-sim-nao rotulo="Tem parente trabalhando na empresa?" nome="possui_parente_empresa"
                   :valor="$candidato->possui_parente_empresa" />
        <div class="grid gap-3 sm:grid-cols-2">
            <x-campo rotulo="Nome do parente" nome="parente_nome" :valor="old('parente_nome', $candidato->parente_nome)" />
            <x-campo rotulo="Setor/posto" nome="parente_setor" :valor="old('parente_setor', $candidato->parente_setor)" />
        </div>
        <x-sim-nao rotulo="Já trabalhou nesta empresa?" nome="ja_trabalhou_empresa" :valor="$candidato->ja_trabalhou_empresa" />
        <div class="sm:max-w-[160px]">
            <x-campo rotulo="Em que ano?" nome="ja_trabalhou_ano" inputmode="numeric" placeholder="2021"
                     :valor="old('ja_trabalhou_ano', $candidato->ja_trabalhou_ano)" />
        </div>
    </fieldset>

    <fieldset class="space-y-3">
        <legend class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Saúde</legend>
        <x-sim-nao rotulo="É fumante?" nome="fumante" :valor="$candidato->fumante" />
    </fieldset>

    <fieldset class="space-y-3">
        <legend class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Vale-transporte e pagamento</legend>
        <x-sim-nao rotulo="Deseja vale-transporte?" nome="deseja_vale_transporte" :valor="$candidato->deseja_vale_transporte" />
        <div class="grid gap-3 sm:grid-cols-2">
            <x-campo rotulo="Linhas de ônibus que utiliza" nome="linhas_onibus" placeholder="Ex.: 32, 41"
                     :valor="old('linhas_onibus', $candidato->linhas_onibus)" />
            <x-campo rotulo="Valor da passagem (R$)" nome="valor_passagem" inputmode="decimal" placeholder="5,20"
                     :valor="old('valor_passagem', $candidato->valor_passagem)" />
        </div>
        <x-campo rotulo="Chave PIX" nome="chave_pix" ajuda="CPF, celular, e-mail ou chave aleatória."
                 :valor="old('chave_pix', $candidato->chave_pix)" />
    </fieldset>

    <fieldset class="space-y-3">
        <legend class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Sobre você</legend>
        <x-area-texto rotulo="Escreva, em 5 linhas, sobre você" nome="sobre_voce" :linhas="6" :max="600"
                      ajuda="Máximo de 600 caracteres."
                      placeholder="Conte um pouco sobre sua trajetória, o que você faz bem e o que espera desta oportunidade."
                      :valor="old('sobre_voce', $candidato->sobre_voce)" />
    </fieldset>

    <x-rodape-etapa :token="$token" :etapa="6" />
</form>
