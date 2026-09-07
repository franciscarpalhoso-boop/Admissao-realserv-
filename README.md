# PROMPT PARA O CLAUDE CODE: SISTEMA DE ENTREVISTA E ADMISSÃO DO GRUPO REAL SERV

## Contexto

Você vai construir um sistema web completo de recrutamento, entrevista e admissão para o Grupo Real Serv, grupo brasileiro de serviços de condomínios e facilities (portaria, controle de acesso, zeladoria, limpeza, copeira, auxiliar de escritório, manobrista, recepcionista), com sede em Santos/SP. O grupo tem oito empresas (CNPJs distintos): Real Serv First, Second, Fourth, Fifth, Sixth, Seventh, Eighth e Ninth. Os funcionários são contratados pela CLT e alocados em postos de trabalho (condomínios clientes), em escalas 5x1, 6x1 ou 12x36.

Hoje o processo é feito em papel: o candidato preenche à mão uma “Ficha de Solicitação de Emprego” de 4 páginas, entrega currículo e cópias de documentos, o entrevistador anota observações à mão no currículo e o RH monta um dossiê físico numerado (ex.: “ADM 01/09” = primeira admissão de setembro). O sistema deve substituir integralmente esse fluxo, reproduzindo todos os campos da ficha em papel e reunindo os documentos digitalizados.

## Requisitos essenciais (prioridade máxima)

Estes três pontos são o núcleo do sistema e devem funcionar antes de qualquer outra coisa:

1. O candidato preenche a ficha e anexa todos os documentos online, pelo celular, por meio de um link público enviado por WhatsApp (sem precisar criar conta).
1. O Departamento Pessoal entra no sistema com login e senha e vê, em um painel, todos os candidatos, a ficha preenchida e os documentos anexados.
1. Com um clique, o DP baixa um PDF único do candidato contendo a ficha completa mais todos os documentos anexados, na ordem do checklist, pronto para arquivar ou enviar à contabilidade.

## Stack sugerida

Use Next.js (App Router) + TypeScript + Prisma + PostgreSQL, com Tailwind e shadcn/ui no front. Upload de arquivos em storage S3-compatível (aceite variável de ambiente para AWS S3, Cloudflare R2 ou MinIO local). Autenticação com NextAuth (e-mail/senha) e controle de acesso por perfil. Se julgar outra stack claramente melhor para o caso, justifique antes de começar. Todo o sistema deve ser em português do Brasil, com datas em dd/mm/aaaa, moeda em R$ e máscaras de CPF, CEP, telefone e PIS.

## Perfis de usuário

1. Administrador (Diretoria/RH): acesso total, cadastros mestres, relatórios, exclusão.
1. Recrutador/Entrevistador: cria vagas, agenda e conduz entrevistas, preenche a avaliação, movimenta o candidato no pipeline.
1. Departamento Pessoal: conferência de documentos, preenchimento das informações internas, geração da ficha em PDF e exportação para a contabilidade.
1. Candidato: acessa apenas por link público com token (sem cadastro), preenche a ficha e envia documentos pelo celular.

## Cadastros mestres

- Empresas do grupo (nome, CNPJ, endereço, responsável).
- Postos de trabalho (nome do condomínio, endereço, cidade, empresa contratante, supervisor responsável).
- Funções (controlador de acesso, porteiro, zelador, auxiliar de limpeza, copeira, auxiliar de escritório, manobrista, recepcionista), cada uma com requisitos configuráveis (ex.: manobrista exige CNH válida; portaria exige sapato preto).
- Escalas (5x1, 6x1, 12x36, com horários).
- Supervisores.
- Checklist de documentos admissionais configurável (ver lista abaixo).

## Pipeline do candidato (kanban + lista)

Etapas, com data/hora e usuário responsável em cada mudança:

1. Cadastro/Triagem (currículo recebido)
1. Entrevista agendada
1. Entrevistado (aguardando decisão)
1. Aprovado (aguardando documentação)
1. Documentação em conferência
1. Exame admissional
1. Admitido (gera número sequencial “ADM nn/mm” por mês)
1. Reprovado / Desistiu / Banco de talentos

