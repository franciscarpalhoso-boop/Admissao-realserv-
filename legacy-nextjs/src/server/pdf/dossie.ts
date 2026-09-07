import 'server-only';
import { PDFDocument, rgb } from 'pdf-lib';
import { A4, CINZA, CINZA_CLARO, CINZA_ESCURO, Desenhista, MARCA, MARGEM, limpar } from './desenho';
import { formatarData, formatarDataHora } from '@/lib/formato';
import { mascararCpf } from '@/lib/validacao';
import { rotuloEtapa, rotuloStatusDocumento } from '@/lib/labels';
import { lerArquivo } from '@/lib/storage';
import type { CandidatoCompleto } from '@/server/candidatos';
import { gerarFichaPdf } from './ficha';

type ItemIndice = { titulo: string; status: string; arquivos: number };

async function gerarCapaEIndice(
  candidato: CandidatoCompleto,
  itens: ItemIndice[],
): Promise<Uint8Array> {
  const d = await Desenhista.criar();

  d.pagina.drawRectangle({ x: MARGEM, y: d.y - 30, width: 60, height: 40, color: MARCA });
  d.pagina.drawText('RS', {
    x: MARGEM + 16,
    y: d.y - 16,
    size: 20,
    font: d.fonteNegrito,
    color: rgb(1, 1, 1),
  });
  d.pagina.drawText('GRUPO REAL SERV', {
    x: MARGEM + 72,
    y: d.y - 4,
    size: 16,
    font: d.fonteNegrito,
    color: CINZA_ESCURO,
  });
  d.pagina.drawText('Dossiê de admissão', {
    x: MARGEM + 72,
    y: d.y - 20,
    size: 10,
    font: d.fonte,
    color: CINZA,
  });
  d.y -= 60;

  d.pagina.drawLine({
    start: { x: MARGEM, y: d.y },
    end: { x: A4.largura - MARGEM, y: d.y },
    thickness: 1.5,
    color: MARCA,
  });
  d.y -= 30;

  const numero = candidato.informacoesInternas?.numeroAdmissao;
  if (numero) {
    d.pagina.drawText(numero, {
      x: MARGEM,
      y: d.y,
      size: 26,
      font: d.fonteNegrito,
      color: MARCA,
    });
    d.y -= 34;
  }

  d.pagina.drawText(limpar(candidato.nomeCompleto), {
    x: MARGEM,
    y: d.y,
    size: 16,
    font: d.fonteNegrito,
    color: CINZA_ESCURO,
  });
  d.y -= 26;

  d.campos([
    { rotulo: 'CPF', valor: mascararCpf(candidato.cpf) },
    { rotulo: 'Data de nascimento', valor: formatarData(candidato.dataNascimento) },
    { rotulo: 'Vaga', valor: candidato.funcao?.nome },
    { rotulo: 'Empresa contratante', valor: candidato.informacoesInternas?.empresa?.nome, colunas: 2 },
    { rotulo: 'Posto', valor: candidato.informacoesInternas?.posto?.nome },
    { rotulo: 'Escala', valor: candidato.informacoesInternas?.escala?.nome },
    { rotulo: 'Data de início', valor: formatarData(candidato.informacoesInternas?.dataInicio) },
    { rotulo: 'Etapa atual', valor: rotuloEtapa[candidato.etapa] },
  ]);

  d.tituloSecao('Índice do dossiê');
  d.tabela(
    ['#', 'Documento', 'Status', 'Arquivos'],
    [
      ['1', 'Ficha de Solicitação de Emprego', 'Gerada pelo sistema', '1'],
      ...itens.map((item, i) => [
        String(i + 2),
        item.titulo,
        item.status,
        String(item.arquivos),
      ]),
    ],
    [0.4, 3.2, 1.4, 0.7],
  );

  d.espaco(10);
  d.paragrafo(
    `Dossiê gerado em ${formatarDataHora(new Date())}. Documento de uso interno do Grupo Real Serv, ` +
      'contendo dados pessoais protegidos pela Lei nº 13.709/2018 (LGPD). O acesso a este arquivo foi ' +
      'registrado no log de auditoria do sistema.',
    { tamanho: 7.5, entrelinha: 10, cor: CINZA },
  );

  return d.doc.save();
}

