import { jsPDF } from 'jspdf';

// Define types for better type safety
interface LessonContent {
  title: string;
  sections: ContentSection[];
  studentName?: string;
  date?: string;
}

interface ContentSection {
  type: 'heading' | 'paragraph' | 'list' | 'dialogue' | 'exercise' | 'vocabulary' | 'instruction';
  content: string | string[] | DialogueLine[] | VocabularyItem[];
  level?: number; // For headings (1-6)
  style?: 'instruction' | 'info' | 'exercise';
  title?: string;
}

interface DialogueLine {
  speaker: string;
  text: string;
}

interface VocabularyItem {
  word: string;
  definition: string;
}

/**
 * Parse HTML content into structured lesson content
 */
function parseHtmlToLessonContent(element: HTMLElement): LessonContent {
  const sections: ContentSection[] = [];
  
  // Get lesson title
  const titleElement = element.querySelector('h1, h2, .title, [class*="title"]');
  const title = titleElement?.textContent?.trim() || 'Interactive Lesson Material';
  
  // Parse all content sections
  const contentElements = element.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol, .dialogue, .exercise, .vocabulary, .instruction, [class*="dialogue"], [class*="exercise"], [class*="vocabulary"], [class*="instruction"]');
  
  contentElements.forEach((el) => {
    const tagName = el.tagName.toLowerCase();
    const className = el.className || '';
    const textContent = el.textContent?.trim() || '';
    
    if (!textContent) return;
    
    // Handle headings
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
      sections.push({
        type: 'heading',
        content: textContent,
        level: parseInt(tagName.charAt(1))
      });
    }
    // Handle dialogues
    else if (className.includes('dialogue') || el.querySelector('.dialogue-line, [class*="dialogue-line"]')) {
      const dialogueLines: DialogueLine[] = [];
      const lines = el.querySelectorAll('.dialogue-line, [class*="dialogue-line"], p');
      
      lines.forEach((line, index) => {
        const lineText = line.textContent?.trim();
        if (lineText) {
          // Try to extract speaker and text
          const colonIndex = lineText.indexOf(':');
          if (colonIndex > 0 && colonIndex < 20) {
            dialogueLines.push({
              speaker: lineText.substring(0, colonIndex).trim(),
              text: lineText.substring(colonIndex + 1).trim()
            });
          } else {
            dialogueLines.push({
              speaker: index % 2 === 0 ? 'Speaker A' : 'Speaker B',
              text: lineText
            });
          }
        }
      });
      
      if (dialogueLines.length > 0) {
        sections.push({
          type: 'dialogue',
          content: dialogueLines,
          title: 'Dialogue Practice'
        });
      }
    }
    // Handle vocabulary
    else if (className.includes('vocabulary')) {
      const vocabItems: VocabularyItem[] = [];
      const items = el.querySelectorAll('.vocabulary-item, [class*="vocabulary-item"], li, p');
      
      items.forEach((item) => {
        const itemText = item.textContent?.trim();
        if (itemText) {
          // Try to split word and definition
          const dashIndex = itemText.indexOf(' - ');
          const colonIndex = itemText.indexOf(': ');
          const separatorIndex = dashIndex > 0 ? dashIndex : colonIndex;
          
          if (separatorIndex > 0) {
            vocabItems.push({
              word: itemText.substring(0, separatorIndex).trim(),
              definition: itemText.substring(separatorIndex + (dashIndex > 0 ? 3 : 2)).trim()
            });
          } else {
            vocabItems.push({
              word: itemText,
              definition: 'Definition not provided'
            });
          }
        }
      });
      
      if (vocabItems.length > 0) {
        sections.push({
          type: 'vocabulary',
          content: vocabItems,
          title: 'Vocabulary'
        });
      }
    }
    // Handle exercises
    else if (className.includes('exercise') || el.id.startsWith('exercise_')) {
      sections.push({
        type: 'exercise',
        content: textContent,
        style: 'exercise',
        title: 'Exercise'
      });
    }
    // Handle instructions
    else if (className.includes('instruction')) {
      sections.push({
        type: 'instruction',
        content: textContent,
        style: 'instruction'
      });
    }
    // Handle lists
    else if (['ul', 'ol'].includes(tagName)) {
      const listItems: string[] = [];
      const items = el.querySelectorAll('li');
      items.forEach((item) => {
        const itemText = item.textContent?.trim();
        if (itemText) listItems.push(itemText);
      });
      
      if (listItems.length > 0) {
        sections.push({
          type: 'list',
          content: listItems
        });
      }
    }
    // Handle paragraphs
    else if (tagName === 'p' && !el.closest('.dialogue, .vocabulary, .exercise, .instruction')) {
      sections.push({
        type: 'paragraph',
        content: textContent
      });
    }
  });
  
  return {
    title,
    sections: sections.filter(section => 
      (typeof section.content === 'string' && section.content.length > 0) ||
      (Array.isArray(section.content) && section.content.length > 0)
    )
  };
}

