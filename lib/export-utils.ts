import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Exports the lesson content as a PDF file with formatting that matches the online lesson material
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
    clone.style.padding = '0.7in 0.5in'; // Margins as requested: 0.7" top/bottom, 0.3" left/right
    clone.style.backgroundColor = '#ffffff';
    
    // Preserve the original styling by capturing all computed styles
    const preserveStyles = (element: HTMLElement) => {
      const computedStyle = window.getComputedStyle(element);
      
      // Apply the most important styles directly
      element.style.color = computedStyle.color;
      element.style.backgroundColor = computedStyle.backgroundColor;
      element.style.fontFamily = computedStyle.fontFamily;
      element.style.fontSize = computedStyle.fontSize;
      element.style.fontWeight = computedStyle.fontWeight;
      element.style.lineHeight = computedStyle.lineHeight;
      element.style.textAlign = computedStyle.textAlign;
      element.style.borderRadius = computedStyle.borderRadius;
      element.style.border = computedStyle.border;
      element.style.padding = computedStyle.padding;
      element.style.margin = computedStyle.margin;
      
      // For elements with background gradients, try to preserve them
      if (computedStyle.backgroundImage && computedStyle.backgroundImage !== 'none') {
        element.style.backgroundImage = computedStyle.backgroundImage;
      }
      
      // Recursively apply to children
      Array.from(element.children).forEach(child => {
        if (child instanceof HTMLElement) {
          preserveStyles(child);
        }
      });
    };
    
    // Apply the original styles to the clone
    preserveStyles(clone);
    
    // Add a title page that matches the LinguaFlow design
    const titlePage = document.createElement('div');
    titlePage.style.height = '240mm'; // A4 height minus margins
    titlePage.style.display = 'flex';
    titlePage.style.flexDirection = 'column';
    titlePage.style.justifyContent = 'center';
    titlePage.style.alignItems = 'center';
    titlePage.style.textAlign = 'center';
    titlePage.style.marginBottom = '20mm';
    titlePage.style.background = 'linear-gradient(135deg, rgba(100, 255, 218, 0.1) 0%, rgba(100, 255, 218, 0.05) 100%)';
    titlePage.style.borderRadius = '8px';
    titlePage.style.padding = '20mm';
    
    // Get the lesson title
    const lessonTitle = clone.querySelector('h1, h2, .title')?.textContent || 'Lesson Material';
    
    // Create title elements with LinguaFlow styling
    const titleHeader = document.createElement('h1');
    titleHeader.textContent = lessonTitle;
    titleHeader.style.fontSize = '28pt';
    titleHeader.style.fontWeight = 'bold';
    titleHeader.style.marginBottom = '16pt';
    titleHeader.style.background = 'linear-gradient(to right, #21c5f0, #d946ef)';
    titleHeader.style.webkitBackgroundClip = 'text';
    titleHeader.style.webkitTextFillColor = 'transparent';
    titleHeader.style.backgroundClip = 'text';
    titleHeader.style.color = '#21c5f0'; // Fallback color
    
    const subtitle = document.createElement('h2');
    subtitle.textContent = 'LinguaFlow';
    subtitle.style.fontSize = '18pt';
    subtitle.style.marginBottom = '40pt';
    subtitle.style.color = '#21c5f0'; // Cyber color from the app
    
    const date = document.createElement('p');
    date.textContent = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    date.style.fontSize = '12pt';
    date.style.color = '#64748b'; // Neural color from the app
    
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
    
    // Enhance section headers to match the app's cyber-card style
    const sectionHeaders = clone.querySelectorAll('h2, h3');
    sectionHeaders.forEach((header) => {
      const headerElement = header as HTMLElement;
      headerElement.style.background = 'linear-gradient(to right, rgba(33, 197, 240, 0.1), rgba(217, 70, 239, 0.1))';
      headerElement.style.borderLeft = '3px solid #21c5f0';
      headerElement.style.padding = '8pt';
      headerElement.style.borderRadius = '4px';
      headerElement.style.marginTop = '20pt';
      headerElement.style.marginBottom = '10pt';
    });
    
    // Style exercise sections to match the cyber-card style
    const exercises = clone.querySelectorAll('[id^="exercise_"], [class*="exercise"]');
    exercises.forEach((exercise) => {
      const exerciseElement = exercise as HTMLElement;
      exerciseElement.style.border = '1px solid rgba(33, 197, 240, 0.3)';
      exerciseElement.style.borderRadius = '8px';
      exerciseElement.style.padding = '12pt';
      exerciseElement.style.marginBottom = '16pt';
      exerciseElement.style.background = 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.1), rgba(33, 197, 240, 0.05))';
      exerciseElement.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
    });
    
    // Style instruction sections to match the app
    const instructions = clone.querySelectorAll('.instruction, [class*="instruction"]');
    instructions.forEach((instruction) => {
      const instructionElement = instruction as HTMLElement;
      instructionElement.style.backgroundColor = 'rgba(33, 197, 240, 0.1)';
      instructionElement.style.padding = '8pt';
      instructionElement.style.borderRadius = '4px';
      instructionElement.style.marginBottom = '10pt';
      instructionElement.style.fontStyle = 'italic';
    });
    
    // Style info cards to match the app
    const infoCards = clone.querySelectorAll('.info-card, [class*="info-card"]');
    infoCards.forEach((card) => {
      const cardElement = card as HTMLElement;
      cardElement.style.backgroundColor = 'rgba(217, 70, 239, 0.05)';
      cardElement.style.border = '1px solid rgba(217, 70, 239, 0.2)';
      cardElement.style.borderRadius = '8px';
      cardElement.style.padding = '12pt';
      cardElement.style.marginBottom = '16pt';
    });
    
    // Style lists to match the app's styling
    const lists = clone.querySelectorAll('ul, ol');
    lists.forEach((list) => {
      const listElement = list as HTMLElement;
      listElement.style.paddingLeft = '20pt';
      listElement.style.marginBottom = '12pt';
    });
    
    const listItems = clone.querySelectorAll('li');
    listItems.forEach((item) => {
      const itemElement = item as HTMLElement;
      itemElement.style.marginBottom = '6pt';
      itemElement.style.position = 'relative';
    });
    
    // Style vocabulary items to match the app
    const vocabItems = clone.querySelectorAll('.vocabulary-item, [class*="vocabulary"]');
    vocabItems.forEach((item) => {
      const itemElement = item as HTMLElement;
      itemElement.style.border = '1px solid rgba(33, 197, 240, 0.2)';
      itemElement.style.borderRadius = '6px';
      itemElement.style.padding = '8pt';
      itemElement.style.marginBottom = '8pt';
      itemElement.style.display = 'flex';
      itemElement.style.flexDirection = 'column';
    });
    
    // Style dialogue sections to match the app
    const dialogues = clone.querySelectorAll('.dialogue, [class*="dialogue"]');
    dialogues.forEach((dialogue) => {
      const dialogueElement = dialogue as HTMLElement;
      dialogueElement.style.backgroundColor = 'rgba(100, 116, 139, 0.05)';
      dialogueElement.style.borderRadius = '8px';
      dialogueElement.style.padding = '12pt';
      dialogueElement.style.marginBottom = '16pt';
    });
    
    // Style dialogue lines to match the app's chat-like interface
    const dialogueLines = clone.querySelectorAll('.dialogue-line, [class*="dialogue-line"]');
    dialogueLines.forEach((line, index) => {
      const lineElement = line as HTMLElement;
      lineElement.style.padding = '8pt';
      lineElement.style.marginBottom = '8pt';
      lineElement.style.borderRadius = '6px';
      
      // Alternate styles for different speakers
      if (index % 2 === 0) {
        lineElement.style.backgroundColor = 'rgba(33, 197, 240, 0.1)';
        lineElement.style.marginLeft = '20pt';
      } else {
        lineElement.style.backgroundColor = 'rgba(217, 70, 239, 0.1)';
        lineElement.style.marginRight = '20pt';
      }
    });
    
    // Remove any buttons or interactive elements
    const buttons = clone.querySelectorAll('button, [role="button"]');
    buttons.forEach(button => {
      button.parentNode?.removeChild(button);
    });
    
    // Add footer with branding that matches the app
    const footer = document.createElement('div');
    footer.style.position = 'fixed';
    footer.style.bottom = '10mm';
    footer.style.left = '0';
    footer.style.right = '0';
    footer.style.textAlign = 'center';
    footer.style.fontSize = '9pt';
    footer.style.color = '#64748b';
    footer.style.borderTop = '1px solid rgba(100, 116, 139, 0.2)';
    footer.style.paddingTop = '5mm';
    footer.innerHTML = `
      <div style="display: flex; justify-content: space-between; padding: 0 15mm;">
        <span>Generated by LinguaFlow</span>
        <span id="page-number"></span>
      </div>
    `;
    
    // Add the clone to the document temporarily (hidden)
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    document.body.appendChild(clone);
    document.body.appendChild(footer);

    // Create a canvas from the element
    const canvas = await html2canvas(clone, {
      scale: 2, // Higher scale for better quality
      useCORS: true, // Allow loading cross-origin images
      logging: false,
      backgroundColor: '#ffffff',
    });
    
    // Remove the clone and footer from the document
    document.body.removeChild(clone);
    document.body.removeChild(footer);

    // Create a PDF with A4 format - removed the invalid margins property
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: 'a4'
    });

    // Calculate the width and height to maintain aspect ratio
    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth() - 0.6; // Subtract left and right margins (0.3" each)
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    // Add the image to the PDF with the specified margins
    pdf.addImage(imgData, 'PNG', 0.3, 0.7, pdfWidth, pdfHeight);

    // If the content is longer than one page, add more pages
    const pageHeight = pdf.internal.pageSize.getHeight() - 1.4; // Subtract top and bottom margins (0.7" each)
    const pageCount = Math.ceil(pdfHeight / pageHeight);
    
    for (let i = 1; i < pageCount; i++) {
      pdf.addPage();
      pdf.addImage(
        imgData,
        'PNG',
        0.3, // Left margin
        0.7 - (pageHeight * i), // Top margin minus offset for current page
        pdfWidth,
        pdfHeight
      );
      
      // Add page number
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139); // Neural color
      pdf.text(`Page ${i + 1} of ${pageCount}`, pdf.internal.pageSize.getWidth() / 2, pdf.internal.pageSize.getHeight() - 0.4, { align: 'center' });
    }

    // Add page number to first page
    pdf.setPage(1);
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139); // Neural color
    pdf.text(`Page 1 of ${pageCount}`, pdf.internal.pageSize.getWidth() / 2, pdf.internal.pageSize.getHeight() - 0.4, { align: 'center' });

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
    // Using styles that match the LinguaFlow app design
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
          /* Word Document Styles that match LinguaFlow design */
          @page {
            size: 21cm 29.7cm;
            margin-top: 0.7in;
            margin-bottom: 0.7in;
            margin-left: 0.3in;
            margin-right: 0.3in;
          }
          body {
            font-family: 'Calibri', 'Arial', sans-serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #1e293b; /* Neural-900 color */
            background-color: #ffffff;
            margin: 0.7in 0.3in; /* Top/bottom 0.7", left/right 0.3" */
          }
          /* Title page with LinguaFlow gradient styling */
          .title-page {
            text-align: center;
            page-break-after: always;
            padding: 40pt;
            background: #f8fafc; /* Very light background */
            border-radius: 8pt;
            border: 1pt solid #e2e8f0;
          }
          .title-page h1 {
            font-size: 28pt;
            margin-top: 100pt;
            margin-bottom: 16pt;
            color: #21c5f0; /* Cyber-400 color */
            border-bottom: 2pt solid #21c5f0;
            padding-bottom: 8pt;
            display: inline-block;
          }
          .title-page h2 {
            font-size: 18pt;
            color: #e879f9; /* Neon-400 color */
            margin-bottom: 40pt;
          }
          .title-page p {
            font-size: 12pt;
            color: #64748b; /* Neural-500 color */
          }
          
          /* Section styling to match LinguaFlow cards */
          .section {
            margin-bottom: 16pt;
            page-break-inside: avoid;
          }
          
          /* Heading styles to match LinguaFlow */
          h1, h2, h3, h4, h5, h6 {
            font-family: 'Calibri', 'Arial', sans-serif;
            font-weight: bold;
            margin-top: 16pt;
            margin-bottom: 8pt;
            page-break-after: avoid;
          }
          h1 { 
            font-size: 20pt; 
            color: #21c5f0; /* Cyber-400 color */
            border-bottom: 1pt solid #21c5f0;
            padding-bottom: 4pt;
          }
          h2 { 
            font-size: 16pt; 
            color: #21c5f0; /* Cyber-400 color */
            background-color: rgba(33, 197, 240, 0.1);
            padding: 6pt;
            border-radius: 4pt;
            border-left: 3pt solid #21c5f0;
          }
          h3 { 
            font-size: 14pt; 
            color: #e879f9; /* Neon-400 color */
            border-bottom: 1pt solid #e879f9;
          }
          h4 { 
            font-size: 12pt; 
            color: #64748b; /* Neural-500 color */
          }
          
          /* Text styling */
          p { 
            margin-bottom: 8pt; 
          }
          
          /* List styling to match LinguaFlow */
          ul, ol { 
            margin-bottom: 10pt; 
            padding-left: 20pt;
          }
          li { 
            margin-bottom: 4pt; 
          }
          
          /* Card styling to match LinguaFlow cyber-card */
          .card, .cyber-card, [class*="Card"], [class*="card"] {
            border: 1pt solid rgba(33, 197, 240, 0.3);
            border-radius: 4pt;
            margin-bottom: 16pt;
            padding: 12pt;
            background-color: rgba(33, 197, 240, 0.05);
            page-break-inside: avoid;
          }
          
          /* Exercise styling to match LinguaFlow */
          .exercise, [id^="exercise_"], [class*="exercise"] {
            padding: 12pt;
            margin-bottom: 16pt;
            border-radius: 6pt;
            border: 1pt solid rgba(33, 197, 240, 0.3);
            background-color: rgba(33, 197, 240, 0.05);
            page-break-inside: avoid;
          }
          
          /* Instruction styling */
          .instruction, [class*="instruction"] {
            background-color: rgba(232, 121, 249, 0.1);
            padding: 8pt;
            border-radius: 4pt;
            margin-bottom: 10pt;
            font-style: italic;
            color: #64748b;
          }
          
          /* Info card styling */
          .info-card, [class*="info-card"] {
            background-color: rgba(232, 121, 249, 0.05);
            border: 1pt solid rgba(232, 121, 249, 0.2);
            border-radius: 6pt;
            padding: 12pt;
            margin-bottom: 16pt;
            page-break-inside: avoid;
          }
          
          /* Dialogue styling to match LinguaFlow chat-like interface */
          .dialogue, [class*="dialogue"] {
            background-color: rgba(100, 116, 139, 0.05);
            border-radius: 6pt;
            padding: 12pt;
            margin-bottom: 16pt;
          }
          
          .dialogue-line:nth-child(odd), [class*="dialogue-line"]:nth-child(odd) {
            background-color: rgba(33, 197, 240, 0.1);
            padding: 8pt;
            margin-bottom: 8pt;
            border-radius: 6pt;
            margin-left: 20pt;
          }
          
          .dialogue-line:nth-child(even), [class*="dialogue-line"]:nth-child(even) {
            background-color: rgba(232, 121, 249, 0.1);
            padding: 8pt;
            margin-bottom: 8pt;
            border-radius: 6pt;
            margin-right: 20pt;
          }
          
          /* Table styling */
          table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 10pt;
          }
          th, td {
            border: 1pt solid #e2e8f0;
            padding: 8pt;
          }
          th {
            background-color: rgba(33, 197, 240, 0.1);
            font-weight: bold;
            color: #21c5f0;
          }
          
          /* Image styling */
          img {
            max-width: 100%;
            height: auto;
            border-radius: 4pt;
          }
          
          /* Footer styling */
          .footer {
            font-size: 9pt;
            color: #64748b;
            text-align: center;
            border-top: 1pt solid rgba(100, 116, 139, 0.2);
            padding-top: 5mm;
            margin-top: 10mm;
          }
          
          /* Remove any interactive elements */
          button, [role="button"] {
            display: none !important;
          }
          
          /* Vocabulary matching styling */
          .vocabulary-item, [class*="vocabulary"] {
            border: 1pt solid rgba(33, 197, 240, 0.2);
            border-radius: 4pt;
            padding: 8pt;
            margin-bottom: 8pt;
          }
          
          /* Preserve LinguaFlow's gradient text */
          .gradient-text, [class*="gradient-text"] {
            color: #21c5f0 !important; /* Fallback */
          }
          
          /* Badge styling */
          .badge, [class*="badge"] {
            display: inline-block;
            padding: 2pt 6pt;
            border-radius: 9999pt;
            font-size: 9pt;
            font-weight: bold;
            background-color: rgba(33, 197, 240, 0.1);
            color: #21c5f0;
            margin-right: 4pt;
          }
        </style>
      </head>
      <body>
        <!-- Title Page with LinguaFlow styling -->
        <div class="title-page">
          <h1>${lessonTitle}</h1>
          <h2>LinguaFlow</h2>
          <p>${new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</p>
        </div>
        
        <!-- Main Content -->
        <div class="content">
          ${processContentForWord(clone.innerHTML)}
        </div>
        
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
 * Process HTML content to make it more Word-friendly while preserving LinguaFlow styling
 */
function processContentForWord(html: string): string {
  // Replace any SVG elements with their text content
  let processed = html.replace(/<svg[^>]*>.*?<\/svg>/gi, '');
  
  // Add classes to help with Word styling
  processed = processed.replace(/<div[^>]*class="[^"]*card[^"]*"[^>]*>/gi, '<div class="card">');
  processed = processed.replace(/<div[^>]*class="[^"]*exercise[^"]*"[^>]*>/gi, '<div class="exercise">');
  processed = processed.replace(/<div[^>]*class="[^"]*instruction[^"]*"[^>]*>/gi, '<div class="instruction">');
  processed = processed.replace(/<div[^>]*class="[^"]*dialogue[^"]*"[^>]*>/gi, '<div class="dialogue">');
  processed = processed.replace(/<div[^>]*class="[^"]*info-card[^"]*"[^>]*>/gi, '<div class="info-card">');
  
  // Wrap sections in div with section class for better page breaks
  processed = processed.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '<div class="section"><h2>$1</h2>');
  processed = processed.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '</div><div class="section"><h3>$1</h3>');
  processed = processed.replace(/<\/div>\s*<\/div>/gi, '</div>');
  
  // Add closing section div at the end
  processed += '</div>';
  
  return processed;
}

