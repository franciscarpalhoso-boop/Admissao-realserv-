import 'server-only';
import { rgb } from 'pdf-lib';
import {
  A4,
  CINZA,
  CINZA_CLARO,
  CINZA_ESCURO,
  Desenhista,
  MARCA,
  MARGEM,
  limpar,
} from './desenho';
import { formatarData, formatarDataHora, formatarMoeda, sim } from '@/lib/formato';
import { mascararCep, mascararCpf, mascararPis, mascararTelefone } from '@/lib/validacao';
import {
  rotuloEscolaridade,
  rotuloEstadoCivil,
  rotuloEtapa,
  rotuloSexo,
} from '@/lib/labels';
import type { CandidatoCompleto } from '@/server/candidatos';

function cabecalho(d: Desenhista, candidato: CandidatoCompleto): void {
  // Logo textual — substitua por embedPng do logo oficial se disponível.
  d.pagina.drawRectangle({
    x: MARGEM,
    y: d.y - 22,
    width: 46,
    height: 30,
    color: MARCA,
  });
  d.pagina.drawText('RS', {
    x: MARGEM + 12,
    y: d.y - 12,
    size: 15,
    font: d.fonteNegrito,
    color: rgb(1, 1, 1),
  });

  d.pagina.drawText('GRUPO REAL SERV', {
    x: MARGEM + 56,
    y: d.y - 2,
    size: 13,
    font: d.fonteNegrito,
    color: CINZA_ESCURO,
  });
  d.pagina.drawText('Serviços de condomínios e facilities - Santos/SP', {
    x: MARGEM + 56,
    y: d.y - 13,
    size: 7.5,
    font: d.fonte,
    color: CINZA,
  });

  const numero = candidato.informacoesInternas?.numeroAdmissao;
  if (numero) {
    const largura = d.fonteNegrito.widthOfTextAtSize(numero, 11);
    d.pagina.drawText(numero, {
      x: A4.largura - MARGEM - largura,
      y: d.y - 2,
      size: 11,
      font: d.fonteNegrito,
      color: MARCA,
    });
  }

  d.y -= 34;
  d.pagina.drawText('FICHA DE SOLICITAÇÃO DE EMPREGO', {
    x: MARGEM,
    y: d.y,
    size: 11,
    font: d.fonteNegrito,
    color: CINZA_ESCURO,
  });
  d.y -= 10;
  d.pagina.drawLine({
    start: { x: MARGEM, y: d.y },
    end: { x: A4.largura - MARGEM, y: d.y },
    thickness: 1,
    color: MARCA,
  });
  d.y -= 16;
}

function rodapes(d: Desenhista): void {
  const paginas = d.doc.getPages();
  paginas.forEach((pagina, i) => {
    pagina.drawText(
      limpar(`Grupo Real Serv - Ficha de Solicitação de Emprego - página ${i + 1} de ${paginas.length}`),
      { x: MARGEM, y: 24, size: 7, font: d.fonte, color: CINZA },
    );
  });
}

