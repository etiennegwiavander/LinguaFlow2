/**
 * Test Supabase function directly using curl-like approach
 * Run with: node scripts/test-supabase-function.js
 */

const fs = require('fs');
const path = require('path');

// Read environment variables
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    });
    
    return envVars;
  } catch (error) {
    console.error('❌ Could not read .env.local file:', error.message);
    return {};
  }
}

async function testSupabaseFunction() {
  console.log('⚡ Testing Supabase Function Directly...\n');
  
  const env = loadEnvFile();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables');
    console.log('Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');
    return;
  }
  
  const testData = {
    email: 'test-tutor@example.com',
    firstName: 'John',
    lastName: 'Doe'
  };

  try {
    console.log('📧 Calling Supabase function...');
    console.log('📍 URL:', `${supabaseUrl}/functions/v1/send-welcome-email`);
    
    const response = await fetch(`${supabaseUrl}/functions/v1/send-welcome-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify(testData)
    });

    console.log('📊 Response Status:', response.status);
    
    const result = await response.json();

    if (response.ok) {
      console.log('✅ Function Success!');
      console.log('📧 Message:', result.message);
      
      if (result.emailContent) {
        console.log('📝 Email HTML generated (length):', result.emailContent.length);
        
        // Save HTML to file for preview
        const previewPath = path.join(__dirname, '..', 'welcome-email-test-output.html');
        fs.writeFileSync(previewPath, result.emailContent);
        console.log('💾 Email HTML saved to:', previewPath);
      }
    } else {
      console.error('❌ Function Error:', result);
    }
  } catch (err) {
    console.error('❌ Function Exception:', err.message);
  }
}

// Test the function
testSupabaseFunction();