Cada candidato tem uma página de detalhe com abas: Ficha, Documentos, Entrevista, Informações Internas, Histórico.

## Ficha de Solicitação de Emprego (formulário do candidato)

Reproduza exatamente os campos da ficha em papel, em etapas (wizard) responsivo para celular, com salvamento parcial:

Etapa 1, Dados pessoais: nome completo; telefones de contato; celular (WhatsApp); vaga pretendida (select de funções); tempo de experiência na vaga; naturalidade; data de nascimento; estado civil; nome do cônjuge; endereço (rua, número, complemento, bairro, cidade, UF, CEP com busca automática via ViaCEP); tempo de residência; escolaridade; nome da mãe; nome do pai; e-mail.

Etapa 2, Documentação: CPF (validar dígitos); nº PIS/NIT; RG, data de emissão e órgão expedidor/UF; CNH (número, nº de registro, UF, data de emissão, validade, categoria, data da 1ª habilitação); CTPS (número e série, ou indicação de CTPS digital); título de eleitor (inscrição, zona, seção); certificado militar/reservista (número); tipo sanguíneo; quantidade de filhos e, para cada filho, nome, data de nascimento e CPF (usados para salário-família e IR).

Etapa 3, Treinamentos e cursos: até 6 itens (nome do curso, instituição, ano). Referências: até 3 (nome, telefone, parentesco/relação, cidade).

Etapa 4, Empregos anteriores (último, penúltimo, antepenúltimo, todos obrigatórios ou marcar “não possui”): empresa, telefone, contato, setor, cargo, data de admissão, data de saída, último salário, motivo da saída.

Etapa 5, Uniforme: nº do sapato, tamanho de camisa/blusa, nº da calça. Exibir aviso automático quando a vaga for portaria: “Candidatos à vaga de portaria devem providenciar sapato preto”.

Etapa 6, Questionário: (1) concorda em trabalhar em escala de revezamento, inclusive domingos e feriados? (2) tem parente na empresa? nome e setor; (3) já trabalhou nesta empresa? em que ano; (4) é fumante? (5) deseja vale-transporte? linhas de ônibus e valor da passagem; chave PIX; (6) texto livre “Escreva, em 5 linhas, sobre você” (limite de caracteres).

Etapa 7, Declaração e assinatura: aceite do termo de veracidade das informações e do termo de consentimento LGPD (texto configurável pelo admin), assinatura por desenho em canvas (touch), data e local preenchidos automaticamente, registro de IP e hora.

## Upload de documentos (aba Documentos)

Checklist admissional padrão, cada item com status (pendente, enviado, conferido, com pendência), upload de imagem ou PDF direto da câmera do celular, visualizador embutido e campo de observação do DP:

- Currículo
- RG (frente e verso) ou RG digital
- CPF
- CTPS digital (print do app) ou CTPS física
- Extrato/consulta do FGTS ou CTPS digital com vínculos
- PIS/NIT
- Título de eleitor
- CNH (obrigatório para manobrista; opcional para os demais)
- Certificado de reservista/alistamento militar (homens)
- Comprovante de residência atualizado (aceitar conta de consumo, contrato ou nota fiscal em nome do candidato)
- Certidão de casamento ou união estável
- Certidão de nascimento dos filhos
- RG/CPF dos filhos
- Carteira de vacinação dos filhos até 6 anos (salário-família)
- Comprovante de escolaridade/frequência escolar dos filhos de 7 a 14 anos (salário-família)
- Certificado de escolaridade
- Certificados de cursos (ex.: brigada de incêndio, controlador de acesso)
- Foto 3x4
- Exame admissional (ASO)
- Comprovante de conta bancária ou chave PIX

O DP deve conseguir adicionar itens extras ao checklist de um candidato específico. O sistema só permite mover para “Admitido” quando todos os itens obrigatórios estiverem conferidos (admin pode forçar com justificativa).

