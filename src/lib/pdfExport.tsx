import jsPDF from 'jspdf';
import type { EditionLayout } from './newspaperLayout';

export interface ExportPDFOptions { filename?: string; onProgress?: (progress: number) => void; }

export async function waitForEditionImages(element: HTMLElement): Promise<void> {
  await document.fonts?.ready;
  await Promise.all(Array.from(element.querySelectorAll('img')).map(image => new Promise<void>((resolve, reject) => {
    const finish = () => { cleanup(); image.naturalWidth > 0 ? resolve() : reject(new Error('A photo could not be loaded. Please retry before exporting.')); };
    const timer = window.setTimeout(() => { cleanup(); reject(new Error('A photo is taking too long to load. Please retry.')); }, 15000);
    const cleanup = () => { window.clearTimeout(timer); image.removeEventListener('load', finish); image.removeEventListener('error', finish); };
    if (image.complete) finish(); else { image.addEventListener('load', finish); image.addEventListener('error', finish); }
  })));
}

/** Export measured pages with real text; photos alone are raster images. */
export async function exportNewspaperToPDF(layout: EditionLayout, options: ExportPDFOptions = {}): Promise<void> {
  const element = document.getElementById('newspaper-content');
  if (!element) throw new Error('Newspaper preview not found.');
  options.onProgress?.(10);
  await waitForEditionImages(element);
  const pdf = createEditionPDF(layout, Array.from(element.querySelectorAll('img')).map(image => ({ url: image.getAttribute('src') || image.src, source: image, width: image.naturalWidth, height: image.naturalHeight })));
  options.onProgress?.(90);
  pdf.save(options.filename || `${layout.options.title.replace(/[^a-z0-9-]+/gi, '-').slice(0, 70) || 'DigiTimes'}.pdf`);
  options.onProgress?.(100);
}

export interface PDFPhoto { url: string; source: string | HTMLImageElement; width: number; height: number; }

export function createEditionPDF(layout: EditionLayout, images: PDFPhoto[] = []): jsPDF {
  const pdf = new jsPDF({ unit: 'pt', format: layout.options.paper, compress: true });
  pdf.setProperties({ title: layout.options.title, author: 'DigiTimes', subject: 'Your family edition' });
  for (let index = 0; index < layout.pages.length; index++) {
    if (index) pdf.addPage(layout.options.paper);
    pdf.setDrawColor(35, 32, 28);
    pdf.line(36, index === 0 ? 116 : 90, layout.width - 36, index === 0 ? 116 : 90);
    for (const block of layout.pages[index]) {
      if (block.kind === 'text') {
        // Other scripts use the browser's font coverage through Print / Save PDF.
        if (/[^\u0020-\u00ff\u2013-\u2014\u2018-\u201d\u2022\u2026\u20ac]/.test(block.text)) {
          throw new Error('This edition includes characters that need browser fonts. Use Print / Save PDF to keep them intact.');
        }
        pdf.setFont('times', block.bold ? 'bold' : 'normal'); pdf.setFontSize(block.size);
        pdf.text(block.text, block.x, block.y + block.size, { baseline: 'alphabetic' });
      } else {
        const image = images.find(image => image.url === block.url);
        if (!image) throw new Error('A photo could not be found. Please reload your edition.');
        const ratio = Math.min(block.width / image.width, block.height / image.height);
        const width = image.width * ratio, height = image.height * ratio;
        pdf.addImage(image.source, block.x + (block.width - width) / 2, block.y + (block.height - height) / 2, width, height);
      }
    }
  }
  return pdf;
}