/**
 * Create a lightweight, text-based PDF export
 */
export const exportToLightweightPdf = async (elementId: string, fileName: string = 'lesson-material'): Promise<void> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    // Show loading toast
    const toast = (window as any).toast;
    if (toast) {
      toast.info('Preparing lightweight PDF export...');
    }

    // Parse content
    const lessonContent = parseHtmlToLessonContent(element);
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Page dimensions
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let currentY = margin;

    // LinguaFlow colors
    const cyberBlue = [33, 197, 240];
    const neonPurple = [232, 121, 249];
    const neutralGray = [100, 116, 139];
    const darkGray = [30, 41, 59];

    // Helper function to add new page if needed
    const checkPageBreak = (requiredHeight: number) => {
      if (currentY + requiredHeight > pageHeight - margin) {
        pdf.addPage();
        currentY = margin;
        return true;
      }
      return false;
    };

    // Helper function to wrap text
    const wrapText = (text: string, maxWidth: number, fontSize: number) => {
      pdf.setFontSize(fontSize);
      return pdf.splitTextToSize(text, maxWidth);
    };

    // Title Page
    pdf.setFillColor(248, 250, 252); // Very light background
    pdf.rect(margin, margin, contentWidth, pageHeight - (margin * 2), 'F');
    
    // LinguaFlow Title
    pdf.setTextColor(...cyberBlue);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    const titleY = pageHeight / 2 - 40;
    pdf.text('LinguaFlow', pageWidth / 2, titleY, { align: 'center' });
    
    // Lesson Title
    pdf.setTextColor(...darkGray);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(lessonContent.title, pageWidth / 2, titleY + 20, { align: 'center' });
    
    // Date
    pdf.setTextColor(...neutralGray);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    pdf.text(currentDate, pageWidth / 2, titleY + 35, { align: 'center' });
    
    // Add decorative line
    pdf.setDrawColor(...cyberBlue);
    pdf.setLineWidth(1);
    pdf.line(margin + 50, titleY + 45, pageWidth - margin - 50, titleY + 45);
    
    // Start new page for content
    pdf.addPage();
    currentY = margin;

    // Process sections
    lessonContent.sections.forEach((section, index) => {
      switch (section.type) {
        case 'heading':
          checkPageBreak(15);
          
          // Add some space before headings (except first)
          if (index > 0) currentY += 8;
          
          pdf.setTextColor(...cyberBlue);
          const headingSize = section.level === 1 ? 18 : section.level === 2 ? 16 : 14;
          pdf.setFontSize(headingSize);
          pdf.setFont('helvetica', 'bold');
          
          // Add background for h2 headings
          if (section.level === 2) {
            pdf.setFillColor(33, 197, 240, 0.1 * 255);
            pdf.rect(margin, currentY - 3, contentWidth, 10, 'F');
          }
          
          pdf.text(section.content as string, margin, currentY + 5);
          currentY += 12;
          break;

        case 'paragraph':
          checkPageBreak(20);
          
          pdf.setTextColor(...darkGray);
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'normal');
          
          const wrappedText = wrapText(section.content as string, contentWidth, 11);
          wrappedText.forEach((line: string) => {
            checkPageBreak(6);
            pdf.text(line, margin, currentY);
            currentY += 6;
          });
          currentY += 4;
          break;

        case 'list':
          checkPageBreak(20);
          
          pdf.setTextColor(...darkGray);
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'normal');
          
          (section.content as string[]).forEach((item) => {
            checkPageBreak(8);
            pdf.text('• ' + item, margin + 5, currentY);
            currentY += 6;
          });
          currentY += 4;
          break;

        case 'dialogue':
          checkPageBreak(50);
          
          // Dialogue header with book icon (using text symbol)
          pdf.setTextColor(...darkGray);
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          pdf.text('📖 Example Dialogue', margin, currentY);
          currentY += 15;
          
          // Instruction box
          pdf.setFillColor(255, 248, 220); // Light beige background
          pdf.setDrawColor(218, 165, 32); // Golden border
          pdf.setLineWidth(0.5);
          pdf.rect(margin, currentY - 2, contentWidth, 12, 'FD');
          
          pdf.setTextColor(139, 69, 19); // Brown text
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'italic');
          pdf.text('Read or listen to this conversation related to the topic.', margin + 3, currentY + 5);
          currentY += 18;
          
          // Process dialogue lines with chat-like formatting
          (section.content as DialogueLine[]).forEach((line, lineIndex) => {
            checkPageBreak(20);
            
            // Get speaker initial and assign color
            const speakerInitial = line.speaker.charAt(0).toUpperCase();
            let speakerColor: number[];
            let bubbleColor: number[];
            
            // Assign colors based on speaker
            if (speakerInitial === 'M') {
              speakerColor = [33, 150, 243]; // Blue
              bubbleColor = [227, 242, 253]; // Light blue
            } else if (speakerInitial === 'P') {
              speakerColor = [156, 39, 176]; // Purple
              bubbleColor = [248, 231, 255]; // Light purple
            } else {
              // Default colors for other speakers
              speakerColor = lineIndex % 2 === 0 ? [33, 150, 243] : [156, 39, 176];
              bubbleColor = lineIndex % 2 === 0 ? [227, 242, 253] : [248, 231, 255];
            }
            
            // Speaker initial circle
            pdf.setFillColor(...speakerColor);
            pdf.circle(margin + 5, currentY + 3, 3, 'F');
            
            // Speaker initial text
            pdf.setTextColor(255, 255, 255); // White text
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'bold');
            pdf.text(speakerInitial, margin + 5, currentY + 4.5, { align: 'center' });
            
            // Speech bubble background
            const bubbleX = margin + 12;
            const bubbleWidth = contentWidth - 17;
            const bubbleHeight = 14;
            
            pdf.setFillColor(...bubbleColor);
            pdf.setDrawColor(200, 200, 200); // Light gray border
            pdf.setLineWidth(0.3);
            pdf.roundedRect(bubbleX, currentY - 2, bubbleWidth, bubbleHeight, 2, 2, 'FD');
            
            // Speaker name (bold, colored)
            pdf.setTextColor(...speakerColor);
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`${line.speaker}:`, bubbleX + 3, currentY + 4);
            
            // Dialogue text (normal, dark)
            pdf.setTextColor(...darkGray);
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            
            // Wrap the dialogue text to fit in the bubble
            const dialogueText = wrapText(line.text, bubbleWidth - 6, 10);
            let textY = currentY + 8;
            
            dialogueText.forEach((textLine: string, textIndex: number) => {
              if (textIndex > 0) {
                checkPageBreak(6);
                textY += 5;
              }
              pdf.text(textLine, bubbleX + 3, textY);
            });
            
            currentY += Math.max(bubbleHeight + 3, dialogueText.length * 5 + 8);
          });
          
          currentY += 8;
          break;

        case 'vocabulary':
          checkPageBreak(30);
          
          // Vocabulary header
          pdf.setTextColor(...cyberBlue);
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text(section.title || 'Vocabulary', margin, currentY);
          currentY += 10;
          
          pdf.setTextColor(...darkGray);
          pdf.setFontSize(11);
          
          (section.content as VocabularyItem[]).forEach((item) => {
            checkPageBreak(12);
            
            // Vocabulary item background
            pdf.setFillColor(33, 197, 240, 0.05 * 255);
            pdf.rect(margin, currentY - 2, contentWidth, 10, 'F');
            
            // Word (bold)
            pdf.setFont('helvetica', 'bold');
            pdf.text(item.word, margin + 3, currentY + 2);
            
            // Definition (normal)
            pdf.setFont('helvetica', 'normal');
            pdf.text(' - ' + item.definition, margin + 3 + pdf.getTextWidth(item.word), currentY + 2);
            
            currentY += 12;
          });
          currentY += 4;
          break;

        case 'exercise':
          checkPageBreak(25);
          
          // Exercise background
          const exerciseHeight = 20;
          pdf.setFillColor(33, 197, 240, 0.05 * 255);
          pdf.setDrawColor(...cyberBlue);
          pdf.setLineWidth(0.5);
          pdf.rect(margin, currentY - 2, contentWidth, exerciseHeight, 'FD');
          
          // Exercise header
          pdf.setTextColor(...cyberBlue);
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text(section.title || 'Exercise', margin + 3, currentY + 4);
          
          // Exercise content
          pdf.setTextColor(...darkGray);
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'normal');
          const exerciseText = wrapText(section.content as string, contentWidth - 6, 11);
          let exerciseY = currentY + 10;
          exerciseText.forEach((line: string) => {
            pdf.text(line, margin + 3, exerciseY);
            exerciseY += 6;
          });
          
          currentY += exerciseHeight + 4;
          break;

        case 'instruction':
          checkPageBreak(15);
          
          // Instruction background
          pdf.setFillColor(232, 121, 249, 0.1 * 255);
          pdf.rect(margin, currentY - 2, contentWidth, 12, 'F');
          
          pdf.setTextColor(...neutralGray);
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'italic');
          pdf.text(section.content as string, margin + 3, currentY + 4);
          currentY += 16;
          break;
      }
    });

    // Add footer to all pages
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      
      // Footer line
      pdf.setDrawColor(...neutralGray);
      pdf.setLineWidth(0.3);
      pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
      
      // Footer text
      pdf.setTextColor(...neutralGray);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Generated by LinguaFlow', margin, pageHeight - 8);
      pdf.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
    }

    // Save the PDF
    pdf.save(`${fileName}.pdf`);

    if (toast) {
      toast.success('Lightweight PDF exported successfully!');
    }
  } catch (error) {
    console.error('Error exporting lightweight PDF:', error);
    const toast = (window as any).toast;
    if (toast) {
      toast.error('Failed to export PDF. Please try again.');
    }
  }
};

