import 'server-only';
import ExcelJS from 'exceljs';
import { prisma } from '@/lib/prisma';
import { candidatoCompletoInclude, type CandidatoCompleto } from '@/server/candidatos';
import { formatarData } from '@/lib/formato';
import { mascararCep, mascararCpf, mascararPis, mascararTelefone } from '@/lib/validacao';
import { rotuloEscolaridade, rotuloEstadoCivil, rotuloSexo } from '@/lib/labels';

/**
 * Layout de exportação para a contabilidade lançar no eSocial.
 * Uma linha por admitido, mais uma aba de dependentes.
 */
const COLUNAS = [
  { chave: 'numeroAdmissao', titulo: 'Nº Admissão', largura: 12 },
  { chave: 'empresa', titulo: 'Empresa contratante', largura: 24 },
  { chave: 'cnpj', titulo: 'CNPJ', largura: 20 },
  { chave: 'nome', titulo: 'Nome completo', largura: 32 },
  { chave: 'cpf', titulo: 'CPF', largura: 16 },
  { chave: 'pis', titulo: 'PIS/NIT', largura: 16 },
  { chave: 'dataNascimento', titulo: 'Data de nascimento', largura: 16 },
  { chave: 'sexo', titulo: 'Sexo', largura: 12 },
  { chave: 'estadoCivil', titulo: 'Estado civil', largura: 16 },
  { chave: 'nomeMae', titulo: 'Nome da mãe', largura: 30 },
  { chave: 'nomePai', titulo: 'Nome do pai', largura: 30 },
  { chave: 'naturalidade', titulo: 'Naturalidade', largura: 20 },
  { chave: 'escolaridade', titulo: 'Escolaridade', largura: 22 },
  { chave: 'rg', titulo: 'RG', largura: 16 },
  { chave: 'rgOrgao', titulo: 'RG órgão/UF', largura: 14 },
  { chave: 'rgEmissao', titulo: 'RG emissão', largura: 14 },
  { chave: 'ctps', titulo: 'CTPS', largura: 18 },
  { chave: 'tituloEleitor', titulo: 'Título de eleitor', largura: 18 },
  { chave: 'reservista', titulo: 'Reservista', largura: 16 },
  { chave: 'cnh', titulo: 'CNH', largura: 16 },
  { chave: 'logradouro', titulo: 'Logradouro', largura: 30 },
  { chave: 'numero', titulo: 'Número', largura: 10 },
  { chave: 'complemento', titulo: 'Complemento', largura: 16 },
  { chave: 'bairro', titulo: 'Bairro', largura: 20 },
  { chave: 'cidade', titulo: 'Cidade', largura: 20 },
  { chave: 'uf', titulo: 'UF', largura: 6 },
  { chave: 'cep', titulo: 'CEP', largura: 12 },
  { chave: 'telefone', titulo: 'Telefone', largura: 16 },
  { chave: 'email', titulo: 'E-mail', largura: 28 },
  { chave: 'dependentes', titulo: 'Qtd. dependentes', largura: 16 },
  { chave: 'cargo', titulo: 'Cargo/função', largura: 24 },
  { chave: 'posto', titulo: 'Posto de trabalho', largura: 28 },
  { chave: 'escala', titulo: 'Escala', largura: 10 },
  { chave: 'salario', titulo: 'Salário base (R$)', largura: 16 },
  { chave: 'valeTransporte', titulo: 'Vale-transporte', largura: 14 },
  { chave: 'chavePix', titulo: 'Chave PIX', largura: 24 },
  { chave: 'dataAdmissao', titulo: 'Data de admissão', largura: 16 },
  { chave: 'dataTreinamento', titulo: 'Data do treinamento', largura: 18 },
] as const;

