# Sistema de Entrevista e Admissão — Grupo Real Serv

Substitui o processo em papel de recrutamento e admissão do Grupo Real Serv: o candidato
preenche a Ficha de Solicitação de Emprego e envia os documentos pelo celular, por um link
recebido no WhatsApp; o Departamento Pessoal confere tudo em um painel; e o dossiê de
admissão sai em um único PDF, pronto para arquivar ou mandar para a contabilidade.

**Laravel 11 + PostgreSQL + Blade**, feito para rodar em hospedagem compartilhada com
PHP 8.2 e **sem Node.js no servidor**.

- Para publicar: **[`DEPLOY-KINGHOST.md`](DEPLOY-KINGHOST.md)**
- Especificação original: [`docs/ESPECIFICACAO.md`](docs/ESPECIFICACAO.md)

---

## O que está pronto

Os três requisitos essenciais funcionam de ponta a ponta:

1. **Link público por WhatsApp** — o candidato abre no celular, preenche a ficha em 8
   etapas com salvamento a cada etapa, assina no dedo e anexa documentos pela câmera.
   Sem cadastro.
2. **Painel do Departamento Pessoal** — login por e-mail e senha, kanban do pipeline,
   lista com busca e filtros, e a página do candidato com as abas Ficha, Documentos,
   Entrevista, Informações Internas e Histórico.
3. **PDF único em um clique** — capa com o número da admissão, índice, a ficha completa
   e todos os anexos, na ordem do checklist.

Também: numeração `ADM nn/mm` por mês, bloqueio da admissão com documentos pendentes,
regras condicionais do checklist, log de auditoria e registro de todo acesso a documento.

| Etapa da especificação | Situação |
| --- | --- |
| 1. Login e painel de candidatos | Pronto |
| 2. Link público, ficha e documentos pelo celular | Pronto |
| 3. Tela do DP e PDF único | Pronto |
| 4. Entrevista e pipeline | Pipeline pronto; agendamento e roteiro da entrevista pendentes |
| 5. Informações internas, ADM e exportação | Internas e ADM prontos; exportação xlsx pendente |
| 6. Relatórios, LGPD e testes | Auditoria e testes prontos; relatórios e anonimização pendentes |

---

## Rodar no seu computador

**Requisitos:** PHP 8.2+ (com `pdo_pgsql`, `gd`, `mbstring`), Composer e PostgreSQL.

```bash
composer install
cp .env.example .env
php artisan key:generate

# Ajuste DB_DATABASE, DB_USERNAME e DB_PASSWORD no .env, depois:
php artisan migrate
php artisan db:seed

php artisan serve    # http://127.0.0.1:8000
```

Usuários criados pelo seeder — **troque as senhas no primeiro acesso**:

| Perfil | E-mail | Senha inicial |
| --- | --- | --- |
| Administrador | `admin@realserv.com.br` | `Admin@2024` |
| Recrutador | `recrutador@realserv.com.br` | `Recruta@2024` |
| Departamento Pessoal | `dp@realserv.com.br` | `Pessoal@2024` |

Para definir outras senhas já na instalação, preencha `SENHA_ADMIN`, `SENHA_RECRUTADOR`
e `SENHA_DP` no `.env` (mínimo 8 caracteres). Rodar o seeder de novo **não** troca a
senha de quem já existe.

> Os CNPJs das oito empresas vêm com valores fictícios (dígitos verificadores válidos)
> só para demonstração. Substitua pelos reais antes de usar para valer.

### Alterar o CSS

O Tailwind é compilado **no desenvolvimento** e o resultado (`public/css/app.css`) vai
versionado — o servidor não precisa de Node:

```bash
npm install
npm run css
```

---

## Testes

```bash
php artisan test
```

26 testes das regras que não podem quebrar:

- **`DocumentosTest`** — dígitos verificadores de CPF, CNPJ e PIS, sequências repetidas,
  máscaras e normalização de telefone para o `wa.me`.
- **`AdmissaoTest`** — formato `ADM nn/mm`, reinício da contagem a cada mês, sequenciais
  acima de 99 e rejeição de entradas inválidas.
