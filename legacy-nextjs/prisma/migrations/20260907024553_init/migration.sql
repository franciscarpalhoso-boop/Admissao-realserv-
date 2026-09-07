-- CreateEnum
CREATE TYPE "Perfil" AS ENUM ('ADMIN', 'RECRUTADOR', 'DP');

-- CreateEnum
CREATE TYPE "EtapaPipeline" AS ENUM ('TRIAGEM', 'ENTREVISTA_AGENDADA', 'ENTREVISTADO', 'APROVADO', 'DOCUMENTACAO', 'EXAME_ADMISSIONAL', 'ADMITIDO', 'REPROVADO', 'DESISTIU', 'BANCO_TALENTOS');

-- CreateEnum
CREATE TYPE "StatusFicha" AS ENUM ('NAO_INICIADA', 'EM_PREENCHIMENTO', 'ENVIADA');

-- CreateEnum
CREATE TYPE "StatusDocumento" AS ENUM ('PENDENTE', 'ENVIADO', 'CONFERIDO', 'COM_PENDENCIA');

-- CreateEnum
CREATE TYPE "EstadoCivil" AS ENUM ('SOLTEIRO', 'CASADO', 'DIVORCIADO', 'VIUVO', 'UNIAO_ESTAVEL', 'SEPARADO');

-- CreateEnum
CREATE TYPE "Escolaridade" AS ENUM ('FUNDAMENTAL_INCOMPLETO', 'FUNDAMENTAL_COMPLETO', 'MEDIO_INCOMPLETO', 'MEDIO_COMPLETO', 'SUPERIOR_INCOMPLETO', 'SUPERIOR_COMPLETO', 'POS_GRADUACAO');

-- CreateEnum
CREATE TYPE "ModalidadeEntrevista" AS ENUM ('PRESENCIAL', 'ONLINE');

-- CreateEnum
CREATE TYPE "ParecerEntrevista" AS ENUM ('APROVADO', 'REPROVADO', 'BANCO_TALENTOS');

-- CreateEnum
CREATE TYPE "ExigenciaDocumento" AS ENUM ('OBRIGATORIO', 'OPCIONAL', 'CONDICIONAL');

-- CreateEnum
CREATE TYPE "RegraCondicional" AS ENUM ('NENHUMA', 'EXIGE_CNH', 'SEXO_MASCULINO', 'POSSUI_FILHOS', 'FILHOS_ATE_6', 'FILHOS_7_A_14', 'CASADO_OU_UNIAO');