/** Página separadora antes de cada bloco de documentos. */
async function gerarSeparador(titulo: string, numero: number, observacao: string | null): Promise<Uint8Array> {
  const d = await Desenhista.criar();
  d.y = A4.altura / 2 + 40;
  d.pagina.drawText(String(numero).padStart(2, '0'), {
    x: MARGEM,
    y: d.y + 26,
    size: 34,
    font: d.fonteNegrito,
    color: CINZA_CLARO,
  });
  d.pagina.drawText(limpar(titulo).toUpperCase(), {
    x: MARGEM,
    y: d.y,
    size: 14,
    font: d.fonteNegrito,
    color: CINZA_ESCURO,
  });
  d.y -= 14;
  d.pagina.drawLine({
    start: { x: MARGEM, y: d.y },
    end: { x: A4.largura - MARGEM, y: d.y },
    thickness: 1,
    color: MARCA,
  });
  d.y -= 20;
  if (observacao) {
    d.paragrafo(`Observação do DP: ${observacao}`, { tamanho: 9, cor: CINZA });
  }
  return d.doc.save();
}

/**
 * Dossiê único: capa + índice + ficha + todos os anexos na ordem do checklist.
 * Imagens viram páginas A4; PDFs são copiados página a página.
 */
export async function gerarDossiePdf(candidato: CandidatoCompleto): Promise<Uint8Array> {
  const documentosComArquivos = candidato.documentos
    .filter((doc) => doc.arquivos.length > 0)
    .sort((a, b) => a.ordem - b.ordem);

  const indice: ItemIndice[] = documentosComArquivos.map((doc) => ({
    titulo: doc.nome,
    status: rotuloStatusDocumento[doc.status],
    arquivos: doc.arquivos.length,
  }));

  const dossie = await PDFDocument.create();

  const copiarTudo = async (bytes: Uint8Array | ArrayBuffer) => {
    const origem = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const paginas = await dossie.copyPages(origem, origem.getPageIndices());
    for (const pagina of paginas) dossie.addPage(pagina);
  };

  await copiarTudo(await gerarCapaEIndice(candidato, indice));
  await copiarTudo(await gerarFichaPdf(candidato));

  let numero = 2;
  for (const documento of documentosComArquivos) {
    await copiarTudo(await gerarSeparador(documento.nome, numero, documento.observacaoDp));
    numero += 1;

    for (const arquivo of documento.arquivos) {
      let conteudo: Buffer;
      try {
        conteudo = await lerArquivo(arquivo.chave);
      } catch {
        await copiarTudo(
          await gerarSeparador(
            `${documento.nome} - arquivo indisponível: ${arquivo.nomeOriginal}`,
            numero - 1,
            'O arquivo não pôde ser lido do storage no momento da geração.',
          ),
        );
        continue;
      }

      if (arquivo.mimeType === 'application/pdf') {
        try {
          await copiarTudo(conteudo);
        } catch {
          await copiarTudo(
            await gerarSeparador(
              `${documento.nome} - PDF ilegível: ${arquivo.nomeOriginal}`,
              numero - 1,
              'O PDF enviado não pôde ser incorporado (pode estar protegido por senha).',
            ),
          );
        }
        continue;
      }

      try {
        const imagem =
          arquivo.mimeType === 'image/png'
            ? await dossie.embedPng(conteudo)
            : await dossie.embedJpg(conteudo);

        const pagina = dossie.addPage([A4.largura, A4.altura]);
        const maxLargura = A4.largura - MARGEM * 2;
        const maxAltura = A4.altura - MARGEM * 2 - 20;
        const escala = Math.min(maxLargura / imagem.width, maxAltura / imagem.height, 1);
        const largura = imagem.width * escala;
        const altura = imagem.height * escala;

        pagina.drawImage(imagem, {
          x: (A4.largura - largura) / 2,
          y: (A4.altura - altura) / 2 - 8,
          width: largura,
          height: altura,
        });
        const fonte = await dossie.embedFont('Helvetica');
        pagina.drawText(limpar(`${documento.nome} - ${arquivo.nomeOriginal}`), {
          x: MARGEM,
          y: 24,
          size: 7,
          font: fonte,
          color: CINZA,
        });
      } catch {
        // Formatos que pdf-lib não incorpora (ex.: HEIC/WebP) entram como aviso.
        await copiarTudo(
          await gerarSeparador(
            `${documento.nome} - formato não suportado`,
            numero - 1,
            `O arquivo "${arquivo.nomeOriginal}" (${arquivo.mimeType}) não pôde ser convertido para PDF. ` +
              'Peça ao candidato para reenviar em JPG, PNG ou PDF.',
          ),
        );
      }
    }
  }

  dossie.setTitle(`Dossiê de admissão - ${candidato.nomeCompleto}`);
  dossie.setSubject(candidato.informacoesInternas?.numeroAdmissao ?? 'Admissão');
  dossie.setProducer('Sistema de Admissão - Grupo Real Serv');
  return dossie.save();
}
