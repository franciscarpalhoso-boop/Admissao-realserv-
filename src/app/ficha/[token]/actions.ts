'use server';

import { revalidatePath } from 'next/cache';
import type { EstadoCivil, Escolaridade, Sexo } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { cifrar } from '@/lib/cripto';
import { parseDataISO, parseMoeda } from '@/lib/formato';
import { somenteDigitos, validarCpf, validarPis } from '@/lib/validacao';
import { MIMES_ACEITOS, gerarChave, salvarArquivo, validarUpload } from '@/lib/storage';
import { ipDaRequisicao, registrarAuditoria, userAgentDaRequisicao } from '@/server/auditoria';
import { buscarCandidatoPorToken, sincronizarStatusDocumento } from '@/server/candidatos';

export type EstadoFicha = { erro?: string; sucesso?: string };

const ENUM_ESTADO_CIVIL: EstadoCivil[] = [
  'SOLTEIRO', 'CASADO', 'DIVORCIADO', 'VIUVO', 'UNIAO_ESTAVEL', 'SEPARADO',
];
const ENUM_ESCOLARIDADE: Escolaridade[] = [
  'FUNDAMENTAL_INCOMPLETO', 'FUNDAMENTAL_COMPLETO', 'MEDIO_INCOMPLETO', 'MEDIO_COMPLETO',
  'SUPERIOR_INCOMPLETO', 'SUPERIOR_COMPLETO', 'POS_GRADUACAO',
];
const ENUM_SEXO: Sexo[] = ['MASCULINO', 'FEMININO', 'NAO_INFORMADO'];

function texto(formData: FormData, campo: string): string | null {
  const v = String(formData.get(campo) ?? '').trim();
  return v === '' ? null : v;
}

function enumOuNulo<T extends string>(valores: T[], bruto: string | null): T | null {
  if (!bruto) return null;
  return valores.includes(bruto as T) ? (bruto as T) : null;
}

function boolOuNulo(formData: FormData, campo: string): boolean | null {
  const v = String(formData.get(campo) ?? '');
  if (v === 'sim') return true;
  if (v === 'nao') return false;
  return null;
}

async function carregarCandidato(token: string) {
  const candidato = await buscarCandidatoPorToken(token);
  if (!candidato) throw new Error('LINK_INVALIDO');
  if (candidato.statusFicha === 'ENVIADA') throw new Error('FICHA_ENVIADA');
  return candidato;
}

function tratar(erro: unknown): EstadoFicha {
  const msg = erro instanceof Error ? erro.message : '';
  if (msg === 'LINK_INVALIDO') {
    return { erro: 'Este link não é mais válido. Entre em contato com o RH do Grupo Real Serv.' };
  }
  if (msg === 'FICHA_ENVIADA') {
    return { erro: 'Sua ficha já foi enviada e não pode mais ser alterada.' };
  }
  console.error(erro);
  return { erro: 'Não foi possível salvar. Verifique sua conexão e tente novamente.' };
}

// --------------------------------------------------------------------------
// Etapas 1 a 6 — salvamento parcial
// --------------------------------------------------------------------------

