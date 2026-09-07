<?php

namespace App\Http\Controllers;

use App\Models\Candidato;
use App\Models\Configuracao;
use App\Models\DocumentoCandidato;
use App\Models\Funcao;
use App\Servicos\ArmazenamentoDocumentos;
use App\Servicos\Auditoria;
use App\Servicos\Pipeline;
use App\Suporte\Documentos;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Illuminate\View\View;

/**
 * Formulário público do candidato: acesso só pelo token do link enviado por
 * WhatsApp, sem cadastro e sem sessão autenticada.
 */
class FichaPublicaController extends Controller
{
    private function candidatoPorToken(string $token): Candidato
    {
        $candidato = Candidato::query()
            ->where('token_publico', $token)
            ->with(['funcao', 'filhos', 'cursos', 'referencias', 'empregosAnteriores', 'documentos.arquivos'])
            ->first();

        abort_if($candidato === null || ! $candidato->tokenValido(), 404);

        return $candidato;
    }

    public function mostrar(string $token, Request $requisicao): View
    {
        $candidato = $this->candidatoPorToken($token);

        $etapa = (int) $requisicao->query('etapa', $candidato->status_ficha === 'ENVIADA' ? 8 : 1);
        $etapa = max(1, min(8, $etapa));
        if ($candidato->status_ficha === 'ENVIADA') {
            $etapa = 8;
        }

        return view('ficha.wizard', [
            'candidato' => $candidato,
            'token' => $token,
            'etapa' => $etapa,
            'funcoes' => Funcao::where('ativo', true)->orderBy('nome')->get(),
            'termoVeracidade' => Configuracao::valor('TERMO_VERACIDADE'),
            'termoLgpd' => Configuracao::valor('TERMO_LGPD'),
            'localAssinatura' => Configuracao::valor('LOCAL_ASSINATURA', 'Santos/SP'),
        ]);
    }

    public function salvarEtapa(string $token, int $etapa, Request $requisicao): RedirectResponse
    {
        $candidato = $this->candidatoPorToken($token);

        if ($candidato->status_ficha === 'ENVIADA') {
            return back()->withErrors(['ficha' => 'Sua ficha já foi enviada e não pode mais ser alterada.']);
        }

        match ($etapa) {
            1 => $this->salvarDadosPessoais($candidato, $requisicao),
            2 => $this->salvarDocumentacao($candidato, $requisicao),
            3 => $this->salvarCursos($candidato, $requisicao),
            4 => $this->salvarEmpregos($candidato, $requisicao),
            5 => $this->salvarUniforme($candidato, $requisicao),
            6 => $this->salvarQuestionario($candidato, $requisicao),
            default => abort(404),
        };

        $candidato->update(['status_ficha' => 'EM_PREENCHIMENTO']);

        return redirect()
            ->route('ficha.mostrar', ['token' => $token, 'etapa' => min(8, $etapa + 1)])
            ->with('sucesso', 'Respostas salvas.');
    }

    // ------------------------------------------------------------------
    // Etapas
    // ------------------------------------------------------------------

    private function salvarDadosPessoais(Candidato $candidato, Request $r): void
    {
        $dados = $r->validate([
            'nome_completo' => ['required', 'string', 'min:3', 'max:255'],
            'celular_whatsapp' => ['required', 'string', 'max:20'],
            'telefone_contato' => ['nullable', 'string', 'max:20'],
            'telefone_recado' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'funcao_id' => ['required', 'exists:funcoes,id'],
            'tempo_experiencia' => ['nullable', 'string', 'max:255'],
            'naturalidade' => ['nullable', 'string', 'max:255'],
            'uf_naturalidade' => ['nullable', 'string', 'size:2'],
            'data_nascimento' => ['required', 'date', 'before:today'],
            'sexo' => ['required', 'in:MASCULINO,FEMININO,NAO_INFORMADO'],
            'estado_civil' => ['nullable', 'in:'.implode(',', array_keys(Candidato::ESTADOS_CIVIS))],
            'nome_conjuge' => ['nullable', 'string', 'max:255'],
            'logradouro' => ['nullable', 'string', 'max:255'],
            'numero' => ['nullable', 'string', 'max:20'],
            'complemento' => ['nullable', 'string', 'max:255'],
            'bairro' => ['nullable', 'string', 'max:255'],
            'cidade' => ['nullable', 'string', 'max:255'],
            'uf' => ['nullable', 'string', 'size:2'],
            'cep' => ['nullable', 'string', 'max:12'],
            'tempo_residencia' => ['nullable', 'string', 'max:255'],
            'escolaridade' => ['nullable', 'in:'.implode(',', array_keys(Candidato::ESCOLARIDADES))],
            'nome_mae' => ['required', 'string', 'max:255'],
            'nome_pai' => ['nullable', 'string', 'max:255'],
        ], [], ['nome_completo' => 'nome completo', 'nome_mae' => 'nome da mãe']);

        $dados['cep'] = Documentos::somenteDigitos($dados['cep'] ?? null) ?: null;

        $candidato->update($dados);
    }