function linhaDoCandidato(c: CandidatoCompleto): Record<string, string | number> {
  const i = c.informacoesInternas;
  return {
    numeroAdmissao: i?.numeroAdmissao ?? '',
    empresa: i?.empresa?.nome ?? '',
    cnpj: i?.empresa?.cnpj ?? '',
    nome: c.nomeCompleto,
    cpf: mascararCpf(c.cpf),
    pis: mascararPis(c.pisNit),
    dataNascimento: formatarData(c.dataNascimento),
    sexo: rotuloSexo[c.sexo],
    estadoCivil: c.estadoCivil ? rotuloEstadoCivil[c.estadoCivil] : '',
    nomeMae: c.nomeMae ?? '',
    nomePai: c.nomePai ?? '',
    naturalidade: [c.naturalidade, c.ufNaturalidade].filter(Boolean).join('/'),
    escolaridade: c.escolaridade ? rotuloEscolaridade[c.escolaridade] : '',
    rg: c.rgNumero ?? '',
    rgOrgao: [c.rgOrgaoExpedidor, c.rgUf].filter(Boolean).join('/'),
    rgEmissao: formatarData(c.rgDataEmissao),
    ctps: c.ctpsDigital ? 'CTPS digital' : [c.ctpsNumero, c.ctpsSerie].filter(Boolean).join('/'),
    tituloEleitor: [c.tituloEleitorNumero, c.tituloEleitorZona, c.tituloEleitorSecao]
      .filter(Boolean)
      .join(' / '),
    reservista: c.reservistaNumero ?? '',
    cnh: [c.cnhNumero, c.cnhCategoria].filter(Boolean).join(' - '),
    logradouro: c.logradouro ?? '',
    numero: c.numero ?? '',
    complemento: c.complemento ?? '',
    bairro: c.bairro ?? '',
    cidade: c.cidade ?? '',
    uf: c.uf ?? '',
    cep: mascararCep(c.cep),
    telefone: mascararTelefone(c.celularWhatsapp ?? c.telefoneContato),
    email: c.email ?? '',
    dependentes: c.filhos.length,
    cargo: c.funcao?.nome ?? '',
    posto: i?.posto?.nome ?? '',
    escala: i?.escala?.nome ?? '',
    salario: i?.baseSalarial ? Number(i.baseSalarial) : '',
    valeTransporte: i?.valeTransporte ? 'Sim' : 'Não',
    chavePix: c.chavePix ?? '',
    dataAdmissao: formatarData(i?.dataInicio),
    dataTreinamento: formatarData(i?.dataTreinamento),
  };
}

export type FiltroExportacao = { mes?: number; ano?: number; empresaId?: string };

export async function buscarAdmitidos(filtro: FiltroExportacao): Promise<CandidatoCompleto[]> {
  return prisma.candidato.findMany({
    where: {
      etapa: 'ADMITIDO',
      anonimizadoEm: null,
      informacoesInternas: {
        ...(filtro.mes ? { admissaoMes: filtro.mes } : {}),
        ...(filtro.ano ? { admissaoAno: filtro.ano } : {}),
        ...(filtro.empresaId ? { empresaId: filtro.empresaId } : {}),
      },
    },
    include: candidatoCompletoInclude,
    orderBy: { criadoEm: 'asc' },
  });
}

export async function gerarPlanilhaAdmissoes(candidatos: CandidatoCompleto[]): Promise<Buffer> {
  const livro = new ExcelJS.Workbook();
  livro.creator = 'Sistema de Admissão — Grupo Real Serv';
  livro.created = new Date();

  const aba = livro.addWorksheet('Admissões');
  aba.columns = COLUNAS.map((c) => ({ header: c.titulo, key: c.chave, width: c.largura }));
  aba.getRow(1).font = { bold: true };
  aba.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFEEF4FF' },
  };
  aba.views = [{ state: 'frozen', ySplit: 1 }];
  aba.autoFilter = { from: 'A1', to: { row: 1, column: COLUNAS.length } };

  for (const candidato of candidatos) {
    aba.addRow(linhaDoCandidato(candidato));
  }
  aba.getColumn('salario').numFmt = '#,##0.00';

  const abaDependentes = livro.addWorksheet('Dependentes');
  abaDependentes.columns = [
    { header: 'Nº Admissão', key: 'admissao', width: 12 },
    { header: 'Titular', key: 'titular', width: 32 },
    { header: 'CPF do titular', key: 'cpfTitular', width: 16 },
    { header: 'Dependente', key: 'dependente', width: 32 },
    { header: 'Data de nascimento', key: 'nascimento', width: 18 },
    { header: 'CPF do dependente', key: 'cpf', width: 16 },
  ];
  abaDependentes.getRow(1).font = { bold: true };

  for (const candidato of candidatos) {
    for (const filho of candidato.filhos) {
      abaDependentes.addRow({
        admissao: candidato.informacoesInternas?.numeroAdmissao ?? '',
        titular: candidato.nomeCompleto,
        cpfTitular: mascararCpf(candidato.cpf),
        dependente: filho.nome,
        nascimento: formatarData(filho.dataNascimento),
        cpf: mascararCpf(filho.cpf),
      });
    }
  }

  const buffer = await livro.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function gerarCsvAdmissoes(candidatos: CandidatoCompleto[]): string {
  const escapar = (valor: unknown): string => {
    const texto = valor === null || valor === undefined ? '' : String(valor);
    return `"${texto.replace(/"/g, '""')}"`;
  };
  const linhas = [COLUNAS.map((c) => escapar(c.titulo)).join(';')];
  for (const candidato of candidatos) {
    const linha = linhaDoCandidato(candidato);
    linhas.push(COLUNAS.map((c) => escapar(linha[c.chave])).join(';'));
  }
  // BOM para o Excel abrir os acentos corretamente.
  return `﻿${linhas.join('\r\n')}`;
}
