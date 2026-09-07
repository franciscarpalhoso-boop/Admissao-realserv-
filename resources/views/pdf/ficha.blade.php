@php
    use App\Models\Candidato;
    use App\Suporte\Documentos;
    $sim = fn ($v) => $v === null ? '—' : ($v ? 'Sim' : 'Não');
    $ou = fn ($v) => ($v === null || $v === '') ? '—' : $v;
    $i = $candidato->informacoesInternas;
@endphp
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 22mm 14mm 18mm 14mm; }
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 8.5pt; color: #14181f; margin: 0; }
        .cabecalho { border-bottom: 1.5pt solid #1f47d6; padding-bottom: 6pt; margin-bottom: 10pt; }
        .logo { display: inline-block; background: #1f47d6; color: #fff; font-weight: bold;
                font-size: 13pt; padding: 6pt 9pt; }
        .marca { display: inline-block; margin-left: 8pt; vertical-align: top; }
        .marca h1 { font-size: 13pt; margin: 0; }
        .marca p { font-size: 7pt; color: #6b7280; margin: 1pt 0 0 0; }
        .adm { float: right; color: #1f47d6; font-size: 11pt; font-weight: bold; }
        h2.titulo { font-size: 9pt; margin: 0; padding: 3pt 5pt; }
        .secao { background: #f2f4f8; color: #1f47d6; text-transform: uppercase;
                 letter-spacing: 0.4pt; margin-top: 9pt; }
        table { width: 100%; border-collapse: collapse; }
        td.campo { padding: 3pt 4pt 5pt 0; vertical-align: top; border-bottom: 0.4pt solid #e2e5ea; }
        .rotulo { font-size: 6.5pt; color: #7a808c; display: block; }
        .valor { font-size: 8.5pt; color: #14181f; }
        table.dados th { background: #f2f4f8; font-size: 7pt; color: #7a808c; text-align: left;
                         padding: 3pt 4pt; }
        table.dados td { font-size: 8pt; padding: 3pt 4pt; border-bottom: 0.4pt solid #e2e5ea; }
        .aviso { border: 0.6pt solid #d97706; background: #fffbeb; color: #92400e;
                 padding: 5pt; font-size: 7.5pt; margin-top: 6pt; }
        .declaracao { font-size: 8pt; line-height: 1.45; margin-top: 4pt; }
        .assinatura { margin-top: 14pt; }
        .assinatura img { height: 55pt; }
        .linha-assinatura { border-top: 0.8pt solid #b8bdc7; width: 240pt; margin-top: 3pt; padding-top: 3pt;
                            font-size: 7.5pt; color: #7a808c; }
        .rodape { position: fixed; bottom: -12mm; left: 0; right: 0; font-size: 7pt; color: #7a808c; }
    </style>
</head>
<body>
    <div class="rodape">Grupo Real Serv — Ficha de Solicitação de Emprego</div>

    <div class="cabecalho">
        @if ($i?->numero_admissao)<span class="adm">{{ $i->numero_admissao }}</span>@endif
        <span class="logo">RS</span>
        <span class="marca">
            <h1>GRUPO REAL SERV</h1>
            <p>Serviços de condomínios e facilities — Santos/SP</p>
        </span>
        <div style="clear: both"></div>
        <h1 style="font-size: 11pt; margin: 8pt 0 0 0;">FICHA DE SOLICITAÇÃO DE EMPREGO</h1>
    </div>

    <h2 class="titulo secao">1. Dados pessoais</h2>
    <table>
        <tr>
            <td class="campo" colspan="2"><span class="rotulo">Nome completo</span><span class="valor">{{ $ou($candidato->nome_completo) }}</span></td>
            <td class="campo"><span class="rotulo">Data de nascimento</span><span class="valor">{{ $ou($candidato->data_nascimento?->format('d/m/Y')) }}</span></td>
        </tr>
        <tr>
            <td class="campo"><span class="rotulo">Telefone de contato</span><span class="valor">{{ $ou(Documentos::mascararTelefone($candidato->telefone_contato)) }}</span></td>
            <td class="campo"><span class="rotulo">Telefone para recado</span><span class="valor">{{ $ou(Documentos::mascararTelefone($candidato->telefone_recado)) }}</span></td>
            <td class="campo"><span class="rotulo">Celular (WhatsApp)</span><span class="valor">{{ $ou(Documentos::mascararTelefone($candidato->celular_whatsapp)) }}</span></td>
        </tr>
        <tr>
            <td class="campo" colspan="2"><span class="rotulo">E-mail</span><span class="valor">{{ $ou($candidato->email) }}</span></td>
            <td class="campo"><span class="rotulo">Vaga pretendida</span><span class="valor">{{ $ou($candidato->funcao?->nome) }}</span></td>
        </tr>
        <tr>
            <td class="campo"><span class="rotulo">Tempo de experiência</span><span class="valor">{{ $ou($candidato->tempo_experiencia) }}</span></td>
            <td class="campo"><span class="rotulo">Naturalidade</span><span class="valor">{{ $ou(trim($candidato->naturalidade . '/' . $candidato->uf_naturalidade, '/')) }}</span></td>
            <td class="campo"><span class="rotulo">Sexo</span><span class="valor">{{ Candidato::SEXOS[$candidato->sexo] ?? '—' }}</span></td>
        </tr>
        <tr>
            <td class="campo"><span class="rotulo">Estado civil</span><span class="valor">{{ Candidato::ESTADOS_CIVIS[$candidato->estado_civil] ?? '—' }}</span></td>
            <td class="campo" colspan="2"><span class="rotulo">Nome do cônjuge</span><span class="valor">{{ $ou($candidato->nome_conjuge) }}</span></td>
        </tr>
        <tr>
            <td class="campo"><span class="rotulo">Escolaridade</span><span class="valor">{{ Candidato::ESCOLARIDADES[$candidato->escolaridade] ?? '—' }}</span></td>
            <td class="campo"><span class="rotulo">Nome da mãe</span><span class="valor">{{ $ou($candidato->nome_mae) }}</span></td>
            <td class="campo"><span class="rotulo">Nome do pai</span><span class="valor">{{ $ou($candidato->nome_pai) }}</span></td>
        </tr>
    </table>

    <h2 class="titulo secao">Endereço</h2>
    <table>
        <tr>
            <td class="campo" colspan="2"><span class="rotulo">Logradouro</span><span class="valor">{{ $ou($candidato->logradouro) }}</span></td>
            <td class="campo"><span class="rotulo">Número</span><span class="valor">{{ $ou($candidato->numero) }}</span></td>
        </tr>
        <tr>
            <td class="campo"><span class="rotulo">Complemento</span><span class="valor">{{ $ou($candidato->complemento) }}</span></td>
            <td class="campo"><span class="rotulo">Bairro</span><span class="valor">{{ $ou($candidato->bairro) }}</span></td>
            <td class="campo"><span class="rotulo">CEP</span><span class="valor">{{ $ou(Documentos::mascararCep($candidato->cep)) }}</span></td>
        </tr>
        <tr>
            <td class="campo" colspan="2"><span class="rotulo">Cidade/UF</span><span class="valor">{{ $ou(trim($candidato->cidade . '/' . $candidato->uf, '/')) }}</span></td>
            <td class="campo"><span class="rotulo">Tempo de residência</span><span class="valor">{{ $ou($candidato->tempo_residencia) }}</span></td>
        </tr>
    </table>

    <h2 class="titulo secao">2. Documentação</h2>
    <table>
        <tr>
            <td class="campo"><span class="rotulo">CPF</span><span class="valor">{{ $ou(Documentos::mascararCpf($candidato->cpf)) }}</span></td>
            <td class="campo"><span class="rotulo">PIS/NIT</span><span class="valor">{{ $ou(Documentos::mascararPis($candidato->pis_nit)) }}</span></td>
            <td class="campo"><span class="rotulo">Tipo sanguíneo</span><span class="valor">{{ $ou($candidato->tipo_sanguineo) }}</span></td>
        </tr>
        <tr>
            <td class="campo"><span class="rotulo">RG</span><span class="valor">{{ $ou($candidato->rg_numero) }}</span></td>
            <td class="campo"><span class="rotulo">Data de emissão</span><span class="valor">{{ $ou($candidato->rg_data_emissao?->format('d/m/Y')) }}</span></td>
            <td class="campo"><span class="rotulo">Órgão expedidor/UF</span><span class="valor">{{ $ou(trim($candidato->rg_orgao_expedidor . '/' . $candidato->rg_uf, '/')) }}</span></td>
        </tr>
        <tr>
            <td class="campo"><span class="rotulo">CNH</span><span class="valor">{{ $ou($candidato->cnh_numero) }}</span></td>
            <td class="campo"><span class="rotulo">Categoria</span><span class="valor">{{ $ou($candidato->cnh_categoria) }}</span></td>
            <td class="campo"><span class="rotulo">Validade</span><span class="valor">{{ $ou($candidato->cnh_validade?->format('d/m/Y')) }}</span></td>
        </tr>
        <tr>
            <td class="campo" colspan="2"><span class="rotulo">CTPS</span><span class="valor">
                {{ $candidato->ctps_digital ? 'CTPS digital' : $ou(trim($candidato->ctps_numero . ' / ' . $candidato->ctps_serie, ' /')) }}</span></td>
            <td class="campo"><span class="rotulo">Reservista</span><span class="valor">{{ $ou($candidato->reservista_numero) }}</span></td>
        </tr>
        <tr>
            <td class="campo"><span class="rotulo">Título de eleitor</span><span class="valor">{{ $ou($candidato->titulo_eleitor_numero) }}</span></td>
            <td class="campo"><span class="rotulo">Zona</span><span class="valor">{{ $ou($candidato->titulo_eleitor_zona) }}</span></td>
            <td class="campo"><span class="rotulo">Seção</span><span class="valor">{{ $ou($candidato->titulo_eleitor_secao) }}</span></td>
        </tr>
    </table>

    @if ($candidato->filhos->isNotEmpty())
        <h2 class="titulo secao">Filhos</h2>
        <table class="dados">
            <tr><th>Nome</th><th>Data de nascimento</th><th>CPF</th></tr>
            @foreach ($candidato->filhos as $filho)
                <tr>
                    <td>{{ $filho->nome }}</td>
                    <td>{{ $ou($filho->data_nascimento?->format('d/m/Y')) }}</td>
                    <td>{{ $ou(Documentos::mascararCpf($filho->cpf)) }}</td>
                </tr>
            @endforeach
        </table>
    @endif

    <h2 class="titulo secao">3. Treinamentos, cursos e referências</h2>
    <table class="dados">
        <tr><th>Curso</th><th>Instituição</th><th>Ano</th></tr>
        @forelse ($candidato->cursos as $curso)
            <tr><td>{{ $curso->nome }}</td><td>{{ $ou($curso->instituicao) }}</td><td>{{ $ou($curso->ano) }}</td></tr>
        @empty
            <tr><td colspan="3">Não informado.</td></tr>
        @endforelse
    </table>
    <table class="dados" style="margin-top: 4pt">
        <tr><th>Referência</th><th>Telefone</th><th>Relação</th><th>Cidade</th></tr>
        @forelse ($candidato->referencias as $ref)
            <tr>
                <td>{{ $ref->nome }}</td><td>{{ $ou(Documentos::mascararTelefone($ref->telefone)) }}</td>
                <td>{{ $ou($ref->relacao) }}</td><td>{{ $ou($ref->cidade) }}</td>
            </tr>
        @empty
            <tr><td colspan="4">Não informado.</td></tr>
        @endforelse
    </table>

    <h2 class="titulo secao">4. Empregos anteriores</h2>
    <table class="dados">
        <tr><th>Ordem</th><th>Empresa</th><th>Cargo</th><th>Período</th><th>Salário</th><th>Motivo da saída</th></tr>
        @foreach ([0, 1, 2] as $ordem)
            @php $e = $candidato->empregosAnteriores->firstWhere('ordem', $ordem);
                 $titulo = ['Último', 'Penúltimo', 'Antepenúltimo'][$ordem]; @endphp
            <tr>
                <td>{{ $titulo }}</td>
                @if (! $e || $e->nao_possui)
                    <td colspan="5">Não possui.</td>
                @else
                    <td>{{ $ou($e->empresa) }}</td>
                    <td>{{ $ou($e->cargo) }}</td>
                    <td>{{ $e->data_admissao?->format('m/Y') }} a {{ $e->data_saida?->format('m/Y') }}</td>
                    <td>{{ $e->ultimo_salario ? 'R$ ' . number_format((float) $e->ultimo_salario, 2, ',', '.') : '—' }}</td>
                    <td>{{ $ou($e->motivo_saida) }}</td>
                @endif
            </tr>
        @endforeach
    </table>

    <h2 class="titulo secao">5. Uniforme &nbsp;·&nbsp; 6. Questionário</h2>
    <table>
        <tr>
            <td class="campo"><span class="rotulo">Nº do sapato</span><span class="valor">{{ $ou($candidato->numero_sapato) }}</span></td>
            <td class="campo"><span class="rotulo">Camisa/blusa</span><span class="valor">{{ $ou($candidato->tamanho_camisa) }}</span></td>
            <td class="campo"><span class="rotulo">Nº da calça</span><span class="valor">{{ $ou($candidato->numero_calca) }}</span></td>
        </tr>
        <tr>
            <td class="campo" colspan="2"><span class="rotulo">Aceita escala de revezamento, domingos e feriados</span><span class="valor">{{ $sim($candidato->aceita_escala_revezamento) }}</span></td>
            <td class="campo"><span class="rotulo">É fumante</span><span class="valor">{{ $sim($candidato->fumante) }}</span></td>
        </tr>
        <tr>
            <td class="campo"><span class="rotulo">Tem parente na empresa</span><span class="valor">{{ $sim($candidato->possui_parente_empresa) }} {{ $candidato->parente_nome }}</span></td>
            <td class="campo"><span class="rotulo">Já trabalhou nesta empresa</span><span class="valor">{{ $sim($candidato->ja_trabalhou_empresa) }} {{ $candidato->ja_trabalhou_ano }}</span></td>
            <td class="campo"><span class="rotulo">Deseja vale-transporte</span><span class="valor">{{ $sim($candidato->deseja_vale_transporte) }}</span></td>
        </tr>
        <tr>
            <td class="campo" colspan="2"><span class="rotulo">Linhas de ônibus</span><span class="valor">{{ $ou($candidato->linhas_onibus) }}</span></td>
            <td class="campo"><span class="rotulo">Valor da passagem</span><span class="valor">
                {{ $candidato->valor_passagem ? 'R$ ' . number_format((float) $candidato->valor_passagem, 2, ',', '.') : '—' }}</span></td>
        </tr>
        <tr>
            <td class="campo" colspan="3"><span class="rotulo">Chave PIX</span><span class="valor">{{ $ou($candidato->chave_pix) }}</span></td>
        </tr>
    </table>

    @if ($candidato->sobre_voce)
        <p style="margin-top: 6pt"><span class="rotulo">Sobre você</span>
            <span class="valor">{{ $candidato->sobre_voce }}</span></p>
    @endif

    @if ($i)
        <h2 class="titulo secao">Informações internas (uso do Departamento Pessoal)</h2>
        <table>
            <tr>
                <td class="campo"><span class="rotulo">Número da admissão</span><span class="valor">{{ $ou($i->numero_admissao) }}</span></td>
                <td class="campo" colspan="2"><span class="rotulo">Empresa contratante</span><span class="valor">{{ $ou($i->empresa?->nome) }}</span></td>
            </tr>
            <tr>
                <td class="campo" colspan="2"><span class="rotulo">Posto</span><span class="valor">{{ $ou($i->posto?->nome) }}</span></td>
                <td class="campo"><span class="rotulo">Escala</span><span class="valor">{{ $ou($i->escala?->nome) }}</span></td>
            </tr>
            <tr>
                <td class="campo"><span class="rotulo">Supervisor</span><span class="valor">{{ $ou($i->supervisor?->nome) }}</span></td>
                <td class="campo"><span class="rotulo">Base salarial</span><span class="valor">
                    {{ $i->base_salarial ? 'R$ ' . number_format((float) $i->base_salarial, 2, ',', '.') : '—' }}</span></td>
                <td class="campo"><span class="rotulo">Acúmulo de função</span><span class="valor">
                    {{ $i->acumulo_funcao ? ($i->acumulo_funcao_qual ?: 'Sim') : 'Não' }}</span></td>
            </tr>
            <tr>
                <td class="campo"><span class="rotulo">Data de início</span><span class="valor">{{ $ou($i->data_inicio?->format('d/m/Y')) }}</span></td>
                <td class="campo"><span class="rotulo">Treinamento/integração</span><span class="valor">{{ $ou($i->data_treinamento?->format('d/m/Y')) }}</span></td>
                <td class="campo"><span class="rotulo">Responsável pela aprovação</span><span class="valor">{{ $ou($i->responsavel_aprovacao) }}</span></td>
            </tr>
        </table>
        @if ($i->justificativa_forcada)
            <div class="aviso">Justificativa de admissão com pendências: {{ $i->justificativa_forcada }}</div>
        @endif
    @endif

    <h2 class="titulo secao">7. Declaração e assinatura</h2>
    <p class="declaracao">
        Declaro que as informações prestadas nesta ficha são verdadeiras e completas, e autorizo o
        tratamento dos meus dados pessoais pelo Grupo Real Serv para as finalidades de recrutamento,
        seleção e admissão, nos termos da Lei nº 13.709/2018 (LGPD).
    </p>
    <table style="margin-top: 4pt">
        <tr>
            <td class="campo"><span class="rotulo">Aceite do termo de veracidade</span><span class="valor">{{ $sim($candidato->aceite_veracidade) }}</span></td>
            <td class="campo"><span class="rotulo">Aceite do termo LGPD</span><span class="valor">{{ $sim($candidato->aceite_lgpd) }}</span></td>
            <td class="campo"><span class="rotulo">Data e hora do aceite</span><span class="valor">{{ $ou($candidato->assinatura_data?->format('d/m/Y H:i')) }}</span></td>
        </tr>
        <tr>
            <td class="campo"><span class="rotulo">Local</span><span class="valor">{{ $ou($candidato->assinatura_local) }}</span></td>
            <td class="campo" colspan="2"><span class="rotulo">Endereço IP registrado</span><span class="valor">{{ $ou($candidato->consentimento_ip) }}</span></td>
        </tr>
    </table>

    <div class="assinatura">
        @if ($candidato->assinatura_base64)
            <img src="{{ $candidato->assinatura_base64 }}" alt="Assinatura">
        @endif
        <div class="linha-assinatura">Assinatura do candidato — {{ $candidato->nome_completo }}</div>
    </div>
</body>
</html>
