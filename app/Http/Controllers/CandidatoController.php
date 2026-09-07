<?php

namespace App\Http\Controllers;

use App\Models\Candidato;
use App\Models\DocumentoCandidato;
use App\Models\Empresa;
use App\Models\Escala;
use App\Models\Funcao;
use App\Models\Posto;
use App\Models\Supervisor;
use App\Models\Usuario;
use App\Servicos\Auditoria;
use App\Servicos\ErroDeRegra;
use App\Servicos\Pipeline;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Illuminate\View\View;

class CandidatoController extends Controller
{
    public function criar(Request $requisicao): RedirectResponse
    {
        $dados = $requisicao->validate([
            'nome_completo' => ['required', 'string', 'min:3', 'max:255'],
            'celular_whatsapp' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'funcao_id' => ['nullable', 'exists:funcoes,id'],
            'observacoes_triagem' => ['nullable', 'string'],
        ], [], ['nome_completo' => 'nome completo']);

        $candidato = Pipeline::criarCandidato($dados);

        Auditoria::registrar('Candidato', $candidato->id, 'CRIACAO', [
            'nome_completo' => $candidato->nome_completo,
        ]);

        return redirect()
            ->route('candidatos.mostrar', $candidato)
            ->with('sucesso', 'Candidato cadastrado. Envie o link abaixo por WhatsApp.')
            ->with('mostrar_link', true);
    }

    public function mostrar(Candidato $candidato, Request $requisicao): View
    {
        $candidato->load([
            'funcao', 'filhos', 'cursos', 'referencias', 'empregosAnteriores',
            'documentos.arquivos', 'entrevistas.entrevistador', 'entrevistas.postoSugerido',
            'informacoesInternas.empresa', 'informacoesInternas.posto',
            'informacoesInternas.escala', 'informacoesInternas.supervisor',
            'movimentacoes.usuario',
        ]);

        return view('painel.candidato', [
            'candidato' => $candidato,
            'aba' => $requisicao->query('aba', 'ficha'),
            'pendencias' => $candidato->pendenciasAdmissao(),
            'empresas' => Empresa::where('ativo', true)->orderBy('nome')->get(),
            'postos' => Posto::where('ativo', true)->orderBy('nome')->get(),
            'escalas' => Escala::where('ativo', true)->orderBy('nome')->get(),
            'supervisores' => Supervisor::where('ativo', true)->orderBy('nome')->get(),
            'entrevistadores' => Usuario::where('ativo', true)
                ->whereIn('perfil', ['ADMIN', 'RECRUTADOR'])->orderBy('nome')->get(),
            'funcoes' => Funcao::where('ativo', true)->orderBy('nome')->get(),
        ]);
    }

    public function moverEtapa(Candidato $candidato, Request $requisicao): RedirectResponse
    {
        $usuario = $requisicao->user();
        abort_unless($usuario->podeRecrutar() || $usuario->podeOperarDp(), 403);

        $dados = $requisicao->validate([
            'para' => ['required', 'in:'.implode(',', array_keys(Candidato::ETAPAS))],
            'observacao' => ['nullable', 'string'],
            'justificativa_forcada' => ['nullable', 'string'],
            'data_admissao' => ['nullable', 'date'],
        ]);

        try {
            $numero = Pipeline::moverEtapa(
                $candidato,
                $dados['para'],
                $usuario,
                $dados['observacao'] ?? null,
                $dados['justificativa_forcada'] ?? null,
                isset($dados['data_admissao']) && $dados['data_admissao']
                    ? Carbon::parse($dados['data_admissao'])
                    : null,
            );
        } catch (ErroDeRegra $erro) {
            return back()->withErrors(['etapa' => $erro->getMessage()])->withInput();
        }

        return back()->with(
            'sucesso',
            $numero ? "Candidato admitido. Número gerado: {$numero}." : 'Etapa atualizada.'
        );
    }