/**
 * Create a lightweight Word document export
 */
export const exportToLightweightWord = async (elementId: string, fileName: string = 'lesson-material'): Promise<void> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    const toast = (window as any).toast;
    if (toast) {
      toast.info('Preparing lightweight Word document...');
    }

    // Parse content
    const lessonContent = parseHtmlToLessonContent(element);
    
    // Create Word document HTML
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
          @page {
            size: 21cm 29.7cm;
            margin: 1.8cm 0.8cm;
          }
          body {
            font-family: 'Calibri', 'Arial', sans-serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #1e293b;
            background-color: #ffffff;
            margin: 0;
          }
          .title-page {
            text-align: center;
            page-break-after: always;
            padding: 60pt 40pt;
            background: #f8fafc;
            border-radius: 8pt;
            border: 1pt solid #e2e8f0;
          }
          .title-page h1 {
            font-size: 28pt;
            margin: 80pt 0 16pt 0;
            color: #21c5f0;
            border-bottom: 2pt solid #21c5f0;
            padding-bottom: 8pt;
            display: inline-block;
          }
          .title-page h2 {
            font-size: 18pt;
            color: #e879f9;
            margin-bottom: 40pt;
          }
          .title-page p {
            font-size: 12pt;
            color: #64748b;
          }
          h1, h2, h3, h4, h5, h6 {
            font-family: 'Calibri', 'Arial', sans-serif;
            font-weight: bold;
            margin-top: 16pt;
            margin-bottom: 8pt;
            page-break-after: avoid;
          }
          h1 { 
            font-size: 20pt; 
            color: #21c5f0;
            border-bottom: 1pt solid #21c5f0;
            padding-bottom: 4pt;
          }
          h2 { 
            font-size: 16pt; 
            color: #21c5f0;
            background-color: rgba(33, 197, 240, 0.1);
            padding: 6pt;
            border-radius: 4pt;
            border-left: 3pt solid #21c5f0;
          }
          h3 { 
            font-size: 14pt; 
            color: #e879f9;
            border-bottom: 1pt solid #e879f9;
          }
          p { 
            margin-bottom: 8pt; 
          }
          ul, ol { 
            margin-bottom: 10pt; 
            padding-left: 20pt;
          }
          li { 
            margin-bottom: 4pt; 
          }
          /* Enhanced Dialogue Styling - Chat-like Interface */
          .dialogue-header {
            font-size: 16pt;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 8pt;
          }
          .dialogue-header:before {
            content: "📖 ";
            margin-right: 4pt;
          }
          .dialogue-instruction {
            background-color: #fff8dc;
            border: 1pt solid #daa520;
            border-radius: 4pt;
            padding: 8pt;
            margin-bottom: 12pt;
            font-style: italic;
            color: #8b4513;
            font-size: 10pt;
          }
          .dialogue {
            margin-bottom: 16pt;
            page-break-inside: avoid;
          }
          .dialogue-line {
            display: flex;
            align-items: flex-start;
            margin-bottom: 8pt;
            page-break-inside: avoid;
          }
          .speaker-initial {
            width: 24pt;
            height: 24pt;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 8pt;
            color: white;
            margin-right: 8pt;
            flex-shrink: 0;
          }
          .speaker-initial.speaker-m {
            background-color: #2196f3;
          }
          .speaker-initial.speaker-p {
            background-color: #9c27b0;
          }
          .speaker-initial.speaker-other {
            background-color: #64748b;
          }
          .speech-bubble {
            flex: 1;
            padding: 8pt;
            border-radius: 8pt;
            border: 1pt solid #e0e0e0;
            position: relative;
          }
          .speech-bubble.bubble-m {
            background-color: #e3f2fd;
            border-color: #2196f3;
          }
          .speech-bubble.bubble-p {
            background-color: #f8e7ff;
            border-color: #9c27b0;
          }
          .speech-bubble.bubble-other {
            background-color: #f8fafc;
            border-color: #64748b;
          }
          .speaker-name {
            font-weight: bold;
            font-size: 10pt;
            margin-bottom: 2pt;
          }
          .speaker-name.name-m {
            color: #2196f3;
          }
          .speaker-name.name-p {
            color: #9c27b0;
          }
          .speaker-name.name-other {
            color: #64748b;
          }
          .dialogue-text {
            font-size: 10pt;
            color: #1e293b;
            line-height: 1.4;
          }
          .vocabulary {
            margin-bottom: 16pt;
          }
          .vocabulary-item {
            border: 1pt solid rgba(33, 197, 240, 0.2);
            border-radius: 4pt;
            padding: 8pt;
            margin-bottom: 8pt;
            page-break-inside: avoid;
          }
          .vocabulary-word {
            font-weight: bold;
            color: #21c5f0;
          }
          .exercise {
            padding: 12pt;
            margin-bottom: 16pt;
            border-radius: 6pt;
            border: 1pt solid rgba(33, 197, 240, 0.3);
            background-color: rgba(33, 197, 240, 0.05);
            page-break-inside: avoid;
          }
          .instruction {
            background-color: rgba(232, 121, 249, 0.1);
            padding: 8pt;
            border-radius: 4pt;
            margin-bottom: 10pt;
            font-style: italic;
            color: #64748b;
          }
          .footer {
            font-size: 9pt;
            color: #64748b;
            text-align: center;
            border-top: 1pt solid rgba(100, 116, 139, 0.2);
            padding-top: 5mm;
            margin-top: 10mm;
          }
        </style>
      </head>
      <body>
        <!-- Title Page -->
        <div class="title-page">
          <h1>${lessonContent.title}</h1>
          <h2>LinguaFlow</h2>
          <p>${new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</p>
        </div>
        
        <!-- Content -->
        ${generateWordContent(lessonContent)}
        
        <!-- Footer -->
        <div class="footer">
          <p>Generated by LinguaFlow</p>
        </div>
      </body>
      </html>
    `;

    // Create and download the file
    const blob = new Blob([wordHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.doc`;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);

    if (toast) {
      toast.success('Lightweight Word document exported successfully!');
    }
  } catch (error) {
    console.error('Error exporting lightweight Word:', error);
    const toast = (window as any).toast;
    if (toast) {
      toast.error('Failed to export Word document. Please try again.');
    }
  }
};

