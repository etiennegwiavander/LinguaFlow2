/**
 * Script to help check Edge Function logs
 */

console.log('📋 HOW TO CHECK EDGE FUNCTION LOGS');
console.log('================================\n');

console.log('Option 1: Supabase Dashboard');
console.log('   1. Go to: https://supabase.com/dashboard/project/urmuwjcjcyohsrkgyapl/functions');
console.log('   2. Click on "generate-lesson-plan" function');
console.log('   3. Click on "Logs" tab');
console.log('   4. Look for recent errors or "AI generation failed" messages');
console.log('');

console.log('Option 2: Supabase CLI');
console.log('   Run: supabase functions logs generate-lesson-plan');
console.log('   This will show real-time logs from the function');
console.log('');

console.log('What to look for:');
console.log('   ✅ "🤖 Calling Gemini AI for lesson X..."');
console.log('   ✅ "✅ AI generated lesson X successfully"');
console.log('   ❌ "❌ AI generation failed for lesson X"');
console.log('   ❌ "GEMINI_API_KEY not configured"');
console.log('   ❌ "Gemini API error: 404"');
console.log('   ❌ "Failed to parse AI response"');
console.log('');

console.log('💡 If you see "AI generation failed", the function is falling back to templates');
console.log('');