-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('MASCULINO', 'FEMININO', 'NAO_INFORMADO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "perfil" "Perfil" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_auditoria" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "autorLabel" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "detalhes" JSONB,
    "ip" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acessos_dossie" (
    "id" TEXT NOT NULL,
    "candidatoId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "tipo" TEXT NOT NULL,
    "referencia" TEXT,
    "ip" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "acessos_dossie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracoes" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "descricao" TEXT,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "logradouro" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "cep" TEXT,
    "responsavel" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supervisores" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "supervisores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "logradouro" TEXT,
    "numero" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "cep" TEXT,
    "empresaId" TEXT,
    "supervisorId" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "postos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funcoes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "exigeCnh" BOOLEAN NOT NULL DEFAULT false,
    "exigeSapatoPreto" BOOLEAN NOT NULL DEFAULT false,
    "avisoEspecifico" TEXT,
    "requisitos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "funcoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escalas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "horarioInicio" TEXT,
    "horarioFim" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "escalas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_checklist_padrao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER NOT NULL,
    "exigencia" "ExigenciaDocumento" NOT NULL DEFAULT 'OBRIGATORIO',
    "regra" "RegraCondicional" NOT NULL DEFAULT 'NENHUMA',
    "aceitaMulti" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "itens_checklist_padrao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidatos" (
    "id" TEXT NOT NULL,
    "tokenPublico" TEXT NOT NULL,
    "tokenExpiraEm" TIMESTAMP(3),
    "statusFicha" "StatusFicha" NOT NULL DEFAULT 'NAO_INICIADA',
    "etapa" "EtapaPipeline" NOT NULL DEFAULT 'TRIAGEM',
    "etapaAtualizadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nomeCompleto" TEXT NOT NULL,
    "telefoneContato" TEXT,
    "telefoneRecado" TEXT,
    "celularWhatsapp" TEXT,
    "email" TEXT,
    "funcaoId" TEXT,
    "tempoExperiencia" TEXT,
    "naturalidade" TEXT,
    "ufNaturalidade" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "sexo" "Sexo" NOT NULL DEFAULT 'NAO_INFORMADO',
    "estadoCivil" "EstadoCivil",
    "nomeConjuge" TEXT,
    "logradouro" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "cep" TEXT,
    "tempoResidencia" TEXT,
    "escolaridade" "Escolaridade",
    "nomeMae" TEXT,
    "nomePai" TEXT,
    "cpf" TEXT,
    "cpfCifrado" TEXT,
    "pisNit" TEXT,
    "rgNumero" TEXT,
    "rgNumeroCifrado" TEXT,
    "rgDataEmissao" TIMESTAMP(3),
    "rgOrgaoExpedidor" TEXT,
    "rgUf" TEXT,
    "cnhNumero" TEXT,
    "cnhRegistro" TEXT,
    "cnhUf" TEXT,
    "cnhDataEmissao" TIMESTAMP(3),
    "cnhValidade" TIMESTAMP(3),
    "cnhCategoria" TEXT,
    "cnhPrimeiraHabilitacao" TIMESTAMP(3),
    "ctpsNumero" TEXT,
    "ctpsSerie" TEXT,
    "ctpsUf" TEXT,
    "ctpsDigital" BOOLEAN NOT NULL DEFAULT false,
    "tituloEleitorNumero" TEXT,
    "tituloEleitorZona" TEXT,
    "tituloEleitorSecao" TEXT,
    "reservistaNumero" TEXT,
    "tipoSanguineo" TEXT,
    "numeroSapato" TEXT,
    "tamanhoCamisa" TEXT,
    "numeroCalca" TEXT,
    "aceitaEscalaRevezamento" BOOLEAN,
    "possuiParenteEmpresa" BOOLEAN,
    "parenteNome" TEXT,
    "parenteSetor" TEXT,
    "jaTrabalhouEmpresa" BOOLEAN,
    "jaTrabalhouAno" TEXT,
    "fumante" BOOLEAN,
    "desejaValeTransporte" BOOLEAN,
    "linhasOnibus" TEXT,
    "valorPassagem" DECIMAL(10,2),
    "chavePix" TEXT,
    "sobreVoce" TEXT,
    "aceiteVeracidade" BOOLEAN NOT NULL DEFAULT false,
    "aceiteLgpd" BOOLEAN NOT NULL DEFAULT false,
    "assinaturaBase64" TEXT,
    "assinaturaLocal" TEXT,
    "assinaturaData" TIMESTAMP(3),
    "consentimentoIp" TEXT,
    "consentimentoUserAgent" TEXT,
    "anonimizadoEm" TIMESTAMP(3),
    "observacoesTriagem" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidatos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "filhos" (
    "id" TEXT NOT NULL,
    "candidatoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "dataNascimento" TIMESTAMP(3),
    "cpf" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "filhos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cursos" (
    "id" TEXT NOT NULL,
    "candidatoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "instituicao" TEXT,
    "ano" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "cursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referencias" (
    "id" TEXT NOT NULL,
    "candidatoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "relacao" TEXT,
    "cidade" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "referencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empregos_anteriores" (
    "id" TEXT NOT NULL,
    "candidatoId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "naoPossui" BOOLEAN NOT NULL DEFAULT false,
    "empresa" TEXT,
    "telefone" TEXT,
    "contato" TEXT,
    "setor" TEXT,
    "cargo" TEXT,
    "dataAdmissao" TIMESTAMP(3),
    "dataSaida" TIMESTAMP(3),
    "ultimoSalario" DECIMAL(10,2),
    "motivoSaida" TEXT,

    CONSTRAINT "empregos_anteriores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos_candidato" (
    "id" TEXT NOT NULL,
    "candidatoId" TEXT NOT NULL,
    "itemChecklistId" TEXT,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "exigencia" "ExigenciaDocumento" NOT NULL DEFAULT 'OBRIGATORIO',
    "regra" "RegraCondicional" NOT NULL DEFAULT 'NENHUMA',
    "extra" BOOLEAN NOT NULL DEFAULT false,
    "status" "StatusDocumento" NOT NULL DEFAULT 'PENDENTE',
    "observacaoDp" TEXT,
    "conferidoEm" TIMESTAMP(3),
    "conferidoPor" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documentos_candidato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arquivos_documento" (
    "id" TEXT NOT NULL,
    "documentoId" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "nomeOriginal" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "enviadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enviadoPor" TEXT,

    CONSTRAINT "arquivos_documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entrevistas" (
    "id" TEXT NOT NULL,
    "candidatoId" TEXT NOT NULL,
    "entrevistadorId" TEXT,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "modalidade" "ModalidadeEntrevista" NOT NULL DEFAULT 'PRESENCIAL',
    "local" TEXT,
    "linkOnline" TEXT,
    "realizada" BOOLEAN NOT NULL DEFAULT false,
    "horarioChegada" TEXT,
    "realizadaEm" TIMESTAMP(3),
    "notaApresentacao" INTEGER,
    "notaComunicacao" INTEGER,
    "notaExperiencia" INTEGER,
    "notaDisponibilidade" INTEGER,
    "notaPontualidade" INTEGER,
    "disponibilidadeDomingos" BOOLEAN,
    "restricaoHorarioFilhos" BOOLEAN,
    "restricaoHorarioDetalhe" TEXT,
    "tempoDeslocamento" TEXT,
    "possuiCnh" BOOLEAN,
    "experienciaManobra" BOOLEAN,
    "conhecimentoInformatica" BOOLEAN,
    "experienciaMilitarSeguranca" BOOLEAN,
    "interesseCursos" BOOLEAN,
    "parecer" "ParecerEntrevista",
    "postoSugeridoId" TEXT,
    "vagasIndicadas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entrevistas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "informacoes_internas" (
    "id" TEXT NOT NULL,
    "candidatoId" TEXT NOT NULL,
    "supervisorId" TEXT,
    "postoId" TEXT,
    "escalaId" TEXT,
    "empresaId" TEXT,
    "acumuloFuncao" BOOLEAN NOT NULL DEFAULT false,
    "acumuloFuncaoQual" TEXT,
    "baseSalarial" DECIMAL(10,2),
    "valeTransporte" BOOLEAN NOT NULL DEFAULT false,
    "premioAssiduidade" BOOLEAN NOT NULL DEFAULT false,
    "outrosBeneficios" TEXT,
    "dataInicio" TIMESTAMP(3),
    "dataTreinamento" TIMESTAMP(3),
    "numeroAdmissao" TEXT,
    "admissaoSequencial" INTEGER,
    "admissaoMes" INTEGER,
    "admissaoAno" INTEGER,
    "responsavelAprovacao" TEXT,
    "assinaturaResponsavel" TEXT,
    "justificativaForcada" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "informacoes_internas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentacoes_etapa" (
    "id" TEXT NOT NULL,
    "candidatoId" TEXT NOT NULL,
    "de" "EtapaPipeline",
    "para" "EtapaPipeline" NOT NULL,
    "usuarioId" TEXT,
    "autorLabel" TEXT NOT NULL,
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentacoes_etapa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "logs_auditoria_entidade_entidadeId_idx" ON "logs_auditoria"("entidade", "entidadeId");

-- CreateIndex
CREATE INDEX "logs_auditoria_criadoEm_idx" ON "logs_auditoria"("criadoEm");

-- CreateIndex
CREATE INDEX "acessos_dossie_candidatoId_idx" ON "acessos_dossie"("candidatoId");

-- CreateIndex
CREATE UNIQUE INDEX "configuracoes_chave_key" ON "configuracoes"("chave");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_nome_key" ON "empresas"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_cnpj_key" ON "empresas"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "funcoes_nome_key" ON "funcoes"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "escalas_nome_key" ON "escalas"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "candidatos_tokenPublico_key" ON "candidatos"("tokenPublico");

-- CreateIndex
CREATE INDEX "candidatos_etapa_idx" ON "candidatos"("etapa");

-- CreateIndex
CREATE INDEX "candidatos_cpf_idx" ON "candidatos"("cpf");

-- CreateIndex
CREATE INDEX "candidatos_nomeCompleto_idx" ON "candidatos"("nomeCompleto");

-- CreateIndex
CREATE INDEX "filhos_candidatoId_idx" ON "filhos"("candidatoId");

-- CreateIndex
CREATE INDEX "cursos_candidatoId_idx" ON "cursos"("candidatoId");

-- CreateIndex
CREATE INDEX "referencias_candidatoId_idx" ON "referencias"("candidatoId");

-- CreateIndex
CREATE INDEX "empregos_anteriores_candidatoId_idx" ON "empregos_anteriores"("candidatoId");

-- CreateIndex
CREATE INDEX "documentos_candidato_candidatoId_idx" ON "documentos_candidato"("candidatoId");

-- CreateIndex
CREATE INDEX "arquivos_documento_documentoId_idx" ON "arquivos_documento"("documentoId");

-- CreateIndex
CREATE INDEX "entrevistas_candidatoId_idx" ON "entrevistas"("candidatoId");

-- CreateIndex
CREATE UNIQUE INDEX "informacoes_internas_candidatoId_key" ON "informacoes_internas"("candidatoId");

-- CreateIndex
CREATE UNIQUE INDEX "informacoes_internas_numeroAdmissao_key" ON "informacoes_internas"("numeroAdmissao");

-- CreateIndex
CREATE UNIQUE INDEX "informacoes_internas_admissaoAno_admissaoMes_admissaoSequen_key" ON "informacoes_internas"("admissaoAno", "admissaoMes", "admissaoSequencial");

-- CreateIndex
CREATE INDEX "movimentacoes_etapa_candidatoId_idx" ON "movimentacoes_etapa"("candidatoId");

-- AddForeignKey
ALTER TABLE "logs_auditoria" ADD CONSTRAINT "logs_auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acessos_dossie" ADD CONSTRAINT "acessos_dossie_candidatoId_fkey" FOREIGN KEY ("candidatoId") REFERENCES "candidatos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acessos_dossie" ADD CONSTRAINT "acessos_dossie_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postos" ADD CONSTRAINT "postos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postos" ADD CONSTRAINT "postos_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "supervisores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidatos" ADD CONSTRAINT "candidatos_funcaoId_fkey" FOREIGN KEY ("funcaoId") REFERENCES "funcoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "filhos" ADD CONSTRAINT "filhos_candidatoId_fkey" FOREIGN KEY ("candidatoId") REFERENCES "candidatos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cursos" ADD CONSTRAINT "cursos_candidatoId_fkey" FOREIGN KEY ("candidatoId") REFERENCES "candidatos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referencias" ADD CONSTRAINT "referencias_candidatoId_fkey" FOREIGN KEY ("candidatoId") REFERENCES "candidatos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empregos_anteriores" ADD CONSTRAINT "empregos_anteriores_candidatoId_fkey" FOREIGN KEY ("candidatoId") REFERENCES "candidatos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_candidato" ADD CONSTRAINT "documentos_candidato_candidatoId_fkey" FOREIGN KEY ("candidatoId") REFERENCES "candidatos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_candidato" ADD CONSTRAINT "documentos_candidato_itemChecklistId_fkey" FOREIGN KEY ("itemChecklistId") REFERENCES "itens_checklist_padrao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquivos_documento" ADD CONSTRAINT "arquivos_documento_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "documentos_candidato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entrevistas" ADD CONSTRAINT "entrevistas_candidatoId_fkey" FOREIGN KEY ("candidatoId") REFERENCES "candidatos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entrevistas" ADD CONSTRAINT "entrevistas_entrevistadorId_fkey" FOREIGN KEY ("entrevistadorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entrevistas" ADD CONSTRAINT "entrevistas_postoSugeridoId_fkey" FOREIGN KEY ("postoSugeridoId") REFERENCES "postos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "informacoes_internas" ADD CONSTRAINT "informacoes_internas_candidatoId_fkey" FOREIGN KEY ("candidatoId") REFERENCES "candidatos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "informacoes_internas" ADD CONSTRAINT "informacoes_internas_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "supervisores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "informacoes_internas" ADD CONSTRAINT "informacoes_internas_postoId_fkey" FOREIGN KEY ("postoId") REFERENCES "postos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "informacoes_internas" ADD CONSTRAINT "informacoes_internas_escalaId_fkey" FOREIGN KEY ("escalaId") REFERENCES "escalas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "informacoes_internas" ADD CONSTRAINT "informacoes_internas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_etapa" ADD CONSTRAINT "movimentacoes_etapa_candidatoId_fkey" FOREIGN KEY ("candidatoId") REFERENCES "candidatos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_etapa" ADD CONSTRAINT "movimentacoes_etapa_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
