<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Cadastros mestres: empresas do grupo, supervisores, postos, funções, escalas e checklist. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('empresas', function (Blueprint $tabela) {
            $tabela->id();
            $tabela->string('nome')->unique();
            $tabela->string('cnpj', 14)->unique();
            $tabela->string('logradouro')->nullable();
            $tabela->string('numero', 20)->nullable();
            $tabela->string('complemento')->nullable();
            $tabela->string('bairro')->nullable();
            $tabela->string('cidade')->nullable();
            $tabela->string('uf', 2)->nullable();
            $tabela->string('cep', 8)->nullable();
            $tabela->string('responsavel')->nullable();
            $tabela->boolean('ativo')->default(true);
            $tabela->timestamps();
        });

        Schema::create('supervisores', function (Blueprint $tabela) {
            $tabela->id();
            $tabela->string('nome');
            $tabela->string('telefone', 20)->nullable();
            $tabela->string('email')->nullable();
            $tabela->boolean('ativo')->default(true);
            $tabela->timestamps();
        });

        Schema::create('postos', function (Blueprint $tabela) {
            $tabela->id();
            $tabela->string('nome'); // nome do condomínio
            $tabela->string('logradouro')->nullable();
            $tabela->string('numero', 20)->nullable();
            $tabela->string('bairro')->nullable();
            $tabela->string('cidade')->nullable();
            $tabela->string('uf', 2)->nullable();
            $tabela->string('cep', 8)->nullable();
            $tabela->foreignId('empresa_id')->nullable()->constrained('empresas')->nullOnDelete();
            $tabela->foreignId('supervisor_id')->nullable()->constrained('supervisores')->nullOnDelete();
            $tabela->boolean('ativo')->default(true);
            $tabela->timestamps();
        });

        Schema::create('funcoes', function (Blueprint $tabela) {
            $tabela->id();
            $tabela->string('nome')->unique();
            $tabela->string('descricao')->nullable();
            $tabela->boolean('exige_cnh')->default(false);
            $tabela->boolean('exige_sapato_preto')->default(false);
            $tabela->text('aviso_especifico')->nullable();
            $tabela->text('requisitos')->nullable(); // um por linha
            $tabela->boolean('ativo')->default(true);
            $tabela->timestamps();
        });

        Schema::create('escalas', function (Blueprint $tabela) {
            $tabela->id();
            $tabela->string('nome')->unique(); // 5x1, 6x1, 12x36
            $tabela->string('descricao')->nullable();
            $tabela->string('horario_inicio', 5)->nullable();
            $tabela->string('horario_fim', 5)->nullable();
            $tabela->boolean('ativo')->default(true);
            $tabela->timestamps();
        });

        Schema::create('itens_checklist_padrao', function (Blueprint $tabela) {
            $tabela->id();
            $tabela->string('nome');
            $tabela->text('descricao')->nullable();
            $tabela->integer('ordem');
            // OBRIGATORIO | OPCIONAL | CONDICIONAL
            $tabela->string('exigencia', 20)->default('OBRIGATORIO');
            // NENHUMA | EXIGE_CNH | SEXO_MASCULINO | POSSUI_FILHOS |
            // FILHOS_ATE_6 | FILHOS_7_A_14 | CASADO_OU_UNIAO
            $tabela->string('regra', 30)->default('NENHUMA');
            $tabela->boolean('aceita_multi')->default(false);
            $tabela->boolean('ativo')->default(true);
            $tabela->timestamps();
        });

        Schema::create('configuracoes', function (Blueprint $tabela) {
            $tabela->id();
            $tabela->string('chave')->unique();
            $tabela->text('valor');
            $tabela->string('descricao')->nullable();
            $tabela->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('configuracoes');
        Schema::dropIfExists('itens_checklist_padrao');
        Schema::dropIfExists('escalas');
        Schema::dropIfExists('funcoes');
        Schema::dropIfExists('postos');
        Schema::dropIfExists('supervisores');
        Schema::dropIfExists('empresas');
    }
};
