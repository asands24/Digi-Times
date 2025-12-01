import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface ExportPDFOptions {
  filename?: string;
  onProgress?: (progress: number) => void;
}

/**
 * Exports a newspaper HTML element to a PDF file using html2canvas.
 * Captures the visible newspaper layout and converts it to PDF.
 */
export async function exportNewspaperToPDF(
  elementId: string = 'newspaper-content',
  options: ExportPDFOptions = {}
): Promise<void> {
  const { filename = `DigiTimes-${new Date().toISOString().split('T')[0]}.pdf`, onProgress } = options;

  try {
    onProgress?.(10);

    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found.`);
    }

    onProgress?.(30);

    // Capture the element as an image
    const canvas = await html2canvas(element, {
      scale: 2, // Higher quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    onProgress?.(60);

    // Calculate PDF dimensions
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pageHeight = 297; // A4 height in mm

    const pdf = new jsPDF({
      orientation: imgHeight > pageHeight ? 'portrait' : 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    let heightLeft = imgHeight;
    let position = 0;
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // Add first page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    onProgress?.(90);

    // Save the PDF
    pdf.save(filename);

    onProgress?.(100);
  } catch (error) {
    console.error('[pdfExport] Failed to generate PDF:', error);
    throw error;
  }
}
