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

    // Capture at 4x scale for professional quality
    const canvas = await html2canvas(element, {
      scale: 4, // 4x for high quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: false,
      imageTimeout: 0,
      removeContainer: true,
    });

    onProgress?.(60);

    // A4 dimensions in mm
    const A4_WIDTH_MM = 210;
    const A4_HEIGHT_MM = 297;

    // Calculate scaling to fit A4 width
    const imgWidth = A4_WIDTH_MM;
    const imgHeight = (canvas.height * A4_WIDTH_MM) / canvas.width;

    // Initialize PDF with consistent A4 settings
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
      precision: 2,
    });

    let heightLeft = imgHeight;
    let position = 0;

    // Use high-quality JPEG compression (0.98 quality)
    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    // Add first page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= A4_HEIGHT_MM;

    // Add additional pages if content exceeds one page
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage('a4', 'portrait');
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= A4_HEIGHT_MM;
    }

    onProgress?.(90);

    // Save with consistent filename format
    pdf.save(filename);

    onProgress?.(100);
  } catch (error) {
    console.error('[pdfExport] Failed to generate PDF:', error);
    throw error;
  }
}
