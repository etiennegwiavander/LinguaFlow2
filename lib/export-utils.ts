import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import HTMLtoDOCX from 'html-to-docx';

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

    // Create a clone of the element to modify for better PDF formatting
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.width = '210mm'; // A4 width
    clone.style.padding = '15mm';
    clone.style.backgroundColor = '#ffffff';
    
    // Improve text formatting
    const textElements = clone.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, span');
    textElements.forEach(el => {
      (el as HTMLElement).style.fontSize = '12pt';
      (el as HTMLElement).style.lineHeight = '1.5';
      (el as HTMLElement).style.color = '#000000';
    });
    
    // Improve heading formatting
    const headings = clone.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(heading => {
      (heading as HTMLElement).style.pageBreakAfter = 'avoid';
      (heading as HTMLElement).style.pageBreakBefore = 'auto';
    });
    
    // Add the clone to the document temporarily (hidden)
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    document.body.appendChild(clone);

    // Create a canvas from the element
    const canvas = await html2canvas(clone, {
      scale: 2, // Higher scale for better quality
      useCORS: true, // Allow loading cross-origin images
      logging: false,
      backgroundColor: '#ffffff',
    });
    
    // Remove the clone from the document
    document.body.removeChild(clone);

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
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageCount = Math.ceil(pdfHeight / pageHeight);
    
    for (let i = 1; i < pageCount; i++) {
      pdf.addPage();
      pdf.addImage(
        imgData,
        'PNG',
        0,
        -(pageHeight * i),
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
 * Exports the lesson content as a Word document
 * @param elementId The ID of the element to export
 * @param fileName The name of the file to save
 */
export const exportToWord = async (elementId: string, fileName: string = 'lesson-material'): Promise<void> => {
  try {
    // Get the element to export
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    // Show loading toast
    const toast = (window as any).toast;
    if (toast) {
      toast.info('Preparing Word document export...');
    }

    // Get the HTML content
    const htmlContent = element.innerHTML;
    
    // Add proper styling for Word document
    const styledHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              font-size: 12pt;
              line-height: 1.5;
              color: #000000;
            }
            h1, h2, h3, h4, h5, h6 {
              margin-top: 12pt;
              margin-bottom: 6pt;
              page-break-after: avoid;
            }
            p {
              margin-bottom: 8pt;
            }
            ul, ol {
              margin-bottom: 10pt;
            }
            li {
              margin-bottom: 4pt;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              margin-bottom: 10pt;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8pt;
            }
            img {
              max-width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `;

    // Convert HTML to DOCX
    const docxBlob = await HTMLtoDOCX(styledHtml, null, {
      title: fileName,
      margin: {
        top: 1440, // 1 inch in twips
        right: 1440,
        bottom: 1440,
        left: 1440,
      },
    });

    // Create a download link
    const url = URL.createObjectURL(docxBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.docx`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);

    // Show success toast
    if (toast) {
      toast.success('Word document exported successfully!');
    }
  } catch (error) {
    console.error('Error exporting to Word:', error);
    const toast = (window as any).toast;
    if (toast) {
      toast.error('Failed to export Word document. Please try again.');
    }
  }
};

/**
 * Shows a dialog to export the lesson as PDF or Word
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
    <p style="margin-bottom: 16px;">Choose a format to export the lesson material:</p>
    <div style="display: flex; gap: 8px; margin-bottom: 24px;">
      <button id="export-pdf" style="flex: 1; padding: 8px 16px; background-color: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer;">Export PDF</button>
      <button id="export-word" style="flex: 1; padding: 8px 16px; background-color: #7c3aed; color: white; border: none; border-radius: 4px; cursor: pointer;">Export Word</button>
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

  document.getElementById('export-word')?.addEventListener('click', async () => {
    document.body.removeChild(dialog);
    await exportToWord(elementId, fileName);
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