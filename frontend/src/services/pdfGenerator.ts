import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Racket, ComparisonResult } from '../types/racket';

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
  comparison: ComparisonResult;
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
    const { rackets, comparison } = options;

    // 1. Cargar imágenes
    const images = await this.loadImages(rackets, options.proxyUrlBase);

    // 2. Portada (Cover Page)
    this.renderCoverPage(rackets, images);

    // 3. Resumen Ejecutivo
    this.renderExecutiveSummary(comparison.executiveSummary);

    // 4. Tabla Comparativa
    if (comparison.comparisonTable) {
      this.renderComparisonTableFromData(comparison.comparisonTable);
    }

    // 5. Análisis Técnico
    this.renderTechnicalAnalysis(comparison.technicalAnalysis);

    // 6. Perfiles Recomendados
    this.renderRecommendedProfiles(comparison.recommendedProfiles);

    // 7. Consideraciones Biomecánicas
    this.renderBiomechanicalConsiderations(comparison.biomechanicalConsiderations);

    // 8. Conclusión
    this.renderConclusion(comparison.conclusion);

    // 9. Pie de página y numeración
    this.addPageNumbers();

    // 10. Guardar
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

  private renderComparisonTableFromData(tableData: any[]) {
    if (!tableData || tableData.length === 0) return;

    this.checkPageBreak(60);

    this.doc.setFontSize(14);
    this.doc.setTextColor(
      THEME.colors.primary[0],
      THEME.colors.primary[1],
      THEME.colors.primary[2]
    );
    this.doc.setFont(THEME.fonts.header, 'bold');
    this.doc.text('TABLA COMPARATIVA', this.margin, this.currentY);
    this.currentY += 8;

    // Transform structured data for autoTable
    // We need to extract headers and body
    // Assuming tableData is an array of objects where keys are columns
    if (tableData.length === 0) return;

    const headers = Object.keys(tableData[0]).filter(k => k !== 'feature');
    const head = ['Característica', ...headers];
    
    const body = tableData.map(item => {
      return [item.feature, ...headers.map(h => item[h])];
    });

    // @ts-ignore
    autoTable(this.doc, {
      startY: this.currentY,
      head: [head],
      body: body,
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
        fillColor: THEME.colors.primary as [number, number, number],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
      },
      bodyStyles: {
        textColor: THEME.colors.secondary as [number, number, number],
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

  private renderExecutiveSummary(summary: string) {
    this.checkPageBreak(40);

    this.doc.setFontSize(14);
    this.doc.setTextColor(
      THEME.colors.primary[0],
      THEME.colors.primary[1],
      THEME.colors.primary[2]
    );
    this.doc.setFont(THEME.fonts.header, 'bold');
    this.doc.text('RESUMEN EJECUTIVO', this.margin, this.currentY);
    this.currentY += 10;

    this.printRichText(summary, 10, false);
    this.currentY += 10;
  }

  private renderTechnicalAnalysis(sections: any[]) {
    if (!sections || sections.length === 0) return;

    this.checkPageBreak(40);

    this.doc.setFontSize(14);
    this.doc.setTextColor(
      THEME.colors.primary[0],
      THEME.colors.primary[1],
      THEME.colors.primary[2]
    );
    this.doc.setFont(THEME.fonts.header, 'bold');
    this.doc.text('ANÁLISIS TÉCNICO', this.margin, this.currentY);
    this.currentY += 10;

    sections.forEach(section => {
      this.checkPageBreak(30);

      // Section title
      this.doc.setFontSize(12);
      this.doc.setTextColor(
        THEME.colors.secondary[0],
        THEME.colors.secondary[1],
        THEME.colors.secondary[2]
      );
      this.doc.setFont(THEME.fonts.header, 'bold');
      this.doc.text(section.title, this.margin, this.currentY);
      this.currentY += 8;

      // Section content
      this.printRichText(section.content, 10, false);
      this.currentY += 5;
    });
  }

  private renderRecommendedProfiles(content: string) {
    if (!content) return;

    this.checkPageBreak(40);

    this.doc.setFontSize(14);
    this.doc.setTextColor(
      THEME.colors.primary[0],
      THEME.colors.primary[1],
      THEME.colors.primary[2]
    );
    this.doc.setFont(THEME.fonts.header, 'bold');
    this.doc.text('PERFILES RECOMENDADOS', this.margin, this.currentY);
    this.currentY += 10;

    this.printRichText(content, 10, false);
    this.currentY += 10;
  }

  private renderBiomechanicalConsiderations(content: string) {
    if (!content) return;

    this.checkPageBreak(40);

    this.doc.setFontSize(14);
    this.doc.setTextColor(
      THEME.colors.primary[0],
      THEME.colors.primary[1],
      THEME.colors.primary[2]
    );
    this.doc.setFont(THEME.fonts.header, 'bold');
    this.doc.text('CONSIDERACIONES BIOMECÁNICAS', this.margin, this.currentY);
    this.currentY += 10;

    this.printRichText(content, 10, false);
    this.currentY += 10;
  }

  private renderConclusion(content: string) {
    if (!content) return;

    this.checkPageBreak(40);

    this.doc.setFontSize(14);
    this.doc.setTextColor(
      THEME.colors.primary[0],
      THEME.colors.primary[1],
      THEME.colors.primary[2]
    );
    this.doc.setFont(THEME.fonts.header, 'bold');
    this.doc.text('CONCLUSIÓN', this.margin, this.currentY);
    this.currentY += 10;

    this.printRichText(content, 10, false);
    this.currentY += 10;
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
      if (!r.imagenes || !r.imagenes[0]) return;
      try {
        const url = r.imagenes[0].startsWith('http')
          ? `${proxyUrlBase}/api/v1/proxy/image?url=${encodeURIComponent(r.imagenes[0])}`
          : r.imagenes[0];

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
