import { PrismaClient, type ExigenciaDocumento, type RegraCondicional } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Os CNPJs abaixo são fictícios (com dígitos verificadores válidos) e servem
 * apenas para o ambiente de demonstração. Substitua pelos CNPJs reais em
 * Cadastros > Empresas antes de usar em produção.
 */
const EMPRESAS = [
  { nome: 'Real Serv First', cnpj: '11222333000181' },
  { nome: 'Real Serv Second', cnpj: '11444777000161' },
  { nome: 'Real Serv Fourth', cnpj: '19131243000197' },
  { nome: 'Real Serv Fifth', cnpj: '34028316000103' },
  { nome: 'Real Serv Sixth', cnpj: '33000167000101' },
  { nome: 'Real Serv Seventh', cnpj: '60746948000112' },
  { nome: 'Real Serv Eighth', cnpj: '47960950000121' },
  { nome: 'Real Serv Ninth', cnpj: '61186680000174' },
];

const FUNCOES = [
  { nome: 'Controlador de acesso', exigeCnh: false, exigeSapatoPreto: true, requisitos: ['Curso de controlador de acesso desejável', 'Sapato preto'] },
  { nome: 'Porteiro', exigeCnh: false, exigeSapatoPreto: true, requisitos: ['Sapato preto'], avisoEspecifico: 'Candidatos à vaga de portaria devem providenciar sapato preto.' },
  { nome: 'Zelador', exigeCnh: false, exigeSapatoPreto: false, requisitos: ['Noções de manutenção predial'] },
  { nome: 'Auxiliar de limpeza', exigeCnh: false, exigeSapatoPreto: false, requisitos: [] },
  { nome: 'Copeira', exigeCnh: false, exigeSapatoPreto: false, requisitos: ['Noções de higiene e manipulação de alimentos'] },
  { nome: 'Auxiliar de escritório', exigeCnh: false, exigeSapatoPreto: false, requisitos: ['Informática básica'] },
  { nome: 'Manobrista', exigeCnh: true, exigeSapatoPreto: false, requisitos: ['CNH válida', 'Experiência em manobra/estacionamento'] },
  { nome: 'Recepcionista', exigeCnh: false, exigeSapatoPreto: false, requisitos: ['Boa comunicação'] },
];

const ESCALAS = [
  { nome: '5x1', descricao: 'Cinco dias de trabalho por um de folga', horarioInicio: '08:00', horarioFim: '17:00' },
  { nome: '6x1', descricao: 'Seis dias de trabalho por um de folga', horarioInicio: '07:00', horarioFim: '15:20' },
  { nome: '12x36', descricao: 'Doze horas de trabalho por trinta e seis de descanso', horarioInicio: '07:00', horarioFim: '19:00' },
];