    private function salvarDocumentacao(Candidato $candidato, Request $r): void
    {
        $r->validate([
            'cpf' => ['required', 'string'],
            'pis_nit' => ['nullable', 'string'],
            'rg_numero' => ['nullable', 'string', 'max:30'],
            'rg_data_emissao' => ['nullable', 'date'],
            'filho_nome' => ['array'],
            'filho_nome.*' => ['nullable', 'string', 'max:255'],
        ]);

        $cpf = Documentos::somenteDigitos($r->input('cpf'));
        if (! Documentos::validarCpf($cpf)) {
            throw ValidationException::withMessages(['cpf' => 'CPF inválido. Confira os números digitados.']);
        }

        $duplicado = Candidato::query()
            ->where('cpf', $cpf)
            ->where('id', '!=', $candidato->id)
            ->whereNull('anonimizado_em')
            ->exists();
        if ($duplicado) {
            throw ValidationException::withMessages([
                'cpf' => 'Já existe um cadastro com este CPF. Entre em contato com o RH.',
            ]);
        }

        $pis = Documentos::somenteDigitos($r->input('pis_nit'));
        if ($pis !== '' && ! Documentos::validarPis($pis)) {
            throw ValidationException::withMessages(['pis_nit' => 'PIS/NIT inválido. Confira os números.']);
        }

        $rg = $r->input('rg_numero');

        $candidato->update([
            'cpf' => $cpf,
            'cpf_cifrado' => Crypt::encryptString($cpf),
            'pis_nit' => $pis ?: null,
            'rg_numero' => $rg,
            'rg_numero_cifrado' => $rg ? Crypt::encryptString($rg) : null,
            'rg_data_emissao' => $r->input('rg_data_emissao') ?: null,
            'rg_orgao_expedidor' => $r->input('rg_orgao_expedidor'),
            'rg_uf' => $r->input('rg_uf'),
            'cnh_numero' => $r->input('cnh_numero'),
            'cnh_registro' => $r->input('cnh_registro'),
            'cnh_uf' => $r->input('cnh_uf'),
            'cnh_data_emissao' => $r->input('cnh_data_emissao') ?: null,
            'cnh_validade' => $r->input('cnh_validade') ?: null,
            'cnh_categoria' => $r->input('cnh_categoria'),
            'cnh_primeira_habilitacao' => $r->input('cnh_primeira_habilitacao') ?: null,
            'ctps_numero' => $r->input('ctps_numero'),
            'ctps_serie' => $r->input('ctps_serie'),
            'ctps_uf' => $r->input('ctps_uf'),
            'ctps_digital' => $r->boolean('ctps_digital'),
            'titulo_eleitor_numero' => $r->input('titulo_eleitor_numero'),
            'titulo_eleitor_zona' => $r->input('titulo_eleitor_zona'),
            'titulo_eleitor_secao' => $r->input('titulo_eleitor_secao'),
            'reservista_numero' => $r->input('reservista_numero'),
            'tipo_sanguineo' => $r->input('tipo_sanguineo'),
        ]);

        // Filhos: substitui a lista inteira pelo que veio do formulário.
        $nomes = (array) $r->input('filho_nome', []);
        $nascimentos = (array) $r->input('filho_nascimento', []);
        $cpfs = (array) $r->input('filho_cpf', []);

        DB::transaction(function () use ($candidato, $nomes, $nascimentos, $cpfs) {
            $candidato->filhos()->delete();
            foreach ($nomes as $i => $nome) {
                $nome = trim((string) $nome);
                if ($nome === '') {
                    continue;
                }
                $cpfFilho = Documentos::somenteDigitos($cpfs[$i] ?? null);
                if ($cpfFilho !== '' && ! Documentos::validarCpf($cpfFilho)) {
                    throw ValidationException::withMessages([
                        'filho_cpf' => "CPF inválido para o filho \"{$nome}\".",
                    ]);
                }
                $candidato->filhos()->create([
                    'nome' => $nome,
                    'data_nascimento' => ($nascimentos[$i] ?? '') ?: null,
                    'cpf' => $cpfFilho ?: null,
                    'ordem' => $i,
                ]);
            }
        });
    }