export async function salvarEtapaAction(
  _estado: EstadoFicha,
  formData: FormData,
): Promise<EstadoFicha> {
  const token = String(formData.get('token') ?? '');
  const etapa = Number(formData.get('etapa') ?? 0);

  try {
    const candidato = await carregarCandidato(token);

    switch (etapa) {
      case 1: {
        const nome = texto(formData, 'nomeCompleto');
        if (!nome || nome.length < 3) return { erro: 'Informe seu nome completo.' };
        await prisma.candidato.update({
          where: { id: candidato.id },
          data: {
            nomeCompleto: nome,
            telefoneContato: texto(formData, 'telefoneContato'),
            telefoneRecado: texto(formData, 'telefoneRecado'),
            celularWhatsapp: texto(formData, 'celularWhatsapp'),
            email: texto(formData, 'email'),
            funcaoId: texto(formData, 'funcaoId'),
            tempoExperiencia: texto(formData, 'tempoExperiencia'),
            naturalidade: texto(formData, 'naturalidade'),
            ufNaturalidade: texto(formData, 'ufNaturalidade'),
            dataNascimento: parseDataISO(String(formData.get('dataNascimento') ?? '')),
            sexo: enumOuNulo(ENUM_SEXO, texto(formData, 'sexo')) ?? 'NAO_INFORMADO',
            estadoCivil: enumOuNulo(ENUM_ESTADO_CIVIL, texto(formData, 'estadoCivil')),
            nomeConjuge: texto(formData, 'nomeConjuge'),
            logradouro: texto(formData, 'logradouro'),
            numero: texto(formData, 'numero'),
            complemento: texto(formData, 'complemento'),
            bairro: texto(formData, 'bairro'),
            cidade: texto(formData, 'cidade'),
            uf: texto(formData, 'uf'),
            cep: texto(formData, 'cep'),
            tempoResidencia: texto(formData, 'tempoResidencia'),
            escolaridade: enumOuNulo(ENUM_ESCOLARIDADE, texto(formData, 'escolaridade')),
            nomeMae: texto(formData, 'nomeMae'),
            nomePai: texto(formData, 'nomePai'),
            statusFicha: 'EM_PREENCHIMENTO',
          },
        });
        break;
      }

      case 2: {
        const cpfBruto = somenteDigitos(texto(formData, 'cpf'));
        if (cpfBruto && !validarCpf(cpfBruto)) {
          return { erro: 'CPF inválido. Confira os números digitados.' };
        }
        const pisBruto = somenteDigitos(texto(formData, 'pisNit'));
        if (pisBruto && !validarPis(pisBruto)) {
          return { erro: 'PIS/NIT inválido. Confira os números digitados.' };
        }
        if (cpfBruto) {
          const duplicado = await prisma.candidato.findFirst({
            where: { cpf: cpfBruto, id: { not: candidato.id }, anonimizadoEm: null },
            select: { id: true },
          });
          if (duplicado) {
            return { erro: 'Já existe um cadastro com este CPF. Entre em contato com o RH.' };
          }
        }

        const rg = texto(formData, 'rgNumero');
        await prisma.candidato.update({
          where: { id: candidato.id },
          data: {
            cpf: cpfBruto || null,
            cpfCifrado: cpfBruto ? cifrar(cpfBruto) : null,
            pisNit: pisBruto || null,
            rgNumero: rg,
            rgNumeroCifrado: cifrar(rg),
            rgDataEmissao: parseDataISO(String(formData.get('rgDataEmissao') ?? '')),
            rgOrgaoExpedidor: texto(formData, 'rgOrgaoExpedidor'),
            rgUf: texto(formData, 'rgUf'),
            cnhNumero: texto(formData, 'cnhNumero'),
            cnhRegistro: texto(formData, 'cnhRegistro'),
            cnhUf: texto(formData, 'cnhUf'),
            cnhDataEmissao: parseDataISO(String(formData.get('cnhDataEmissao') ?? '')),
            cnhValidade: parseDataISO(String(formData.get('cnhValidade') ?? '')),
            cnhCategoria: texto(formData, 'cnhCategoria'),
            cnhPrimeiraHabilitacao: parseDataISO(String(formData.get('cnhPrimeiraHabilitacao') ?? '')),
            ctpsNumero: texto(formData, 'ctpsNumero'),
            ctpsSerie: texto(formData, 'ctpsSerie'),
            ctpsUf: texto(formData, 'ctpsUf'),
            ctpsDigital: formData.get('ctpsDigital') === 'on',
            tituloEleitorNumero: texto(formData, 'tituloEleitorNumero'),
            tituloEleitorZona: texto(formData, 'tituloEleitorZona'),
            tituloEleitorSecao: texto(formData, 'tituloEleitorSecao'),
            reservistaNumero: texto(formData, 'reservistaNumero'),
            tipoSanguineo: texto(formData, 'tipoSanguineo'),
          },
        });

        // Filhos: substitui a lista inteira pelo que veio do formulário.
        const nomes = formData.getAll('filhoNome').map((v) => String(v).trim());
        const nascimentos = formData.getAll('filhoNascimento').map((v) => String(v));
        const cpfsFilhos = formData.getAll('filhoCpf').map((v) => String(v));
        const filhos = nomes
          .map((nome, i) => ({
            nome,
            dataNascimento: parseDataISO(nascimentos[i] ?? ''),
            cpf: somenteDigitos(cpfsFilhos[i] ?? '') || null,
            ordem: i,
          }))
          .filter((f) => f.nome.length > 0);

        const filhoComCpfInvalido = filhos.find((f) => f.cpf && !validarCpf(f.cpf));
        if (filhoComCpfInvalido) {
          return { erro: `CPF inválido para o filho "${filhoComCpfInvalido.nome}".` };
        }

        await prisma.$transaction([
          prisma.filho.deleteMany({ where: { candidatoId: candidato.id } }),
          ...(filhos.length > 0
            ? [prisma.filho.createMany({ data: filhos.map((f) => ({ ...f, candidatoId: candidato.id })) })]
            : []),
        ]);
        break;
      }

      case 3: {
        const cursos = formData
          .getAll('cursoNome')
          .map((v, i) => ({
            nome: String(v).trim(),
            instituicao: String(formData.getAll('cursoInstituicao')[i] ?? '').trim() || null,
            ano: String(formData.getAll('cursoAno')[i] ?? '').trim() || null,
            ordem: i,
          }))
          .filter((c) => c.nome.length > 0);

        const referencias = formData
          .getAll('referenciaNome')
          .map((v, i) => ({
            nome: String(v).trim(),
            telefone: String(formData.getAll('referenciaTelefone')[i] ?? '').trim() || null,
            relacao: String(formData.getAll('referenciaRelacao')[i] ?? '').trim() || null,
            cidade: String(formData.getAll('referenciaCidade')[i] ?? '').trim() || null,
            ordem: i,
          }))
          .filter((r) => r.nome.length > 0);

        await prisma.$transaction([
          prisma.curso.deleteMany({ where: { candidatoId: candidato.id } }),
          prisma.referencia.deleteMany({ where: { candidatoId: candidato.id } }),
          ...(cursos.length > 0
            ? [prisma.curso.createMany({ data: cursos.map((c) => ({ ...c, candidatoId: candidato.id })) })]
            : []),
          ...(referencias.length > 0
            ? [prisma.referencia.createMany({ data: referencias.map((r) => ({ ...r, candidatoId: candidato.id })) })]
            : []),
        ]);
        break;
      }

      case 4: {
        const empregos = [0, 1, 2].map((i) => ({
          candidatoId: candidato.id,
          ordem: i,
          naoPossui: formData.get(`emprego${i}NaoPossui`) === 'on',
          empresa: texto(formData, `emprego${i}Empresa`),
          telefone: texto(formData, `emprego${i}Telefone`),
          contato: texto(formData, `emprego${i}Contato`),
          setor: texto(formData, `emprego${i}Setor`),
          cargo: texto(formData, `emprego${i}Cargo`),
          dataAdmissao: parseDataISO(String(formData.get(`emprego${i}DataAdmissao`) ?? '')),
          dataSaida: parseDataISO(String(formData.get(`emprego${i}DataSaida`) ?? '')),
          ultimoSalario: parseMoeda(String(formData.get(`emprego${i}Salario`) ?? '')),
          motivoSaida: texto(formData, `emprego${i}MotivoSaida`),
        }));

        const incompleto = empregos.find((e) => !e.naoPossui && !e.empresa);
        if (incompleto) {
          return {
            erro: `Informe a empresa do ${incompleto.ordem + 1}º emprego anterior ou marque "não possui".`,
          };
        }

        await prisma.$transaction([
          prisma.empregoAnterior.deleteMany({ where: { candidatoId: candidato.id } }),
          prisma.empregoAnterior.createMany({ data: empregos }),
        ]);
        break;
      }

      case 5: {
        await prisma.candidato.update({
          where: { id: candidato.id },
          data: {
            numeroSapato: texto(formData, 'numeroSapato'),
            tamanhoCamisa: texto(formData, 'tamanhoCamisa'),
            numeroCalca: texto(formData, 'numeroCalca'),
          },
        });
        break;
      }

      case 6: {
        const sobreVoce = texto(formData, 'sobreVoce');
        if (sobreVoce && sobreVoce.length > 600) {
          return { erro: 'O texto sobre você deve ter no máximo 600 caracteres.' };
        }
        await prisma.candidato.update({
          where: { id: candidato.id },
          data: {
            aceitaEscalaRevezamento: boolOuNulo(formData, 'aceitaEscalaRevezamento'),
            possuiParenteEmpresa: boolOuNulo(formData, 'possuiParenteEmpresa'),
            parenteNome: texto(formData, 'parenteNome'),
            parenteSetor: texto(formData, 'parenteSetor'),
            jaTrabalhouEmpresa: boolOuNulo(formData, 'jaTrabalhouEmpresa'),
            jaTrabalhouAno: texto(formData, 'jaTrabalhouAno'),
            fumante: boolOuNulo(formData, 'fumante'),
            desejaValeTransporte: boolOuNulo(formData, 'desejaValeTransporte'),
            linhasOnibus: texto(formData, 'linhasOnibus'),
            valorPassagem: parseMoeda(String(formData.get('valorPassagem') ?? '')),
            chavePix: texto(formData, 'chavePix'),
            sobreVoce,
          },
        });
        break;
      }

      default:
        return { erro: 'Etapa inválida.' };
    }

    revalidatePath(`/ficha/${token}`);
    return { sucesso: 'Respostas salvas.' };
  } catch (erro) {
    return tratar(erro);
  }
}

