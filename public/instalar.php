<?php

/**
 * Instalador para hospedagem compartilhada SEM acesso SSH.
 *
 * Roda pelo navegador os mesmos comandos do artisan: key:generate, migrate,
 * db:seed e os caches. Protegido por token definido no .env (INSTALL_TOKEN).
 *
 * APAGUE ESTE ARQUIVO ASSIM QUE TERMINAR A INSTALAÇÃO.
 */

use Illuminate\Contracts\Console\Kernel;

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

header('Content-Type: text/html; charset=utf-8');

/**
 * O token é lido direto do arquivo .env, e não por env(): um dos comandos que
 * este instalador roda é `config:cache`, e depois disso env() passa a devolver
 * null — o instalador se declararia "desativado" na segunda execução.
 */
function tokenDoEnvGenerico(string $caminho, string $chave): string
{
    if (! is_readable($caminho)) {
        return '';
    }
    foreach (file($caminho, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $linha) {
        if (! preg_match('/^\s*'.preg_quote($chave, '/').'\s*=(.*)$/', $linha, $partes)) {
            continue;
        }
        $valor = trim($partes[1]);
        if (strlen($valor) >= 2 && ($valor[0] === '"' || $valor[0] === "'")
            && $valor[strlen($valor) - 1] === $valor[0]) {
            $valor = substr($valor, 1, -1);
        }

        return trim($valor);
    }

    return '';
}

$tokenConfigurado = tokenDoEnvGenerico(__DIR__.'/../.env', 'INSTALL_TOKEN');
$tokenRecebido = (string) ($_GET['token'] ?? '');

function pagina(string $conteudo, int $status = 200): never
{
    http_response_code($status);
    echo '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">'
        .'<meta name="viewport" content="width=device-width,initial-scale=1">'
        .'<title>Instalador — Admissão Real Serv</title><style>'
        .'body{font-family:system-ui,sans-serif;max-width:760px;margin:40px auto;padding:0 16px;'
        .'color:#14181f;line-height:1.5}'
        .'h1{font-size:20px}pre{background:#f2f4f8;padding:12px;border-radius:6px;overflow-x:auto;'
        .'font-size:13px;white-space:pre-wrap}'
        .'.ok{color:#046c4e}.erro{color:#b91c1c}.aviso{background:#fffbeb;border:1px solid #d97706;'
        .'padding:12px;border-radius:6px;color:#92400e}'
        .'</style></head><body>'.$conteudo.'</body></html>';
    exit;
}

if ($tokenConfigurado === '') {
    pagina(
        '<h1>Instalador desativado</h1>'
        .'<p>Defina <code>INSTALL_TOKEN</code> no arquivo <code>.env</code> com um valor longo '
        .'e aleatório, depois acesse esta página com <code>?token=SEU_TOKEN</code>.</p>',
        403
    );
}

if (! hash_equals($tokenConfigurado, $tokenRecebido)) {
    pagina('<h1>Token inválido</h1><p>Confira o valor de <code>INSTALL_TOKEN</code> no <code>.env</code>.</p>', 403);
}

/**
 * A APP_KEY cifra CPF e RG em repouso. Regerá-la numa segunda execução deixaria
 * os dados já gravados ilegíveis, então só geramos quando está vazia.
 */
$chaveAtual = tokenDoEnvGenerico(__DIR__.'/../.env', 'APP_KEY');

$comandos = [];
if ($chaveAtual === '') {
    $comandos['Gerar a chave da aplicação'] = ['key:generate', ['--force' => true]];
}

$comandos += [
    'Criar as tabelas (migrations)' => ['migrate', ['--force' => true]],
    'Popular cadastros e usuários (seed)' => ['db:seed', ['--force' => true]],
    'Cachear configuração' => ['config:cache', []],
    'Cachear rotas' => ['route:cache', []],
    'Cachear views' => ['view:cache', []],
];

$saida = '<h1>Instalador — Admissão Real Serv</h1>';
$houveErro = false;

foreach ($comandos as $titulo => [$comando, $parametros]) {
    try {
        $codigo = $kernel->call($comando, $parametros);
        $texto = trim($kernel->output());
        $classe = $codigo === 0 ? 'ok' : 'erro';
        $marca = $codigo === 0 ? '✓' : '✗';
        if ($codigo !== 0) {
            $houveErro = true;
        }
        $saida .= "<h2 class=\"{$classe}\">{$marca} ".htmlspecialchars($titulo).'</h2>';
        if ($texto !== '') {
            $saida .= '<pre>'.htmlspecialchars($texto).'</pre>';
        }
    } catch (Throwable $erro) {
        $houveErro = true;
        $saida .= '<h2 class="erro">✗ '.htmlspecialchars($titulo).'</h2>';
        $saida .= '<pre>'.htmlspecialchars($erro->getMessage()).'</pre>';
        break;
    }
}

$saida .= $houveErro
    ? '<div class="aviso"><strong>Houve erro.</strong> Confira os dados do banco no '
        .'<code>.env</code> e o arquivo <code>storage/logs/laravel.log</code>. '
        .'Depois de corrigir, recarregue esta página.</div>'
    : '<div class="aviso"><strong>Instalação concluída.</strong><br>'
        .'1. <strong>Apague este arquivo agora</strong> (<code>public/instalar.php</code>).<br>'
        .'2. Remova <code>INSTALL_TOKEN</code> do <code>.env</code>.<br>'
        .'3. Acesse a página de login e troque as senhas iniciais.</div>'
        .'<p><a href="/login">Ir para o login</a></p>';

pagina($saida);
