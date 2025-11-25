import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Racket } from '../types/racket';

// --- CONFIGURACIÓN DE DISEÑO ---
const THEME = {
  colors: {
    primary: [22, 163, 74], // #16a34a (Smashly Green)
    secondary: [31, 41, 55], // #1f2937 (Dark Gray)
    text: [55, 65, 81], // #374151
    lightGray: [243, 244, 246],
    white: [255, 255, 255],
  },
  fonts: {
    header: 'helvetica',
    body: 'helvetica',
  },
};

interface PdfOptions {
  rackets: Racket[];
  comparisonText: string;
  proxyUrlBase: string;
}

export class RacketPdfGenerator {
  private doc: jsPDF;
  private currentY: number;
  private margin: number;
  private pageWidth: number;
  private pageHeight: number;
  private contentWidth: number;

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = 210;
    this.pageHeight = 297;
    this.margin = 20;
    this.contentWidth = this.pageWidth - this.margin * 2;
    this.currentY = 0;
  }

  // --- MÉTODOS PÚBLICOS ---

  public async generatePDF(options: PdfOptions): Promise<void> {
    const { rackets, comparisonText } = options;

    // 1. Cargar imágenes
    const images = await this.loadImages(rackets, options.proxyUrlBase);

    // 2. Portada (Cover Page)
    this.renderCoverPage(rackets, images);

    // 3. Comparativa Técnica (Tabla Visual)
    this.renderComparisonTable(comparisonText);

    // 4. Análisis de Texto (Eliminando sección 2 y limpiando asteriscos)
    this.renderAnalysisContent(comparisonText);

    // 5. Pie de página y numeración
    this.addPageNumbers();

    // 6. Guardar
    this.doc.save(`Smashly-Comparativa-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  // --- MÉTODOS DE RENDERIZADO ---

  private renderCoverPage(rackets: Racket[], images: Record<number, string>) {
    // Fondo Header Verde
    this.doc.setFillColor(
      THEME.colors.primary[0],
      THEME.colors.primary[1],
      THEME.colors.primary[2]
    );
    this.doc.rect(0, 0, this.pageWidth, 297, 'F');

    // Reset a blanco para el cuerpo (efecto tarjeta)
    this.doc.setFillColor(255, 255, 255);
    this.doc.rect(0, 80, this.pageWidth, 217, 'F');

    // Título Principal
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(36);
    this.doc.setFont(THEME.fonts.header, 'bold');
    this.doc.text('COMPARATIVA', this.margin, 40);
    this.doc.setFontSize(14);
    this.doc.setFont(THEME.fonts.header, 'normal');
    this.doc.text('ANÁLISIS DE MATERIAL Y RENDIMIENTO', this.margin, 50);

    // Fecha
    this.doc.setFontSize(10);
    this.doc.text(`Generado el ${new Date().toLocaleDateString()}`, this.margin, 65);

    this.currentY = 95;

    // Renderizar las palas
    const cardWidth = this.contentWidth / rackets.length - 5;

    rackets.forEach((racket, index) => {
      const xPos = this.margin + (cardWidth + 5) * index;

      // Imagen Grande
      const imgData = images[racket.id!];
      if (imgData) {
        try {
          const props = this.doc.getImageProperties(imgData);
          const imgHeight = 60;
          const imgWidth = (props.width * imgHeight) / props.height;
          const centeredX = xPos + (cardWidth - imgWidth) / 2;

          this.doc.addImage(imgData, 'PNG', centeredX, this.currentY, imgWidth, imgHeight);
        } catch (e) {
          this.doc.setFillColor(230, 230, 230);
          this.doc.circle(xPos + cardWidth / 2, this.currentY + 30, 20, 'F');
        }
      }

      // Nombre de la pala
      this.doc.setFontSize(11);
      this.doc.setTextColor(
        THEME.colors.secondary[0],
        THEME.colors.secondary[1],
        THEME.colors.secondary[2]
      );
      this.doc.setFont(THEME.fonts.header, 'bold');

      const splitTitle = this.doc.splitTextToSize(racket.nombre, cardWidth);
      this.doc.text(splitTitle, xPos + cardWidth / 2, this.currentY + 65, { align: 'center' });

      // Marca
      this.doc.setFontSize(9);
      this.doc.setTextColor(100, 100, 100);
      this.doc.setFont(THEME.fonts.header, 'normal');
      this.doc.text(
        racket.marca.toUpperCase(),
        xPos + cardWidth / 2,
        this.currentY + 65 + splitTitle.length * 5 + 3,
        { align: 'center' }
      );
    });

    // Dibujar "VS" si son 2
    if (rackets.length === 2) {
      this.doc.setFillColor(
        THEME.colors.primary[0],
        THEME.colors.primary[1],
        THEME.colors.primary[2]
      );
      this.doc.circle(this.pageWidth / 2, this.currentY + 30, 8, 'F');
      this.doc.setTextColor(255, 255, 255);
      this.doc.setFontSize(8);
      this.doc.setFont(THEME.fonts.header, 'bold');
      this.doc.text('VS', this.pageWidth / 2, this.currentY + 31, {
        align: 'center',
        baseline: 'middle',
      });
    }

    this.currentY += 100;
  }

  private renderComparisonTable(markdown: string) {
    const tableData = this.extractTableFromMarkdown(markdown);
    if (!tableData) return;

    this.doc.setFontSize(14);
    this.doc.setTextColor(
      THEME.colors.primary[0],
      THEME.colors.primary[1],
      THEME.colors.primary[2]
    );
    this.doc.setFont(THEME.fonts.header, 'bold');
    this.doc.text('ESPECIFICACIONES TÉCNICAS', this.margin, this.currentY);
    this.currentY += 8;

    // Limpieza de datos de la tabla: quitar ** de las celdas
    const cleanBody = tableData.body.map(row => row.map(cell => cell.replace(/\*\*/g, '').trim()));
    const cleanHead = tableData.head.map(h => h.replace(/\*\*/g, '').trim());

    // @ts-ignore
    autoTable(this.doc, {
      startY: this.currentY,
      head: [cleanHead],
      body: cleanBody,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 5,
        lineColor: [230, 230, 230],
        lineWidth: 0.1,
        valign: 'middle',
      },
      headStyles: {
        fillColor: THEME.colors.primary,
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
      },
      bodyStyles: {
        textColor: THEME.colors.secondary,
      },
      columnStyles: {
        // Primera columna (Características) en negrita y fondo gris claro
        0: { fontStyle: 'bold', fillColor: [249, 250, 251], cellWidth: 40 },
      },
      alternateRowStyles: {
        fillColor: [255, 255, 255],
      },
      margin: { left: this.margin, right: this.margin },
      didDrawPage: (data: any) => {
        this.currentY = data.cursor.y + 15;
      },
    });

    // @ts-ignore
    this.currentY = this.doc.lastAutoTable.finalY + 15;
  }

  private renderAnalysisContent(markdown: string) {
    // 1. Eliminamos la tabla cruda del texto para que no se duplique
    let cleanText = markdown.replace(/\|.*\|[\r\n]/g, '').replace(/-{3,}/g, '');

    // 2. ELIMINAR SECCIÓN 2 (Headers y contenido vacío asociado a la tabla)
    // Buscamos patrones como "# 2. Tabla..." o "# 2. Especificaciones..." y su contenido inmediato
    // Esta regex busca un header que empiece por "2." y elimina hasta el siguiente header "#"
    // Nota: Asumimos que la tabla visual reemplaza esta sección.
    cleanText = cleanText.replace(/#+\s*2\..*?(?=\n#|\z)/gs, '');

    // Limpiamos saltos de línea excesivos resultantes de la eliminación
    const lines = cleanText.split('\n').filter(l => l.trim() !== '');

    lines.forEach(line => {
      line = line.trim();
      if (!line) return;

      this.checkPageBreak(20);

      if (line.startsWith('#')) {
        // Headers
        const level = line.match(/^#+/)?.[0].length || 0;
        const text = line.replace(/^#+\s*/, '').replace(/\*\*/g, '');

        if (level === 1) {
          this.doc.addPage();
          this.currentY = this.margin;
          this.doc.setFontSize(16);
          this.doc.setTextColor(
            THEME.colors.primary[0],
            THEME.colors.primary[1],
            THEME.colors.primary[2]
          );
          this.doc.setFont(THEME.fonts.header, 'bold');
          this.doc.text(text.toUpperCase(), this.margin, this.currentY);

          // Línea decorativa
          this.doc.setDrawColor(
            THEME.colors.primary[0],
            THEME.colors.primary[1],
            THEME.colors.primary[2]
          );
          this.doc.setLineWidth(0.5);
          this.doc.line(this.margin, this.currentY + 2, this.margin + 20, this.currentY + 2);

          this.currentY += 15;
        } else {
          this.currentY += 5;
          this.doc.setFontSize(12);
          this.doc.setTextColor(
            THEME.colors.secondary[0],
            THEME.colors.secondary[1],
            THEME.colors.secondary[2]
          );
          this.doc.setFont(THEME.fonts.header, 'bold');
          this.doc.text(text, this.margin, this.currentY);
          this.currentY += 8;
        }
      } else if (line.startsWith('-') || line.startsWith('*')) {
        // Listas
        const text = line.replace(/^[-*]\s*/, '');
        this.printRichText(text, 10, true);
      } else {
        // Párrafos normales
        this.printRichText(line, 10, false);
      }
    });
  }

  // --- UTILIDADES INTERNAS MEJORADAS ---

  /**
   * Imprime texto soportando negritas inline (**texto**).
   * Parsea el string y cambia la fuente dinámicamente.
   */
  private printRichText(text: string, fontSize: number, isList: boolean) {
    this.doc.setFontSize(fontSize);
    this.doc.setTextColor(THEME.colors.text[0], THEME.colors.text[1], THEME.colors.text[2]);

    const xBase = isList ? this.margin + 5 : this.margin;
    const maxWidth = isList ? this.contentWidth - 5 : this.contentWidth;

    if (isList) {
      this.doc.setFillColor(
        THEME.colors.primary[0],
        THEME.colors.primary[1],
        THEME.colors.primary[2]
      );
      this.doc.circle(this.margin + 2, this.currentY - fontSize / 3, 1, 'F');
    }

    // Dividimos el texto por los marcadores de negrita **
    // Ejemplo: "Hola **mundo** cruel" -> ["Hola ", "mundo", " cruel"]
    const parts = text.split(/\*\*(.*?)\*\*/g);

    // Necesitamos lógica de word-wrap manual porque jsPDF no soporta mix styles en multiline automático
    let cursorX = xBase;
    let lineHeight = fontSize * 0.5; // Espaciado aprox

    // Aplanamos en palabras para procesar saltos de línea
    // Cada 'part' alterna entre normal (índice par) y negrita (índice impar)

    // Estrategia simplificada pero robusta:
    // 1. Imprimimos línea por línea usando HTML? No, jsPDF html es lento/buggy en navegadores.
    // 2. Cálculo manual de ancho.

    let lineBuffer: { text: string; bold: boolean; width: number }[] = [];
    let currentLineWidth = 0;

    parts.forEach((part, index) => {
      const isBold = index % 2 !== 0; // Partes impares son las que estaban entre **
      if (!part) return;

      // Dividir en palabras para controlar el wrap
      const words = part.split(/(\s+)/); // Mantiene espacios

      words.forEach(word => {
        this.doc.setFont(THEME.fonts.body, isBold ? 'bold' : 'normal');
        const wordWidth = this.doc.getTextWidth(word);

        if (currentLineWidth + wordWidth > maxWidth) {
          // FLUSH LINE
          this.printLineBuffer(lineBuffer, xBase, this.currentY);
          this.currentY += lineHeight + 2;
          this.checkPageBreak(10);

          // Reset
          lineBuffer = [];
          currentLineWidth = 0;

          // Si es un espacio al inicio de nueva línea, lo ignoramos (opcional, mejora estética)
          if (/^\s+$/.test(word)) return;
        }

        lineBuffer.push({ text: word, bold: isBold, width: wordWidth });
        currentLineWidth += wordWidth;
      });
    });

    // Flush final line
    if (lineBuffer.length > 0) {
      this.printLineBuffer(lineBuffer, xBase, this.currentY);
      this.currentY += lineHeight + 4; // Salto de párrafo
    }
  }

  private printLineBuffer(
    buffer: { text: string; bold: boolean; width: number }[],
    x: number,
    y: number
  ) {
    let currentX = x;
    buffer.forEach(chunk => {
      this.doc.setFont(THEME.fonts.body, chunk.bold ? 'bold' : 'normal');
      this.doc.text(chunk.text, currentX, y);
      currentX += chunk.width;
    });
  }

  private extractTableFromMarkdown(markdown: string) {
    const lines = markdown.split('\n');
    let head: string[] = [];
    let body: string[][] = [];
    let inTable = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('|')) {
        if (trimmed.includes('---')) continue;
        const cols = trimmed
          .split('|')
          .map(c => c.trim())
          .filter(c => c !== '');

        if (!inTable) {
          head = cols;
          inTable = true;
        } else {
          body.push(cols);
        }
      } else if (inTable) {
        break;
      }
    }
    return head.length > 0 ? { head, body } : null;
  }

  private checkPageBreak(neededHeight: number) {
    if (this.currentY + neededHeight > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
  }

  private addPageNumbers() {
    const pageCount = this.doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.setTextColor(150, 150, 150);
      this.doc.text(
        `Página ${i} de ${pageCount} - Smashly.app`,
        this.pageWidth / 2,
        this.pageHeight - 10,
        { align: 'center' }
      );
    }
  }

  private async loadImages(
    rackets: Racket[],
    proxyUrlBase: string
  ): Promise<Record<number, string>> {
    const loaded: Record<number, string> = {};
    const promises = rackets.map(async r => {
      if (!r.imagen) return;
      try {
        const url = r.imagen.startsWith('http')
          ? `${proxyUrlBase}/api/v1/proxy/image?url=${encodeURIComponent(r.imagen)}`
          : r.imagen;

        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise<void>(resolve => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              loaded[r.id!] = reader.result;
            }
            resolve();
          };
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.warn(`Error loading image for ${r.nombre}`, e);
      }
    });
    await Promise.all(promises);
    return loaded;
  }
}
