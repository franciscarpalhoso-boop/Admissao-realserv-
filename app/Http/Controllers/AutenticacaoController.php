<?php

namespace App\Http\Controllers;

use App\Servicos\Auditoria;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Illuminate\View\View;

class AutenticacaoController extends Controller
{
    public function formulario(): View
    {
        return view('auth.login');
    }

    public function entrar(Request $requisicao): RedirectResponse
    {
        $dados = $requisicao->validate([
            'email' => ['required', 'email'],
            'senha' => ['required', 'string'],
        ], [], ['email' => 'e-mail', 'senha' => 'senha']);

        // A coluna de senha se chama "senha"; o guard recebe "password".
        $credenciais = [
            'email' => mb_strtolower(trim($dados['email'])),
            'password' => $dados['senha'],
            'ativo' => true,
        ];

        if (! Auth::attempt($credenciais, $requisicao->boolean('lembrar'))) {
            throw ValidationException::withMessages([
                'email' => 'E-mail ou senha inválidos.',
            ]);
        }

        $requisicao->session()->regenerate();
        Auditoria::registrar('Usuario', Auth::id(), 'LOGIN');

        return redirect()->intended(route('painel'));
    }

    public function sair(Request $requisicao): RedirectResponse
    {
        Auth::logout();
        $requisicao->session()->invalidate();
        $requisicao->session()->regenerateToken();

        return redirect()->route('login');
    }
}
