import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface ExportPDFOptions {
  filename?: string;
  onProgress?: (progress: number) => void;
}

/**
 * Exports a newspaper HTML element to a PDF file.
 * Uses html2canvas to capture the rendered output and jsPDF to create the PDF.
 */
export async function exportNewspaperToPDF(
  elementId: string = 'newspaper-content',
  options: ExportPDFOptions = {}
): Promise<void> {
  const { filename = `DigiTimes-${new Date().toISOString().split('T')[0]}.pdf`, onProgress } = options;

  try {
    onProgress?.(10);
    
    // Get the newspaper container element
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found.`);
    }

    onProgress?.(20);

    // Capture the element as a canvas
    // Using high quality settings for better output
    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better quality (300 DPI equivalent)
      useCORS: true, // Allow cross-origin images
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    onProgress?.(60);

    // Calculate PDF dimensions
    // Letter size: 8.5 x 11 inches = 216 x 279 mm
    const imgWidth = 210; // A4 width in mm (close to Letter)
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: imgHeight > imgWidth ? 'portrait' : 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    onProgress?.(70);

    // If content fits on one page
    if (imgHeight <= pageHeight) {
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
    } else {
      // Multi-page PDF
      let heightLeft = imgHeight;
      let position = 0;
      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      // Add first page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add remaining pages
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
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