## Entrevista (aba Entrevista)

- Agendamento com data, hora, local (presencial na sede ou online), entrevistador, envio de confirmação por WhatsApp (link wa.me pré-preenchido) e e-mail.
- Roteiro de entrevista configurável, com as observações que hoje o entrevistador anota à mão: pontualidade (horário de chegada), apresentação pessoal, comunicação, experiência na função, disponibilidade de horário e dias (inclusive domingos/feriados), restrição de horário por filhos menores, distância/tempo de deslocamento até o posto, possui CNH e experiência em estacionamento/manobra, conhecimento básico de informática, experiência militar ou em segurança, interesse em cursos.
- Notas de 1 a 5 por critério, parecer final (aprovado / reprovado / banco de talentos), vaga(s) indicada(s), posto sugerido e campo de observações livres.
- Registro de quem entrevistou, data e hora.

## Informações Internas (aba do DP)

Nome do supervisor, posto, escala, empresa contratante (uma das oito), acúmulo de função (sim/não e qual), base salarial, benefícios (vale-transporte, assiduidade, outros), data de início, data do treinamento/integração, número da admissão (ADM nn/mm, gerado automaticamente), responsável pela aprovação e assinatura digital do responsável.

## Saídas e integrações

1. Geração da Ficha de Solicitação de Emprego completa em PDF, com o layout equivalente ao formulário em papel (logo do Grupo Real Serv no cabeçalho, seções na mesma ordem, assinaturas), para arquivo e impressão.
1. Geração do dossiê de admissão em PDF único: ficha + todos os documentos enviados, na ordem do checklist, com capa e índice.
1. Exportação dos dados admissionais em planilha (xlsx/csv) no layout que a contabilidade usa para lançar no eSocial: dados pessoais, documentos, endereço, dependentes, cargo, salário, escala, empresa, data de admissão.
1. Relatórios: admissões por mês e por empresa, candidatos por etapa, tempo médio entre entrevista e admissão, documentos pendentes, banco de talentos por função e cidade.
1. Log de auditoria de todas as alterações (quem, quando, o quê).

## LGPD e segurança

- Consentimento explícito do candidato registrado com data, hora e IP.
- Dados sensíveis (CPF, RG, documentos) criptografados em repouso; links de download expiram.
- Política de retenção configurável: candidatos reprovados/desistentes são anonimizados após X meses (padrão 6), salvo se marcados como banco de talentos.
- Todos os acessos ao dossiê ficam registrados.
- Não expor documentos em URLs públicas.

## Entregáveis

1. Modelo de dados (schema Prisma) com todas as entidades acima.
1. Aplicação funcional com as telas: login, painel/kanban, lista de candidatos, detalhe do candidato (5 abas), formulário público do candidato (wizard), cadastros mestres, relatórios.
1. Geração de PDF (ficha e dossiê) e exportação xlsx.
1. Seed com as oito empresas, as funções, as escalas e o checklist padrão.
1. README com instruções de instalação, variáveis de ambiente, deploy e um guia rápido para o RH.
1. Testes básicos das regras críticas: validação de CPF, geração do número ADM, bloqueio de admissão com documentos pendentes, regras de obrigatoriedade por função.

Comece apresentando o plano de arquitetura e o schema; aguarde minha aprovação antes de gerar o código. Depois implemente nesta ordem, mostrando o que foi feito ao fim de cada etapa:

1. Login com usuário e senha (perfis admin, recrutador, DP) e painel de candidatos.
1. Link público para o candidato preencher a ficha e anexar os documentos pelo celular.
1. Tela do DP para visualizar ficha e documentos e gerar o PDF único do candidato.
1. Entrevista e pipeline.
1. Informações internas, numeração ADM e exportação para a contabilidade.
1. Relatórios, LGPD e testes.

A versão mínima utilizável é o resultado das etapas 1 a 3; entregue-a funcionando antes de avançar.
