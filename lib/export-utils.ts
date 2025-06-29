import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import htmlToDocx from 'html-to-docx';

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

    // Create a styled HTML document
    const styledHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            h1 {
              color: #2563eb;
              font-size: 24px;
              margin-bottom: 16px;
            }
            h2 {
              color: #4f46e5;
              font-size: 20px;
              margin-bottom: 12px;
            }
            h3 {
              color: #6366f1;
              font-size: 18px;
              margin-bottom: 10px;
            }
            p {
              margin-bottom: 10px;
            }
            ul, ol {
              margin-bottom: 10px;
              padding-left: 20px;
            }
            .card {
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 16px;
              margin-bottom: 16px;
              background-color: #f9fafb;
            }
            .card-title {
              font-weight: bold;
              margin-bottom: 8px;
              color: #1f2937;
            }
            .badge {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 9999px;
              font-size: 12px;
              font-weight: 500;
              background-color: #e5e7eb;
              color: #4b5563;
              margin-right: 4px;
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `;

    // Convert HTML to DOCX
    const docxBuffer = await htmlToDocx(styledHtml, {
      title: fileName,
      margin: {
        top: 1440, // 1 inch
        right: 1440,
        bottom: 1440,
        left: 1440,
      },
    });

    // Create a download link
    const blob = new Blob([docxBuffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

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
 * Shows a dialog to choose export format and then exports the lesson
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
      <button id="export-pdf" style="flex: 1; padding: 8px 16px; background-color: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer;">PDF</button>
      <button id="export-word" style="flex: 1; padding: 8px 16px; background-color: #4f46e5; color: white; border: none; border-radius: 4px; cursor: pointer;">Word</button>
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