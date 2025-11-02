const fs = require('fs');
const path = require('path');

const filesToFix = [
  'app/api/auth/reset-password/route.ts',
  'app/api/admin/email/templates/[id]/route.ts',
  'app/api/admin/email/templates/route.ts',
  'app/api/admin/email/smtp-config/route.ts'
];

filesToFix.forEach(filePath => {
  console.log(`Fixing ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if already fixed
  if (content.includes("export const dynamic = 'force-dynamic'")) {
    console.log(`  ✓ Already fixed`);
    return;
  }
  
  // Pattern 1: const supabase = createClient at module level
  const pattern1 = /^(const supabase = createClient\(\s*process\.env\.[^)]+\s*\);)/m;
  
  if (pattern1.test(content)) {
    // Remove the module-level declaration
    content = content.replace(pattern1, '// Supabase client moved inside functions');
    
    // Add dynamic export at the top after imports
    const importEnd = content.lastIndexOf('import ');
    const nextLine = content.indexOf('\n', importEnd) + 1;
    const insertion = "\nexport const dynamic = 'force-dynamic';\nexport const runtime = 'nodejs';\n";
    content = content.slice(0, nextLine) + insertion + content.slice(nextLine);
    
    // Find all function exports and add supabase client creation
    const functionPattern = /export async function (GET|POST|PUT|DELETE|PATCH)\([^)]*\)\s*{/g;
    let match;
    const matches = [];
    
    while ((match = functionPattern.exec(content)) !== null) {
      matches.push(match.index + match[0].length);
    }
    
    // Insert supabase client creation in reverse order to maintain indices
    matches.reverse().forEach(index => {
      const insertion = `\n  // Create Supabase client inside the function\n  const supabase = createClient(\n    process.env.NEXT_PUBLIC_SUPABASE_URL!,\n    process.env.SUPABASE_SERVICE_ROLE_KEY!\n  );\n`;
      content = content.slice(0, index) + insertion + content.slice(index);
    });
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✓ Fixed`);
  } else {
    console.log(`  - No module-level supabase client found`);
  }
});

console.log('\nDone!');