/** Gera a Ficha de Solicitação de Emprego no layout equivalente ao papel. */
export async function gerarFichaPdf(candidato: CandidatoCompleto): Promise<Uint8Array> {
  const d = await Desenhista.criar();
  cabecalho(d, candidato);

  // -- Etapa 1: dados pessoais
  d.tituloSecao('1. Dados pessoais');
  d.campos([
    { rotulo: 'Nome completo', valor: candidato.nomeCompleto, colunas: 2 },
    { rotulo: 'Data de nascimento', valor: formatarData(candidato.dataNascimento) },
    { rotulo: 'Telefone de contato', valor: mascararTelefone(candidato.telefoneContato) },
    { rotulo: 'Telefone para recado', valor: mascararTelefone(candidato.telefoneRecado) },
    { rotulo: 'Celular (WhatsApp)', valor: mascararTelefone(candidato.celularWhatsapp) },
    { rotulo: 'E-mail', valor: candidato.email, colunas: 2 },
    { rotulo: 'Vaga pretendida', valor: candidato.funcao?.nome },
    { rotulo: 'Tempo de experiência na vaga', valor: candidato.tempoExperiencia },
    { rotulo: 'Naturalidade', valor: [candidato.naturalidade, candidato.ufNaturalidade].filter(Boolean).join('/') },
    { rotulo: 'Sexo', valor: rotuloSexo[candidato.sexo] },
    { rotulo: 'Estado civil', valor: candidato.estadoCivil ? rotuloEstadoCivil[candidato.estadoCivil] : null },
    { rotulo: 'Nome do cônjuge', valor: candidato.nomeConjuge, colunas: 2 },
    { rotulo: 'Escolaridade', valor: candidato.escolaridade ? rotuloEscolaridade[candidato.escolaridade] : null },
    { rotulo: 'Nome da mãe', valor: candidato.nomeMae, colunas: 2 },
    { rotulo: 'Nome do pai', valor: candidato.nomePai },
  ]);

  d.tituloSecao('Endereço');
  d.campos([
    { rotulo: 'Logradouro', valor: candidato.logradouro, colunas: 2 },
    { rotulo: 'Número', valor: candidato.numero },
    { rotulo: 'Complemento', valor: candidato.complemento },
    { rotulo: 'Bairro', valor: candidato.bairro },
    { rotulo: 'CEP', valor: mascararCep(candidato.cep) },
    { rotulo: 'Cidade', valor: candidato.cidade, colunas: 2 },
    { rotulo: 'UF', valor: candidato.uf },
    { rotulo: 'Tempo de residência', valor: candidato.tempoResidencia },
  ]);

  // -- Etapa 2: documentação
  d.tituloSecao('2. Documentação');
  d.campos([
    { rotulo: 'CPF', valor: mascararCpf(candidato.cpf) },
    { rotulo: 'PIS/NIT', valor: mascararPis(candidato.pisNit) },
    { rotulo: 'Tipo sanguíneo', valor: candidato.tipoSanguineo },
    { rotulo: 'RG', valor: candidato.rgNumero },
    { rotulo: 'Data de emissão', valor: formatarData(candidato.rgDataEmissao) },
    { rotulo: 'Órgão expedidor/UF', valor: [candidato.rgOrgaoExpedidor, candidato.rgUf].filter(Boolean).join('/') },
    { rotulo: 'CNH', valor: candidato.cnhNumero },
    { rotulo: 'Registro CNH', valor: candidato.cnhRegistro },
    { rotulo: 'Categoria', valor: candidato.cnhCategoria },
    { rotulo: 'Emissão CNH', valor: formatarData(candidato.cnhDataEmissao) },
    { rotulo: 'Validade CNH', valor: formatarData(candidato.cnhValidade) },
    { rotulo: '1ª habilitação', valor: formatarData(candidato.cnhPrimeiraHabilitacao) },
    {
      rotulo: 'CTPS',
      valor: candidato.ctpsDigital
        ? 'CTPS digital'
        : [candidato.ctpsNumero, candidato.ctpsSerie].filter(Boolean).join(' / '),
      colunas: 2,
    },
    { rotulo: 'UF da CTPS', valor: candidato.ctpsUf },
    { rotulo: 'Título de eleitor', valor: candidato.tituloEleitorNumero },
    { rotulo: 'Zona', valor: candidato.tituloEleitorZona },
    { rotulo: 'Seção', valor: candidato.tituloEleitorSecao },
    { rotulo: 'Certificado militar/reservista', valor: candidato.reservistaNumero, colunas: 3 },
  ]);

  if (candidato.filhos.length > 0) {
    d.tituloSecao('Filhos');
    d.tabela(
      ['Nome', 'Data de nascimento', 'CPF'],
      candidato.filhos.map((f) => [f.nome, formatarData(f.dataNascimento), mascararCpf(f.cpf)]),
      [3, 1.2, 1.2],
    );
  }

  // -- Etapa 3: cursos e referências
  d.tituloSecao('3. Treinamentos e cursos');
  if (candidato.cursos.length > 0) {
    d.tabela(
      ['Curso', 'Instituição', 'Ano'],
      candidato.cursos.map((c) => [c.nome, c.instituicao ?? '', c.ano ?? '']),
      [2.4, 2, 0.7],
    );
  } else {
    d.paragrafo('Não informado.', { cor: CINZA });
    d.espaco(4);
  }

  d.tituloSecao('Referências');
  if (candidato.referencias.length > 0) {
    d.tabela(
      ['Nome', 'Telefone', 'Relação', 'Cidade'],
      candidato.referencias.map((r) => [
        r.nome,
        mascararTelefone(r.telefone),
        r.relacao ?? '',
        r.cidade ?? '',
      ]),
      [2, 1.3, 1.3, 1.3],
    );
  } else {
    d.paragrafo('Não informado.', { cor: CINZA });
    d.espaco(4);
  }

  // -- Etapa 4: empregos anteriores
  d.tituloSecao('4. Empregos anteriores');
  const rotulosEmprego = ['Último', 'Penúltimo', 'Antepenúltimo'];
  for (const ordem of [0, 1, 2]) {
    const emprego = candidato.empregosAnteriores.find((e) => e.ordem === ordem);
    d.garantirEspaco(60);
    d.texto(rotulosEmprego[ordem], { tamanho: 8, negrito: true, cor: MARCA });
    d.y -= 14;
    if (!emprego || emprego.naoPossui) {
      d.texto('Não possui.', { tamanho: 8.5, cor: CINZA });
      d.y -= 18;
      continue;
    }
    d.campos([
      { rotulo: 'Empresa', valor: emprego.empresa, colunas: 2 },
      { rotulo: 'Telefone', valor: mascararTelefone(emprego.telefone) },
      { rotulo: 'Contato', valor: emprego.contato },
      { rotulo: 'Setor', valor: emprego.setor },
      { rotulo: 'Cargo', valor: emprego.cargo },
      { rotulo: 'Admissão', valor: formatarData(emprego.dataAdmissao) },
      { rotulo: 'Saída', valor: formatarData(emprego.dataSaida) },
      { rotulo: 'Último salário', valor: formatarMoeda(emprego.ultimoSalario?.toString()) },
      { rotulo: 'Motivo da saída', valor: emprego.motivoSaida, colunas: 3 },
    ]);
  }

  // -- Etapa 5: uniforme
  d.tituloSecao('5. Uniforme');
  d.campos([
    { rotulo: 'Nº do sapato', valor: candidato.numeroSapato },
    { rotulo: 'Camisa/blusa', valor: candidato.tamanhoCamisa },
    { rotulo: 'Nº da calça', valor: candidato.numeroCalca },
  ]);

  // -- Etapa 6: questionário
  d.tituloSecao('6. Questionário');
  d.campos([
    { rotulo: 'Aceita escala de revezamento, domingos e feriados', valor: sim(candidato.aceitaEscalaRevezamento), colunas: 2 },
    { rotulo: 'É fumante', valor: sim(candidato.fumante) },
    { rotulo: 'Tem parente na empresa', valor: sim(candidato.possuiParenteEmpresa) },
    { rotulo: 'Nome do parente', valor: candidato.parenteNome },
    { rotulo: 'Setor do parente', valor: candidato.parenteSetor },
    { rotulo: 'Já trabalhou nesta empresa', valor: sim(candidato.jaTrabalhouEmpresa) },
    { rotulo: 'Ano', valor: candidato.jaTrabalhouAno },
    { rotulo: 'Deseja vale-transporte', valor: sim(candidato.desejaValeTransporte) },
    { rotulo: 'Linhas de ônibus', valor: candidato.linhasOnibus, colunas: 2 },
    { rotulo: 'Valor da passagem', valor: formatarMoeda(candidato.valorPassagem?.toString()) },
    { rotulo: 'Chave PIX', valor: candidato.chavePix, colunas: 3 },
  ]);

  if (candidato.sobreVoce) {
    d.texto('Sobre você', { tamanho: 6.5, cor: CINZA });
    d.y -= 12;
    d.paragrafo(candidato.sobreVoce, { tamanho: 8.5 });
    d.espaco(6);
  }

  // -- Informações internas (preenchidas pelo DP)
  const internas = candidato.informacoesInternas;
  if (internas) {
    d.tituloSecao('Informações internas (uso do Departamento Pessoal)');
    d.campos([
      { rotulo: 'Número da admissão', valor: internas.numeroAdmissao },
      { rotulo: 'Empresa contratante', valor: internas.empresa?.nome, colunas: 2 },
      { rotulo: 'Posto', valor: internas.posto?.nome, colunas: 2 },
      { rotulo: 'Supervisor', valor: internas.supervisor?.nome },
      { rotulo: 'Escala', valor: internas.escala?.nome },
      { rotulo: 'Base salarial', valor: formatarMoeda(internas.baseSalarial?.toString()) },
      { rotulo: 'Acúmulo de função', valor: internas.acumuloFuncao ? (internas.acumuloFuncaoQual ?? 'Sim') : 'Não' },
      { rotulo: 'Data de início', valor: formatarData(internas.dataInicio) },
      { rotulo: 'Treinamento/integração', valor: formatarData(internas.dataTreinamento) },
      { rotulo: 'Vale-transporte', valor: sim(internas.valeTransporte) },
      {
        rotulo: 'Benefícios',
        valor: [
          internas.valeTransporte ? 'Vale-transporte' : null,
          internas.premioAssiduidade ? 'Assiduidade' : null,
          internas.outrosBeneficios,
        ]
          .filter(Boolean)
          .join(', '),
        colunas: 2,
      },
      { rotulo: 'Responsável pela aprovação', valor: internas.responsavelAprovacao, colunas: 2 },
      { rotulo: 'Etapa atual', valor: rotuloEtapa[candidato.etapa] },
    ]);
    if (internas.justificativaForcada) {
      d.paragrafo(`Justificativa de admissão com pendências: ${internas.justificativaForcada}`, {
        tamanho: 8,
        cor: rgb(0.7, 0.1, 0.1),
      });
    }
  }

  // -- Etapa 7: declaração e assinatura
  d.garantirEspaco(160);
  d.tituloSecao('7. Declaração e assinatura');
  d.paragrafo(
    'Declaro que as informações prestadas nesta ficha são verdadeiras e completas, e autorizo o tratamento ' +
      'dos meus dados pessoais pelo Grupo Real Serv para as finalidades de recrutamento, seleção e admissão, ' +
      'nos termos da Lei nº 13.709/2018 (LGPD).',
    { tamanho: 8, entrelinha: 11 },
  );
  d.espaco(6);
  d.campos([
    { rotulo: 'Aceite do termo de veracidade', valor: sim(candidato.aceiteVeracidade) },
    { rotulo: 'Aceite do termo LGPD', valor: sim(candidato.aceiteLgpd) },
    { rotulo: 'Data e hora do aceite', valor: formatarDataHora(candidato.assinaturaData) },
    { rotulo: 'Local', valor: candidato.assinaturaLocal },
    { rotulo: 'Endereço IP registrado', valor: candidato.consentimentoIp, colunas: 2 },
  ]);

  if (candidato.assinaturaBase64?.startsWith('data:image/png;base64,')) {
    try {
      const bytes = Buffer.from(candidato.assinaturaBase64.split(',')[1], 'base64');
      const imagem = await d.doc.embedPng(bytes);
      const largura = 200;
      const altura = (imagem.height / imagem.width) * largura;
      d.garantirEspaco(altura + 30);
      d.pagina.drawImage(imagem, { x: MARGEM, y: d.y - altura, width: largura, height: altura });
      d.y -= altura + 4;
    } catch {
      // Assinatura corrompida: segue com a linha em branco.
    }
  }

  d.pagina.drawLine({
    start: { x: MARGEM, y: d.y },
    end: { x: MARGEM + 220, y: d.y },
    thickness: 0.8,
    color: CINZA_CLARO,
  });
  d.y -= 11;
  d.texto(`Assinatura do candidato - ${candidato.nomeCompleto}`, { tamanho: 7.5, cor: CINZA });

  rodapes(d);
  return d.doc.save();
}
