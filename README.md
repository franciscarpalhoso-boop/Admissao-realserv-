# Sistema de Entrevista e Admissão — Grupo Real Serv

Substitui o processo em papel de recrutamento e admissão do Grupo Real Serv: o candidato
preenche a Ficha de Solicitação de Emprego e envia os documentos pelo celular, por um link
recebido no WhatsApp; o Departamento Pessoal confere tudo em um painel; e o dossiê de
admissão sai em um único PDF, pronto para arquivar ou mandar para a contabilidade.

A especificação original está em [`docs/ESPECIFICACAO.md`](docs/ESPECIFICACAO.md).

---

## Índice

- [O que já está pronto](#o-que-já-está-pronto)
- [Instalação](#instalação)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Deploy](#deploy)
- [Guia rápido para o RH](#guia-rápido-para-o-rh)
- [Decisões de arquitetura](#decisões-de-arquitetura)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Testes](#testes)
- [Limitações conhecidas](#limitações-conhecidas)

---

## O que já está pronto

Os três requisitos essenciais funcionam de ponta a ponta:

1. **Link público por WhatsApp** — o candidato abre o link no celular, preenche a ficha em
   8 etapas com salvamento parcial, assina o termo no dedo e anexa os documentos pela câmera.
   Não precisa criar conta.
2. **Painel do Departamento Pessoal** — login por e-mail e senha, kanban do pipeline, lista
   com busca e filtros, e uma página de detalhe do candidato com as abas Ficha, Documentos,
   Entrevista, Informações Internas e Histórico.
3. **PDF único em um clique** — o botão *Baixar dossiê* gera capa, índice, a ficha completa
   e todos os documentos anexados, na ordem do checklist.

Além disso: entrevista com roteiro e notas, numeração `ADM nn/mm`, exportação em xlsx/csv no
layout do eSocial, relatórios, cadastros mestres, log de auditoria e rotina de anonimização
da LGPD.

| Etapa da especificação | Situação |
| --- | --- |
| 1. Login e painel de candidatos | Pronto |
| 2. Link público, ficha e documentos pelo celular | Pronto |
| 3. Tela do DP e PDF único | Pronto |
| 4. Entrevista e pipeline | Pronto |
| 5. Informações internas, ADM e exportação | Pronto |
| 6. Relatórios, LGPD e testes | Pronto |

---

## Instalação

**Pré-requisitos:** Node.js 20+ e PostgreSQL 14+.

```bash
# 1. Dependências
npm install

# 2. Configuração — cria o .env e gera os segredos sozinho
npm run setup
# Ele avisa o que falta preencher à mão (DATABASE_URL, e APP_URL em produção).
# Rodar de novo é seguro: segredo já preenchido nunca é sobrescrito.

# 3. Banco de dados — migrações + cadastros mestres e usuários
npm run db:init

# 4. Subir
npm run dev                  # http://localhost:3000
```

<details>
<summary>Fazer os passos 2 e 3 à mão</summary>

```bash
cp .env.example .env
openssl rand -base64 32   # cole em AUTH_SECRET
openssl rand -base64 32   # cole em ENCRYPTION_KEY
# ajuste DATABASE_URL e APP_URL

npx prisma migrate deploy
npm run seed
```
</details>

O seed cria três usuários para o primeiro acesso — **troque as senhas assim que entrar**,
em *Cadastros → Usuários*. Para definir outras senhas já no seed, preencha `SENHA_ADMIN`,
`SENHA_RECRUTADOR` e `SENHA_DP` no `.env` (mínimo de 8 caracteres; deixadas em branco, valem
as da tabela). Rodar o seed de novo não altera a senha de quem já existe:

| Perfil | E-mail | Senha inicial |
| --- | --- | --- |
| Administrador | `admin@realserv.com.br` | `Admin@2024` |
| Recrutador | `recrutador@realserv.com.br` | `Recruta@2024` |
| Departamento Pessoal | `dp@realserv.com.br` | `Pessoal@2024` |

> Os CNPJs das oito empresas vêm preenchidos com valores fictícios (válidos nos dígitos
> verificadores) só para o ambiente de demonstração. Substitua pelos CNPJs reais em
> *Cadastros → Empresas* antes de usar para valer.

### Scripts

| Comando | O que faz |
| --- | --- |
| `npm run setup` | Cria o `.env` e gera os segredos (idempotente) |
| `npm run db:init` | Aplica as migrações e roda o seed |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm start` | Sobe o build de produção |
| `npm test` | Testes das regras críticas |
| `npm run typecheck` | Checagem de tipos |
| `npm run seed` | Popula cadastros mestres e usuários |
| `npm run prisma:migrate` | Cria uma migração nova em desenvolvimento |
| `npm run prisma:studio` | Abre o navegador de dados do Prisma |

---

## Variáveis de ambiente

Todas estão documentadas em [`.env.example`](.env.example). As essenciais:

| Variável | Obrigatória | Para que serve |
| --- | --- | --- |
| `DATABASE_URL` | sim | Conexão PostgreSQL. |
| `AUTH_SECRET` | sim | Assina o cookie de sessão e os links temporários. |
| `ENCRYPTION_KEY` | sim | AES-256 (32 bytes em base64) que cifra CPF e RG em repouso. |
| `APP_URL` | sim | URL pública; monta o link enviado ao candidato. |
| `STORAGE_DRIVER` | não | `local` (padrão) ou `s3`. |
| `LOCAL_STORAGE_DIR` | não | Pasta dos uploads no driver local (padrão `./.uploads`). |
| `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | se `s3` | Credenciais do storage. |
| `S3_ENDPOINT`, `S3_FORCE_PATH_STYLE` | se R2/MinIO | Endpoint alternativo. |
| `DIAS_VALIDADE_LINK` | não | Validade do link do candidato (padrão 30 dias). |

> **`ENCRYPTION_KEY` não pode ser trocada depois** sem reprocessar os dados: os CPFs e RGs
> já cifrados ficariam ilegíveis. Guarde-a junto com o backup do banco. Por isso o
> `npm run setup` nunca sobrescreve uma chave existente — se encontrar uma inválida, ele
> para com erro em vez de gerar outra por conta própria.

### Storage

| Cenário | Configuração |
| --- | --- |
| Desenvolvimento | `STORAGE_DRIVER=local` |
| AWS S3 | `STORAGE_DRIVER=s3`, `S3_ENDPOINT` vazio, região real (ex.: `sa-east-1`) |
| Cloudflare R2 | `STORAGE_DRIVER=s3`, `S3_REGION=auto`, `S3_ENDPOINT=https://<conta>.r2.cloudflarestorage.com` |
| MinIO local | `STORAGE_DRIVER=s3`, `S3_ENDPOINT=http://localhost:9000`, `S3_FORCE_PATH_STYLE=true` |

O bucket deve ser **privado**. Nenhum documento é servido por URL pública: o download passa
sempre pela rota autenticada `/api/arquivos/[id]`, que registra o acesso.

---

## Deploy

### Vercel (mais simples)

1. Conecte o repositório e configure as variáveis de ambiente do painel.
2. Use um Postgres gerenciado (Neon, Supabase, RDS) e um storage S3-compatível — o
   sistema de arquivos da Vercel é efêmero, então **`STORAGE_DRIVER=local` não serve** lá.
3. Rode `npx prisma migrate deploy` no build ou por um job de release.

### Docker / VPS

```bash
npm ci
npm run build
npx prisma migrate deploy
npm start          # atrás de um proxy reverso com HTTPS
```

Coloque a aplicação **sempre atrás de HTTPS**: o cookie de sessão só é marcado como `secure`
em produção, e a ficha trafega dados pessoais.

### Rotina de retenção (LGPD)

A anonimização de reprovados e desistentes pode ser disparada pela tela
*Cadastros → Configurações*. Para automatizar, agende um job diário chamando
`anonimizarVencidos()` de `src/server/retencao.ts` — por exemplo, com um cron que execute
`npx tsx -e "import('./src/server/retencao').then(m => m.anonimizarVencidos())"`.

---

## Guia rápido para o RH

### Recebi um currículo. E agora?

1. No painel, clique em **Novo candidato**, informe nome e celular e escolha a vaga.
2. O sistema devolve um link. Clique em **Enviar por WhatsApp** — a mensagem já vai pronta.
3. O candidato preenche pelo celular. Você acompanha pelo selo *Ficha* no painel:
   *Não iniciada → Em preenchimento → Enviada*.

O link vale 30 dias. Se expirar ou o candidato perder, abra o candidato,
clique em **Link do candidato** e gere um novo (o anterior deixa de funcionar).

### Agendar e registrar a entrevista

Na aba **Entrevista**, clique em *Agendar entrevista*, escolha data, hora e modalidade. O
botão **Confirmar por WhatsApp** manda a confirmação pronta para o candidato.

Depois da entrevista, preencha o roteiro na mesma aba: horário de chegada, notas de 1 a 5,
disponibilidade, deslocamento, CNH e o parecer final. Ao salvar, o candidato **anda sozinho
no pipeline**: aprovado vai para *Aprovado*, reprovado para *Reprovado*, e assim por diante.

### Conferir documentos

Na aba **Documentos** você vê o checklist inteiro. Cada item mostra o status e permite
visualizar o arquivo ali mesmo, sem baixar.

- **Conferido** — documento aceito.
- **Com pendência** — escreva o motivo; **o candidato lê esse texto** no link dele e pode
  reenviar sem falar com ninguém.
- **+ Adicionar documento ao checklist** — inclui um item extra só para aquele candidato.

Itens condicionais só aparecem como obrigatórios quando fazem sentido: a CNH para
manobrista, o reservista para homens, as certidões dos filhos para quem tem filhos, a
vacinação para filhos de até 6 anos e a frequência escolar dos de 7 a 14.

### Admitir

Na aba **Informações Internas**, preencha empresa contratante, posto, escala, supervisor,
salário, benefícios e as datas. Depois clique em **Mover etapa → Admitido**.

O sistema **bloqueia a admissão enquanto houver documento obrigatório sem conferência** e
mostra quais estão faltando. Se for mesmo necessário admitir antes, só o administrador
consegue, e precisa escrever uma justificativa, que fica registrada no histórico e sai
impressa na ficha.

Ao admitir, o número **ADM nn/mm** é gerado sozinho: `ADM 01/09` é a primeira admissão de
setembro. A contagem reinicia todo mês.

### Gerar o dossiê

Na página do candidato:

- **Ficha em PDF** — só a ficha, no layout do papel, para conferência ou impressão.
- **Baixar dossiê (PDF único)** — capa com o número da admissão, índice, a ficha completa e
  todos os documentos, cada bloco com sua página separadora. É o arquivo que vai para a
  contabilidade.

### Mandar as admissões do mês para a contabilidade

Em **Relatórios**, escolha mês, ano e (se quiser) a empresa, e clique em
**Baixar planilha (.xlsx)**. Vem uma linha por admitido com dados pessoais, documentos,
endereço, cargo, salário, escala e empresa, mais uma aba de dependentes para o
salário-família.

### Quem pode o quê

| | Administrador | Recrutador | Dep. Pessoal |
| --- | :---: | :---: | :---: |
| Ver painel e candidatos | ✓ | ✓ | ✓ |
| Cadastrar candidato e gerar link | ✓ | ✓ | ✓ |
| Agendar e registrar entrevistas | ✓ | ✓ | |
| Conferir documentos | ✓ | | ✓ |
| Informações internas e ADM | ✓ | | ✓ |
| Baixar dossiê | ✓ | ✓ | ✓ |
| Exportar para a contabilidade | ✓ | | ✓ |
| Cadastros mestres e usuários | ✓ | | |
| Admitir com pendências (com justificativa) | ✓ | | |

---

## Decisões de arquitetura

A stack segue o que a especificação sugeriu: **Next.js 15 (App Router) + TypeScript +
Prisma + PostgreSQL + Tailwind**, com componentes no padrão shadcn/ui copiados para
`src/components/ui` (sem dependência de runtime). Duas escolhas fogem da sugestão:

**Autenticação sem NextAuth.** O requisito é um único provedor de e-mail e senha para
usuários internos, sem OAuth, sem federação e sem cadastro público — o NextAuth v5 ainda
está em beta e traria uma dependência grande para resolver algo que são ~90 linhas.
`src/lib/auth.ts` faz sessão em cookie `httpOnly` com JWT assinado (`jose`) e senha com
bcrypt. Se um dia entrar login corporativo (Google Workspace, Microsoft), vale trocar por
NextAuth — a troca fica contida nesse arquivo e no `layout` do painel.

**Server Actions em vez de uma API REST.** Todo formulário posta direto para uma Server
Action, o que dispensa uma camada de rotas e mantém a validação no servidor. As rotas em
`src/app/api` existem só onde o navegador precisa de um arquivo binário: PDFs, documentos e
planilhas.

Outros pontos que valem registro:

- **Checklist materializado por candidato.** Ao cadastrar, o checklist padrão é copiado
  para o candidato. Mudar o checklist mestre depois não altera processos em andamento, e o
  DP pode acrescentar itens avulsos a um candidato específico.
- **Regras de obrigatoriedade separadas do banco.** `src/lib/checklist.ts` é código puro:
  recebe os itens e o perfil do candidato e diz o que falta. Por isso dá para testar sem
  subir banco, e é o mesmo cálculo que alimenta a tela, o bloqueio da admissão e o aviso no
  topo da página.
- **Numeração ADM à prova de concorrência.** O par ano/mês/sequencial tem índice único no
  banco; se dois DPs admitirem ao mesmo tempo, um recebe erro de unicidade e a operação é
  repetida com o próximo número, em vez de gerar duas admissões `ADM 07/09`.
- **Dossiê montado com `pdf-lib`.** Imagens viram páginas A4 centralizadas e PDFs são
  copiados página a página. Arquivo ilegível não derruba a geração: entra uma página de
  aviso no lugar, dizendo o que houve.

---

## Estrutura do projeto

```
prisma/
  schema.prisma           modelo de dados completo
  seed.ts                 empresas, funções, escalas, checklist, termos, usuários
src/
  app/
    login/                autenticação
    ficha/[token]/        formulário público do candidato (wizard de 8 etapas)
    painel/               kanban, candidatos, relatórios, cadastros
    api/                  PDFs, download de documentos e exportação
  components/ui/          primitivos de interface (padrão shadcn/ui)
  lib/
    validacao.ts          CPF, CNPJ, PIS e máscaras
    formato.ts            datas dd/mm/aaaa e moeda em R$
    checklist.ts          regras de obrigatoriedade dos documentos
    admissao.ts           numeração ADM nn/mm
    cripto.ts             AES-256-GCM e tokens
    auth.ts               sessão e permissões
    storage.ts            driver local ou S3-compatível
  server/
    candidatos.ts         pipeline, transições e geração do número ADM
    auditoria.ts          log de auditoria e registro de acessos
    retencao.ts           anonimização da LGPD
    exportacao.ts         planilha do eSocial
    pdf/                  ficha, dossiê e o motor de layout
scripts/
  setup.ts                prepara o .env e gera os segredos
  env-arquivo.ts          leitura/escrita do .env em funções puras
tests/                    regras críticas
```

---

## Testes

```bash
npm test
```

72 testes cobrindo as regras que não podem quebrar:

- **`validacao.test.ts`** — dígitos verificadores de CPF, CNPJ e PIS, sequências repetidas,
  máscaras e normalização de telefone para o `wa.me`.
- **`admissao.test.ts`** — formato `ADM nn/mm`, reinício da contagem a cada mês,
  sequenciais acima de 99 e rejeição de entradas inválidas.
- **`checklist.test.ts`** — obrigatoriedade por função (CNH do manobrista), por sexo
  (reservista), por estado civil e pelas faixas etárias do salário-família, incluindo os
  limites de 6/7 e 14/15 anos; e o bloqueio da admissão com documento pendente.
- **`formato.test.ts`** — datas em dd/mm/aaaa sem deslocamento de fuso, moeda em R$ e o
  ciclo de cifrar/decifrar dos dados sensíveis.
- **`seed.test.ts`** — garante que os usuários iniciais nunca sejam criados com senha em
  branco quando as variáveis do `.env.example` vêm vazias.
- **`setup.test.ts`** — leitura e escrita do `.env` sem corromper o arquivo, validação da
  chave AES-256 e o round-trip de valores base64 (que contêm `+`, `/` e `=`).

---

## Limitações conhecidas

- **Fotos em HEIC** (padrão do iPhone com "Alta eficiência") são aceitas no upload e podem
  ser baixadas, mas nem o navegador as exibe nem o `pdf-lib` as incorpora ao dossiê. A aba
  Documentos avisa o DP quando isso acontece, para pedir o reenvio antes de gerar o PDF; se
  o dossiê for gerado assim mesmo, entra uma página de aviso no lugar da imagem. A maioria
  dos iPhones já envia JPG pelo WhatsApp e pelo seletor de arquivos; se virar um problema
  recorrente, a saída é converter no servidor com `sharp` ou `heic-convert` no upload.
- **O logotipo é um bloco "RS" desenhado**, não a arte oficial. Para usar o logo real,
  coloque o PNG em `public/` e troque a chamada em `src/server/pdf/ficha.ts` por
  `doc.embedPng`.
- **A confirmação de entrevista é semiautomática**: o sistema monta a mensagem e abre o
  `wa.me` ou o cliente de e-mail, mas o envio é manual. Integrar a API oficial do WhatsApp
  Business exige conta aprovada e templates homologados pela Meta.
- **Não há envio automático de e-mail** (recuperação de senha, avisos). A troca de senha é
  feita pelo administrador em *Cadastros → Usuários*.
- **A `ENCRYPTION_KEY` não tem rotação automática.** Trocá-la exige reprocessar os registros
  cifrados.
