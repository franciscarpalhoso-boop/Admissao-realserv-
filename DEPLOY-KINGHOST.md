# Publicar em `admissao.gruporealserv.com.br` — KingHost compartilhado

Passo a passo para colocar o sistema no ar em hospedagem compartilhada com PHP 8.2
(php-fpm) e PostgreSQL, **sem Node.js no servidor**. O CSS já vem compilado em
`public/css/app.css`.

Tempo estimado: 40 a 60 minutos na primeira vez.

> Antes de começar, tenha em mãos: acesso ao Painel do Cliente da KingHost, um
> cliente de FTP (FileZilla) ou acesso SSH, e os CNPJs reais das oito empresas.

---

## Índice

1. [Conferir os requisitos do plano](#1-conferir-os-requisitos-do-plano)
2. [Criar o subdomínio](#2-criar-o-subdomínio)
3. [Criar o banco PostgreSQL](#3-criar-o-banco-postgresql)
4. [Preparar os arquivos no seu computador](#4-preparar-os-arquivos-no-seu-computador)
5. [Enviar os arquivos](#5-enviar-os-arquivos)
6. [Apontar o subdomínio para a pasta `public`](#6-apontar-o-subdomínio-para-a-pasta-public)
7. [Configurar o `.env`](#7-configurar-o-env)
8. [Rodar migrations e seeders](#8-rodar-migrations-e-seeders)
9. [Permissões das pastas](#9-permissões-das-pastas)
10. [Ativar o HTTPS](#10-ativar-o-https)
11. [Primeiro acesso e conferência](#11-primeiro-acesso-e-conferência)
12. [Atualizações futuras](#12-atualizações-futuras)
13. [Se algo der errado](#13-se-algo-der-errado)

---

## 1. Conferir os requisitos do plano

No **Painel do Cliente → Hospedagem → Gerenciar**, confirme:

| Item | Precisa ser | Onde ver |
| --- | --- | --- |
| Versão do PHP | **8.2 ou superior** | Configurações → Versão do PHP |
| Banco de dados | **PostgreSQL disponível** | Gerenciar bancos PgSQL |
| Extensões PHP | `pdo_pgsql`, `mbstring`, `gd`, `fileinfo`, `openssl`, `zip` | Informações do PHP (`phpinfo`) |

Para conferir as extensões, crie um arquivo `info.php` na pasta pública com
`<?php phpinfo();`, acesse pelo navegador, confira, **e apague o arquivo em seguida**
(ele expõe detalhes do servidor).

Se faltar `pdo_pgsql` ou `gd`, abra um chamado no suporte da KingHost pedindo a
habilitação — são extensões padrão e costumam ser liberadas na hora.

> **Se o plano não tiver acesso SSH**, tudo funciona igual: os passos 4 e 8 têm um
> caminho alternativo, indicado em cada um.

---

## 2. Criar o subdomínio

1. **Painel do Cliente → Domínios → Gerenciar DNS** (ou **Subdomínios**).
2. Clique em **Adicionar subdomínio**.
3. Nome: `admissao` · Domínio: `gruporealserv.com.br`.
4. Confirme. A KingHost cria a pasta `~/www/admissao.gruporealserv.com.br/`.
5. A propagação do DNS leva de alguns minutos a algumas horas.

---

## 3. Criar o banco PostgreSQL

1. **Painel do Cliente → Hospedagem → Gerenciar bancos PgSQL**.
2. **Adicionar banco de dados**:
   - Nome: `admissao` (a KingHost prefixa com o seu usuário, ficando algo como
     `usuario_admissao` — **anote o nome completo que aparecer**).
   - Senha: gere uma forte e guarde.
3. Anote os quatro valores; você vai usá-los no `.env`:

   | Campo | Valor |
   | --- | --- |
   | Host | normalmente `localhost` (o painel informa) |
   | Porta | `5432` |
   | Banco | o nome completo criado |
   | Usuário / Senha | os que o painel mostrar |

---

## 4. Preparar os arquivos no seu computador

O servidor compartilhado normalmente **não roda `composer install`**. Por isso, gere a
pasta `vendor/` na sua máquina e envie junto.

```bash
git clone <url-do-repositorio> admissao
cd admissao

# Dependências de produção, otimizadas (exige PHP 8.2+ e Composer localmente)
composer install --no-dev --optimize-autoloader
```

Isso cria `vendor/`. **Não** rode `npm install` — o CSS já está compilado em
`public/css/app.css`.

> **Sem PHP/Composer no seu computador?** Peça a quem cuida da TI para rodar o comando
> acima e te entregar a pasta pronta (o projeto inteiro, com `vendor/`, zipado).

---

## 5. Enviar os arquivos

### Opção A — FTP (FileZilla)

1. Conecte com os dados de FTP do painel.
2. Envie **todo o conteúdo do projeto** (inclusive `vendor/`, `public/`, `storage/`,
   `bootstrap/`) para `~/www/admissao.gruporealserv.com.br/`.
3. **Não envie**: `.env` (será criado no servidor), `.git/`, `node_modules/`,
   `legacy-nextjs/`, `tests/`.

Ao final, a estrutura no servidor deve ser:

```
~/www/admissao.gruporealserv.com.br/
├── app/
├── bootstrap/
├── config/
├── database/
├── public/          ← o subdomínio aponta para cá (passo 6)
│   ├── index.php
│   └── css/app.css
├── resources/
├── routes/
├── storage/
├── vendor/
└── artisan
```

### Opção B — Git (se houver SSH)

```bash
cd ~/www/admissao.gruporealserv.com.br
git clone <url-do-repositorio> .
composer install --no-dev --optimize-autoloader
```

---

## 6. Apontar o subdomínio para a pasta `public`

Este é o passo mais importante para a segurança: **só a pasta `public/` pode ficar
acessível pela web**. O resto (código, `.env`, documentos dos candidatos) precisa ficar
fora do alcance do navegador.

### Opção A — pelo painel (preferível)

1. **Painel do Cliente → Domínios → Subdomínios → `admissao.gruporealserv.com.br`**.
2. Em **Diretório / Document Root**, informe:
   `/www/admissao.gruporealserv.com.br/public`
3. Salve.

### Opção B — se o painel não permitir mudar o diretório

Crie um `.htaccess` **na raiz** do subdomínio (fora de `public/`):

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{REQUEST_URI} !^/public/
    RewriteRule ^(.*)$ public/$1 [L]
</IfModule>
```

E outro, também na raiz, bloqueando o acesso direto aos arquivos sensíveis:

```apache
<FilesMatch "^\.env">
    Require all denied
</FilesMatch>
```

> Depois de configurar, **teste**: abrir `https://admissao.gruporealserv.com.br/.env`
> tem que dar erro 403 ou 404. Se mostrar o conteúdo, pare tudo e corrija — esse arquivo
> tem a senha do banco e a chave que cifra os CPFs.

---

## 7. Configurar o `.env`

Copie `.env.example` para `.env` (pelo FTP: baixe, renomeie, edite e envie) e preencha:

```dotenv
APP_NAME="Admissão Real Serv"
APP_ENV=production
APP_KEY=                       # gerado no passo 8
APP_DEBUG=false                # NUNCA true em produção
APP_TIMEZONE=America/Sao_Paulo
APP_URL=https://admissao.gruporealserv.com.br
APP_LOCALE=pt_BR

LOG_LEVEL=error
SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=sync

DB_CONNECTION=pgsql
DB_HOST=localhost              # o que o painel informou
DB_PORT=5432
DB_DATABASE=usuario_admissao   # nome completo do passo 3
DB_USERNAME=usuario_admissao
DB_PASSWORD=a-senha-do-banco

DIAS_VALIDADE_LINK=30
RETENCAO_MESES=6
DOSSIE_MAX_PX=1600
DOSSIE_QUALIDADE_JPEG=78
```

> `APP_DEBUG=false` é obrigatório: com `true`, uma tela de erro mostraria a senha do
> banco para quem estiver acessando.

---

## 8. Rodar migrations e seeders

### Opção A — com SSH

```bash
cd ~/www/admissao.gruporealserv.com.br

php artisan key:generate --force     # preenche APP_KEY
php artisan migrate --force          # cria as tabelas
php artisan db:seed --force          # empresas, funções, escalas, checklist, usuários

php artisan config:cache             # acelera; a hospedagem tem 1 processo só
php artisan route:cache
php artisan view:cache
```

### Opção B — sem SSH

O repositório traz `public/instalar.php`, que executa exatamente os mesmos comandos
pelo navegador.

1. Abra `https://admissao.gruporealserv.com.br/instalar.php?token=SEU_TOKEN`
   — o token é o valor de `INSTALL_TOKEN` que você definir no `.env`
   (invente uma senha longa, ex.: `INSTALL_TOKEN=um-valor-bem-longo-e-aleatorio`).
2. A página mostra o resultado de cada etapa.
3. **Apague `public/instalar.php` assim que terminar** — a própria página lembra disso.

---

## 9. Permissões das pastas

O PHP precisa escrever em duas pastas. Pelo FileZilla, clique com o botão direito →
**Permissões de arquivo** → `775` (ou `755`, conforme o servidor), marcando
*Recursar em subdiretórios*:

- `storage/`
- `bootstrap/cache/`

Com SSH:

```bash
chmod -R 775 storage bootstrap/cache
```

Os documentos dos candidatos são gravados em `storage/app/documentos/`, **fora da pasta
pública** — não têm URL direta, e o download passa pela rota autenticada
`/arquivos/{id}`, que registra quem acessou.

---

## 10. Ativar o HTTPS

1. **Painel do Cliente → Hospedagem → Certificado SSL** → ative o Let's Encrypt para
   `admissao.gruporealserv.com.br`.
2. Depois de ativo, force o redirecionamento criando/editando `public/.htaccess`,
   acrescentando **logo após** `RewriteEngine On`:

```apache
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

HTTPS não é opcional aqui: o candidato envia CPF, RG e foto de documentos pelo celular,
muitas vezes em rede pública.

---

## 11. Primeiro acesso e conferência

Acesse `https://admissao.gruporealserv.com.br`. Você verá a tela de login.

**Usuários criados pelo seeder:**

| Perfil | E-mail | Senha inicial |
| --- | --- | --- |
| Administrador | `admin@realserv.com.br` | `Admin@2024` |
| Recrutador | `recrutador@realserv.com.br` | `Recruta@2024` |
| **Departamento Pessoal** | **`dp@realserv.com.br`** | **`Pessoal@2024`** |

> **Troque as três senhas no primeiro acesso.** Elas estão neste documento e no
> repositório — qualquer pessoa com acesso ao código as conhece.
> Para definir outras já na instalação, preencha `SENHA_ADMIN`, `SENHA_RECRUTADOR` e
> `SENHA_DP` no `.env` (mínimo 8 caracteres) **antes** de rodar o seeder.

### Roteiro de conferência (10 minutos)

1. **Login** com `dp@realserv.com.br` → deve abrir o painel com o kanban.
2. **Novo candidato** → preencha um nome de teste → deve aparecer o link e o botão
   *Enviar por WhatsApp*.
3. **Abra o link no celular** (ou numa aba anônima) → a ficha deve abrir **sem pedir
   login**.
4. Preencha a etapa 1 e salve → deve avançar para a etapa 2.
5. Na etapa 2, digite um CPF inválido (`111.111.111-11`) → deve recusar.
6. Vá até a etapa 7, aceite os termos, **assine com o dedo** e envie.
7. Na etapa 8, anexe uma foto pela câmera.
8. De volta ao painel, abra o candidato → aba **Documentos** → marque *Conferido*.
9. Clique em **Baixar dossiê (PDF único)** → deve baixar um PDF com capa, índice, a
   ficha e a foto anexada.
10. Apague o candidato de teste (ou mova para *Desistiu*).

Se os 10 passos funcionarem, o sistema está no ar.

---

## 12. Atualizações futuras

Com SSH:

```bash
cd ~/www/admissao.gruporealserv.com.br
git pull
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache && php artisan route:cache && php artisan view:cache
```

Por FTP: envie os arquivos alterados, **apague a pasta `bootstrap/cache/`** (para o
Laravel reconstruir os caches) e rode as migrations pelo `instalar.php`.

**Backup antes de qualquer atualização:** exporte o banco em *Gerenciar bancos PgSQL →
Backup* e baixe a pasta `storage/app/documentos/` por FTP. Guarde também a `APP_KEY` do
`.env` — **sem ela, os CPFs e RGs cifrados não podem ser lidos de volta**.

---

## 13. Se algo der errado

| Sintoma | Causa provável | O que fazer |
| --- | --- | --- |
| Página em branco | erro de PHP com `APP_DEBUG=false` | veja `storage/logs/laravel.log` |
| `500 Server Error` logo de cara | `APP_KEY` vazia | rode `php artisan key:generate --force` |
| `could not find driver` | falta `pdo_pgsql` | abra chamado na KingHost |
| `Permission denied` ao gravar | permissões | `chmod -R 775 storage bootstrap/cache` |
| Aparece a listagem de pastas | Document Root errado | refaça o passo 6 |
| CSS não carrega (site "sem formatação") | `public/css/app.css` não subiu | reenvie a pasta `public/css/` |
| Upload falha em arquivo grande | limite do PHP | veja abaixo |
| Login não entra, sem erro | sessão sem gravar | confirme `SESSION_DRIVER=database` e que a migration rodou |

### Limite de upload

O sistema aceita até 15 MB por arquivo. Se o servidor recusar antes disso, crie um
`.user.ini` na pasta `public/`:

```ini
upload_max_filesize = 16M
post_max_size = 20M
memory_limit = 320M
max_execution_time = 180
```

Se o painel da KingHost tiver a seção **Configurações do PHP**, prefira ajustar por lá.

### Dossiê com muitos documentos

O plano tem cerca de 342 MB e **um processo de PHP**. Um dossiê com muitas fotos é a
operação mais pesada do sistema — as imagens já são reduzidas automaticamente antes de
entrar no PDF (`DOSSIE_MAX_PX`). Se um dossiê específico falhar por tempo ou memória,
baixe a ficha em PDF separadamente e reduza `DOSSIE_MAX_PX` para `1200`.

### PDFs que não entram no dossiê

Uma limitação conhecida, que aparece como **página de aviso dentro do dossiê**:

O sistema mescla PDFs com a biblioteca FPDI. A versão gratuita só abre **PDF até a
versão 1.4**. Documentos gerados por celular, pela CTPS digital e por sites do governo
costumam vir em 1.5 ou superior e **não podem ser mesclados** — no lugar deles o dossiê
traz uma página explicando e pedindo o reenvio.

Duas saídas:

1. **Sem custo:** oriente o candidato a enviar **foto (JPG)** em vez de PDF. Imagens
   sempre entram no dossiê. É o caminho natural de quem usa o celular.
2. **Com custo:** licencie o [FPDI PDF-Parser](https://www.setasign.com/fpdi-pdf-parser)
   (licença comercial, pagamento único) e instale com
   `composer require setasign/fpdi-pdf-parser`. **Nenhuma mudança de código é
   necessária** — o FPDI passa a usar o parser automaticamente e os PDFs modernos
   passam a ser mesclados.

---

## Checklist final

- [ ] Subdomínio criado e apontando para `/public`
- [ ] `https://admissao.gruporealserv.com.br/.env` retorna **erro** (não o conteúdo)
- [ ] Banco PostgreSQL criado, migrations e seeders rodados
- [ ] `APP_KEY` preenchida e `APP_DEBUG=false`
- [ ] HTTPS ativo e forçado
- [ ] `storage/` e `bootstrap/cache/` graváveis
- [ ] `public/instalar.php` **apagado** (se usou a opção sem SSH)
- [ ] `info.php` **apagado** (se usou no passo 1)
- [ ] As três senhas iniciais trocadas
- [ ] CNPJs reais das oito empresas cadastrados
- [ ] Roteiro de conferência do passo 11 executado com sucesso
- [ ] Backup do banco e da `APP_KEY` guardados
