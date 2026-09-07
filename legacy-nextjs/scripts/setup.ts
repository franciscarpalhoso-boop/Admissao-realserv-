/**
 * `npm run setup` — prepara o .env do zero.
 *
 * Cria o .env a partir do .env.example (se ainda não existir) e gera os
 * segredos que estiverem em branco. É seguro rodar quantas vezes quiser:
 * segredo já preenchido nunca é sobrescrito.
 *
 * A ENCRYPTION_KEY em especial não pode ser trocada depois que existirem
 * candidatos cadastrados — ela cifra CPF e RG em repouso, e uma chave nova
 * tornaria os dados já gravados ilegíveis.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  chaveAes256Valida,
  definirVariavel,
  ehPlaceholder,
  lerVariavel,
  variavelVazia,
} from './env-arquivo';

const RAIZ = path.resolve(import.meta.dirname, '..');
const CAMINHO_ENV = path.join(RAIZ, '.env');
const CAMINHO_EXEMPLO = path.join(RAIZ, '.env.example');

const verde = (t: string) => `\x1b[32m${t}\x1b[0m`;
const amarelo = (t: string) => `\x1b[33m${t}\x1b[0m`;
const vermelho = (t: string) => `\x1b[31m${t}\x1b[0m`;
const cinza = (t: string) => `\x1b[90m${t}\x1b[0m`;

const feito: string[] = [];
const pendencias: string[] = [];

function gerarSegredo(): string {
  return crypto.randomBytes(32).toString('base64');
}

function main(): void {
  console.log('\nPreparando o ambiente do Sistema de Admissão — Grupo Real Serv\n');

  // 1. Garante que o .env existe.
  let criouAgora = false;
  if (!fs.existsSync(CAMINHO_ENV)) {
    if (!fs.existsSync(CAMINHO_EXEMPLO)) {
      console.error(vermelho('  .env.example não encontrado. Rode o comando na raiz do projeto.'));
      process.exit(1);
    }
    fs.copyFileSync(CAMINHO_EXEMPLO, CAMINHO_ENV);
    criouAgora = true;
    feito.push('.env criado a partir do .env.example');
  } else {
    feito.push('.env já existia — valores preenchidos foram mantidos');
  }

  let texto = fs.readFileSync(CAMINHO_ENV, 'utf8');

  // 2. AUTH_SECRET — assina o cookie de sessão. Trocar só desloga todo mundo.
  if (variavelVazia(texto, 'AUTH_SECRET')) {
    texto = definirVariavel(texto, 'AUTH_SECRET', gerarSegredo());
    feito.push('AUTH_SECRET gerado (32 bytes aleatórios)');
  } else {
    feito.push('AUTH_SECRET já preenchido — mantido');
  }

  // 3. ENCRYPTION_KEY — cifra CPF e RG. Nunca sobrescrever uma chave existente.
  const chaveAtual = lerVariavel(texto, 'ENCRYPTION_KEY');
  if (variavelVazia(texto, 'ENCRYPTION_KEY')) {
    texto = definirVariavel(texto, 'ENCRYPTION_KEY', gerarSegredo());
    feito.push('ENCRYPTION_KEY gerada (32 bytes para AES-256)');
  } else if (!chaveAes256Valida(chaveAtual)) {
    console.error(`  ${vermelho('✗')} ENCRYPTION_KEY existente é inválida.`);
    console.error('    Ela precisa ser exatamente 32 bytes em base64 (AES-256).');
    console.error(cinza('    Não vou substituí-la automaticamente: se já existirem candidatos'));
    console.error(cinza('    cadastrados, uma chave nova torna os CPFs e RGs ilegíveis.'));
    console.error(cinza('    Com o banco ainda vazio, apague a linha do .env e rode de novo:'));
    console.error(cinza('      openssl rand -base64 32\n'));
    process.exit(1);
  } else {
    feito.push('ENCRYPTION_KEY já preenchida e válida — mantida');
  }

  fs.writeFileSync(CAMINHO_ENV, texto);

  // 4. Aponta o que ainda precisa de edição manual.
  const banco = lerVariavel(texto, 'DATABASE_URL');
  if (!banco || banco.trim() === '' || ehPlaceholder(banco)) {
    pendencias.push(
      'DATABASE_URL ainda é o valor de exemplo — aponte para o seu PostgreSQL.',
    );
  }

  const appUrl = lerVariavel(texto, 'APP_URL');
  if (!appUrl || appUrl.trim() === '') {
    pendencias.push('APP_URL está vazio — é a URL usada no link enviado ao candidato.');
  } else if (appUrl.includes('localhost') && process.env.NODE_ENV === 'production') {
    pendencias.push(`APP_URL aponta para localhost (${appUrl}) — troque pela URL pública.`);
  }

  const driver = (lerVariavel(texto, 'STORAGE_DRIVER') ?? 'local').trim();
  if (driver === 's3' && variavelVazia(texto, 'S3_BUCKET')) {
    pendencias.push('STORAGE_DRIVER=s3, mas S3_BUCKET está vazio.');
  }

  // 5. Relatório.
  for (const item of feito) console.log(`  ${verde('✓')} ${item}`);

  if (pendencias.length > 0) {
    console.log(`\n  ${amarelo('Falta ajustar à mão no .env:')}`);
    for (const item of pendencias) console.log(`    - ${item}`);
  }

  console.log('\n  Próximos passos:');
  if (pendencias.length > 0) {
    console.log(`    1. Edite o .env conforme acima`);
    console.log(`    2. npm run db:init     ${cinza('# aplica as migrações e popula os cadastros')}`);
    console.log(`    3. npm run dev         ${cinza('# http://localhost:3000')}`);
  } else {
    console.log(`    1. npm run db:init     ${cinza('# aplica as migrações e popula os cadastros')}`);
    console.log(`    2. npm run dev         ${cinza('# http://localhost:3000')}`);
  }

  if (criouAgora) {
    console.log('');
    console.log(cinza('  O .env está no .gitignore e não deve ser versionado. Guarde a'));
    console.log(cinza('  ENCRYPTION_KEY junto com o backup do banco: sem ela, os CPFs e'));
    console.log(cinza('  RGs cifrados não podem ser recuperados.'));
  }
  console.log('');
}

main();
