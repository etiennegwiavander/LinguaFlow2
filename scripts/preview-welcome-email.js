/**
 * Preview welcome email HTML without sending
 * Run with: node scripts/preview-welcome-email.js
 */

const fs = require('fs');
const path = require('path');

// Read the welcome email function to extract the HTML template
function extractEmailTemplate() {
  const functionPath = path.join(__dirname, '..', 'supabase', 'functions', 'send-welcome-email', 'index.ts');
  
  try {
    const content = fs.readFileSync(functionPath, 'utf8');
    
    // Extract the HTML template from the function
    const htmlStart = content.indexOf('return `') + 8;
    const htmlEnd = content.lastIndexOf('`;');
    
    if (htmlStart > 7 && htmlEnd > htmlStart) {
      let htmlTemplate = content.substring(htmlStart, htmlEnd);
      
      // Replace template variables with sample data
      htmlTemplate = htmlTemplate.replace(/\$\{displayName\}/g, 'John Doe');
      htmlTemplate = htmlTemplate.replace(/\$\{email \|\| "your email"\}/g, 'john.doe@example.com');
      
      return htmlTemplate;
    }
    
    return null;
  } catch (error) {
    console.error('Error reading function file:', error.message);
    return null;
  }
}

function generatePreviewHTML() {
  console.log('🎨 Generating Welcome Email Preview...\n');
  
  const emailHTML = extractEmailTemplate();
  
  if (!emailHTML) {
    console.error('❌ Could not extract email template');
    return;
  }
  
  // Create preview HTML file
  const previewPath = path.join(__dirname, '..', 'welcome-email-preview.html');
  
  try {
    fs.writeFileSync(previewPath, emailHTML);
    console.log('✅ Preview generated successfully!');
    console.log(`📁 File saved to: ${previewPath}`);
    console.log('🌐 Open this file in your browser to preview the email');
    
    // Try to open in default browser (Windows)
    if (process.platform === 'win32') {
      const { exec } = require('child_process');
      exec(`start "" "${previewPath}"`, (error) => {
        if (error) {
          console.log('💡 Manually open the file in your browser to see the preview');
        } else {
          console.log('🚀 Opening preview in your default browser...');
        }
      });
    } else {
      console.log('💡 Open the HTML file in your browser to see the preview');
    }
    
  } catch (error) {
    console.error('❌ Error saving preview file:', error.message);
  }
}

// Generate the preview
generatePreviewHTML();