<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Candidato e os campos da Ficha de Solicitação de Emprego (etapas 1 a 7). */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('candidatos', function (Blueprint $tabela) {
            $tabela->id();

            // Acesso público por token
            $tabela->string('token_publico', 64)->unique();
            $tabela->timestamp('token_expira_em')->nullable();

            // NAO_INICIADA | EM_PREENCHIMENTO | ENVIADA
            $tabela->string('status_ficha', 20)->default('NAO_INICIADA');
            // TRIAGEM | ENTREVISTA_AGENDADA | ENTREVISTADO | APROVADO | DOCUMENTACAO
            // | EXAME_ADMISSIONAL | ADMITIDO | REPROVADO | DESISTIU | BANCO_TALENTOS
            $tabela->string('etapa', 30)->default('TRIAGEM')->index();
            $tabela->timestamp('etapa_atualizada_em')->nullable();

            // Etapa 1 — dados pessoais
            $tabela->string('nome_completo')->index();
            $tabela->string('telefone_contato', 20)->nullable();
            $tabela->string('telefone_recado', 20)->nullable();
            $tabela->string('celular_whatsapp', 20)->nullable();
            $tabela->string('email')->nullable();
            $tabela->foreignId('funcao_id')->nullable()->constrained('funcoes')->nullOnDelete();
            $tabela->string('tempo_experiencia')->nullable();
            $tabela->string('naturalidade')->nullable();
            $tabela->string('uf_naturalidade', 2)->nullable();
            $tabela->date('data_nascimento')->nullable();
            $tabela->string('sexo', 20)->default('NAO_INFORMADO');
            $tabela->string('estado_civil', 20)->nullable();
            $tabela->string('nome_conjuge')->nullable();
            $tabela->string('logradouro')->nullable();
            $tabela->string('numero', 20)->nullable();
            $tabela->string('complemento')->nullable();
            $tabela->string('bairro')->nullable();
            $tabela->string('cidade')->nullable();
            $tabela->string('uf', 2)->nullable();
            $tabela->string('cep', 8)->nullable();
            $tabela->string('tempo_residencia')->nullable();
            $tabela->string('escolaridade', 30)->nullable();
            $tabela->string('nome_mae')->nullable();
            $tabela->string('nome_pai')->nullable();

            // Etapa 2 — documentação. CPF e RG guardam também a versão cifrada.
            $tabela->string('cpf', 11)->nullable()->index();
            $tabela->text('cpf_cifrado')->nullable();
            $tabela->string('pis_nit', 11)->nullable();
            $tabela->string('rg_numero', 30)->nullable();
            $tabela->text('rg_numero_cifrado')->nullable();
            $tabela->date('rg_data_emissao')->nullable();
            $tabela->string('rg_orgao_expedidor', 20)->nullable();
            $tabela->string('rg_uf', 2)->nullable();
            $tabela->string('cnh_numero', 20)->nullable();
            $tabela->string('cnh_registro', 20)->nullable();
            $tabela->string('cnh_uf', 2)->nullable();
            $tabela->date('cnh_data_emissao')->nullable();
            $tabela->date('cnh_validade')->nullable();
            $tabela->string('cnh_categoria', 5)->nullable();
            $tabela->date('cnh_primeira_habilitacao')->nullable();
            $tabela->string('ctps_numero', 20)->nullable();
            $tabela->string('ctps_serie', 20)->nullable();
            $tabela->string('ctps_uf', 2)->nullable();
            $tabela->boolean('ctps_digital')->default(false);
            $tabela->string('titulo_eleitor_numero', 20)->nullable();
            $tabela->string('titulo_eleitor_zona', 10)->nullable();
            $tabela->string('titulo_eleitor_secao', 10)->nullable();
            $tabela->string('reservista_numero', 30)->nullable();
            $tabela->string('tipo_sanguineo', 5)->nullable();

            // Etapa 5 — uniforme
            $tabela->string('numero_sapato', 5)->nullable();
            $tabela->string('tamanho_camisa', 5)->nullable();
            $tabela->string('numero_calca', 5)->nullable();

            // Etapa 6 — questionário
            $tabela->boolean('aceita_escala_revezamento')->nullable();
            $tabela->boolean('possui_parente_empresa')->nullable();
            $tabela->string('parente_nome')->nullable();
            $tabela->string('parente_setor')->nullable();
            $tabela->boolean('ja_trabalhou_empresa')->nullable();
            $tabela->string('ja_trabalhou_ano', 4)->nullable();
            $tabela->boolean('fumante')->nullable();
            $tabela->boolean('deseja_vale_transporte')->nullable();
            $tabela->string('linhas_onibus')->nullable();
            $tabela->decimal('valor_passagem', 10, 2)->nullable();
            $tabela->string('chave_pix')->nullable();
            $tabela->text('sobre_voce')->nullable();

            // Etapa 7 — declaração e assinatura
            $tabela->boolean('aceite_veracidade')->default(false);
            $tabela->boolean('aceite_lgpd')->default(false);
            $tabela->longText('assinatura_base64')->nullable();
            $tabela->string('assinatura_local')->nullable();
            $tabela->timestamp('assinatura_data')->nullable();
            $tabela->string('consentimento_ip', 45)->nullable();
            $tabela->text('consentimento_user_agent')->nullable();

            $tabela->timestamp('anonimizado_em')->nullable();
            $tabela->text('observacoes_triagem')->nullable();
            $tabela->timestamps();
        });

        Schema::create('filhos', function (Blueprint $tabela) {
            $tabela->id();
            $tabela->foreignId('candidato_id')->constrained('candidatos')->cascadeOnDelete();
            $tabela->string('nome');
            $tabela->date('data_nascimento')->nullable();
            $tabela->string('cpf', 11)->nullable();
            $tabela->integer('ordem')->default(0);
            $tabela->timestamps();
        });

        Schema::create('cursos', function (Blueprint $tabela) {
            $tabela->id();
            $tabela->foreignId('candidato_id')->constrained('candidatos')->cascadeOnDelete();
            $tabela->string('nome');
            $tabela->string('instituicao')->nullable();
            $tabela->string('ano', 4)->nullable();
            $tabela->integer('ordem')->default(0);
            $tabela->timestamps();
        });

        Schema::create('referencias', function (Blueprint $tabela) {
            $tabela->id();
            $tabela->foreignId('candidato_id')->constrained('candidatos')->cascadeOnDelete();
            $tabela->string('nome');
            $tabela->string('telefone', 20)->nullable();
            $tabela->string('relacao')->nullable();
            $tabela->string('cidade')->nullable();
            $tabela->integer('ordem')->default(0);
            $tabela->timestamps();
        });

        Schema::create('empregos_anteriores', function (Blueprint $tabela) {
            $tabela->id();
            $tabela->foreignId('candidato_id')->constrained('candidatos')->cascadeOnDelete();
            $tabela->integer('ordem')->default(0); // 0 último, 1 penúltimo, 2 antepenúltimo
            $tabela->boolean('nao_possui')->default(false);
            $tabela->string('empresa')->nullable();
            $tabela->string('telefone', 20)->nullable();
            $tabela->string('contato')->nullable();
            $tabela->string('setor')->nullable();
            $tabela->string('cargo')->nullable();
            $tabela->date('data_admissao')->nullable();
            $tabela->date('data_saida')->nullable();
            $tabela->decimal('ultimo_salario', 10, 2)->nullable();
            $tabela->text('motivo_saida')->nullable();
            $tabela->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('empregos_anteriores');
        Schema::dropIfExists('referencias');
        Schema::dropIfExists('cursos');
        Schema::dropIfExists('filhos');
        Schema::dropIfExists('candidatos');
    }
};
