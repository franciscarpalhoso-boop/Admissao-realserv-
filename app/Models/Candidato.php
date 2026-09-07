<?php

namespace App\Models;

use App\Suporte\Checklist;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Candidato extends Model
{
    protected $table = 'candidatos';

    protected $guarded = [];

    protected $casts = [
        'token_expira_em' => 'datetime',
        'etapa_atualizada_em' => 'datetime',
        'data_nascimento' => 'date',
        'rg_data_emissao' => 'date',
        'cnh_data_emissao' => 'date',
        'cnh_validade' => 'date',
        'cnh_primeira_habilitacao' => 'date',
        'ctps_digital' => 'boolean',
        'aceita_escala_revezamento' => 'boolean',
        'possui_parente_empresa' => 'boolean',
        'ja_trabalhou_empresa' => 'boolean',
        'fumante' => 'boolean',
        'deseja_vale_transporte' => 'boolean',
        'aceite_veracidade' => 'boolean',
        'aceite_lgpd' => 'boolean',
        'assinatura_data' => 'datetime',
        'anonimizado_em' => 'datetime',
        'valor_passagem' => 'decimal:2',
    ];

    // ------------------------------------------------------------------
    // Relacionamentos
    // ------------------------------------------------------------------

    public function funcao(): BelongsTo
    {
        return $this->belongsTo(Funcao::class);
    }

    public function filhos(): HasMany
    {
        return $this->hasMany(Filho::class)->orderBy('ordem');
    }

    public function cursos(): HasMany
    {
        return $this->hasMany(Curso::class)->orderBy('ordem');
    }

    public function referencias(): HasMany
    {
        return $this->hasMany(Referencia::class)->orderBy('ordem');
    }

    public function empregosAnteriores(): HasMany
    {
        return $this->hasMany(EmpregoAnterior::class)->orderBy('ordem');
    }

    public function documentos(): HasMany
    {
        return $this->hasMany(DocumentoCandidato::class)->orderBy('ordem');
    }

    public function entrevistas(): HasMany
    {
        return $this->hasMany(Entrevista::class)->orderByDesc('data_hora');
    }

    public function informacoesInternas(): HasOne
    {
        return $this->hasOne(InformacoesInternas::class);
    }

    public function movimentacoes(): HasMany
    {
        return $this->hasMany(MovimentacaoEtapa::class)->orderByDesc('created_at');
    }

    // ------------------------------------------------------------------
    // Regras
    // ------------------------------------------------------------------

    /** Perfil usado pelas regras condicionais do checklist. */
    public function perfilChecklist(): array
    {
        return [
            'sexo' => (string) $this->sexo,
            'funcao_exige_cnh' => (bool) ($this->funcao?->exige_cnh),
            'casado_ou_uniao' => in_array($this->estado_civil, ['CASADO', 'UNIAO_ESTAVEL'], true),
            'idades_filhos' => $this->filhos
                ->map(fn (Filho $filho) => Checklist::calcularIdade($filho->data_nascimento))
                ->filter(fn (?int $idade) => $idade !== null)
                ->values()
                ->all(),
        ];
    }

    /** @return array<int,array{id:mixed,nome:string,status:string}> */
    public function pendenciasAdmissao(): array
    {
        $itens = $this->documentos->map(fn (DocumentoCandidato $doc) => [
            'id' => $doc->id,
            'nome' => $doc->nome,
            'exigencia' => $doc->exigencia,
            'regra' => $doc->regra,
            'status' => $doc->status,
        ])->all();

        return Checklist::pendencias($itens, $this->perfilChecklist());
    }

    public function linkPublico(): string
    {
        return url('/ficha/'.$this->token_publico);
    }

    public function tokenValido(): bool
    {
        if ($this->anonimizado_em !== null) {
            return false;
        }

        return $this->token_expira_em === null || $this->token_expira_em->isFuture();
    }

    public function rotuloEtapa(): string
    {
        return self::ETAPAS[$this->etapa] ?? $this->etapa;
    }

    public const ETAPAS = [
        'TRIAGEM' => 'Cadastro/Triagem',
        'ENTREVISTA_AGENDADA' => 'Entrevista agendada',
        'ENTREVISTADO' => 'Entrevistado',
        'APROVADO' => 'Aprovado',
        'DOCUMENTACAO' => 'Documentação em conferência',
        'EXAME_ADMISSIONAL' => 'Exame admissional',
        'ADMITIDO' => 'Admitido',
        'REPROVADO' => 'Reprovado',
        'DESISTIU' => 'Desistiu',
        'BANCO_TALENTOS' => 'Banco de talentos',
    ];

    public const ETAPAS_KANBAN = [
        'TRIAGEM', 'ENTREVISTA_AGENDADA', 'ENTREVISTADO', 'APROVADO',
        'DOCUMENTACAO', 'EXAME_ADMISSIONAL', 'ADMITIDO',
    ];

    public const ETAPAS_ENCERRAMENTO = ['REPROVADO', 'DESISTIU', 'BANCO_TALENTOS'];

    public const ESTADOS_CIVIS = [
        'SOLTEIRO' => 'Solteiro(a)',
        'CASADO' => 'Casado(a)',
        'DIVORCIADO' => 'Divorciado(a)',
        'VIUVO' => 'Viúvo(a)',
        'UNIAO_ESTAVEL' => 'União estável',
        'SEPARADO' => 'Separado(a)',
    ];

    public const ESCOLARIDADES = [
        'FUNDAMENTAL_INCOMPLETO' => 'Fundamental incompleto',
        'FUNDAMENTAL_COMPLETO' => 'Fundamental completo',
        'MEDIO_INCOMPLETO' => 'Médio incompleto',
        'MEDIO_COMPLETO' => 'Médio completo',
        'SUPERIOR_INCOMPLETO' => 'Superior incompleto',
        'SUPERIOR_COMPLETO' => 'Superior completo',
        'POS_GRADUACAO' => 'Pós-graduação',
    ];

    public const SEXOS = [
        'MASCULINO' => 'Masculino',
        'FEMININO' => 'Feminino',
        'NAO_INFORMADO' => 'Não informado',
    ];

    public const UFS = [
        'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
        'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
    ];

    public const TIPOS_SANGUINEOS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
}