    public function regerarLink(Candidato $candidato): RedirectResponse
    {
        $candidato->update([
            'token_publico' => Str::random(48),
            'token_expira_em' => now()->addDays((int) config('admissao.dias_validade_link', 30)),
        ]);

        Auditoria::registrar('Candidato', $candidato->id, 'REGERAR_LINK_PUBLICO');

        return back()->with('sucesso', 'Link novo gerado. O anterior deixou de funcionar.')
            ->with('mostrar_link', true);
    }

    public function conferirDocumento(DocumentoCandidato $documento, Request $requisicao): RedirectResponse
    {
        $usuario = $requisicao->user();
        abort_unless($usuario->podeOperarDp(), 403);

        $dados = $requisicao->validate([
            'status' => ['required', 'in:PENDENTE,ENVIADO,CONFERIDO,COM_PENDENCIA'],
            'observacao_dp' => ['nullable', 'string'],
        ]);

        $documento->update([
            'status' => $dados['status'],
            'observacao_dp' => $dados['observacao_dp'] ?? null,
            'conferido_em' => $dados['status'] === 'CONFERIDO' ? now() : null,
            'conferido_por' => $dados['status'] === 'CONFERIDO' ? $usuario->nome : null,
        ]);

        Auditoria::registrar('DocumentoCandidato', $documento->id, 'CONFERENCIA_DOCUMENTO', $dados);

        return back()->with('sucesso', 'Documento atualizado.');
    }

    public function adicionarItem(Candidato $candidato, Request $requisicao): RedirectResponse
    {
        abort_unless($requisicao->user()->podeOperarDp(), 403);

        $dados = $requisicao->validate([
            'nome' => ['required', 'string', 'max:255'],
        ], [], ['nome' => 'nome do documento']);

        $candidato->documentos()->create([
            'nome' => $dados['nome'],
            'ordem' => ((int) $candidato->documentos()->max('ordem')) + 1,
            'exigencia' => $requisicao->boolean('obrigatorio') ? 'OBRIGATORIO' : 'OPCIONAL',
            'regra' => 'NENHUMA',
            'extra' => true,
        ]);

        Auditoria::registrar('Candidato', $candidato->id, 'ITEM_CHECKLIST_ADICIONADO', $dados);

        return back()->with('sucesso', "\"{$dados['nome']}\" adicionado ao checklist.");
    }

    public function salvarInternas(Candidato $candidato, Request $requisicao): RedirectResponse
    {
        $usuario = $requisicao->user();
        abort_unless($usuario->podeOperarDp(), 403);

        $dados = $requisicao->validate([
            'empresa_id' => ['nullable', 'exists:empresas,id'],
            'posto_id' => ['nullable', 'exists:postos,id'],
            'escala_id' => ['nullable', 'exists:escalas,id'],
            'supervisor_id' => ['nullable', 'exists:supervisores,id'],
            'acumulo_funcao_qual' => ['nullable', 'string', 'max:255'],
            'base_salarial' => ['nullable', 'string'],
            'outros_beneficios' => ['nullable', 'string', 'max:255'],
            'data_inicio' => ['nullable', 'date'],
            'data_treinamento' => ['nullable', 'date'],
            'responsavel_aprovacao' => ['nullable', 'string', 'max:255'],
            'assinatura_responsavel' => ['nullable', 'string', 'max:255'],
        ]);

        $candidato->informacoesInternas()->updateOrCreate(
            ['candidato_id' => $candidato->id],
            array_merge($dados, [
                'acumulo_funcao' => $requisicao->boolean('acumulo_funcao'),
                'vale_transporte' => $requisicao->boolean('vale_transporte'),
                'premio_assiduidade' => $requisicao->boolean('premio_assiduidade'),
                'base_salarial' => FichaPublicaController::parseMoeda($dados['base_salarial'] ?? null),
                'responsavel_aprovacao' => $dados['responsavel_aprovacao'] ?? $usuario->nome,
            ])
        );

        Auditoria::registrar('InformacoesInternas', $candidato->id, 'ATUALIZACAO');

        return back()->with('sucesso', 'Informações internas salvas.');
    }
}
