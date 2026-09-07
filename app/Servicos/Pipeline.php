<?php

namespace App\Servicos;

use App\Models\Candidato;
use App\Models\InformacoesInternas;
use App\Models\ItemChecklistPadrao;
use App\Models\MovimentacaoEtapa;
use App\Models\Usuario;
use App\Suporte\Admissao;
use Illuminate\Database\QueryException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

/** Erro de regra de negócio — vira mensagem para o usuário, não stack trace. */
class ErroDeRegra extends RuntimeException {}

class Pipeline
{
    /** Cria o candidato já com o checklist padrão materializado. */
    public static function criarCandidato(array $dados): Candidato
    {
        $dias = (int) config('admissao.dias_validade_link', 30);

        return DB::transaction(function () use ($dados, $dias) {
            $candidato = Candidato::create([
                'nome_completo' => trim($dados['nome_completo']),
                'celular_whatsapp' => $dados['celular_whatsapp'] ?? null,
                'email' => $dados['email'] ?? null,
                'funcao_id' => $dados['funcao_id'] ?? null,
                'observacoes_triagem' => $dados['observacoes_triagem'] ?? null,
                'token_publico' => Str::random(48),
                'token_expira_em' => now()->addDays($dias),
                'etapa' => 'TRIAGEM',
                'etapa_atualizada_em' => now(),
            ]);

            $itens = ItemChecklistPadrao::query()->where('ativo', true)->orderBy('ordem')->get();
            foreach ($itens as $item) {
                $candidato->documentos()->create([
                    'item_checklist_id' => $item->id,
                    'nome' => $item->nome,
                    'ordem' => $item->ordem,
                    'exigencia' => $item->exigencia,
                    'regra' => $item->regra,
                ]);
            }

            MovimentacaoEtapa::create([
                'candidato_id' => $candidato->id,
                'para' => 'TRIAGEM',
                'autor_label' => 'Sistema',
                'observacao' => 'Candidato cadastrado',
            ]);

            return $candidato;
        });
    }

    /**
     * Move o candidato de etapa registrando o histórico. A transição para
     * ADMITIDO exige checklist completo e gera o número ADM nn/mm.
     */
    public static function moverEtapa(
        Candidato $candidato,
        string $para,
        Usuario $usuario,
        ?string $observacao = null,
        ?string $justificativaForcada = null,
        ?Carbon $dataAdmissao = null,
    ): ?string {
        if (! array_key_exists($para, Candidato::ETAPAS)) {
            throw new ErroDeRegra('Etapa inválida.');
        }
        if ($candidato->etapa === $para) {
            return null;
        }

        $numeroAdmissao = null;

        if ($para === 'ADMITIDO') {
            $candidato->load(['documentos', 'filhos', 'funcao']);
            $pendentes = $candidato->pendenciasAdmissao();

            if ($pendentes !== []) {
                if (! $usuario->podeAdministrar()) {
                    throw new ErroDeRegra(sprintf(
                        'Não é possível admitir: %d documento(s) obrigatório(s) sem conferência — %s.',
                        count($pendentes),
                        implode(', ', array_column($pendentes, 'nome'))
                    ));
                }
                if (trim((string) $justificativaForcada) === '') {
                    throw new ErroDeRegra(
                        'Há documentos obrigatórios pendentes. Informe uma justificativa para forçar a admissão.'
                    );
                }
            }

            $numeroAdmissao = self::gerarNumeroAdmissao(
                $candidato,
                $dataAdmissao ?? now(),
                $justificativaForcada
            );
        }

        $de = $candidato->etapa;

        DB::transaction(function () use ($candidato, $para, $de, $usuario, $observacao, $justificativaForcada) {
            $candidato->update(['etapa' => $para, 'etapa_atualizada_em' => now()]);

            MovimentacaoEtapa::create([
                'candidato_id' => $candidato->id,
                'de' => $de,
                'para' => $para,
                'usuario_id' => $usuario->id,
                'autor_label' => $usuario->nome,
                'observacao' => trim((string) $justificativaForcada) !== ''
                    ? 'Admissão forçada: '.trim((string) $justificativaForcada)
                    : $observacao,
            ]);
        });

        Auditoria::registrar('Candidato', $candidato->id, 'MOVIMENTACAO_ETAPA', [
            'de' => $de,
            'para' => $para,
            'numero_admissao' => $numeroAdmissao,
        ]);

        return $numeroAdmissao;
    }

    /**
     * Gera "ADM nn/mm" com sequencial por mês. A unicidade é garantida por
     * índice no banco; em caso de corrida, tenta o próximo número.
     */
    public static function gerarNumeroAdmissao(
        Candidato $candidato,
        Carbon $referencia,
        ?string $justificativaForcada,
    ): string {
        $existente = InformacoesInternas::query()->where('candidato_id', $candidato->id)->first();
        if ($existente?->numero_admissao) {
            return $existente->numero_admissao;
        }

        $mes = (int) $referencia->format('n');
        $ano = (int) $referencia->format('Y');

        for ($tentativa = 0; $tentativa < 10; $tentativa++) {
            $maior = InformacoesInternas::query()
                ->where('admissao_ano', $ano)
                ->where('admissao_mes', $mes)
                ->max('admissao_sequencial');

            $sequencial = Admissao::proximoSequencial($maior !== null ? (int) $maior : null) + $tentativa;
            $numero = Admissao::formatarNumero($sequencial, $mes);

            try {
                InformacoesInternas::updateOrCreate(
                    ['candidato_id' => $candidato->id],
                    array_filter([
                        'numero_admissao' => $numero,
                        'admissao_sequencial' => $sequencial,
                        'admissao_mes' => $mes,
                        'admissao_ano' => $ano,
                        'justificativa_forcada' => $justificativaForcada,
                    ], fn ($v) => $v !== null)
                );

                return $numero;
            } catch (QueryException $erro) {
                // 23505 = unique_violation no PostgreSQL: outro DP pegou o número.
                if (($erro->errorInfo[0] ?? null) !== '23505') {
                    throw $erro;
                }
            }
        }

        throw new ErroDeRegra('Não foi possível gerar o número de admissão. Tente novamente.');
    }

    /** Recalcula o status do documento após upload ou remoção de arquivos. */
    public static function sincronizarStatusDocumento(\App\Models\DocumentoCandidato $documento): void
    {
        if (in_array($documento->status, ['CONFERIDO', 'COM_PENDENCIA'], true)) {
            return;
        }
        $novo = $documento->arquivos()->count() > 0 ? 'ENVIADO' : 'PENDENTE';
        if ($novo !== $documento->status) {
            $documento->update(['status' => $novo]);
        }
    }
}
