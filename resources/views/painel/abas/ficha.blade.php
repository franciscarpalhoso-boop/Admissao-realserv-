@php use App\Models\Candidato; use App\Suporte\Documentos;
    $sim = fn ($v) => $v === null ? '—' : ($v ? 'Sim' : 'Não');
    $item = fn ($rotulo, $valor) => view('painel.abas.item', ['rotulo' => $rotulo, 'valor' => $valor]);
@endphp

@if ($candidato->status_ficha === 'NAO_INICIADA')
    <p class="rounded-md border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
        O candidato ainda não iniciou o preenchimento da ficha.
    </p>
@else
<div class="space-y-6">
    <section>
        <h3 class="mb-2 border-b border-slate-100 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">1. Dados pessoais</h3>
        <div class="grid gap-x-4 gap-y-3 sm:grid-cols-3">
            {{ $item('Nome completo', $candidato->nome_completo) }}
            {{ $item('Data de nascimento', $candidato->data_nascimento?->format('d/m/Y')) }}
            {{ $item('Sexo', Candidato::SEXOS[$candidato->sexo] ?? null) }}
            {{ $item('Telefone de contato', Documentos::mascararTelefone($candidato->telefone_contato)) }}
            {{ $item('Celular (WhatsApp)', Documentos::mascararTelefone($candidato->celular_whatsapp)) }}
            {{ $item('E-mail', $candidato->email) }}
            {{ $item('Vaga pretendida', $candidato->funcao?->nome) }}
            {{ $item('Tempo de experiência', $candidato->tempo_experiencia) }}
            {{ $item('Naturalidade', trim($candidato->naturalidade . '/' . $candidato->uf_naturalidade, '/')) }}
            {{ $item('Estado civil', Candidato::ESTADOS_CIVIS[$candidato->estado_civil] ?? null) }}
            {{ $item('Nome do cônjuge', $candidato->nome_conjuge) }}
            {{ $item('Escolaridade', Candidato::ESCOLARIDADES[$candidato->escolaridade] ?? null) }}
            {{ $item('Nome da mãe', $candidato->nome_mae) }}
            {{ $item('Nome do pai', $candidato->nome_pai) }}
        </div>
    </section>

    <section>
        <h3 class="mb-2 border-b border-slate-100 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Endereço</h3>
        <div class="grid gap-x-4 gap-y-3 sm:grid-cols-3">
            {{ $item('Endereço', trim(implode(', ', array_filter([$candidato->logradouro, $candidato->numero, $candidato->complemento])))) }}
            {{ $item('Bairro', $candidato->bairro) }}
            {{ $item('CEP', Documentos::mascararCep($candidato->cep)) }}
            {{ $item('Cidade/UF', trim($candidato->cidade . '/' . $candidato->uf, '/')) }}
            {{ $item('Tempo de residência', $candidato->tempo_residencia) }}
        </div>
    </section>

    <section>
        <h3 class="mb-2 border-b border-slate-100 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">2. Documentação</h3>
        <div class="grid gap-x-4 gap-y-3 sm:grid-cols-3">
            {{ $item('CPF', Documentos::mascararCpf($candidato->cpf)) }}
            {{ $item('PIS/NIT', Documentos::mascararPis($candidato->pis_nit)) }}
            {{ $item('Tipo sanguíneo', $candidato->tipo_sanguineo) }}
            {{ $item('RG', $candidato->rg_numero) }}
            {{ $item('RG — emissão', $candidato->rg_data_emissao?->format('d/m/Y')) }}
            {{ $item('RG — órgão/UF', trim($candidato->rg_orgao_expedidor . '/' . $candidato->rg_uf, '/')) }}
            {{ $item('CNH', $candidato->cnh_numero) }}
            {{ $item('CNH — categoria', $candidato->cnh_categoria) }}
            {{ $item('CNH — validade', $candidato->cnh_validade?->format('d/m/Y')) }}
            {{ $item('CTPS', $candidato->ctps_digital ? 'CTPS digital' : trim($candidato->ctps_numero . ' / ' . $candidato->ctps_serie, ' /')) }}
            {{ $item('Título de eleitor', trim(implode(' / ', array_filter([$candidato->titulo_eleitor_numero, $candidato->titulo_eleitor_zona, $candidato->titulo_eleitor_secao])))) }}
            {{ $item('Reservista', $candidato->reservista_numero) }}
        </div>
    </section>

    @if ($candidato->filhos->isNotEmpty())
        <section>
            <h3 class="mb-2 border-b border-slate-100 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Filhos ({{ $candidato->filhos->count() }})
            </h3>
            <ul class="space-y-1 text-sm">
                @foreach ($candidato->filhos as $filho)
                    <li>{{ $filho->nome }} · {{ $filho->data_nascimento?->format('d/m/Y') ?? 'sem data' }}
                        @if ($filho->cpf) · {{ Documentos::mascararCpf($filho->cpf) }} @endif</li>
                @endforeach
            </ul>
        </section>
    @endif

    <section>
        <h3 class="mb-2 border-b border-slate-100 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">3. Cursos e referências</h3>
        <div class="grid gap-4 sm:grid-cols-2">
            <div>
                <p class="mb-1 text-[11px] font-medium text-slate-500">Cursos</p>
                <ul class="space-y-1 text-sm">
                    @forelse ($candidato->cursos as $curso)
                        <li>{{ $curso->nome }}@if ($curso->instituicao) · {{ $curso->instituicao }}@endif @if ($curso->ano) · {{ $curso->ano }}@endif</li>
                    @empty
                        <li class="text-slate-500">—</li>
                    @endforelse
                </ul>
            </div>
            <div>
                <p class="mb-1 text-[11px] font-medium text-slate-500">Referências</p>
                <ul class="space-y-1 text-sm">
                    @forelse ($candidato->referencias as $ref)
                        <li>{{ $ref->nome }} · {{ Documentos::mascararTelefone($ref->telefone) ?: 'sem telefone' }}@if ($ref->relacao) · {{ $ref->relacao }}@endif</li>
                    @empty
                        <li class="text-slate-500">—</li>
                    @endforelse
                </ul>
            </div>
        </div>
    </section>

    <section>
        <h3 class="mb-2 border-b border-slate-100 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">4. Empregos anteriores</h3>
        <div class="space-y-2">
            @foreach ([0, 1, 2] as $ordem)
                @php
                    $e = $candidato->empregosAnteriores->firstWhere('ordem', $ordem);
                    $titulo = ['Último', 'Penúltimo', 'Antepenúltimo'][$ordem];
                @endphp
                @if (! $e || $e->nao_possui)
                    <p class="text-sm text-slate-500"><span class="font-medium text-slate-700">{{ $titulo }}:</span> não possui</p>
                @else
                    <div class="rounded-md border border-slate-200 p-2.5">
                        <p class="text-sm font-medium">{{ $titulo }}: {{ $e->empresa }}</p>
                        <p class="text-xs text-slate-600">
                            {{ $e->cargo }} · {{ $e->setor }} ·
                            {{ $e->data_admissao?->format('d/m/Y') }} a {{ $e->data_saida?->format('d/m/Y') }} ·
                            {{ $e->ultimo_salario ? 'R$ ' . number_format((float) $e->ultimo_salario, 2, ',', '.') : 'salário não informado' }}
                        </p>
                        <p class="text-xs text-slate-600">
                            Contato: {{ $e->contato ?? '—' }} · {{ Documentos::mascararTelefone($e->telefone) ?: '—' }}
                        </p>
                        @if ($e->motivo_saida)
                            <p class="mt-1 text-xs text-slate-500">Saída: {{ $e->motivo_saida }}</p>
                        @endif
                    </div>
                @endif
            @endforeach
        </div>
    </section>

    <section>
        <h3 class="mb-2 border-b border-slate-100 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">5. Uniforme e 6. Questionário</h3>
        <div class="grid gap-x-4 gap-y-3 sm:grid-cols-3">
            {{ $item('Nº do sapato', $candidato->numero_sapato) }}
            {{ $item('Camisa/blusa', $candidato->tamanho_camisa) }}
            {{ $item('Nº da calça', $candidato->numero_calca) }}
            {{ $item('Aceita revezamento', $sim($candidato->aceita_escala_revezamento)) }}
            {{ $item('É fumante', $sim($candidato->fumante)) }}
            {{ $item('Deseja vale-transporte', $sim($candidato->deseja_vale_transporte)) }}
            {{ $item('Parente na empresa', $candidato->possui_parente_empresa ? ($candidato->parente_nome ?? 'Sim') : $sim($candidato->possui_parente_empresa)) }}
            {{ $item('Já trabalhou aqui', $candidato->ja_trabalhou_empresa ? 'Sim (' . $candidato->ja_trabalhou_ano . ')' : $sim($candidato->ja_trabalhou_empresa)) }}
            {{ $item('Linhas de ônibus', $candidato->linhas_onibus) }}
            {{ $item('Valor da passagem', $candidato->valor_passagem ? 'R$ ' . number_format((float) $candidato->valor_passagem, 2, ',', '.') : null) }}
            {{ $item('Chave PIX', $candidato->chave_pix) }}
        </div>
    </section>

    @if ($candidato->sobre_voce)
        <section>
            <h3 class="mb-2 border-b border-slate-100 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Sobre o candidato</h3>
            <p class="whitespace-pre-line text-sm leading-relaxed">{{ $candidato->sobre_voce }}</p>
        </section>
    @endif

    <section>
        <h3 class="mb-2 border-b border-slate-100 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">7. Declaração e assinatura</h3>
        <div class="grid gap-x-4 gap-y-3 sm:grid-cols-3">
            {{ $item('Termo de veracidade', $sim($candidato->aceite_veracidade)) }}
            {{ $item('Consentimento LGPD', $sim($candidato->aceite_lgpd)) }}
            {{ $item('Data e hora do aceite', $candidato->assinatura_data?->format('d/m/Y H:i')) }}
            {{ $item('Local', $candidato->assinatura_local) }}
            {{ $item('IP registrado', $candidato->consentimento_ip) }}
        </div>
        @if ($candidato->assinatura_base64)
            <div class="mt-3">
                <p class="mb-1 text-[11px] font-medium text-slate-500">Assinatura do candidato</p>
                <img src="{{ $candidato->assinatura_base64 }}" alt="Assinatura do candidato"
                     class="h-24 rounded-md border border-slate-200 bg-white">
            </div>
        @endif
    </section>
</div>
@endif
