<?php

namespace App\Http\Controllers;

use App\Models\Candidato;
use App\Models\Funcao;
use Illuminate\Http\Request;
use Illuminate\View\View;

class PainelController extends Controller
{
    public function kanban(): View
    {
        $candidatos = Candidato::query()
            ->whereNull('anonimizado_em')
            ->with(['funcao', 'informacoesInternas'])
            ->orderByDesc('etapa_atualizada_em')
            ->limit(400)
            ->get();

        return view('painel.kanban', [
            'candidatos' => $candidatos,
            'funcoes' => Funcao::where('ativo', true)->orderBy('nome')->get(),
        ]);
    }

    public function lista(Request $requisicao): View
    {
        $busca = trim((string) $requisicao->query('busca'));
        $etapa = (string) $requisicao->query('etapa');
        $funcaoId = $requisicao->query('funcao_id');

        $consulta = Candidato::query()
            ->whereNull('anonimizado_em')
            ->with(['funcao', 'informacoesInternas'])
            ->withCount([
                'documentos as obrigatorios' => fn ($q) => $q->where('exigencia', 'OBRIGATORIO'),
                'documentos as conferidos' => fn ($q) => $q->where('exigencia', 'OBRIGATORIO')
                    ->where('status', 'CONFERIDO'),
            ]);

        if ($etapa !== '' && array_key_exists($etapa, Candidato::ETAPAS)) {
            $consulta->where('etapa', $etapa);
        }
        if ($funcaoId) {
            $consulta->where('funcao_id', $funcaoId);
        }
        if ($busca !== '') {
            $digitos = preg_replace('/\D/', '', $busca) ?? '';
            $consulta->where(function ($q) use ($busca, $digitos) {
                $q->where('nome_completo', 'ilike', "%{$busca}%")
                    ->orWhere('email', 'ilike', "%{$busca}%");
                if ($digitos !== '') {
                    $q->orWhere('cpf', 'like', "%{$digitos}%")
                        ->orWhere('celular_whatsapp', 'like', "%{$digitos}%");
                }
            });
        }

        return view('painel.lista', [
            'candidatos' => $consulta->orderByDesc('created_at')->paginate(50)->withQueryString(),
            'funcoes' => Funcao::where('ativo', true)->orderBy('nome')->get(),
        ]);
    }
}
