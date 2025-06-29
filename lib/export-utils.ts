import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Exports the lesson content as a PDF file with improved formatting
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
    
    // Apply styles for better PDF formatting
    clone.style.width = '210mm'; // A4 width
    clone.style.padding = '20mm'; // Generous margins
    clone.style.backgroundColor = '#ffffff';
    clone.style.color = '#000000';
    
    // Add a title page
    const titlePage = document.createElement('div');
    titlePage.style.height = '240mm'; // A4 height minus margins
    titlePage.style.display = 'flex';
    titlePage.style.flexDirection = 'column';
    titlePage.style.justifyContent = 'center';
    titlePage.style.alignItems = 'center';
    titlePage.style.textAlign = 'center';
    titlePage.style.marginBottom = '20mm';
    
    // Get the lesson title
    const lessonTitle = clone.querySelector('h1, h2, .title')?.textContent || 'Lesson Material';
    
    // Create title elements
    const titleHeader = document.createElement('h1');
    titleHeader.textContent = lessonTitle;
    titleHeader.style.fontSize = '28pt';
    titleHeader.style.fontWeight = 'bold';
    titleHeader.style.marginBottom = '16pt';
    titleHeader.style.color = '#1e40af'; // Deep blue color
    
    const subtitle = document.createElement('h2');
    subtitle.textContent = 'LinguaFlow';
    subtitle.style.fontSize = '18pt';
    subtitle.style.marginBottom = '40pt';
    subtitle.style.color = '#3b82f6'; // Blue color
    
    const date = document.createElement('p');
    date.textContent = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    date.style.fontSize = '12pt';
    date.style.color = '#6b7280'; // Gray color
    
    // Add elements to title page
    titlePage.appendChild(titleHeader);
    titlePage.appendChild(subtitle);
    titlePage.appendChild(date);
    
    // Add page break after title page
    const pageBreak = document.createElement('div');
    pageBreak.style.pageBreakAfter = 'always';
    titlePage.appendChild(pageBreak);
    
    // Insert title page at the beginning of the clone
    clone.insertBefore(titlePage, clone.firstChild);
    
    // Add table of contents
    const tocContainer = document.createElement('div');
    tocContainer.style.marginBottom = '20mm';
    
    const tocTitle = document.createElement('h2');
    tocTitle.textContent = 'Contents';
    tocTitle.style.fontSize = '18pt';
    tocTitle.style.fontWeight = 'bold';
    tocTitle.style.marginBottom = '12pt';
    tocTitle.style.color = '#1e40af'; // Deep blue color
    
    tocContainer.appendChild(tocTitle);
    
    // Get all section headings
    const headings = clone.querySelectorAll('h1, h2, h3, h4');
    const tocList = document.createElement('ul');
    tocList.style.listStyleType = 'none';
    tocList.style.paddingLeft = '0';
    
    headings.forEach((heading, index) => {
      // Skip the title page heading
      if (index === 0 && heading.textContent === lessonTitle) return;
      
      const tocItem = document.createElement('li');
      tocItem.style.marginBottom = '8pt';
      tocItem.style.fontSize = '12pt';
      
      // Add indentation based on heading level
      const headingLevel = parseInt(heading.tagName.substring(1));
      tocItem.style.paddingLeft = `${(headingLevel - 1) * 12}pt`;
      
      // Add dot leaders
      tocItem.textContent = heading.textContent || `Section ${index}`;
      
      tocList.appendChild(tocItem);
    });
    
    tocContainer.appendChild(tocList);
    
    // Add page break after TOC
    const tocPageBreak = document.createElement('div');
    tocPageBreak.style.pageBreakAfter = 'always';
    tocContainer.appendChild(tocPageBreak);
    
    // Insert TOC after title page
    clone.insertBefore(tocContainer, titlePage.nextSibling);
    
    // Improve text formatting
    const textElements = clone.querySelectorAll('p, li, span');
    textElements.forEach(el => {
      (el as HTMLElement).style.fontSize = '11pt';
      (el as HTMLElement).style.lineHeight = '1.5';
      (el as HTMLElement).style.color = '#000000';
      (el as HTMLElement).style.fontFamily = 'Arial, sans-serif';
      (el as HTMLElement).style.marginBottom = '8pt';
    });
    
    // Improve heading formatting
    const headingsAll = clone.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headingsAll.forEach((heading, index) => {
      // Skip the title page heading
      if (index === 0 && heading.textContent === lessonTitle) return;
      
      const headingLevel = parseInt(heading.tagName.substring(1));
      
      (heading as HTMLElement).style.pageBreakAfter = 'avoid';
      (heading as HTMLElement).style.pageBreakBefore = headingLevel <= 2 ? 'always' : 'auto';
      (heading as HTMLElement).style.marginTop = '24pt';
      (heading as HTMLElement).style.marginBottom = '12pt';
      (heading as HTMLElement).style.fontWeight = 'bold';
      (heading as HTMLElement).style.fontFamily = 'Arial, sans-serif';
      
      // Set font size based on heading level
      switch (headingLevel) {
        case 1:
          (heading as HTMLElement).style.fontSize = '20pt';
          (heading as HTMLElement).style.color = '#1e40af'; // Deep blue
          break;
        case 2:
          (heading as HTMLElement).style.fontSize = '16pt';
          (heading as HTMLElement).style.color = '#2563eb'; // Blue
          break;
        case 3:
          (heading as HTMLElement).style.fontSize = '14pt';
          (heading as HTMLElement).style.color = '#3b82f6'; // Light blue
          break;
        default:
          (heading as HTMLElement).style.fontSize = '12pt';
          (heading as HTMLElement).style.color = '#000000';
      }
      
      // Add decorative underline to h1 and h2
      if (headingLevel <= 2) {
        const underline = document.createElement('div');
        underline.style.height = '2px';
        underline.style.width = '100%';
        underline.style.backgroundColor = headingLevel === 1 ? '#1e40af' : '#3b82f6';
        underline.style.marginTop = '4pt';
        underline.style.marginBottom = '12pt';
        
        heading.parentNode?.insertBefore(underline, heading.nextSibling);
      }
    });
    
    // Improve card formatting
    const cards = clone.querySelectorAll('.card, [class*="Card"], [class*="card"]');
    cards.forEach(card => {
      (card as HTMLElement).style.border = '1px solid #e2e8f0';
      (card as HTMLElement).style.borderRadius = '4px';
      (card as HTMLElement).style.marginBottom = '16pt';
      (card as HTMLElement).style.padding = '12pt';
      (card as HTMLElement).style.backgroundColor = '#f8fafc'; // Very light blue/gray
      (card as HTMLElement).style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    });
    
    // Format exercise sections
    const exercises = clone.querySelectorAll('[id^="exercise_"], [class*="exercise"]');
    exercises.forEach((exercise, index) => {
      // Add alternating background colors for exercises
      (exercise as HTMLElement).style.backgroundColor = index % 2 === 0 ? '#f0f9ff' : '#f0fdf4'; // Light blue/green alternating
      (exercise as HTMLElement).style.padding = '16pt';
      (exercise as HTMLElement).style.marginBottom = '20pt';
      (exercise as HTMLElement).style.borderRadius = '8px';
      (exercise as HTMLElement).style.border = index % 2 === 0 ? '1px solid #bfdbfe' : '1px solid #bbf7d0';
    });
    
    // Format lists
    const lists = clone.querySelectorAll('ul, ol');
    lists.forEach(list => {
      (list as HTMLElement).style.marginBottom = '16pt';
      (list as HTMLElement).style.paddingLeft = '24pt';
    });
    
    // Format list items
    const listItems = clone.querySelectorAll('li');
    listItems.forEach(item => {
      (item as HTMLElement).style.marginBottom = '6pt';
    });
    
    // Format tables
    const tables = clone.querySelectorAll('table');
    tables.forEach(table => {
      (table as HTMLElement).style.width = '100%';
      (table as HTMLElement).style.borderCollapse = 'collapse';
      (table as HTMLElement).style.marginBottom = '16pt';
      (table as HTMLElement).style.border = '1px solid #e2e8f0';
    });
    
    // Format table cells
    const tableCells = clone.querySelectorAll('th, td');
    tableCells.forEach(cell => {
      (cell as HTMLElement).style.border = '1px solid #e2e8f0';
      (cell as HTMLElement).style.padding = '8pt';
    });
    
    // Format table headers
    const tableHeaders = clone.querySelectorAll('th');
    tableHeaders.forEach(header => {
      (header as HTMLElement).style.backgroundColor = '#f1f5f9';
      (header as HTMLElement).style.fontWeight = 'bold';
    });
    
    // Remove any buttons or interactive elements
    const buttons = clone.querySelectorAll('button, [role="button"]');
    buttons.forEach(button => {
      button.parentNode?.removeChild(button);
    });
    
    // Add page numbers
    const pageNumberContainer = document.createElement('div');
    pageNumberContainer.style.position = 'fixed';
    pageNumberContainer.style.bottom = '10mm';
    pageNumberContainer.style.right = '10mm';
    pageNumberContainer.style.fontSize = '10pt';
    pageNumberContainer.style.color = '#6b7280';
    pageNumberContainer.textContent = 'Page ';
    pageNumberContainer.id = 'page-number-container';
    
    // Add footer with branding
    const footer = document.createElement('div');
    footer.style.position = 'fixed';
    footer.style.bottom = '10mm';
    footer.style.left = '10mm';
    footer.style.fontSize = '10pt';
    footer.style.color = '#6b7280';
    footer.textContent = 'Generated by LinguaFlow';
    
    // Add the clone to the document temporarily (hidden)
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    document.body.appendChild(clone);
    document.body.appendChild(pageNumberContainer);
    document.body.appendChild(footer);

    // Create a canvas from the element
    const canvas = await html2canvas(clone, {
      scale: 2, // Higher scale for better quality
      useCORS: true, // Allow loading cross-origin images
      logging: false,
      backgroundColor: '#ffffff',
    });
    
    // Remove the clone and page number container from the document
    document.body.removeChild(clone);
    document.body.removeChild(pageNumberContainer);
    document.body.removeChild(footer);

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
      
      // Add page number
      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128); // Gray color
      pdf.text(`Page ${i + 1} of ${pageCount}`, pdfWidth - 30, pageHeight - 10);
      
      // Add footer
      pdf.text('Generated by LinguaFlow', 10, pageHeight - 10);
    }

    // Add page number to first page
    pdf.setPage(1);
    pdf.setFontSize(10);
    pdf.setTextColor(107, 114, 128); // Gray color
    pdf.text(`Page 1 of ${pageCount}`, pdfWidth - 30, pageHeight - 10);
    
    // Add footer to first page
    pdf.text('Generated by LinguaFlow', 10, pageHeight - 10);

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
 * Exports the lesson content as a Word document by creating a downloadable HTML file
 * This is a browser-compatible alternative to html-to-docx
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

    // Create a clone of the element to modify for better Word formatting
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Get the lesson title
    const lessonTitle = clone.querySelector('h1, h2, .title')?.textContent || 'Lesson Material';
    
    // Create a properly formatted HTML document that Word can open
    const wordHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:w="urn:schemas-microsoft-com:office:word" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>${fileName}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          /* Word Document Styles */
          @page {
            size: 21cm 29.7cm;
            margin: 2cm;
          }
          body {
            font-family: 'Calibri', sans-serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #000000;
          }
          .title-page {
            text-align: center;
            page-break-after: always;
          }
          .title-page h1 {
            font-size: 28pt;
            color: #1e40af;
            margin-top: 200pt;
            margin-bottom: 16pt;
          }
          .title-page h2 {
            font-size: 18pt;
            color: #3b82f6;
            margin-bottom: 40pt;
          }
          .title-page p {
            font-size: 12pt;
            color: #6b7280;
          }
          .toc {
            page-break-after: always;
          }
          .toc h2 {
            font-size: 18pt;
            color: #1e40af;
            margin-bottom: 12pt;
          }
          .toc ul {
            list-style-type: none;
            padding-left: 0;
          }
          .toc li {
            margin-bottom: 8pt;
            font-size: 12pt;
          }
          .toc-level-2 {
            padding-left: 12pt;
          }
          .toc-level-3 {
            padding-left: 24pt;
          }
          h1, h2, h3, h4, h5, h6 {
            font-family: 'Calibri', sans-serif;
            font-weight: bold;
            margin-top: 24pt;
            margin-bottom: 12pt;
            page-break-after: avoid;
          }
          h1 { 
            font-size: 20pt; 
            color: #1e40af;
            border-bottom: 2pt solid #1e40af;
            padding-bottom: 4pt;
          }
          h2 { 
            font-size: 16pt; 
            color: #2563eb;
            border-bottom: 1pt solid #2563eb;
            padding-bottom: 2pt;
          }
          h3 { 
            font-size: 14pt; 
            color: #3b82f6;
          }
          h4 { 
            font-size: 12pt; 
            color: #000000;
          }
          p { margin-bottom: 8pt; }
          ul, ol { margin-bottom: 10pt; }
          li { margin-bottom: 4pt; }
          table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 10pt;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8pt;
          }
          th {
            background-color: #f1f5f9;
            font-weight: bold;
          }
          img {
            max-width: 100%;
            height: auto;
          }
          .card {
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            margin-bottom: 16pt;
            padding: 12pt;
            background-color: #f8fafc;
          }
          .exercise {
            padding: 16pt;
            margin-bottom: 20pt;
            border-radius: 8px;
          }
          .exercise-even {
            background-color: #f0f9ff;
            border: 1px solid #bfdbfe;
          }
          .exercise-odd {
            background-color: #f0fdf4;
            border: 1px solid #bbf7d0;
          }
          .footer {
            font-size: 10pt;
            color: #6b7280;
            text-align: center;
            margin-top: 20pt;
          }
          /* Remove any background colors and gradients */
          [class*="bg-"] {
            background-color: transparent !important;
          }
          [class*="gradient-"] {
            background-image: none !important;
          }
          /* Remove any interactive elements */
          button, [role="button"] {
            display: none !important;
          }
        </style>
      </head>
      <body>
        <!-- Title Page -->
        <div class="title-page">
          <h1>${lessonTitle}</h1>
          <h2>LinguaFlow</h2>
          <p>${new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</p>
        </div>
        
        <!-- Table of Contents -->
        <div class="toc">
          <h2>Contents</h2>
          <ul>
            ${Array.from(clone.querySelectorAll('h1, h2, h3, h4')).map((heading, index) => {
              // Skip the title page heading
              if (index === 0 && heading.textContent === lessonTitle) return '';
              
              const headingLevel = parseInt(heading.tagName.substring(1));
              const className = headingLevel > 1 ? `toc-level-${headingLevel}` : '';
              
              return `<li class="${className}">${heading.textContent}</li>`;
            }).join('')}
          </ul>
        </div>
        
        <!-- Main Content -->
        ${clone.innerHTML}
        
        <!-- Footer -->
        <div class="footer">
          <p>Generated by LinguaFlow</p>
        </div>
      </body>
      </html>
    `;

    // Create a Blob with the HTML content
    const blob = new Blob([wordHtml], { type: 'application/msword' });
    
    // Create a download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.doc`;
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