/**
 * Generate Word document content from parsed lesson content
 */
function generateWordContent(lessonContent: LessonContent): string {
  let html = '';
  
  lessonContent.sections.forEach((section) => {
    switch (section.type) {
      case 'heading':
        const headingTag = `h${section.level || 2}`;
        html += `<${headingTag}>${section.content}</${headingTag}>`;
        break;
        
      case 'paragraph':
        html += `<p>${section.content}</p>`;
        break;
        
      case 'list':
        html += '<ul>';
        (section.content as string[]).forEach((item) => {
          html += `<li>${item}</li>`;
        });
        html += '</ul>';
        break;
        
      case 'dialogue':
        html += `<div class="dialogue">`;
        html += `<div class="dialogue-header">Example Dialogue</div>`;
        html += `<div class="dialogue-instruction">Read or listen to this conversation related to the topic.</div>`;
        
        (section.content as DialogueLine[]).forEach((line) => {
          const speakerInitial = line.speaker.charAt(0).toUpperCase();
          let speakerClass = 'speaker-other';
          let bubbleClass = 'bubble-other';
          let nameClass = 'name-other';
          
          // Assign classes based on speaker initial
          if (speakerInitial === 'M') {
            speakerClass = 'speaker-m';
            bubbleClass = 'bubble-m';
            nameClass = 'name-m';
          } else if (speakerInitial === 'P') {
            speakerClass = 'speaker-p';
            bubbleClass = 'bubble-p';
            nameClass = 'name-p';
          }
          
          html += `<div class="dialogue-line">`;
          html += `<div class="speaker-initial ${speakerClass}">${speakerInitial}</div>`;
          html += `<div class="speech-bubble ${bubbleClass}">`;
          html += `<div class="speaker-name ${nameClass}">${line.speaker}:</div>`;
          html += `<div class="dialogue-text">${line.text}</div>`;
          html += `</div>`;
          html += `</div>`;
        });
        
        html += '</div>';
        break;
        
      case 'vocabulary':
        html += '<div class="vocabulary">';
        html += `<h3>${section.title || 'Vocabulary'}</h3>`;
        (section.content as VocabularyItem[]).forEach((item) => {
          html += `<div class="vocabulary-item">`;
          html += `<span class="vocabulary-word">${item.word}</span> - ${item.definition}`;
          html += '</div>';
        });
        html += '</div>';
        break;
        
      case 'exercise':
        html += `<div class="exercise">`;
        html += `<h4>${section.title || 'Exercise'}</h4>`;
        html += `<p>${section.content}</p>`;
        html += '</div>';
        break;
        
      case 'instruction':
        html += `<div class="instruction">${section.content}</div>`;
        break;
    }
  });
  
  return html;
}

