import type {
  EtapaPipeline,
  StatusDocumento,
  StatusFicha,
  EstadoCivil,
  Escolaridade,
  Perfil,
  ModalidadeEntrevista,
  ParecerEntrevista,
  ExigenciaDocumento,
  Sexo,
} from '@prisma/client';

export const ETAPAS: EtapaPipeline[] = [
  'TRIAGEM',
  'ENTREVISTA_AGENDADA',
  'ENTREVISTADO',
  'APROVADO',
  'DOCUMENTACAO',
  'EXAME_ADMISSIONAL',
  'ADMITIDO',
  'REPROVADO',
  'DESISTIU',
  'BANCO_TALENTOS',
];

/** Etapas exibidas como colunas do kanban, na ordem do funil. */
export const ETAPAS_KANBAN: EtapaPipeline[] = [
  'TRIAGEM',
  'ENTREVISTA_AGENDADA',
  'ENTREVISTADO',
  'APROVADO',
  'DOCUMENTACAO',
  'EXAME_ADMISSIONAL',
  'ADMITIDO',
];

export const ETAPAS_ENCERRAMENTO: EtapaPipeline[] = ['REPROVADO', 'DESISTIU', 'BANCO_TALENTOS'];

export const rotuloEtapa: Record<EtapaPipeline, string> = {
  TRIAGEM: 'Cadastro/Triagem',
  ENTREVISTA_AGENDADA: 'Entrevista agendada',
  ENTREVISTADO: 'Entrevistado',
  APROVADO: 'Aprovado',
  DOCUMENTACAO: 'Documentação em conferência',
  EXAME_ADMISSIONAL: 'Exame admissional',
  ADMITIDO: 'Admitido',
  REPROVADO: 'Reprovado',
  DESISTIU: 'Desistiu',
  BANCO_TALENTOS: 'Banco de talentos',
};

export const corEtapa: Record<EtapaPipeline, string> = {
  TRIAGEM: 'bg-slate-100 text-slate-700 border-slate-200',
  ENTREVISTA_AGENDADA: 'bg-sky-100 text-sky-800 border-sky-200',
  ENTREVISTADO: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  APROVADO: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  DOCUMENTACAO: 'bg-amber-100 text-amber-800 border-amber-200',
  EXAME_ADMISSIONAL: 'bg-purple-100 text-purple-800 border-purple-200',
  ADMITIDO: 'bg-green-600 text-white border-green-700',
  REPROVADO: 'bg-red-100 text-red-800 border-red-200',
  DESISTIU: 'bg-zinc-200 text-zinc-700 border-zinc-300',
  BANCO_TALENTOS: 'bg-teal-100 text-teal-800 border-teal-200',
};

export const rotuloStatusDocumento: Record<StatusDocumento, string> = {
  PENDENTE: 'Pendente',
  ENVIADO: 'Enviado',
  CONFERIDO: 'Conferido',
  COM_PENDENCIA: 'Com pendência',
};

export const corStatusDocumento: Record<StatusDocumento, string> = {
  PENDENTE: 'bg-slate-100 text-slate-600 border-slate-200',
  ENVIADO: 'bg-sky-100 text-sky-800 border-sky-200',
  CONFERIDO: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  COM_PENDENCIA: 'bg-red-100 text-red-800 border-red-200',
};

export const rotuloStatusFicha: Record<StatusFicha, string> = {
  NAO_INICIADA: 'Não iniciada',
  EM_PREENCHIMENTO: 'Em preenchimento',
  ENVIADA: 'Enviada',
};

export const rotuloPerfil: Record<Perfil, string> = {
  ADMIN: 'Administrador',
  RECRUTADOR: 'Recrutador/Entrevistador',
  DP: 'Departamento Pessoal',
};

export const rotuloEstadoCivil: Record<EstadoCivil, string> = {
  SOLTEIRO: 'Solteiro(a)',
  CASADO: 'Casado(a)',
  DIVORCIADO: 'Divorciado(a)',
  VIUVO: 'Viúvo(a)',
  UNIAO_ESTAVEL: 'União estável',
  SEPARADO: 'Separado(a)',
};

export const rotuloEscolaridade: Record<Escolaridade, string> = {
  FUNDAMENTAL_INCOMPLETO: 'Fundamental incompleto',
  FUNDAMENTAL_COMPLETO: 'Fundamental completo',
  MEDIO_INCOMPLETO: 'Médio incompleto',
  MEDIO_COMPLETO: 'Médio completo',
  SUPERIOR_INCOMPLETO: 'Superior incompleto',
  SUPERIOR_COMPLETO: 'Superior completo',
  POS_GRADUACAO: 'Pós-graduação',
};

export const rotuloSexo: Record<Sexo, string> = {
  MASCULINO: 'Masculino',
  FEMININO: 'Feminino',
  NAO_INFORMADO: 'Não informado',
};

export const rotuloModalidade: Record<ModalidadeEntrevista, string> = {
  PRESENCIAL: 'Presencial (sede)',
  ONLINE: 'Online',
};

export const rotuloParecer: Record<ParecerEntrevista, string> = {
  APROVADO: 'Aprovado',
  REPROVADO: 'Reprovado',
  BANCO_TALENTOS: 'Banco de talentos',
};

export const rotuloExigencia: Record<ExigenciaDocumento, string> = {
  OBRIGATORIO: 'Obrigatório',
  OPCIONAL: 'Opcional',
  CONDICIONAL: 'Condicional',
};

export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;

export const TIPOS_SANGUINEOS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
