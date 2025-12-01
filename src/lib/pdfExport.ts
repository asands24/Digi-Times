import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface ExportPDFOptions {
  filename?: string;
  onProgress?: (progress: number) => void;
}

/**
 * Exports a newspaper HTML element to a PDF file.
 * Uses a "smart pagination" approach to prevent content slicing.
 */
export async function exportNewspaperToPDF(
  elementId: string = 'newspaper-content',
  options: ExportPDFOptions = {}
): Promise<void> {
  const { filename = `DigiTimes-${new Date().toISOString().split('T')[0]}.pdf`, onProgress } = options;

  try {
    onProgress?.(5);

    // 1. Get the source element
    const sourceElement = document.getElementById(elementId);
    if (!sourceElement) {
      throw new Error(`Element with id "${elementId}" not found.`);
    }

    // 2. Create a hidden sandbox for pagination
    // We'll use this to layout pages one by one
    const sandbox = document.createElement('div');
    sandbox.style.position = 'absolute';
    sandbox.style.top = '-9999px';
    sandbox.style.left = '-9999px';
    sandbox.style.width = '210mm'; // A4 width
    sandbox.style.minHeight = '297mm'; // A4 height
    sandbox.style.backgroundColor = '#ffffff';
    document.body.appendChild(sandbox);

    // 3. Define page dimensions (A4 in pixels at 96 DPI)
    // A4 is 210mm x 297mm
    // We use a slightly smaller content area to account for margins if needed, 
    // but for simplicity we'll match the PDF size and rely on CSS padding.
    const PAGE_WIDTH_MM = 210;
    const PAGE_HEIGHT_MM = 297;
    // Conversion factor: 1mm approx 3.78px
    const MM_TO_PX = 3.78; 
    const PAGE_HEIGHT_PX = PAGE_HEIGHT_MM * MM_TO_PX;

    // 4. Clone content and prepare for distribution
    // We need to iterate through the children of the source and place them into pages
    const children = Array.from(sourceElement.children) as HTMLElement[];
    
    // Helper to create a new page container
    const createPage = () => {
      const page = document.createElement('div');
      page.className = 'newspaper-pdf-page'; // Add a class for specific print styling if needed
      page.style.width = `${PAGE_WIDTH_MM}mm`;
      page.style.height = `${PAGE_HEIGHT_MM}mm`;
      page.style.padding = '20px'; // Internal padding
      page.style.boxSizing = 'border-box';
      page.style.backgroundColor = '#ffffff';
      page.style.overflow = 'hidden';
      page.style.position = 'relative';
      // Copy relevant styles from source
      page.style.fontFamily = getComputedStyle(sourceElement).fontFamily;
      page.style.color = getComputedStyle(sourceElement).color;
      return page;
    };

    const pages: HTMLElement[] = [];
    let currentPage = createPage();
    sandbox.appendChild(currentPage);
    pages.push(currentPage);

    let currentHeight = 0;

    onProgress?.(15);

    // 5. Distribute content
    for (const child of children) {
      const clone = child.cloneNode(true) as HTMLElement;
      
      // Temporarily append to measure
      currentPage.appendChild(clone);
      const height = clone.offsetHeight;
      
      // If it fits, keep it. If not, move to next page.
      // We assume a single element is not taller than a page. 
      // If it is, it will be cut, but that's a rare edge case for this app.
      if (currentHeight + height > PAGE_HEIGHT_PX - 40) { // -40 for padding safety
        currentPage.removeChild(clone);
        
        // Start new page
        currentPage = createPage();
        sandbox.appendChild(currentPage);
        pages.push(currentPage);
        
        currentPage.appendChild(clone);
        currentHeight = height;
      } else {
        currentHeight += height;
      }
    }

    onProgress?.(40);

    // 6. Generate PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      
      // Update progress
      const progress = 40 + Math.floor((i / pages.length) * 50);
      onProgress?.(progress);

      const canvas = await html2canvas(page, {
        scale: 2, // High quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      if (i > 0) {
        pdf.addPage();
      }
      
      pdf.addImage(imgData, 'JPEG', 0, 0, PAGE_WIDTH_MM, PAGE_HEIGHT_MM);
    }

    // 7. Cleanup
    document.body.removeChild(sandbox);

    onProgress?.(95);

    // 8. Save
    pdf.save(filename);

    onProgress?.(100);
  } catch (error) {
    console.error('[pdfExport] Failed to generate PDF:', error);
    throw error;
  }
}
