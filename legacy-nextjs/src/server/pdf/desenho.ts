import 'server-only';
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb, type RGB } from 'pdf-lib';

/**
 * Pequeno motor de layout sobre pdf-lib: mantém o cursor vertical, quebra
 * páginas sozinho e desenha títulos, campos em grade e tabelas.
 * As fontes padrão usam WinAnsi, que cobre os acentos do português.
 */

export const A4 = { largura: 595.28, altura: 841.89 };
export const MARGEM = 40;

export const CINZA_ESCURO = rgb(0.1, 0.12, 0.16);
export const CINZA = rgb(0.42, 0.45, 0.5);
export const CINZA_CLARO = rgb(0.88, 0.9, 0.93);
export const FUNDO_SECAO = rgb(0.95, 0.96, 0.98);
export const MARCA = rgb(0.12, 0.28, 0.84);

/**
 * As fontes padrão do PDF usam WinAnsiEncoding, que cobre todo o Latin-1 —
 * portanto os acentos do português (á, ã, ç, é, õ, ú) passam intactos.
 * Aqui só normalizamos a pontuação tipográfica e descartamos o que ficaria
 * fora da tabela (emoji, por exemplo), que faria a geração falhar.
 */
export function limpar(texto: string | null | undefined): string {
  if (texto === null || texto === undefined) return '';
  return String(texto)
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[^\x20-\x7E\u00A0-\u00FF\n]/g, '');
}

export class Desenhista {
  readonly doc: PDFDocument;
  readonly fonte: PDFFont;
  readonly fonteNegrito: PDFFont;
  pagina: PDFPage;
  y: number;

  private constructor(doc: PDFDocument, fonte: PDFFont, fonteNegrito: PDFFont) {
    this.doc = doc;
    this.fonte = fonte;
    this.fonteNegrito = fonteNegrito;
    this.pagina = doc.addPage([A4.largura, A4.altura]);
    this.y = A4.altura - MARGEM;
  }

  static async criar(): Promise<Desenhista> {
    const doc = await PDFDocument.create();
    const fonte = await doc.embedFont(StandardFonts.Helvetica);
    const fonteNegrito = await doc.embedFont(StandardFonts.HelveticaBold);
    return new Desenhista(doc, fonte, fonteNegrito);
  }

  get larguraUtil(): number {
    return A4.largura - MARGEM * 2;
  }

  novaPagina(): void {
    this.pagina = this.doc.addPage([A4.largura, A4.altura]);
    this.y = A4.altura - MARGEM;
  }

  /** Garante espaço vertical; abre outra página se não couber. */
  garantirEspaco(altura: number): void {
    if (this.y - altura < MARGEM + 20) this.novaPagina();
  }

  espaco(altura: number): void {
    this.y -= altura;
  }

  texto(
    conteudo: string,
    opcoes: { x?: number; tamanho?: number; negrito?: boolean; cor?: RGB } = {},
  ): void {
    const { x = MARGEM, tamanho = 9, negrito = false, cor = CINZA_ESCURO } = opcoes;
    this.pagina.drawText(limpar(conteudo), {
      x,
      y: this.y,
      size: tamanho,
      font: negrito ? this.fonteNegrito : this.fonte,
      color: cor,
    });
  }

  /** Quebra o texto em linhas que caibam na largura e desenha, avançando o cursor. */
  paragrafo(
    conteudo: string,
    opcoes: { largura?: number; tamanho?: number; entrelinha?: number; cor?: RGB } = {},
  ): void {
    const { largura = this.larguraUtil, tamanho = 9, entrelinha = 12, cor = CINZA_ESCURO } = opcoes;
    for (const linha of this.quebrar(conteudo, largura, tamanho)) {
      this.garantirEspaco(entrelinha);
      this.texto(linha, { tamanho, cor });
      this.y -= entrelinha;
    }
  }

  quebrar(conteudo: string, largura: number, tamanho: number): string[] {
    const linhas: string[] = [];
    for (const bloco of limpar(conteudo).split('\n')) {
      let atual = '';
      for (const palavra of bloco.split(/\s+/)) {
        const tentativa = atual ? `${atual} ${palavra}` : palavra;
        if (this.fonte.widthOfTextAtSize(tentativa, tamanho) > largura && atual) {
          linhas.push(atual);
          atual = palavra;
        } else {
          atual = tentativa;
        }
      }
      linhas.push(atual);
    }
    return linhas;
  }