/**
 * Show improved export dialog with lightweight options
 */
export const showImprovedExportDialog = (elementId: string, fileName: string = 'lesson-material'): void => {
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

  const content = document.createElement('div');
  content.style.backgroundColor = 'white';
  content.style.borderRadius = '12px';
  content.style.padding = '24px';
  content.style.width = '450px';
  content.style.maxWidth = '90%';
  content.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
  content.style.border = '1px solid rgba(33, 197, 240, 0.3)';
  content.style.background = 'linear-gradient(to bottom right, white, rgba(33, 197, 240, 0.05))';
  
  content.innerHTML = `
    <h2 style="margin-top: 0; margin-bottom: 8px; font-size: 20px; font-weight: bold; color: #21c5f0; display: flex; align-items: center;">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
      </svg>
      Export Lesson Material
    </h2>
    <p style="margin-bottom: 16px; color: #64748b; font-size: 14px;">Choose a format to export your lesson. Our improved exports are lightweight, properly formatted, and include a professional title page.</p>
    
    <div style="background: rgba(33, 197, 240, 0.05); border: 1px solid rgba(33, 197, 240, 0.2); border-radius: 8px; padding: 12px; margin-bottom: 16px;">
      <h4 style="margin: 0 0 8px 0; color: #21c5f0; font-size: 14px;">✨ Improved Features:</h4>
      <ul style="margin: 0; padding-left: 16px; font-size: 12px; color: #64748b;">
        <li>Professional LinguaFlow title page</li>
        <li>Lightweight, text-based format</li>
        <li>Perfect formatting preservation</li>
        <li>No word cuts or layout issues</li>
      </ul>
    </div>
    
    <div style="display: flex; gap: 12px; margin-bottom: 24px;">
      <button id="export-pdf-improved" style="flex: 1; padding: 12px 16px; background: linear-gradient(to right, #21c5f0, #07a8d6); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(33, 197, 240, 0.3);">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
        Lightweight PDF
      </button>
      <button id="export-word-improved" style="flex: 1; padding: 12px 16px; background: linear-gradient(to right, #e879f9, #d946ef); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(232, 121, 249, 0.3);">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
        Lightweight Word
      </button>
    </div>
    <button id="export-cancel" style="width: 100%; padding: 10px 16px; background-color: #f1f5f9; color: #64748b; border: none; border-radius: 8px; cursor: pointer; font-weight: medium;">Cancel</button>
  `;

  dialog.appendChild(content);
  document.body.appendChild(dialog);

  // Event listeners
  document.getElementById('export-pdf-improved')?.addEventListener('click', async () => {
    document.body.removeChild(dialog);
    await exportToLightweightPdf(elementId, fileName);
  });

  document.getElementById('export-word-improved')?.addEventListener('click', async () => {
    document.body.removeChild(dialog);
    await exportToLightweightWord(elementId, fileName);
  });

  document.getElementById('export-cancel')?.addEventListener('click', () => {
    document.body.removeChild(dialog);
  });

  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      document.body.removeChild(dialog);
    }
  });
};