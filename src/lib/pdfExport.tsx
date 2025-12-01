import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { NewspaperPDF } from '../components/NewspaperPDF';
import type { ArchiveItem } from '../types/story';

export interface ExportPDFOptions {
  filename?: string;
  onProgress?: (progress: number) => void;
  stories?: ArchiveItem[]; // Pass stories directly
}

/**
 * Exports a newspaper to a PDF file using @react-pdf/renderer.
 */
export async function exportNewspaperToPDF(
  _elementId: string = 'newspaper-content', // Deprecated but kept for signature compatibility
  options: ExportPDFOptions = {}
): Promise<void> {
  const { filename = `DigiTimes-${new Date().toISOString().split('T')[0]}.pdf`, onProgress, stories } = options;

  if (!stories || stories.length === 0) {
    console.error('No stories provided for PDF export');
    return;
  }

  try {
    onProgress?.(10);

    // Render the PDF component to a blob
    const blob = await pdf(<NewspaperPDF stories={stories} />).toBlob();
    
    onProgress?.(80);

    // Create a download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onProgress?.(100);
  } catch (error) {
    console.error('[pdfExport] Failed to generate PDF:', error);
    throw error;
  }
}
