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
    const createPage = (pageNumber: number) => {
      const page = document.createElement('div');
      page.className = 'newspaper-pdf-page';
      page.style.width = `${PAGE_WIDTH_MM}mm`;
      page.style.height = `${PAGE_HEIGHT_MM}mm`;
      page.style.boxSizing = 'border-box';
      page.style.backgroundColor = '#ffffff';
      page.style.position = 'relative';
      
      // Header
      const header = document.createElement('div');
      header.className = 'newspaper-pdf-header';
      header.innerHTML = `
        <span>DigiTimes Edition</span>
        <span>${new Date().toLocaleDateString()}</span>
      `;
      page.appendChild(header);

      // Footer placeholder (updated later with total pages)
      const footer = document.createElement('div');
      footer.className = 'newspaper-pdf-footer';
      footer.dataset.page = pageNumber.toString();
      page.appendChild(footer);

      // Content Area
      const content = document.createElement('div');
      content.className = 'newspaper-pdf-content';
      content.style.padding = '0 40px'; // Side padding
      page.appendChild(content);

      // Copy relevant styles from source
      page.style.fontFamily = getComputedStyle(sourceElement).fontFamily;
      page.style.color = getComputedStyle(sourceElement).color;
      
      return { page, content };
    };

    const pages: { page: HTMLElement; content: HTMLElement }[] = [];
    let currentPageObj = createPage(1);
    sandbox.appendChild(currentPageObj.page);
    pages.push(currentPageObj);

    let currentHeight = 0;
    // Effective height for content: Page height - Header - Footer - Margins
    // 297mm total. Header/Footer ~15mm each. Margins ~10mm.
    // Let's use pixels for calculation.
    // 40px header + 40px footer + 20px extra gap = 100px reserved vertical space
    const MAX_CONTENT_HEIGHT_PX = PAGE_HEIGHT_PX - 120; 

    onProgress?.(15);

    // 5. Distribute content
    // 5. Distribute content
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const clone = child.cloneNode(true) as HTMLElement;
      
      // Add separator if not the first item
      if (i > 0) {
        const separator = document.createElement('div');
        separator.className = 'newspaper-pdf-separator';
        
        // Try to add separator
        currentPageObj.content.appendChild(separator);
        const sepHeight = separator.offsetHeight + 32; // + margin (2rem approx 32px)
        
        // If separator pushes us over, discard it (don't start page with separator)
        // But we DO start a new page for the next content
        if (currentHeight + sepHeight > MAX_CONTENT_HEIGHT_PX) {
          currentPageObj.content.removeChild(separator);
          
          // Start new page
          currentPageObj = createPage(pages.length + 1);
          sandbox.appendChild(currentPageObj.page);
          pages.push(currentPageObj);
          currentHeight = 0;
          // No separator at top of new page
        } else {
          currentHeight += sepHeight;
        }
      }

      // Now add the content
      currentPageObj.content.appendChild(clone);
      const height = clone.offsetHeight;
      
      if (currentHeight + height > MAX_CONTENT_HEIGHT_PX) {
        currentPageObj.content.removeChild(clone);
        
        // Start new page
        currentPageObj = createPage(pages.length + 1);
        sandbox.appendChild(currentPageObj.page);
        pages.push(currentPageObj);
        
        currentPageObj.content.appendChild(clone);
        currentHeight = height;
      } else {
        currentHeight += height;
      }
    }

    // Update footers with total pages
    pages.forEach((p, i) => {
      const footer = p.page.querySelector('.newspaper-pdf-footer');
      if (footer) {
        footer.innerHTML = `Page ${i + 1} of ${pages.length} • Created with DigiTimes`;
      }
    });

    onProgress?.(40);

    // 6. Generate PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    for (let i = 0; i < pages.length; i++) {
      const { page } = pages[i];
      
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