  tituloSecao(titulo: string): void {
    this.garantirEspaco(30);
    this.y -= 6;
    this.pagina.drawRectangle({
      x: MARGEM,
      y: this.y - 4,
      width: this.larguraUtil,
      height: 16,
      color: FUNDO_SECAO,
    });
    this.texto(titulo.toUpperCase(), { x: MARGEM + 6, tamanho: 8.5, negrito: true, cor: MARCA });
    this.y -= 22;
  }

  /** Campos em grade: rótulo pequeno acima do valor. */
  campos(itens: Array<{ rotulo: string; valor: string | null | undefined; colunas?: number }>): void {
    const colunasTotais = 3;
    const largura = this.larguraUtil / colunasTotais;
    let coluna = 0;

    for (const item of itens) {
      const ocupa = Math.min(item.colunas ?? 1, colunasTotais);
      if (coluna + ocupa > colunasTotais) {
        coluna = 0;
        this.y -= 26;
      }
      this.garantirEspaco(30);

      const x = MARGEM + coluna * largura;
      const larguraCampo = largura * ocupa - 8;

      this.pagina.drawText(limpar(item.rotulo), {
        x,
        y: this.y + 10,
        size: 6.5,
        font: this.fonte,
        color: CINZA,
      });

      const valor = item.valor?.toString().trim() || '—';
      const linhas = this.quebrar(valor, larguraCampo, 8.5);
      this.pagina.drawText(linhas[0] ?? '—', {
        x,
        y: this.y,
        size: 8.5,
        font: this.fonte,
        color: CINZA_ESCURO,
      });
      if (linhas.length > 1) {
        this.pagina.drawText(`${linhas[1].slice(0, 60)}${linhas.length > 2 ? '...' : ''}`, {
          x,
          y: this.y - 9,
          size: 7.5,
          font: this.fonte,
          color: CINZA_ESCURO,
        });
      }

      this.pagina.drawLine({
        start: { x, y: this.y - (linhas.length > 1 ? 13 : 4) },
        end: { x: x + larguraCampo, y: this.y - (linhas.length > 1 ? 13 : 4) },
        thickness: 0.5,
        color: CINZA_CLARO,
      });

      coluna += ocupa;
    }
    this.y -= 30;
  }

  tabela(cabecalhos: string[], linhas: string[][], larguras: number[]): void {
    const total = larguras.reduce((s, l) => s + l, 0);
    const escala = this.larguraUtil / total;
    const cols = larguras.map((l) => l * escala);

    const desenharCabecalho = () => {
      this.garantirEspaco(22);
      this.pagina.drawRectangle({
        x: MARGEM,
        y: this.y - 4,
        width: this.larguraUtil,
        height: 14,
        color: FUNDO_SECAO,
      });
      let x = MARGEM + 3;
      cabecalhos.forEach((titulo, i) => {
        this.pagina.drawText(limpar(titulo), {
          x,
          y: this.y,
          size: 7,
          font: this.fonteNegrito,
          color: CINZA,
        });
        x += cols[i];
      });
      this.y -= 18;
    };

    desenharCabecalho();

    for (const linha of linhas) {
      this.garantirEspaco(16);
      if (this.y === A4.altura - MARGEM) desenharCabecalho();
      let x = MARGEM + 3;
      linha.forEach((celula, i) => {
        const texto = this.quebrar(celula || '—', cols[i] - 6, 8)[0] ?? '—';
        this.pagina.drawText(texto, { x, y: this.y, size: 8, font: this.fonte, color: CINZA_ESCURO });
        x += cols[i];
      });
      this.pagina.drawLine({
        start: { x: MARGEM, y: this.y - 4 },
        end: { x: A4.largura - MARGEM, y: this.y - 4 },
        thickness: 0.4,
        color: CINZA_CLARO,
      });
      this.y -= 15;
    }
    this.y -= 6;
  }
}