    private function salvarCursos(Candidato $candidato, Request $r): void
    {
        DB::transaction(function () use ($candidato, $r) {
            $candidato->cursos()->delete();
            foreach ((array) $r->input('curso_nome', []) as $i => $nome) {
                if (trim((string) $nome) === '') {
                    continue;
                }
                $candidato->cursos()->create([
                    'nome' => trim((string) $nome),
                    'instituicao' => $r->input("curso_instituicao.{$i}"),
                    'ano' => $r->input("curso_ano.{$i}"),
                    'ordem' => $i,
                ]);
            }

            $candidato->referencias()->delete();
            foreach ((array) $r->input('referencia_nome', []) as $i => $nome) {
                if (trim((string) $nome) === '') {
                    continue;
                }
                $candidato->referencias()->create([
                    'nome' => trim((string) $nome),
                    'telefone' => $r->input("referencia_telefone.{$i}"),
                    'relacao' => $r->input("referencia_relacao.{$i}"),
                    'cidade' => $r->input("referencia_cidade.{$i}"),
                    'ordem' => $i,
                ]);
            }
        });
    }

    private function salvarEmpregos(Candidato $candidato, Request $r): void
    {
        for ($i = 0; $i < 3; $i++) {
            $naoPossui = $r->boolean("emprego.{$i}.nao_possui");
            $empresa = trim((string) $r->input("emprego.{$i}.empresa"));
            if (! $naoPossui && $empresa === '') {
                throw ValidationException::withMessages([
                    "emprego.{$i}.empresa" => 'Informe a empresa ou marque "não possui".',
                ]);
            }
        }

        DB::transaction(function () use ($candidato, $r) {
            $candidato->empregosAnteriores()->delete();
            for ($i = 0; $i < 3; $i++) {
                $candidato->empregosAnteriores()->create([
                    'ordem' => $i,
                    'nao_possui' => $r->boolean("emprego.{$i}.nao_possui"),
                    'empresa' => $r->input("emprego.{$i}.empresa"),
                    'telefone' => $r->input("emprego.{$i}.telefone"),
                    'contato' => $r->input("emprego.{$i}.contato"),
                    'setor' => $r->input("emprego.{$i}.setor"),
                    'cargo' => $r->input("emprego.{$i}.cargo"),
                    'data_admissao' => $r->input("emprego.{$i}.data_admissao") ?: null,
                    'data_saida' => $r->input("emprego.{$i}.data_saida") ?: null,
                    'ultimo_salario' => self::parseMoeda($r->input("emprego.{$i}.ultimo_salario")),
                    'motivo_saida' => $r->input("emprego.{$i}.motivo_saida"),
                ]);
            }
        });
    }

    private function salvarUniforme(Candidato $candidato, Request $r): void
    {
        $candidato->update($r->validate([
            'numero_sapato' => ['nullable', 'string', 'max:5'],
            'tamanho_camisa' => ['nullable', 'string', 'max:5'],
            'numero_calca' => ['nullable', 'string', 'max:5'],
        ]));
    }

    private function salvarQuestionario(Candidato $candidato, Request $r): void
    {
        $r->validate(['sobre_voce' => ['nullable', 'string', 'max:600']]);

        $simNao = fn (string $campo) => match ($r->input($campo)) {
            'sim' => true,
            'nao' => false,
            default => null,
        };

        $candidato->update([
            'aceita_escala_revezamento' => $simNao('aceita_escala_revezamento'),
            'possui_parente_empresa' => $simNao('possui_parente_empresa'),
            'parente_nome' => $r->input('parente_nome'),
            'parente_setor' => $r->input('parente_setor'),
            'ja_trabalhou_empresa' => $simNao('ja_trabalhou_empresa'),
            'ja_trabalhou_ano' => $r->input('ja_trabalhou_ano'),
            'fumante' => $simNao('fumante'),
            'deseja_vale_transporte' => $simNao('deseja_vale_transporte'),
            'linhas_onibus' => $r->input('linhas_onibus'),
            'valor_passagem' => self::parseMoeda($r->input('valor_passagem')),
            'chave_pix' => $r->input('chave_pix'),
            'sobre_voce' => $r->input('sobre_voce'),
        ]);
    }

    // ------------------------------------------------------------------
    // Etapa 7 — declaração, assinatura e envio
    // ------------------------------------------------------------------

