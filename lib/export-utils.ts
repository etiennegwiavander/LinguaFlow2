import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Exports the lesson content as a PDF file
 * @param elementId The ID of the element to export
 * @param fileName The name of the file to save
 */
export const exportToPdf = async (elementId: string, fileName: string = 'lesson-material'): Promise<void> => {
  try {
    // Get the element to export
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    // Show loading toast
    const toast = (window as any).toast;
    if (toast) {
      toast.info('Preparing PDF export...');
    }

    // Create a canvas from the element
    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better quality
      useCORS: true, // Allow loading cross-origin images
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Create a PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Calculate the width and height to maintain aspect ratio
    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    // Add the image to the PDF
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    // If the content is longer than one page, add more pages
    const pageCount = Math.ceil(pdfHeight / pdf.internal.pageSize.getHeight());
    
    for (let i = 1; i < pageCount; i++) {
      pdf.addPage();
      pdf.addImage(
        imgData,
        'PNG',
        0,
        -(pdf.internal.pageSize.getHeight() * i),
        pdfWidth,
        pdfHeight
      );
    }

    // Save the PDF
    pdf.save(`${fileName}.pdf`);

    // Show success toast
    if (toast) {
      toast.success('PDF exported successfully!');
    }
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    const toast = (window as any).toast;
    if (toast) {
      toast.error('Failed to export PDF. Please try again.');
    }
  }
};

/**
 * Shows a dialog to export the lesson as PDF
 * @param elementId The ID of the element to export
 * @param fileName The base name of the file to save
 */
export const showExportDialog = (elementId: string, fileName: string = 'lesson-material'): void => {
  // Create a modal dialog
  const dialog = document.createElement('div');
  dialog.style.position = 'fixed';
  dialog.style.top = '0';
  dialog.style.left = '0';
  dialog.style.width = '100%';
  dialog.style.height = '100%';
  dialog.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  dialog.style.display = 'flex';
  dialog.style.alignItems = 'center';
  dialog.style.justifyContent = 'center';
  dialog.style.zIndex = '9999';

  // Create the dialog content
  const content = document.createElement('div');
  content.style.backgroundColor = 'white';
  content.style.borderRadius = '8px';
  content.style.padding = '24px';
  content.style.width = '400px';
  content.style.maxWidth = '90%';
  content.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  content.innerHTML = `
    <h2 style="margin-top: 0; margin-bottom: 16px; font-size: 20px; font-weight: bold;">Export Lesson</h2>
    <p style="margin-bottom: 16px;">Export the lesson material as a PDF:</p>
    <div style="display: flex; gap: 8px; margin-bottom: 24px;">
      <button id="export-pdf" style="flex: 1; padding: 8px 16px; background-color: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer;">Export PDF</button>
    </div>
    <button id="export-cancel" style="width: 100%; padding: 8px 16px; background-color: #e5e7eb; color: #374151; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
  `;

  // Add the dialog to the document
  dialog.appendChild(content);
  document.body.appendChild(dialog);

  // Add event listeners
  document.getElementById('export-pdf')?.addEventListener('click', async () => {
    document.body.removeChild(dialog);
    await exportToPdf(elementId, fileName);
  });

  document.getElementById('export-cancel')?.addEventListener('click', () => {
    document.body.removeChild(dialog);
  });

  // Close the dialog when clicking outside
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      document.body.removeChild(dialog);
    }
  });
};