- **`ChecklistTest`** — obrigatoriedade por função (CNH do manobrista), por sexo
  (reservista), por estado civil e pelas faixas etárias do salário-família, incluindo os
  limites de 6/7 e 14/15 anos; e o bloqueio da admissão com documento pendente.

---

## Como está organizado

```
app/
  Suporte/            regras puras, testáveis sem banco
    Documentos.php      CPF, CNPJ, PIS e máscaras
    Admissao.php        numeração ADM nn/mm
    Checklist.php       obrigatoriedade dos documentos
  Servicos/
    Pipeline.php        transições de etapa e geração do número ADM
    GeradorFicha.php    ficha em PDF (dompdf)
    GeradorDossie.php   dossiê único (FPDI + redução de imagens)
    ArmazenamentoDocumentos.php   disco privado
    Auditoria.php       log e registro de acessos
  Http/Controllers/
    FichaPublicaController.php    formulário do candidato (sem login)
    CandidatoController.php       painel do DP
    PdfController.php             ficha e dossiê
    ArquivoController.php         download autenticado
resources/views/
  ficha/etapas/       as 8 etapas do formulário público
  painel/abas/        as 5 abas da página do candidato
  pdf/ficha.blade.php layout da ficha em PDF
public/instalar.php   instalador para hospedagem sem SSH (apagar após usar)
legacy-nextjs/        implementação anterior em Next.js (pode ser removida)
```

### Decisões que valem registro

- **Documentos fora da pasta pública.** Ficam em `storage/app/documentos/`, sem URL
  direta. O download passa pela rota `/arquivos/{id}`, que exige sessão e registra quem
  acessou — importante em hospedagem compartilhada.
- **CPF e RG cifrados em repouso**, com a `APP_KEY` do Laravel. Guarde essa chave junto
  com o backup do banco: sem ela os dados cifrados não voltam.
- **Checklist copiado para o candidato** no cadastro. Mudar o checklist mestre depois
  não altera processos em andamento, e o DP pode acrescentar itens avulsos.
- **Regras separadas do banco.** `app/Suporte/` é código puro: dá para testar sem subir
  PostgreSQL, e é o mesmo cálculo que alimenta a tela, o bloqueio da admissão e o aviso
  no topo da página.
- **Numeração ADM à prova de concorrência.** O par ano/mês/sequencial tem índice único;
  se dois DPs admitirem ao mesmo tempo, um recebe erro de unicidade e a operação é
  repetida com o próximo número.
- **Imagens reduzidas antes de entrar no dossiê** (`DOSSIE_MAX_PX`). O php-fpm do plano
  tem ~342 MB e um processo: embutir fotos de 12 MP em tamanho original estoura.
- **Sem fila e sem worker.** `QUEUE_CONNECTION=sync` — a hospedagem não mantém processo
  em segundo plano.

---

## Limitações conhecidas

- **PDFs modernos não entram no dossiê.** O FPDI gratuito só importa **PDF até a versão
  1.4**; scans de celular, CTPS digital e sites do governo costumam sair em 1.5+. Esses
  arquivos viram uma **página de aviso dentro do dossiê**, pedindo o reenvio como foto.
  Duas saídas: orientar o envio em JPG (que é o natural no celular), ou licenciar o
  [FPDI PDF-Parser](https://www.setasign.com/fpdi-pdf-parser) e instalar com
  `composer require setasign/fpdi-pdf-parser` — **sem mudar código**, o FPDI passa a
  usá-lo automaticamente.
- **Capa e separadores do dossiê saem sem acento** ("Dossie de admissao"). São
  desenhados pelo FPDF, cujas fontes internas não cobrem UTF-8. **A ficha em si — o
  documento que vale — tem os acentos corretos**, porque é gerada pelo dompdf com
  DejaVu Sans.
- **Fotos em HEIC** (iPhone) são aceitas e podem ser baixadas, mas nem o navegador as
  exibe nem entram no dossiê. A aba Documentos avisa o DP para pedir o reenvio.
- **O logotipo é um bloco "RS" desenhado**, não a arte oficial.
- **Confirmação de entrevista é semiautomática**: o sistema monta a mensagem e abre o
  `wa.me`; o envio é manual.
- **Sem envio de e-mail** (recuperação de senha, avisos). A troca de senha é feita pelo
  administrador em Cadastros.
