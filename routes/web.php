<?php

use App\Http\Controllers\ArquivoController;
use App\Http\Controllers\AutenticacaoController;
use App\Http\Controllers\CandidatoController;
use App\Http\Controllers\FichaPublicaController;
use App\Http\Controllers\PainelController;
use App\Http\Controllers\PdfController;
use Illuminate\Support\Facades\Route;

// ---------------------------------------------------------------------------
// Público — o candidato acessa só por token, sem cadastro. Sem middleware auth.
// ---------------------------------------------------------------------------
Route::prefix('ficha/{token}')->name('ficha.')->group(function () {
    Route::get('/', [FichaPublicaController::class, 'mostrar'])->name('mostrar');
    Route::post('/etapa/{etapa}', [FichaPublicaController::class, 'salvarEtapa'])
        ->whereNumber('etapa')->name('etapa');
    Route::post('/enviar', [FichaPublicaController::class, 'enviar'])->name('enviar');
    Route::post('/documento/{documento}', [FichaPublicaController::class, 'enviarDocumento'])
        ->whereNumber('documento')->name('documento');
});

// ---------------------------------------------------------------------------
// Autenticação
// ---------------------------------------------------------------------------
Route::middleware('guest')->group(function () {
    Route::get('/login', [AutenticacaoController::class, 'formulario'])->name('login');
    Route::post('/login', [AutenticacaoController::class, 'entrar'])->name('login.entrar');
});
Route::post('/sair', [AutenticacaoController::class, 'sair'])->middleware('auth')->name('sair');

Route::get('/', fn () => redirect()->route(auth()->check() ? 'painel' : 'login'));

// ---------------------------------------------------------------------------
// Área interna
// ---------------------------------------------------------------------------
Route::middleware('auth')->group(function () {
    Route::get('/painel', [PainelController::class, 'kanban'])->name('painel');
    Route::get('/painel/candidatos', [PainelController::class, 'lista'])->name('candidatos');

    Route::post('/painel/candidatos', [CandidatoController::class, 'criar'])->name('candidatos.criar');
    Route::get('/painel/candidatos/{candidato}', [CandidatoController::class, 'mostrar'])
        ->whereNumber('candidato')->name('candidatos.mostrar');
    Route::post('/painel/candidatos/{candidato}/etapa', [CandidatoController::class, 'moverEtapa'])
        ->whereNumber('candidato')->name('candidatos.etapa');
    Route::post('/painel/candidatos/{candidato}/link', [CandidatoController::class, 'regerarLink'])
        ->whereNumber('candidato')->name('candidatos.link');
    Route::post('/painel/documentos/{documento}/conferir', [CandidatoController::class, 'conferirDocumento'])
        ->whereNumber('documento')->name('documentos.conferir');
    Route::post('/painel/candidatos/{candidato}/checklist', [CandidatoController::class, 'adicionarItem'])
        ->whereNumber('candidato')->name('candidatos.checklist');
    Route::post('/painel/candidatos/{candidato}/internas', [CandidatoController::class, 'salvarInternas'])
        ->whereNumber('candidato')->name('candidatos.internas');

    // Downloads — sempre autenticados e registrados no log de acesso.
    Route::get('/arquivos/{arquivo}', [ArquivoController::class, 'baixar'])
        ->whereNumber('arquivo')->name('arquivos.baixar');
    Route::get('/painel/candidatos/{candidato}/ficha.pdf', [PdfController::class, 'ficha'])
        ->whereNumber('candidato')->name('pdf.ficha');
    Route::get('/painel/candidatos/{candidato}/dossie.pdf', [PdfController::class, 'dossie'])
        ->whereNumber('candidato')->name('pdf.dossie');
});