    public function enviar(string $token, Request $requisicao): RedirectResponse
    {
        $candidato = $this->candidatoPorToken($token);

        if ($candidato->status_ficha === 'ENVIADA') {
            return back()->withErrors(['ficha' => 'Sua ficha já foi enviada.']);
        }

        $requisicao->validate([
            'aceite_veracidade' => ['accepted'],
            'aceite_lgpd' => ['accepted'],
            'assinatura_base64' => ['required', 'string'],
        ], [
            'aceite_veracidade.accepted' => 'É necessário aceitar o termo de veracidade.',
            'aceite_lgpd.accepted' => 'É necessário aceitar o termo de consentimento (LGPD).',
            'assinatura_base64.required' => 'Assine no quadro antes de enviar.',
        ]);

        $assinatura = (string) $requisicao->input('assinatura_base64');
        if (! str_starts_with($assinatura, 'data:image/png;base64,') || strlen($assinatura) < 200) {
            throw ValidationException::withMessages(['assinatura_base64' => 'Assine no quadro antes de enviar.']);
        }

        if (! $candidato->cpf) {
            throw ValidationException::withMessages([
                'assinatura_base64' => 'Volte à etapa 2 e informe o seu CPF antes de enviar a ficha.',
            ]);
        }

        $candidato->update([
            'aceite_veracidade' => true,
            'aceite_lgpd' => true,
            'assinatura_base64' => $assinatura,
            'assinatura_local' => Configuracao::valor('LOCAL_ASSINATURA', 'Santos/SP'),
            'assinatura_data' => now(),
            'consentimento_ip' => $requisicao->ip(),
            'consentimento_user_agent' => substr((string) $requisicao->userAgent(), 0, 500),
            'status_ficha' => 'ENVIADA',
        ]);

        Auditoria::registrar(
            'Candidato', $candidato->id, 'FICHA_ENVIADA',
            ['aceite_veracidade' => true, 'aceite_lgpd' => true],
            "Candidato {$candidato->nome_completo}"
        );

        return redirect()
            ->route('ficha.mostrar', ['token' => $token, 'etapa' => 8])
            ->with('sucesso', 'Ficha enviada com sucesso!');
    }

    // ------------------------------------------------------------------
    // Etapa 8 — envio de documentos
    // ------------------------------------------------------------------

    public function enviarDocumento(string $token, int $documentoId, Request $requisicao): RedirectResponse
    {
        $candidato = $this->candidatoPorToken($token);

        $documento = DocumentoCandidato::query()
            ->where('candidato_id', $candidato->id)
            ->findOrFail($documentoId);

        if ($documento->status === 'CONFERIDO') {
            return back()->withErrors([
                'arquivo' => 'Este documento já foi conferido pelo RH e não pode ser substituído.',
            ]);
        }

        $arquivos = array_filter((array) $requisicao->file('arquivo', []));
        if ($arquivos === []) {
            return back()->withErrors(['arquivo' => 'Selecione pelo menos um arquivo.']);
        }

        foreach ($arquivos as $arquivo) {
            if ($problema = ArmazenamentoDocumentos::validar($arquivo)) {
                return back()->withErrors(['arquivo' => $arquivo->getClientOriginalName().': '.$problema]);
            }
        }

        foreach ($arquivos as $arquivo) {
            $caminho = ArmazenamentoDocumentos::guardar($arquivo, $candidato->id);
            $documento->arquivos()->create([
                'caminho' => $caminho,
                'nome_original' => $arquivo->getClientOriginalName(),
                'mime_type' => $arquivo->getMimeType(),
                'tamanho' => $arquivo->getSize(),
                'enviado_por' => 'candidato',
            ]);
        }

        $documento->update(['status' => 'ENVIADO', 'observacao_dp' => null]);
        Pipeline::sincronizarStatusDocumento($documento->fresh());

        Auditoria::registrar(
            'DocumentoCandidato', $documento->id, 'UPLOAD_CANDIDATO',
            ['quantidade' => count($arquivos), 'item' => $documento->nome],
            "Candidato {$candidato->nome_completo}"
        );

        return redirect()
            ->route('ficha.mostrar', ['token' => $token, 'etapa' => 8])
            ->with('sucesso', count($arquivos).' arquivo(s) enviado(s) para "'.$documento->nome.'".');
    }

    /** Aceita "1.234,56" e "1234.56". */
    public static function parseMoeda(?string $valor): ?float
    {
        if ($valor === null || trim($valor) === '') {
            return null;
        }
        $limpo = preg_replace('/[^\d,.-]/', '', $valor) ?? '';
        if ($limpo === '') {
            return null;
        }
        if (str_contains($limpo, ',')) {
            $limpo = str_replace(['.', ','], ['', '.'], $limpo);
        }

        return is_numeric($limpo) ? (float) $limpo : null;
    }
}