const CHECKLIST: Array<{
  nome: string;
  descricao?: string;
  exigencia: ExigenciaDocumento;
  regra: RegraCondicional;
  aceitaMulti?: boolean;
}> = [
  { nome: 'Currículo', exigencia: 'OBRIGATORIO', regra: 'NENHUMA' },
  { nome: 'RG (frente e verso) ou RG digital', exigencia: 'OBRIGATORIO', regra: 'NENHUMA', aceitaMulti: true },
  { nome: 'CPF', exigencia: 'OBRIGATORIO', regra: 'NENHUMA' },
  { nome: 'CTPS digital (print do app) ou CTPS física', exigencia: 'OBRIGATORIO', regra: 'NENHUMA', aceitaMulti: true },
  { nome: 'Extrato/consulta do FGTS ou CTPS digital com vínculos', exigencia: 'OBRIGATORIO', regra: 'NENHUMA' },
  { nome: 'PIS/NIT', exigencia: 'OBRIGATORIO', regra: 'NENHUMA' },
  { nome: 'Título de eleitor', exigencia: 'OBRIGATORIO', regra: 'NENHUMA' },
  { nome: 'CNH', descricao: 'Obrigatório para manobrista; opcional para as demais funções.', exigencia: 'CONDICIONAL', regra: 'EXIGE_CNH' },
  { nome: 'Certificado de reservista/alistamento militar', descricao: 'Exigido para candidatos do sexo masculino.', exigencia: 'CONDICIONAL', regra: 'SEXO_MASCULINO' },
  { nome: 'Comprovante de residência atualizado', descricao: 'Conta de consumo, contrato de locação ou nota fiscal em nome do candidato.', exigencia: 'OBRIGATORIO', regra: 'NENHUMA' },
  { nome: 'Certidão de casamento ou união estável', exigencia: 'CONDICIONAL', regra: 'CASADO_OU_UNIAO' },
  { nome: 'Certidão de nascimento dos filhos', exigencia: 'CONDICIONAL', regra: 'POSSUI_FILHOS', aceitaMulti: true },
  { nome: 'RG/CPF dos filhos', exigencia: 'CONDICIONAL', regra: 'POSSUI_FILHOS', aceitaMulti: true },
  { nome: 'Carteira de vacinação dos filhos até 6 anos', descricao: 'Necessária para o salário-família.', exigencia: 'CONDICIONAL', regra: 'FILHOS_ATE_6', aceitaMulti: true },
  { nome: 'Comprovante de frequência escolar dos filhos de 7 a 14 anos', descricao: 'Necessário para o salário-família.', exigencia: 'CONDICIONAL', regra: 'FILHOS_7_A_14', aceitaMulti: true },
  { nome: 'Certificado de escolaridade', exigencia: 'OBRIGATORIO', regra: 'NENHUMA' },
  { nome: 'Certificados de cursos', descricao: 'Ex.: brigada de incêndio, controlador de acesso.', exigencia: 'OPCIONAL', regra: 'NENHUMA', aceitaMulti: true },
  { nome: 'Foto 3x4', exigencia: 'OBRIGATORIO', regra: 'NENHUMA' },
  { nome: 'Exame admissional (ASO)', exigencia: 'OBRIGATORIO', regra: 'NENHUMA' },
  { nome: 'Comprovante de conta bancária ou chave PIX', exigencia: 'OBRIGATORIO', regra: 'NENHUMA' },
];

const TERMO_VERACIDADE =
  'Declaro que todas as informações prestadas nesta Ficha de Solicitação de Emprego são verdadeiras e completas, ' +
  'assumindo inteira responsabilidade por elas. Estou ciente de que a omissão ou a inexatidão de qualquer informação ' +
  'pode acarretar o indeferimento da minha candidatura ou, se já admitido, a rescisão do contrato de trabalho por justa causa.';

const TERMO_LGPD =
  'Autorizo o Grupo Real Serv a coletar, armazenar e tratar os meus dados pessoais e os dados pessoais dos meus dependentes ' +
  'informados nesta ficha, exclusivamente para as finalidades de recrutamento, seleção, admissão e cumprimento de obrigações ' +
  'legais e trabalhistas, nos termos da Lei nº 13.709/2018 (LGPD). Estou ciente de que posso solicitar a qualquer momento a ' +
  'confirmação do tratamento, o acesso, a correção ou a exclusão dos meus dados, pelos canais de atendimento do Grupo Real Serv, ' +
  'e de que os dados de candidatos não aprovados são anonimizados após o prazo de retenção definido na política interna.';

