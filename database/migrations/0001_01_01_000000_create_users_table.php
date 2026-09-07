<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Usuários internos (admin, recrutador, DP) e a tabela de sessões.
 * O candidato não tem usuário: acessa por token no link público.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('usuarios', function (Blueprint $tabela) {
            $tabela->id();
            $tabela->string('nome');
            $tabela->string('email')->unique();
            $tabela->string('senha');
            $tabela->string('perfil', 20)->index(); // ADMIN | RECRUTADOR | DP
            $tabela->boolean('ativo')->default(true);
            $tabela->rememberToken();
            $tabela->timestamps();
        });

        Schema::create('sessions', function (Blueprint $tabela) {
            $tabela->string('id')->primary();
            $tabela->foreignId('user_id')->nullable()->index();
            $tabela->string('ip_address', 45)->nullable();
            $tabela->text('user_agent')->nullable();
            $tabela->longText('payload');
            $tabela->integer('last_activity')->index();
        });

        Schema::create('cache', function (Blueprint $tabela) {
            $tabela->string('key')->primary();
            $tabela->mediumText('value');
            $tabela->integer('expiration');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cache');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('usuarios');
    }
};
