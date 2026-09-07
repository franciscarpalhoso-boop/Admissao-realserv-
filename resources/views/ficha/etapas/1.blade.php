@php use App\Models\Candidato; use App\Suporte\Documentos; @endphp
<form method="POST" action="{{ route('ficha.etapa', ['token' => $token, 'etapa' => 1]) }}" class="space-y-4">
    @csrf

    <fieldset class="space-y-3">
        <legend class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Identificação</legend>
        <x-campo rotulo="Nome completo" nome="nome_completo" obrigatorio :valor="old('nome_completo', $candidato->nome_completo)" />
        <div class="grid gap-3 sm:grid-cols-2">
            <x-campo rotulo="Telefone de contato" nome="telefone_contato" inputmode="tel"
                     :valor="old('telefone_contato', Documentos::mascararTelefone($candidato->telefone_contato))" />
            <x-campo rotulo="Telefone para recado" nome="telefone_recado" inputmode="tel"
                     :valor="old('telefone_recado', Documentos::mascararTelefone($candidato->telefone_recado))" />
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
            <x-campo rotulo="Celular (WhatsApp)" nome="celular_whatsapp" obrigatorio inputmode="tel"
                     :valor="old('celular_whatsapp', Documentos::mascararTelefone($candidato->celular_whatsapp))" />
            <x-campo rotulo="E-mail" nome="email" tipo="email" :valor="old('email', $candidato->email)" />
        </div>
    </fieldset>

    <fieldset class="space-y-3">
        <legend class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Vaga pretendida</legend>
        <div class="grid gap-3 sm:grid-cols-2">
            <x-select rotulo="Vaga pretendida" nome="funcao_id" obrigatorio
                      :opcoes="$funcoes->pluck('nome', 'id')->all()" :valor="old('funcao_id', $candidato->funcao_id)" />
            <x-campo rotulo="Tempo de experiência na vaga" nome="tempo_experiencia" ajuda="Ex.: 2 anos e 6 meses"
                     :valor="old('tempo_experiencia', $candidato->tempo_experiencia)" />
        </div>
    </fieldset>

    <fieldset class="space-y-3">
        <legend class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Dados pessoais</legend>
        <div class="grid gap-3 sm:grid-cols-2">
            <x-campo rotulo="Naturalidade (cidade)" nome="naturalidade" :valor="old('naturalidade', $candidato->naturalidade)" />
            <x-select rotulo="UF de nascimento" nome="uf_naturalidade"
                      :opcoes="array_combine(Candidato::UFS, Candidato::UFS)" :valor="old('uf_naturalidade', $candidato->uf_naturalidade)" />
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
            <x-campo rotulo="Data de nascimento" nome="data_nascimento" tipo="date" obrigatorio
                     :valor="old('data_nascimento', $candidato->data_nascimento?->format('Y-m-d'))" />
            <x-select rotulo="Sexo" nome="sexo" :opcoes="Candidato::SEXOS" :valor="old('sexo', $candidato->sexo)"
                      ajuda="Define se o certificado de reservista é exigido." :semVazio="true" />
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
            <x-select rotulo="Estado civil" nome="estado_civil" :opcoes="Candidato::ESTADOS_CIVIS"
                      :valor="old('estado_civil', $candidato->estado_civil)" />
            <x-campo rotulo="Nome do cônjuge" nome="nome_conjuge" :valor="old('nome_conjuge', $candidato->nome_conjuge)" />
        </div>
        <x-select rotulo="Escolaridade" nome="escolaridade" :opcoes="Candidato::ESCOLARIDADES"
                  :valor="old('escolaridade', $candidato->escolaridade)" />
        <div class="grid gap-3 sm:grid-cols-2">
            <x-campo rotulo="Nome da mãe" nome="nome_mae" obrigatorio :valor="old('nome_mae', $candidato->nome_mae)" />
            <x-campo rotulo="Nome do pai" nome="nome_pai" :valor="old('nome_pai', $candidato->nome_pai)" />
        </div>
    </fieldset>

    <fieldset class="space-y-3">
        <legend class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Endereço</legend>
        <div class="grid gap-3 sm:grid-cols-3">
            <x-campo rotulo="CEP" nome="cep" inputmode="numeric" id="campo-cep" placeholder="00000-000"
                     ajuda="Preenche o endereço sozinho." :valor="old('cep', Documentos::mascararCep($candidato->cep))" />
            <div class="sm:col-span-2">
                <x-campo rotulo="Logradouro (rua)" nome="logradouro" id="campo-logradouro"
                         :valor="old('logradouro', $candidato->logradouro)" />
            </div>
        </div>
        <div class="grid gap-3 sm:grid-cols-3">
            <x-campo rotulo="Número" nome="numero" :valor="old('numero', $candidato->numero)" />
            <x-campo rotulo="Complemento" nome="complemento" :valor="old('complemento', $candidato->complemento)" />
            <x-campo rotulo="Bairro" nome="bairro" id="campo-bairro" :valor="old('bairro', $candidato->bairro)" />
        </div>
        <div class="grid gap-3 sm:grid-cols-3">
            <div class="sm:col-span-2">
                <x-campo rotulo="Cidade" nome="cidade" id="campo-cidade" :valor="old('cidade', $candidato->cidade)" />
            </div>
            <x-select rotulo="UF" nome="uf" id="campo-uf" :opcoes="array_combine(Candidato::UFS, Candidato::UFS)"
                      :valor="old('uf', $candidato->uf)" />
        </div>
        <x-campo rotulo="Tempo de residência no endereço" nome="tempo_residencia" ajuda="Ex.: 3 anos"
                 :valor="old('tempo_residencia', $candidato->tempo_residencia)" />
    </fieldset>

    <x-rodape-etapa :token="$token" :etapa="1" />
</form>

<script>
// Busca o endereço no ViaCEP. Se não houver rede, o candidato preenche à mão.
document.getElementById('campo-cep')?.addEventListener('blur', async (evento) => {
    const digitos = evento.target.value.replace(/\D/g, '');
    if (digitos.length !== 8) return;
    try {
        const resposta = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
        const dados = await resposta.json();
        if (dados.erro) return;
        const preencher = (id, valor) => {
            const campo = document.getElementById(id);
            if (campo && valor && !campo.value) campo.value = valor;
        };
        preencher('campo-logradouro', dados.logradouro);
        preencher('campo-bairro', dados.bairro);
        preencher('campo-cidade', dados.localidade);
        const uf = document.getElementById('campo-uf');
        if (uf && dados.uf && !uf.value) uf.value = dados.uf;
    } catch (e) { /* sem rede: segue preenchimento manual */ }
});
</script>
