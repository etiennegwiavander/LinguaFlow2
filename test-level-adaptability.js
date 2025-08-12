// Test script to analyze level adaptability in lesson generation
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read environment variables from .env.local
let supabaseUrl, supabaseKey, serviceRoleKey;

try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      supabaseKey = line.split('=')[1].trim();
    }
    if (line.startsWith('SERVICE_ROLE_KEY=')) {
      serviceRoleKey = line.split('=')[1].trim();
    }
  });
} catch (error) {
  console.error('Error reading .env.local file:', error.message);
}

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Helper function to convert level to number for comparison
function getLevelNumber(level) {
  const levelMap = { 'a1': 1, 'a2': 2, 'b1': 3, 'b2': 4, 'c1': 5, 'c2': 6 };
  return levelMap[level.toLowerCase()] || 3;
}

// Simulate the template selection logic
function analyzeTemplateSelection(studentLevel, templates) {
  console.log(`\n🎯 ANALYZING LEVEL ADAPTABILITY FOR ${studentLevel.toUpperCase()}`);
  console.log('=' .repeat(60));
  
  // Score templates based on level matching
  const scoredTemplates = templates.map(template => {
    let score = 0;
    const templateLevel = template.level.toLowerCase();
    
    // Level matching (highest priority)
    if (templateLevel === studentLevel.toLowerCase()) {
      score += 100;
    } else if (Math.abs(getLevelNumber(templateLevel) - getLevelNumber(studentLevel)) === 1) {
      score += 50;
    } else if (Math.abs(getLevelNumber(templateLevel) - getLevelNumber(studentLevel)) === 2) {
      score += 25;
    } else {
      score += 10; // Very low score for distant levels
    }
    
    return { ...template, score, levelDifference: Math.abs(getLevelNumber(templateLevel) - getLevelNumber(studentLevel)) };
  });
  
  // Sort by score
  const sortedTemplates = scoredTemplates.sort((a, b) => b.score - a.score);
  
  // Analyze results
  const exactMatches = sortedTemplates.filter(t => t.levelDifference === 0);
  const closeMatches = sortedTemplates.filter(t => t.levelDifference === 1);
  const distantMatches = sortedTemplates.filter(t => t.levelDifference >= 2);
  
  console.log(`📊 Template Distribution for ${studentLevel.toUpperCase()}:`);
  console.log(`   ✅ Exact Level Matches (${studentLevel.toUpperCase()}): ${exactMatches.length}`);
  console.log(`   🟡 Close Matches (±1 level): ${closeMatches.length}`);
  console.log(`   🔴 Distant Matches (±2+ levels): ${distantMatches.length}`);
  
  console.log(`\n🏆 Top 5 Selected Templates:`);
  sortedTemplates.slice(0, 5).forEach((template, index) => {
    const levelMatch = template.levelDifference === 0 ? '✅ EXACT' : 
                      template.levelDifference === 1 ? '🟡 CLOSE' : '🔴 DISTANT';
    console.log(`   ${index + 1}. ${template.name} (${template.level.toUpperCase()}) - Score: ${template.score} ${levelMatch}`);
  });
  
  // Check for level appropriateness issues
  const inappropriateSelections = sortedTemplates.slice(0, 5).filter(t => t.levelDifference >= 2);
  if (inappropriateSelections.length > 0) {
    console.log(`\n⚠️  LEVEL ADAPTABILITY ISSUES:`);
    inappropriateSelections.forEach(template => {
      const levelGap = getLevelNumber(template.level) - getLevelNumber(studentLevel);
      const difficulty = levelGap > 0 ? 'TOO ADVANCED' : 'TOO BASIC';
      console.log(`   • ${template.name} (${template.level.toUpperCase()}) is ${Math.abs(levelGap)} levels ${difficulty}`);
    });
  } else {
    console.log(`\n✅ Level adaptability looks good - no inappropriate selections in top 5`);
  }
  
  return {
    exactMatches: exactMatches.length,
    closeMatches: closeMatches.length,
    distantMatches: distantMatches.length,
    topSelections: sortedTemplates.slice(0, 5),
    inappropriateCount: inappropriateSelections.length
  };
}