async function main() {
  console.log('Populando cadastros mestres...');

  for (const empresa of EMPRESAS) {
    await prisma.empresa.upsert({
      where: { cnpj: empresa.cnpj },
      update: { nome: empresa.nome },
      create: { ...empresa, cidade: 'Santos', uf: 'SP' },
    });
  }

  for (const funcao of FUNCOES) {
    await prisma.funcao.upsert({
      where: { nome: funcao.nome },
      update: {
        exigeCnh: funcao.exigeCnh,
        exigeSapatoPreto: funcao.exigeSapatoPreto,
        requisitos: funcao.requisitos,
        avisoEspecifico: funcao.avisoEspecifico ?? null,
      },
      create: {
        nome: funcao.nome,
        exigeCnh: funcao.exigeCnh,
        exigeSapatoPreto: funcao.exigeSapatoPreto,
        requisitos: funcao.requisitos,
        avisoEspecifico: funcao.avisoEspecifico ?? null,
      },
    });
  }

  for (const escala of ESCALAS) {
    await prisma.escala.upsert({
      where: { nome: escala.nome },
      update: escala,
      create: escala,
    });
  }

  const checklistExistente = await prisma.itemChecklistPadrao.count();
  if (checklistExistente === 0) {
    for (const [indice, item] of CHECKLIST.entries()) {
      await prisma.itemChecklistPadrao.create({
        data: {
          nome: item.nome,
          descricao: item.descricao ?? null,
          ordem: indice + 1,
          exigencia: item.exigencia,
          regra: item.regra,
          aceitaMulti: item.aceitaMulti ?? false,
        },
      });
    }
    console.log(`Checklist padrão criado com ${CHECKLIST.length} itens.`);
  } else {
    console.log('Checklist padrão já existe — mantido como está.');
  }

  for (const [chave, valor, descricao] of [
    ['TERMO_VERACIDADE', TERMO_VERACIDADE, 'Termo de veracidade exibido na etapa 7 da ficha'],
    ['TERMO_LGPD', TERMO_LGPD, 'Termo de consentimento LGPD exibido na etapa 7 da ficha'],
    ['RETENCAO_MESES', '6', 'Meses até anonimizar candidatos reprovados/desistentes'],
    ['LOCAL_ASSINATURA', 'Santos/SP', 'Local preenchido automaticamente na assinatura'],
  ] as const) {
    await prisma.configuracao.upsert({
      where: { chave },
      update: { descricao },
      create: { chave, valor, descricao },
    });
  }

  // Supervisores e postos de exemplo — ajuste ou remova em produção.
  const supervisor = await prisma.supervisor.findFirst({ where: { nome: 'Supervisor Exemplo' } });
  if (!supervisor) {
    const criado = await prisma.supervisor.create({
      data: { nome: 'Supervisor Exemplo', telefone: '(13) 99999-0000' },
    });
    const primeiraEmpresa = await prisma.empresa.findFirst({ orderBy: { nome: 'asc' } });
    await prisma.posto.create({
      data: {
        nome: 'Condomínio Edifício Exemplo',
        logradouro: 'Av. Ana Costa',
        numero: '100',
        bairro: 'Gonzaga',
        cidade: 'Santos',
        uf: 'SP',
        empresaId: primeiraEmpresa?.id ?? null,
        supervisorId: criado.id,
      },
    });
  }

  console.log('Criando usuários iniciais...');

  /**
   * Lê a senha da variável de ambiente. Uma variável vazia (como vem no
   * .env.example) conta como "não informada" e cai no padrão — usar `??` aqui
   * criaria os usuários com senha em branco. Senha curta é erro, não aviso.
   */
  function senhaInicial(variavel: string, padrao: string): string {
    const bruta = (process.env[variavel] ?? '').trim();
    if (bruta === '') return padrao;
    if (bruta.length < 8) {
      throw new Error(`${variavel} deve ter pelo menos 8 caracteres (recebeu ${bruta.length}).`);
    }
    return bruta;
  }

  const usuarios = [
    { nome: 'Administrador do Sistema', email: 'admin@realserv.com.br', perfil: 'ADMIN' as const, senha: senhaInicial('SENHA_ADMIN', 'Admin@2024') },
    { nome: 'Usuário Recrutamento', email: 'recrutador@realserv.com.br', perfil: 'RECRUTADOR' as const, senha: senhaInicial('SENHA_RECRUTADOR', 'Recruta@2024') },
    { nome: 'Usuário DP', email: 'dp@realserv.com.br', perfil: 'DP' as const, senha: senhaInicial('SENHA_DP', 'Pessoal@2024') },
  ];

  for (const usuario of usuarios) {
    const existente = await prisma.usuario.findUnique({ where: { email: usuario.email } });
    await prisma.usuario.upsert({
      where: { email: usuario.email },
      update: { nome: usuario.nome, perfil: usuario.perfil },
      create: {
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        senhaHash: await bcrypt.hash(usuario.senha, 10),
      },
    });
    // A senha do usuário que já existia não é alterada — não faz sentido exibi-la.
    console.log(
      existente
        ? `  ${usuario.email} (já existia, senha mantida)`
        : `  ${usuario.email} / ${usuario.senha}`,
    );
  }

  console.log('\nSeed concluído. Troque as senhas no primeiro acesso.');
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