/**
 * Shows a dialog to export the lesson as PDF or Word
 * @param elementId The ID of the element to export
 * @param fileName The base name of the file to save
 */
export const showExportDialog = (elementId: string, fileName: string = 'lesson-material'): void => {
  // Create a modal dialog with LinguaFlow styling
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
  dialog.style.backdropFilter = 'blur(4px)';

  // Create the dialog content with LinguaFlow styling
  const content = document.createElement('div');
  content.style.backgroundColor = 'white';
  content.style.borderRadius = '12px';
  content.style.padding = '24px';
  content.style.width = '400px';
  content.style.maxWidth = '90%';
  content.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
  content.style.border = '1px solid rgba(33, 197, 240, 0.3)';
  content.style.background = 'linear-gradient(to bottom right, white, rgba(33, 197, 240, 0.05))';
  
  content.innerHTML = `
    <h2 style="margin-top: 0; margin-bottom: 16px; font-size: 20px; font-weight: bold; color: #21c5f0; display: flex; align-items: center;">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
      </svg>
      Export Lesson
    </h2>
    <p style="margin-bottom: 16px; color: #64748b;">Choose a format to export the lesson material:</p>
    <div style="display: flex; gap: 12px; margin-bottom: 24px;">
      <button id="export-pdf" style="flex: 1; padding: 10px 16px; background: linear-gradient(to right, #21c5f0, #07a8d6); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(33, 197, 240, 0.3);">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <path d="M9 15L12 12 15 15"></path>
          <path d="M12 12V18"></path>
        </svg>
        Export PDF
      </button>
      <button id="export-word" style="flex: 1; padding: 10px 16px; background: linear-gradient(to right, #e879f9, #d946ef); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(232, 121, 249, 0.3);">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <path d="M9.5 12.5 11.5 16.5 13.5 12.5 15.5 16.5"></path>
        </svg>
        Export Word
      </button>
    </div>
    <button id="export-cancel" style="width: 100%; padding: 10px 16px; background-color: #f1f5f9; color: #64748b; border: none; border-radius: 8px; cursor: pointer; font-weight: medium;">Cancel</button>
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