// --------------------------------------------------------------------------
// Etapa 7 — declaração, assinatura e envio
// --------------------------------------------------------------------------

export async function enviarFichaAction(
  _estado: EstadoFicha,
  formData: FormData,
): Promise<EstadoFicha> {
  const token = String(formData.get('token') ?? '');

  try {
    const candidato = await carregarCandidato(token);

    if (formData.get('aceiteVeracidade') !== 'on') {
      return { erro: 'É necessário aceitar o termo de veracidade das informações.' };
    }
    if (formData.get('aceiteLgpd') !== 'on') {
      return { erro: 'É necessário aceitar o termo de consentimento de dados (LGPD).' };
    }

    const assinatura = String(formData.get('assinaturaBase64') ?? '');
    if (!assinatura.startsWith('data:image/png;base64,') || assinatura.length < 200) {
      return { erro: 'Assine no quadro antes de enviar.' };
    }
    if (!candidato.cpf) {
      return { erro: 'Volte à etapa 2 e informe o seu CPF antes de enviar a ficha.' };
    }

    const config = await prisma.configuracao.findUnique({ where: { chave: 'LOCAL_ASSINATURA' } });

    await prisma.candidato.update({
      where: { id: candidato.id },
      data: {
        aceiteVeracidade: true,
        aceiteLgpd: true,
        assinaturaBase64: assinatura,
        assinaturaLocal: config?.valor ?? 'Santos/SP',
        assinaturaData: new Date(),
        consentimentoIp: await ipDaRequisicao(),
        consentimentoUserAgent: await userAgentDaRequisicao(),
        statusFicha: 'ENVIADA',
      },
    });

    await registrarAuditoria({
      autorLabel: `Candidato ${candidato.nomeCompleto}`,
      entidade: 'Candidato',
      entidadeId: candidato.id,
      acao: 'FICHA_ENVIADA',
      detalhes: { aceiteVeracidade: true, aceiteLgpd: true },
    });

    revalidatePath(`/ficha/${token}`);
    revalidatePath(`/painel/candidatos/${candidato.id}`);
    return { sucesso: 'Ficha enviada com sucesso!' };
  } catch (erro) {
    return tratar(erro);
  }
}