async function testLevelAdaptability() {
  try {
    console.log('🔍 Analyzing Level Adaptability in Lesson Template Selection');
    console.log('=' .repeat(80));
    
    // Get all active templates
    const { data: templates, error: templatesError } = await supabase
      .from('lesson_templates')
      .select('*')
      .eq('is_active', true)
      .order('level, name');

    if (templatesError) {
      console.error('❌ Error fetching templates:', templatesError);
      return;
    }

    console.log(`📚 Found ${templates.length} active templates`);
    
    // Show template distribution by level
    const templatesByLevel = {};
    templates.forEach(template => {
      const level = template.level.toUpperCase();
      if (!templatesByLevel[level]) {
        templatesByLevel[level] = [];
      }
      templatesByLevel[level].push(template);
    });
    
    console.log('\n📊 Template Distribution by Level:');
    Object.keys(templatesByLevel).sort().forEach(level => {
      console.log(`   ${level}: ${templatesByLevel[level].length} templates`);
      templatesByLevel[level].forEach(template => {
        console.log(`      • ${template.name} (${template.category})`);
      });
    });
    
    // Test each level
    const levels = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
    const results = {};
    
    for (const level of levels) {
      results[level] = analyzeTemplateSelection(level, templates);
    }
    
    // Overall analysis
    console.log('\n' + '=' .repeat(80));
    console.log('📈 OVERALL LEVEL ADAPTABILITY ANALYSIS');
    console.log('=' .repeat(80));
    
    levels.forEach(level => {
      const result = results[level];
      const adaptabilityScore = (result.exactMatches * 3 + result.closeMatches * 2 + (5 - result.inappropriateCount) * 1) / 15 * 100;
      const status = adaptabilityScore >= 80 ? '✅ EXCELLENT' : 
                    adaptabilityScore >= 60 ? '🟡 GOOD' : '🔴 NEEDS IMPROVEMENT';
      
      console.log(`${level.toUpperCase()}: ${adaptabilityScore.toFixed(1)}% ${status}`);
      console.log(`   Exact: ${result.exactMatches}, Close: ${result.closeMatches}, Inappropriate: ${result.inappropriateCount}`);
    });
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS FOR IMPROVING LEVEL ADAPTABILITY:');
    
    levels.forEach(level => {
      const result = results[level];
      if (result.exactMatches === 0) {
        console.log(`   🔴 ${level.toUpperCase()}: No exact level matches - need more ${level.toUpperCase()} templates`);
      } else if (result.exactMatches < 3) {
        console.log(`   🟡 ${level.toUpperCase()}: Only ${result.exactMatches} exact matches - consider adding more ${level.toUpperCase()} templates`);
      }
      
      if (result.inappropriateCount > 0) {
        console.log(`   ⚠️  ${level.toUpperCase()}: ${result.inappropriateCount} inappropriate selections in top 5 - improve scoring algorithm`);
      }
    });
    
    // Check for level gaps
    const levelCounts = levels.map(level => ({
      level: level.toUpperCase(),
      count: templatesByLevel[level.toUpperCase()]?.length || 0
    }));
    
    const avgTemplatesPerLevel = levelCounts.reduce((sum, l) => sum + l.count, 0) / levels.length;
    const underrepresentedLevels = levelCounts.filter(l => l.count < avgTemplatesPerLevel * 0.5);
    
    if (underrepresentedLevels.length > 0) {
      console.log('\n🎯 UNDERREPRESENTED LEVELS (need more templates):');
      underrepresentedLevels.forEach(level => {
        console.log(`   • ${level.level}: ${level.count} templates (avg: ${avgTemplatesPerLevel.toFixed(1)})`);
      });
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testLevelAdaptability();