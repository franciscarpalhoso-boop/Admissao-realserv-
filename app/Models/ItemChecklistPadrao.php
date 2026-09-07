<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemChecklistPadrao extends Model
{
    protected $table = 'itens_checklist_padrao';

    protected $guarded = [];

    protected $casts = ['aceita_multi' => 'boolean', 'ativo' => 'boolean'];
}