// --------------------------------------------------------------------------
// Upload de documentos pelo candidato
// --------------------------------------------------------------------------

export async function enviarDocumentoAction(
  _estado: EstadoFicha,
  formData: FormData,
): Promise<EstadoFicha> {
  const token = String(formData.get('token') ?? '');
  const documentoId = String(formData.get('documentoId') ?? '');

  try {
    const candidato = await buscarCandidatoPorToken(token);
    if (!candidato) throw new Error('LINK_INVALIDO');

    const documento = candidato.documentos.find((d) => d.id === documentoId);
    if (!documento) return { erro: 'Documento não encontrado.' };
    if (documento.status === 'CONFERIDO') {
      return { erro: 'Este documento já foi conferido pelo RH e não pode ser substituído.' };
    }

    const arquivos = formData.getAll('arquivo').filter((a): a is File => a instanceof File && a.size > 0);
    if (arquivos.length === 0) return { erro: 'Selecione pelo menos um arquivo.' };

    for (const arquivo of arquivos) {
      const problema = validarUpload(arquivo);
      if (problema) return { erro: `${arquivo.name}: ${problema}` };
    }

    for (const arquivo of arquivos) {
      const chave = gerarChave(candidato.id, arquivo.name);
      const conteudo = Buffer.from(await arquivo.arrayBuffer());
      await salvarArquivo(chave, conteudo, arquivo.type);
      await prisma.arquivoDocumento.create({
        data: {
          documentoId: documento.id,
          chave,
          nomeOriginal: arquivo.name,
          mimeType: arquivo.type,
          tamanho: arquivo.size,
          enviadoPor: 'candidato',
        },
      });
    }

    await prisma.documentoCandidato.update({
      where: { id: documento.id },
      data: { status: 'ENVIADO', observacaoDp: null },
    });
    await sincronizarStatusDocumento(documento.id);

    await registrarAuditoria({
      autorLabel: `Candidato ${candidato.nomeCompleto}`,
      entidade: 'DocumentoCandidato',
      entidadeId: documento.id,
      acao: 'UPLOAD_CANDIDATO',
      detalhes: { quantidade: arquivos.length, item: documento.nome },
    });

    revalidatePath(`/ficha/${token}`);
    revalidatePath(`/painel/candidatos/${candidato.id}`);
    return { sucesso: `${arquivos.length} arquivo(s) enviado(s) para "${documento.nome}".` };
  } catch (erro) {
    return tratar(erro);
  }
}

export const FORMATOS_ACEITOS = MIMES_ACEITOS.join(',');
