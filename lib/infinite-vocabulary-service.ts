import { VocabularyCardData, StudentVocabularyProfile } from '@/types';
import { supabase } from './supabase';

export interface VocabularyHistory {
  id: string;
  studentId: string;
  word: string;
  firstSeenAt: Date;
  lastSeenAt: Date;
  timesSeen: number;
  difficultyLevel: string;
  masteryScore: number;
  semanticCategory?: string;
  wordFamily?: string;
}

export interface SemanticRelationship {
  word: string;
  relatedWord: string;
  relationshipType: 'synonym' | 'antonym' | 'family' | 'concept' | 'theme';
  strength: number;
  difficultyLevel: string;
}

export interface GenerationPattern {
  studentId: string;
  difficultyLevel: string;
  semanticCategories: string[];
  wordFamilies: string[];
  learningVelocity: number;
  successRate: number;
  preferredThemes: string[];
  avoidedPatterns: string[];
}

export interface ExpansionQueue {
  id: string;
  studentId: string;
  baseWord: string;
  expansionWords: string[];
  expansionType: 'semantic' | 'thematic' | 'difficulty' | 'family';
  priorityScore: number;
  isActive: boolean;
}

export class InfiniteVocabularyService {
  private static instance: InfiniteVocabularyService;
  private semanticCache: Map<string, SemanticRelationship[]> = new Map();
  private patternCache: Map<string, GenerationPattern> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): InfiniteVocabularyService {
    if (!InfiniteVocabularyService.instance) {
      InfiniteVocabularyService.instance = new InfiniteVocabularyService();
    }
    return InfiniteVocabularyService.instance;
  }

  /**
   * Generate infinite vocabulary using semantic expansion and adaptive difficulty
   */
  async generateInfiniteVocabulary(
    studentProfile: StudentVocabularyProfile,
    count: number = 20,
    excludeWords: string[] = []
  ): Promise<VocabularyCardData[]> {
    try {
      // Get student's vocabulary history and patterns with error handling
      const results = await Promise.allSettled([
        this.getVocabularyHistory(studentProfile.studentId),
        this.getGenerationPatterns(studentProfile.studentId, studentProfile.proficiencyLevel),
        this.getActiveExpansionQueue(studentProfile.studentId)
      ]);

      const history: VocabularyHistory[] = results[0].status === 'fulfilled' ? results[0].value : [];
      const patterns: GenerationPattern | null = results[1].status === 'fulfilled' ? results[1].value : null;
      const expansionQueue: ExpansionQueue[] = results[2].status === 'fulfilled' ? results[2].value : [];

      // Calculate adaptive difficulty and learning velocity
      const adaptiveDifficulty = this.calculateAdaptiveDifficulty(history, patterns, studentProfile);
      const learningVelocity = this.calculateLearningVelocity(history, patterns);

      // Generate vocabulary using multiple strategies
      const vocabularyStrategies = [
        () => this.generateFromSemanticExpansion(studentProfile, history, expansionQueue, Math.ceil(count * 0.4)),
        () => this.generateFromWordFamilies(studentProfile, history, patterns, Math.ceil(count * 0.3)),
        () => this.generateFromThematicProgression(studentProfile, history, patterns, Math.ceil(count * 0.2)),
        () => this.generateFromAdaptiveDifficulty(studentProfile, adaptiveDifficulty, Math.ceil(count * 0.1))
      ];

      // Execute strategies in parallel
      const strategyResults = await Promise.allSettled(
        vocabularyStrategies.map(strategy => strategy())
      );

      // Combine results and filter out failures
      let allWords: VocabularyCardData[] = [];
      strategyResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allWords = allWords.concat(result.value);
        } else {
          console.warn(`Vocabulary strategy ${index} failed:`, result.reason);
        }
      });

      // Remove duplicates and excluded words
      const uniqueWords = this.removeDuplicatesAndExcluded(allWords, excludeWords, history);

      // Apply intelligent selection and ordering
      const selectedWords = this.applyIntelligentSelection(
        uniqueWords,
        count,
        studentProfile,
        patterns,
        learningVelocity
      );

      // If we don't have enough words, return what we have
      if (selectedWords.length === 0) {
        console.warn('No words generated from infinite vocabulary service, falling back to empty array');
        return [];
      }

      // Update expansion queue for future sessions (non-blocking)
      this.updateExpansionQueue(studentProfile.studentId, selectedWords).catch(error => {
        console.warn('Failed to update expansion queue:', error);
      });

      // Update generation patterns based on selection (non-blocking)
      this.updateGenerationPatterns(studentProfile.studentId, selectedWords, patterns).catch(error => {
        console.warn('Failed to update generation patterns:', error);
      });

      return selectedWords;
    } catch (error) {
      console.error('Error generating infinite vocabulary:', error);
      // Return empty array instead of throwing to allow fallback
      return [];
    }
  }

  /**
   * Generate vocabulary from semantic expansion
   */
  private async generateFromSemanticExpansion(
    studentProfile: StudentVocabularyProfile,
    history: VocabularyHistory[],
    expansionQueue: ExpansionQueue[],
    count: number
  ): Promise<VocabularyCardData[]> {
    const seenWords = history.map(h => h.word);
    const semanticWords: string[] = [];

    // Use expansion queue first
    for (const expansion of expansionQueue.slice(0, Math.ceil(count / 2))) {
      const availableWords = expansion.expansionWords.filter(word => 
        !seenWords.includes(word) && !semanticWords.includes(word)
      );
      semanticWords.push(...availableWords.slice(0, 2));
    }

    // Fill remaining with semantic relationships
    if (semanticWords.length < count) {
      const recentWords = history
        .sort((a, b) => b.lastSeenAt.getTime() - a.lastSeenAt.getTime())
        .slice(0, 10)
        .map(h => h.word);

      for (const baseWord of recentWords) {
        if (semanticWords.length >= count) break;
        
        const relationships = await this.getSemanticRelationships(baseWord, studentProfile.proficiencyLevel);
        const relatedWords = relationships
          .filter(r => !seenWords.includes(r.relatedWord) && !semanticWords.includes(r.relatedWord))
          .sort((a, b) => b.strength - a.strength)
          .slice(0, 2)
          .map(r => r.relatedWord);
        
        semanticWords.push(...relatedWords);
      }
    }

    // Generate vocabulary data for selected words
    return await this.generateVocabularyData(
      semanticWords.slice(0, count),
      studentProfile
    );
  }

  /**
   * Generate vocabulary from word families
   */
  private async generateFromWordFamilies(
    studentProfile: StudentVocabularyProfile,
    history: VocabularyHistory[],
    patterns: GenerationPattern | null,
    count: number
  ): Promise<VocabularyCardData[]> {
    const seenWords = history.map(h => h.word);
    const familyWords: string[] = [];

    // Get preferred word families from patterns
    const preferredFamilies = patterns?.wordFamilies || [];
    
    // If no preferred families, derive from history
    const derivedFamilies = history
      .filter(h => h.wordFamily)
      .map(h => h.wordFamily!)
      .filter((family, index, arr) => arr.indexOf(family) === index)
      .slice(0, 5);

    const targetFamilies = preferredFamilies.length > 0 ? preferredFamilies : derivedFamilies;

    for (const family of targetFamilies) {
      if (familyWords.length >= count) break;
      
      const familyRelationships = await this.getWordFamilyMembers(family, studentProfile.proficiencyLevel);
      const availableWords = familyRelationships
        .filter(word => !seenWords.includes(word) && !familyWords.includes(word))
        .slice(0, Math.ceil(count / targetFamilies.length));
      
      familyWords.push(...availableWords);
    }

    return await this.generateVocabularyData(
      familyWords.slice(0, count),
      studentProfile
    );
  }

  /**
   * Generate vocabulary from thematic progression
   */
  private async generateFromThematicProgression(
    studentProfile: StudentVocabularyProfile,
    history: VocabularyHistory[],
    patterns: GenerationPattern | null,
    count: number
  ): Promise<VocabularyCardData[]> {
    const seenWords = history.map(h => h.word);
    const thematicWords: string[] = [];

    // Get preferred themes from patterns or student profile
    const preferredThemes = patterns?.preferredThemes || 
      studentProfile.learningGoals.concat(studentProfile.vocabularyWeaknesses);

    // Get semantic categories from history
    const recentCategories = history
      .filter(h => h.semanticCategory)
      .map(h => h.semanticCategory!)
      .filter((cat, index, arr) => arr.indexOf(cat) === index)
      .slice(0, 3);

    const targetThemes = [...preferredThemes, ...recentCategories].slice(0, 5);

    for (const theme of targetThemes) {
      if (thematicWords.length >= count) break;
      
      const themeWords = await this.getThematicWords(theme, studentProfile.proficiencyLevel);
      const availableWords = themeWords
        .filter(word => !seenWords.includes(word) && !thematicWords.includes(word))
        .slice(0, Math.ceil(count / targetThemes.length));
      
      thematicWords.push(...availableWords);
    }

    return await this.generateVocabularyData(
      thematicWords.slice(0, count),
      studentProfile
    );
  }

  /**
   * Generate vocabulary with adaptive difficulty
   */
  private async generateFromAdaptiveDifficulty(
    studentProfile: StudentVocabularyProfile,
    adaptiveDifficulty: string,
    count: number
  ): Promise<VocabularyCardData[]> {
    // Generate words at the adaptive difficulty level
    const difficultyWords = await this.getWordsAtDifficultyLevel(
      adaptiveDifficulty,
      count * 2 // Get more to allow for filtering
    );

    // Filter based on student's seen words
    const history = await this.getVocabularyHistory(studentProfile.studentId);
    const seenWords = history.map(h => h.word);
    
    const availableWords = difficultyWords
      .filter(word => !seenWords.includes(word))
      .slice(0, count);

    return await this.generateVocabularyData(availableWords, studentProfile);
  }

  /**
   * Calculate adaptive difficulty based on student progress
   */
  private calculateAdaptiveDifficulty(
    history: VocabularyHistory[],
    patterns: GenerationPattern | null,
    studentProfile: StudentVocabularyProfile
  ): string {
    if (history.length === 0) {
      return studentProfile.proficiencyLevel;
    }

    // Calculate average mastery score
    const averageMastery = history.reduce((sum, h) => sum + h.masteryScore, 0) / history.length;
    const successRate = patterns?.successRate || 0.5;

    // Get current level index
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const currentIndex = levels.indexOf(studentProfile.proficiencyLevel);

    // Adaptive logic
    if (averageMastery > 0.8 && successRate > 0.7 && currentIndex < levels.length - 1) {
      // Student is doing well, increase difficulty
      return levels[currentIndex + 1];
    } else if (averageMastery < 0.4 && successRate < 0.3 && currentIndex > 0) {
      // Student is struggling, decrease difficulty
      return levels[currentIndex - 1];
    } else {
      // Maintain current level
      return studentProfile.proficiencyLevel;
    }
  }

  /**
   * Calculate learning velocity
   */
  private calculateLearningVelocity(
    history: VocabularyHistory[],
    patterns: GenerationPattern | null
  ): number {
    if (patterns?.learningVelocity) {
      return patterns.learningVelocity;
    }

    // Calculate based on recent history
    const recentHistory = history
      .filter(h => {
        const daysSince = (Date.now() - h.lastSeenAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 7; // Last week
      });

    if (recentHistory.length === 0) {
      return 1.0; // Default velocity
    }

    // Calculate words per session (assuming average session is 20 words)
    return Math.max(0.5, Math.min(2.0, recentHistory.length / 7));
  }

  /**
   * Remove duplicates and excluded words
   */
  private removeDuplicatesAndExcluded(
    words: VocabularyCardData[],
    excludeWords: string[],
    history: VocabularyHistory[]
  ): VocabularyCardData[] {
    const seenWords = new Set([
      ...excludeWords.map(w => w.toLowerCase()),
      ...history.map(h => h.word.toLowerCase())
    ]);

    const uniqueWords = new Map<string, VocabularyCardData>();
    
    for (const word of words) {
      const wordLower = word.word.toLowerCase();
      if (!seenWords.has(wordLower) && !uniqueWords.has(wordLower)) {
        uniqueWords.set(wordLower, word);
      }
    }

    return Array.from(uniqueWords.values());
  }

  /**
   * Apply intelligent selection and ordering
   */
  private applyIntelligentSelection(
    words: VocabularyCardData[],
    count: number,
    studentProfile: StudentVocabularyProfile,
    patterns: GenerationPattern | null,
    learningVelocity: number
  ): VocabularyCardData[] {
    // Score words based on multiple factors
    const scoredWords = words.map(word => ({
      word,
      score: this.calculateWordScore(word, studentProfile, patterns, learningVelocity)
    }));

    // Sort by score and select top words
    return scoredWords
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .map(item => item.word);
  }

  /**
   * Calculate word score for intelligent selection
   */
  private calculateWordScore(
    word: VocabularyCardData,
    studentProfile: StudentVocabularyProfile,
    patterns: GenerationPattern | null,
    learningVelocity: number
  ): number {
    let score = 1.0;

    // Boost score for words matching learning goals
    for (const goal of studentProfile.learningGoals) {
      if (word.definition.toLowerCase().includes(goal.toLowerCase()) ||
          word.word.toLowerCase().includes(goal.toLowerCase())) {
        score += 0.3;
      }
    }

    // Boost score for words addressing vocabulary weaknesses
    for (const weakness of studentProfile.vocabularyWeaknesses) {
      if (word.definition.toLowerCase().includes(weakness.toLowerCase()) ||
          word.partOfSpeech.toLowerCase().includes(weakness.toLowerCase())) {
        score += 0.4;
      }
    }

    // Boost score for preferred themes
    if (patterns?.preferredThemes) {
      for (const theme of patterns.preferredThemes) {
        if (word.definition.toLowerCase().includes(theme.toLowerCase())) {
          score += 0.2;
        }
      }
    }

    // Adjust for learning velocity
    if (learningVelocity > 1.5) {
      // Fast learner, prefer more challenging words
      if (word.word.length > 8 || word.definition.split(' ').length > 10) {
        score += 0.2;
      }
    } else if (learningVelocity < 0.8) {
      // Slower learner, prefer simpler words
      if (word.word.length <= 6 && word.definition.split(' ').length <= 8) {
        score += 0.2;
      }
    }

    return score;
  }

  /**
   * Get vocabulary history for student
   */
  private async getVocabularyHistory(studentId: string): Promise<VocabularyHistory[]> {
    const { data, error } = await supabase
      .from('vocabulary_history')
      .select('*')
      .eq('student_id', studentId)
      .order('last_seen_at', { ascending: false });

    if (error) {
      console.error('Error fetching vocabulary history:', error);
      return [];
    }

    return (data || []).map(item => ({
      id: item.id,
      studentId: item.student_id,
      word: item.word,
      firstSeenAt: new Date(item.first_seen_at),
      lastSeenAt: new Date(item.last_seen_at),
      timesSeen: item.times_seen,
      difficultyLevel: item.difficulty_level,
      masteryScore: item.mastery_score,
      semanticCategory: item.semantic_category,
      wordFamily: item.word_family
    }));
  }

  /**
   * Get generation patterns for student
   */
  private async getGenerationPatterns(studentId: string, difficultyLevel: string): Promise<GenerationPattern | null> {
    const cacheKey = `${studentId}_${difficultyLevel}`;
    
    // Check cache first
    if (this.patternCache.has(cacheKey)) {
      return this.patternCache.get(cacheKey)!;
    }

    const { data, error } = await supabase
      .from('vocabulary_generation_patterns')
      .select('*')
      .eq('student_id', studentId)
      .eq('difficulty_level', difficultyLevel)
      .single();

    if (error || !data) {
      return null;
    }

    const pattern: GenerationPattern = {
      studentId: data.student_id,
      difficultyLevel: data.difficulty_level,
      semanticCategories: data.semantic_categories || [],
      wordFamilies: data.word_families || [],
      learningVelocity: data.learning_velocity,
      successRate: data.success_rate,
      preferredThemes: data.preferred_themes || [],
      avoidedPatterns: data.avoided_patterns || []
    };

    // Cache the result
    this.patternCache.set(cacheKey, pattern);
    
    return pattern;
  }

  /**
   * Get active expansion queue for student
   */
  private async getActiveExpansionQueue(studentId: string): Promise<ExpansionQueue[]> {
    const { data, error } = await supabase
      .from('vocabulary_expansion_queue')
      .select('*')
      .eq('student_id', studentId)
      .eq('is_active', true)
      .order('priority_score', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching expansion queue:', error);
      return [];
    }

    return (data || []).map(item => ({
      id: item.id,
      studentId: item.student_id,
      baseWord: item.base_word,
      expansionWords: item.expansion_words || [],
      expansionType: item.expansion_type,
      priorityScore: item.priority_score,
      isActive: item.is_active
    }));
  }

  /**
   * Get semantic relationships for a word
   */
  private async getSemanticRelationships(word: string, difficultyLevel: string): Promise<SemanticRelationship[]> {
    const cacheKey = `${word}_${difficultyLevel}`;
    
    if (this.semanticCache.has(cacheKey)) {
      return this.semanticCache.get(cacheKey)!;
    }

    const { data, error } = await supabase
      .from('vocabulary_semantic_relationships')
      .select('*')
      .eq('word', word.toLowerCase())
      .eq('difficulty_level', difficultyLevel)
      .order('strength', { ascending: false });

    if (error) {
      console.error('Error fetching semantic relationships:', error);
      return [];
    }

    const relationships = (data || []).map(item => ({
      word: item.word,
      relatedWord: item.related_word,
      relationshipType: item.relationship_type,
      strength: item.strength,
      difficultyLevel: item.difficulty_level
    }));

    this.semanticCache.set(cacheKey, relationships);
    return relationships;
  }

  /**
   * Get word family members
   */
  private async getWordFamilyMembers(family: string, difficultyLevel: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('vocabulary_semantic_relationships')
      .select('related_word')
      .eq('relationship_type', 'family')
      .eq('difficulty_level', difficultyLevel)
      .ilike('word', `%${family}%`);

    if (error) {
      console.error('Error fetching word family members:', error);
      return [];
    }

    return (data || []).map(item => item.related_word);
  }

  /**
   * Get thematic words
   */
  private async getThematicWords(theme: string, difficultyLevel: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('vocabulary_semantic_relationships')
      .select('word, related_word')
      .eq('relationship_type', 'theme')
      .eq('difficulty_level', difficultyLevel)
      .or(`word.ilike.%${theme}%,related_word.ilike.%${theme}%`);

    if (error) {
      console.error('Error fetching thematic words:', error);
      return [];
    }

    const words = new Set<string>();
    (data || []).forEach(item => {
      words.add(item.word);
      words.add(item.related_word);
    });

    return Array.from(words);
  }

  /**
   * Get words at specific difficulty level
   */
  private async getWordsAtDifficultyLevel(difficultyLevel: string, count: number): Promise<string[]> {
    const { data, error } = await supabase
      .from('vocabulary_semantic_relationships')
      .select('word')
      .eq('difficulty_level', difficultyLevel)
      .limit(count);

    if (error) {
      console.error('Error fetching words at difficulty level:', error);
      return [];
    }

    return (data || []).map(item => item.word);
  }

  /**
   * Generate vocabulary data for words
   */
  private async generateVocabularyData(
    words: string[],
    studentProfile: StudentVocabularyProfile
  ): Promise<VocabularyCardData[]> {
    // This would call the existing AI generation service
    // For now, return empty array to avoid circular dependency
    // In the actual implementation, this would call the enhanced generate-vocabulary-words function
    try {
      // Call Supabase Edge Function directly to avoid Netlify 26s timeout
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/generate-vocabulary-words`;
      
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentProfile.studentId,
          specific_words: words,
          count: words.length,
          difficulty: studentProfile.proficiencyLevel
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.words || [];
    } catch (error) {
      console.error('Error generating vocabulary data:', error);
      return [];
    }
  }

  /**
   * Update expansion queue based on selected words
   */
  private async updateExpansionQueue(studentId: string, selectedWords: VocabularyCardData[]): Promise<void> {
    try {
      // Create expansion entries for selected words
      const expansions = selectedWords.map(word => ({
        student_id: studentId,
        base_word: word.word,
        expansion_words: [], // Will be populated by semantic analysis
        expansion_type: 'semantic',
        priority_score: 1.0,
        is_active: true
      }));

      const { error } = await supabase
        .from('vocabulary_expansion_queue')
        .insert(expansions);

      if (error) {
        console.error('Error updating expansion queue:', error);
      }
    } catch (error) {
      console.error('Error updating expansion queue:', error);
    }
  }

  /**
   * Update generation patterns based on selection
   */
  private async updateGenerationPatterns(
    studentId: string,
    selectedWords: VocabularyCardData[],
    currentPatterns: GenerationPattern | null
  ): Promise<void> {
    try {
      // Analyze selected words to update patterns
      const semanticCategories = this.extractSemanticCategories(selectedWords);
      const wordFamilies = this.extractWordFamilies(selectedWords);
      const preferredThemes = this.extractThemes(selectedWords);

      const updatedPatterns = {
        student_id: studentId,
        difficulty_level: currentPatterns?.difficultyLevel || 'B1',
        semantic_categories: semanticCategories,
        word_families: wordFamilies,
        learning_velocity: currentPatterns?.learningVelocity || 1.0,
        success_rate: currentPatterns?.successRate || 0.5,
        preferred_themes: preferredThemes,
        avoided_patterns: currentPatterns?.avoidedPatterns || [],
        last_updated: new Date().toISOString()
      };

      const { error } = await supabase
        .from('vocabulary_generation_patterns')
        .upsert(updatedPatterns, {
          onConflict: 'student_id,difficulty_level'
        });

      if (error) {
        console.error('Error updating generation patterns:', error);
      }

      // Clear cache
      const cacheKey = `${studentId}_${updatedPatterns.difficulty_level}`;
      this.patternCache.delete(cacheKey);
    } catch (error) {
      console.error('Error updating generation patterns:', error);
    }
  }

  /**
   * Extract semantic categories from words
   */
  private extractSemanticCategories(words: VocabularyCardData[]): string[] {
    const categories = new Set<string>();
    
    words.forEach(word => {
      // Simple category extraction based on part of speech and definition
      if (word.partOfSpeech === 'verb') {
        categories.add('actions');
      } else if (word.partOfSpeech === 'adjective') {
        categories.add('descriptive');
      } else if (word.partOfSpeech === 'noun') {
        if (word.definition.toLowerCase().includes('business') || 
            word.definition.toLowerCase().includes('work')) {
          categories.add('business');
        } else if (word.definition.toLowerCase().includes('technology') ||
                   word.definition.toLowerCase().includes('computer')) {
          categories.add('technology');
        } else {
          categories.add('general');
        }
      }
    });

    return Array.from(categories);
  }

  /**
   * Extract word families from words
   */
  private extractWordFamilies(words: VocabularyCardData[]): string[] {
    const families = new Set<string>();
    
    words.forEach(word => {
      // Extract root words and common patterns
      const wordLower = word.word.toLowerCase();
      
      // Common suffixes that indicate word families
      const suffixes = ['tion', 'sion', 'ment', 'ness', 'ity', 'able', 'ible', 'ful', 'less'];
      
      for (const suffix of suffixes) {
        if (wordLower.endsWith(suffix)) {
          const root = wordLower.substring(0, wordLower.length - suffix.length);
          if (root.length > 2) {
            families.add(root);
          }
        }
      }
    });

    return Array.from(families);
  }

  /**
   * Extract themes from words
   */
  private extractThemes(words: VocabularyCardData[]): string[] {
    const themes = new Set<string>();
    
    words.forEach(word => {
      const definition = word.definition.toLowerCase();
      
      // Common themes
      if (definition.includes('business') || definition.includes('work') || definition.includes('professional')) {
        themes.add('business');
      }
      if (definition.includes('technology') || definition.includes('computer') || definition.includes('digital')) {
        themes.add('technology');
      }
      if (definition.includes('travel') || definition.includes('journey') || definition.includes('vacation')) {
        themes.add('travel');
      }
      if (definition.includes('education') || definition.includes('learn') || definition.includes('study')) {
        themes.add('education');
      }
      if (definition.includes('health') || definition.includes('medical') || definition.includes('doctor')) {
        themes.add('health');
      }
    });

    return Array.from(themes);
  }

  /**
   * Record vocabulary interaction for learning analytics
   */
  async recordVocabularyInteraction(
    studentId: string,
    word: string,
    difficultyLevel: string,
    interactionType: 'seen' | 'mastered' | 'struggled',
    masteryScore?: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('vocabulary_history')
        .upsert({
          student_id: studentId,
          word: word.toLowerCase(),
          last_seen_at: new Date().toISOString(),
          times_seen: 1, // Will be incremented by database trigger
          difficulty_level: difficultyLevel,
          mastery_score: masteryScore || 0.5
        }, {
          onConflict: 'student_id,word',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('Error recording vocabulary interaction:', error);
      }
    } catch (error) {
      console.error('Error recording vocabulary interaction:', error);
    }
  }

  /**
   * Get vocabulary analytics for student
   */
  async getVocabularyAnalytics(studentId: string): Promise<{
    totalWordsLearned: number;
    averageMasteryScore: number;
    learningVelocity: number;
    strongCategories: string[];
    weakCategories: string[];
    recommendedDifficulty: string;
  }> {
    try {
      const history = await this.getVocabularyHistory(studentId);
      
      if (history.length === 0) {
        return {
          totalWordsLearned: 0,
          averageMasteryScore: 0,
          learningVelocity: 1.0,
          strongCategories: [],
          weakCategories: [],
          recommendedDifficulty: 'B1'
        };
      }

      const totalWordsLearned = history.length;
      const averageMasteryScore = history.reduce((sum, h) => sum + h.masteryScore, 0) / history.length;
      
      // Calculate learning velocity (words per week)
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentWords = history.filter(h => h.lastSeenAt > oneWeekAgo);
      const learningVelocity = recentWords.length / 7;

      // Analyze categories
      const categoryScores = new Map<string, { total: number; count: number }>();
      history.forEach(h => {
        if (h.semanticCategory) {
          const current = categoryScores.get(h.semanticCategory) || { total: 0, count: 0 };
          current.total += h.masteryScore;
          current.count += 1;
          categoryScores.set(h.semanticCategory, current);
        }
      });

      const categoryAverages = Array.from(categoryScores.entries())
        .map(([category, scores]) => ({
          category,
          average: scores.total / scores.count
        }))
        .sort((a, b) => b.average - a.average);

      const strongCategories = categoryAverages.slice(0, 3).map(c => c.category);
      const weakCategories = categoryAverages.slice(-3).map(c => c.category);

      // Recommend difficulty based on performance
      const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      const currentLevelIndex = levels.indexOf(history[0]?.difficultyLevel || 'B1');
      let recommendedDifficulty = history[0]?.difficultyLevel || 'B1';

      if (averageMasteryScore > 0.8 && currentLevelIndex < levels.length - 1) {
        recommendedDifficulty = levels[currentLevelIndex + 1];
      } else if (averageMasteryScore < 0.4 && currentLevelIndex > 0) {
        recommendedDifficulty = levels[currentLevelIndex - 1];
      }

      return {
        totalWordsLearned,
        averageMasteryScore,
        learningVelocity,
        strongCategories,
        weakCategories,
        recommendedDifficulty
      };
    } catch (error) {
      console.error('Error getting vocabulary analytics:', error);
      return {
        totalWordsLearned: 0,
        averageMasteryScore: 0,
        learningVelocity: 1.0,
        strongCategories: [],
        weakCategories: [],
        recommendedDifficulty: 'B1'
      };
    }
  }
}

export const infiniteVocabularyService = InfiniteVocabularyService.getInstance();