<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Configuracao extends Model
{
    protected $table = 'configuracoes';

    protected $guarded = [];

    public static function valor(string $chave, string $padrao = ''): string
    {
        return (string) (static::query()->where('chave', $chave)->value('valor') ?? $padrao);
    }
}
