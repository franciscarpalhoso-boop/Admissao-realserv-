<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Usuario extends Authenticatable
{
    use Notifiable;

    protected $table = 'usuarios';

    protected $fillable = ['nome', 'email', 'senha', 'perfil', 'ativo'];

    protected $hidden = ['senha', 'remember_token'];

    protected $casts = ['ativo' => 'boolean'];

    /** O Laravel espera "password"; aqui a coluna se chama "senha". */
    public function getAuthPassword(): string
    {
        return $this->senha;
    }

    public function ehAdmin(): bool
    {
        return $this->perfil === 'ADMIN';
    }

    /** Cadastros mestres, exclusão, configurações e admissão forçada. */
    public function podeAdministrar(): bool
    {
        return $this->perfil === 'ADMIN';
    }

    /** Conferir documentos, informações internas, dossiê e exportação. */
    public function podeOperarDp(): bool
    {
        return in_array($this->perfil, ['ADMIN', 'DP'], true);
    }

    /** Agendar/conduzir entrevistas e movimentar o pipeline. */
    public function podeRecrutar(): bool
    {
        return in_array($this->perfil, ['ADMIN', 'RECRUTADOR'], true);
    }

    public function rotuloPerfil(): string
    {
        return match ($this->perfil) {
            'ADMIN' => 'Administrador',
            'RECRUTADOR' => 'Recrutador/Entrevistador',
            'DP' => 'Departamento Pessoal',
            default => $this->perfil,
        };
    }
}
