<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Documentos anexados, entrevistas, informações internas do DP e trilhas de auditoria. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documentos_candidato', function (Blueprint $tabela) {
            $tabela->id();
            $tabela->foreignId('candidato_id')->constrained('candidatos')->cascadeOnDelete();
            $tabela->foreignId('item_checklist_id')->nullable()
                ->constrained('itens_checklist_padrao')->nullOnDelete();

            // Cópia do item no momento do cadastro: mudar o checklist mestre
            // depois não altera processos em andamento.
            $tabela->string('nome');
            $tabela->integer('ordem')->default(0);
            $tabela->string('exigencia', 20)->default('OBRIGATORIO');
            $tabela->string('regra', 30)->default('NENHUMA');
            $tabela->boolean('extra')->default(false);

            // PENDENTE | ENVIADO | CONFERIDO | COM_PENDENCIA
            $tabela->string('status', 20)->default('PENDENTE');
            $tabela->text('observacao_dp')->nullable();
            $tabela->timestamp('conferido_em')->nullable();
            $tabela->string('conferido_por')->nullable();
            $tabela->timestamps();
        });

        Schema::create('arquivos_documento', function (Blueprint $tabela) {
            $tabela->id();
            $tabela->foreignId('documento_id')->constrained('documentos_candidato')->cascadeOnDelete();
            $tabela->string('caminho'); // relativo ao disco privado; nunca exposto
            $tabela->string('nome_original');
            $tabela->string('mime_type', 100);
            $tabela->unsignedBigInteger('tamanho');
            $tabela->string('enviado_por', 50)->nullable();
            $tabela->timestamps();
        });

        Schema::create('entrevistas', function (Blueprint $tabela) {
            $tabela->id();
            $tabela->foreignId('candidato_id')->constrained('candidatos')->cascadeOnDelete();
            $tabela->foreignId('entrevistador_id')->nullable()->constrained('usuarios')->nullOnDelete();
            $tabela->dateTime('data_hora');
            $tabela->string('modalidade', 20)->default('PRESENCIAL');
            $tabela->string('local')->nullable();
            $tabela->string('link_online')->nullable();

            $tabela->boolean('realizada')->default(false);
            $tabela->string('horario_chegada', 5)->nullable();
            $tabela->timestamp('realizada_em')->nullable();

            $tabela->unsignedTinyInteger('nota_pontualidade')->nullable();
            $tabela->unsignedTinyInteger('nota_apresentacao')->nullable();
            $tabela->unsignedTinyInteger('nota_comunicacao')->nullable();
            $tabela->unsignedTinyInteger('nota_experiencia')->nullable();
            $tabela->unsignedTinyInteger('nota_disponibilidade')->nullable();

            $tabela->boolean('disponibilidade_domingos')->nullable();
            $tabela->boolean('restricao_horario_filhos')->nullable();
            $tabela->string('restricao_horario_detalhe')->nullable();
            $tabela->string('tempo_deslocamento')->nullable();
            $tabela->boolean('possui_cnh')->nullable();
            $tabela->boolean('experiencia_manobra')->nullable();
            $tabela->boolean('conhecimento_informatica')->nullable();
            $tabela->boolean('experiencia_militar_seguranca')->nullable();
            $tabela->boolean('interesse_cursos')->nullable();

            // APROVADO | REPROVADO | BANCO_TALENTOS
            $tabela->string('parecer', 20)->nullable();
            $tabela->foreignId('posto_sugerido_id')->nullable()->constrained('postos')->nullOnDelete();
            $tabela->text('vagas_indicadas')->nullable();
            $tabela->text('observacoes')->nullable();
            $tabela->timestamps();
        });

        Schema::create('informacoes_internas', function (Blueprint $tabela) {
            $tabela->id();
            $tabela->foreignId('candidato_id')->unique()->constrained('candidatos')->cascadeOnDelete();
            $tabela->foreignId('supervisor_id')->nullable()->constrained('supervisores')->nullOnDelete();
            $tabela->foreignId('posto_id')->nullable()->constrained('postos')->nullOnDelete();
            $tabela->foreignId('escala_id')->nullable()->constrained('escalas')->nullOnDelete();
            $tabela->foreignId('empresa_id')->nullable()->constrained('empresas')->nullOnDelete();

            $tabela->boolean('acumulo_funcao')->default(false);
            $tabela->string('acumulo_funcao_qual')->nullable();
            $tabela->decimal('base_salarial', 10, 2)->nullable();
            $tabela->boolean('vale_transporte')->default(false);
            $tabela->boolean('premio_assiduidade')->default(false);
            $tabela->string('outros_beneficios')->nullable();

            $tabela->date('data_inicio')->nullable();
            $tabela->date('data_treinamento')->nullable();

            $tabela->string('numero_admissao', 20)->nullable()->unique(); // "ADM 01/09"
            $tabela->integer('admissao_sequencial')->nullable();
            $tabela->integer('admissao_mes')->nullable();
            $tabela->integer('admissao_ano')->nullable();

            $tabela->string('responsavel_aprovacao')->nullable();
            $tabela->string('assinatura_responsavel')->nullable();
            $tabela->text('justificativa_forcada')->nullable();
            $tabela->timestamps();

            // Garante a unicidade do sequencial dentro do mês, mesmo com dois
            // usuários admitindo ao mesmo tempo.
            $tabela->unique(
                ['admissao_ano', 'admissao_mes', 'admissao_sequencial'],
                'informacoes_internas_sequencial_unico'
            );
        });

        Schema::create('movimentacoes_etapa', function (Blueprint $tabela) {
            $tabela->id();
            $tabela->foreignId('candidato_id')->constrained('candidatos')->cascadeOnDelete();
            $tabela->string('de', 30)->nullable();
            $tabela->string('para', 30);
            $tabela->foreignId('usuario_id')->nullable()->constrained('usuarios')->nullOnDelete();
            $tabela->string('autor_label');
            $tabela->text('observacao')->nullable();
            $tabela->timestamps();
        });

        Schema::create('logs_auditoria', function (Blueprint $tabela) {
            $tabela->id();
            $tabela->foreignId('usuario_id')->nullable()->constrained('usuarios')->nullOnDelete();
            $tabela->string('autor_label');
            $tabela->string('entidade', 60);
            $tabela->string('entidade_id', 60);
            $tabela->string('acao', 60);
            $tabela->json('detalhes')->nullable();
            $tabela->string('ip', 45)->nullable();
            $tabela->timestamps();
            $tabela->index(['entidade', 'entidade_id']);
        });

        Schema::create('acessos_dossie', function (Blueprint $tabela) {
            $tabela->id();
            $tabela->foreignId('candidato_id')->constrained('candidatos')->cascadeOnDelete();
            $tabela->foreignId('usuario_id')->nullable()->constrained('usuarios')->nullOnDelete();
            $tabela->string('tipo', 30); // FICHA_PDF | DOSSIE_PDF | DOCUMENTO | EXPORTACAO
            $tabela->string('referencia')->nullable();
            $tabela->string('ip', 45)->nullable();
            $tabela->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('acessos_dossie');
        Schema::dropIfExists('logs_auditoria');
        Schema::dropIfExists('movimentacoes_etapa');
        Schema::dropIfExists('informacoes_internas');
        Schema::dropIfExists('entrevistas');
        Schema::dropIfExists('arquivos_documento');
        Schema::dropIfExists('documentos_candidato');
    }
};
