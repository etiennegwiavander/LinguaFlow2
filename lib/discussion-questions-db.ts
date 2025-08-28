import { supabase, supabaseRequest } from './supabase';
import { Question } from '../types';

// Discussion Questions Database Operations

/**
 * Fetch all questions for a specific topic, ordered by question_order
 */
export async function getQuestionsByTopicId(
  topicId: string
): Promise<{ data: Question[] | null; error: any }> {
  return supabaseRequest(async () => {
    const { data, error } = await supabase
      .from('discussion_questions')
      .select('*')
      .eq('topic_id', topicId)
      .order('question_order', { ascending: true });

    return { data, error };
  });
}

/**
 * Fetch questions with pagination support
 */
export async function getQuestionsByTopicIdPaginated(
  topicId: string,
  page: number = 1,
  pageSize: number = 10
): Promise<{ data: Question[] | null; error: any; count?: number }> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  return supabaseRequest(async () => {
    const { data, error, count } = await supabase
      .from('discussion_questions')
      .select('*', { count: 'exact' })
      .eq('topic_id', topicId)
      .order('question_order', { ascending: true })
      .range(from, to);

    return { data, error, count };
  });
}

/**
 * Create a single question
 */
export async function createQuestion(
  question: Omit<Question, 'id' | 'created_at'>
): Promise<{ data: Question | null; error: any }> {
  return supabaseRequest(async () => {
    const { data, error } = await supabase
      .from('discussion_questions')
      .insert([question])
      .select()
      .single();

    return { data, error };
  });
}

/**
 * Create multiple questions in a batch (for AI-generated questions)
 */
export async function createQuestionsInBatch(
  questions: Omit<Question, 'id' | 'created_at'>[]
): Promise<{ data: Question[] | null; error: any }> {
  if (!questions || questions.length === 0) {
    return { data: null, error: { message: 'No questions provided' } };
  }

  // Validate questions before insertion
  for (const question of questions) {
    if (!question.question_text || question.question_text.trim().length === 0) {
      return { data: null, error: { message: 'All questions must have text' } };
    }
    if (!question.topic_id) {
      return { data: null, error: { message: 'All questions must have a topic_id' } };
    }
    if (typeof question.question_order !== 'number' || question.question_order < 1) {
      return { data: null, error: { message: 'All questions must have a valid question_order' } };
    }
  }

  return supabaseRequest(async () => {
    const { data, error } = await supabase
      .from('discussion_questions')
      .insert(questions)
      .select();

    return { data, error };
  });
}

/**
 * Store AI-generated questions for a topic
 */
export async function storeAIGeneratedQuestions(
  topicId: string,
  aiQuestions: Array<{
    question_text: string;
    difficulty_level: string;
    question_order: number;
  }>
): Promise<{ data: Question[] | null; error: any }> {
  // Transform AI questions to match our database schema
  const questionsToInsert: Omit<Question, 'id' | 'created_at'>[] = aiQuestions.map(q => ({
    topic_id: topicId,
    question_text: q.question_text.trim(),
    question_order: q.question_order,
    difficulty_level: q.difficulty_level,
  }));

  return createQuestionsInBatch(questionsToInsert);
}

/**
 * Update a question
 */
export async function updateQuestion(
  questionId: string,
  updates: Partial<Omit<Question, 'id' | 'created_at'>>
): Promise<{ data: Question | null; error: any }> {
  return supabaseRequest(async () => {
    const { data, error } = await supabase
      .from('discussion_questions')
      .update(updates)
      .eq('id', questionId)
      .select()
      .single();

    return { data, error };
  });
}

/**
 * Delete a question
 */
export async function deleteQuestion(
  questionId: string
): Promise<{ data: null; error: any }> {
  return supabaseRequest(async () => {
    const { error } = await supabase
      .from('discussion_questions')
      .delete()
      .eq('id', questionId);

    return { data: null, error };
  });
}

/**
 * Delete all questions for a topic
 */
export async function deleteQuestionsByTopicId(
  topicId: string
): Promise<{ data: null; error: any }> {
  return supabaseRequest(async () => {
    const { error } = await supabase
      .from('discussion_questions')
      .delete()
      .eq('topic_id', topicId);

    return { data: null, error };
  });
}

/**
 * Get a single question by ID
 */
export async function getQuestionById(
  questionId: string
): Promise<{ data: Question | null; error: any }> {
  return supabaseRequest(async () => {
    const { data, error } = await supabase
      .from('discussion_questions')
      .select('*')
      .eq('id', questionId)
      .single();

    return { data, error };
  });
}

/**
 * Get questions by difficulty level for a topic
 */
export async function getQuestionsByDifficulty(
  topicId: string,
  difficultyLevel: string
): Promise<{ data: Question[] | null; error: any }> {
  return supabaseRequest(async () => {
    const { data, error } = await supabase
      .from('discussion_questions')
      .select('*')
      .eq('topic_id', topicId)
      .eq('difficulty_level', difficultyLevel)
      .order('question_order', { ascending: true });

    return { data, error };
  });
}

/**
 * Count questions for a topic
 */
export async function countQuestionsByTopicId(
  topicId: string
): Promise<{ data: number | null; error: any }> {
  return supabaseRequest(async () => {
    const { count, error } = await supabase
      .from('discussion_questions')
      .select('*', { count: 'exact', head: true })
      .eq('topic_id', topicId);

    return { data: count ?? 0, error };
  });
}

/**
 * Check if questions exist for a topic
 */
export async function checkQuestionsExist(
  topicId: string
): Promise<{ data: boolean | null; error: any }> {
  return supabaseRequest(async () => {
    const { data, error } = await supabase
      .from('discussion_questions')
      .select('id')
      .eq('topic_id', topicId)
      .limit(1);

    if (error) {
      return { data: false, error };
    }

    return { data: !!(data && data.length > 0), error: null };
  });
}

/**
 * Check if questions exist and return count for more efficient caching decisions
 */
export async function checkQuestionsExistWithCount(
  topicId: string
): Promise<{ data: { exists: boolean; count: number } | null; error: any }> {
  return supabaseRequest(async () => {
    const { count, error } = await supabase
      .from('discussion_questions')
      .select('*', { count: 'exact', head: true })
      .eq('topic_id', topicId);

    if (error) {
      return { data: { exists: false, count: 0 }, error };
    }

    const questionCount = count ?? 0;
    return { 
      data: { 
        exists: questionCount > 0, 
        count: questionCount 
      }, 
      error: null 
    };
  });
}

/**
 * Get questions with metadata for better caching decisions
 */
export async function getQuestionsWithMetadata(
  topicId: string
): Promise<{ 
  data: { 
    questions: Question[]; 
    count: number; 
    lastUpdated: string | null;
  } | null; 
  error: any 
}> {
  return supabaseRequest(async () => {
    const { data, error } = await supabase
      .from('discussion_questions')
      .select('*')
      .eq('topic_id', topicId)
      .order('question_order', { ascending: true });

    if (error) {
      return { data: null, error };
    }

    const questions = data || [];
    const lastUpdated = questions.length > 0 
      ? questions.reduce((latest, q) => 
          q.created_at > latest ? q.created_at : latest, 
          questions[0].created_at
        )
      : null;

    return { 
      data: {
        questions,
        count: questions.length,
        lastUpdated
      }, 
      error: null 
    };
  });
}

/**
 * Get the next available question order for a topic
 */
export async function getNextQuestionOrder(
  topicId: string
): Promise<{ data: number | null; error: any }> {
  return supabaseRequest(async () => {
    const { data, error } = await supabase
      .from('discussion_questions')
      .select('question_order')
      .eq('topic_id', topicId)
      .order('question_order', { ascending: false })
      .limit(1);

    if (error) {
      return { data: 1, error };
    }

    const nextOrder = data && data.length > 0 ? data[0].question_order + 1 : 1;
    return { data: nextOrder, error: null };
  });
}

/**
 * Reorder questions for a topic (useful for manual question management)
 */
export async function reorderQuestions(
  topicId: string,
  questionOrders: Array<{ id: string; question_order: number }>
): Promise<{ data: Question[] | null; error: any }> {
  return supabaseRequest(async () => {
    // Update each question's order
    const updatePromises = questionOrders.map(({ id, question_order }) =>
      supabase
        .from('discussion_questions')
        .update({ question_order })
        .eq('id', id)
        .eq('topic_id', topicId) // Additional security check
    );

    const results = await Promise.all(updatePromises);
    
    // Check if any updates failed
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      return { data: null, error: errors[0].error };
    }

    // Return updated questions
    return getQuestionsByTopicId(topicId);
  });
}

/**
 * Force regeneration of questions by clearing existing ones
 * This is useful when the question generation algorithm has been improved
 */
export async function forceRegenerateQuestions(
  topicId: string
): Promise<{ data: null; error: any }> {
  return supabaseRequest(async () => {
    // Delete all existing questions for this topic
    const { error } = await supabase
      .from('discussion_questions')
      .delete()
      .eq('topic_id', topicId);

    return { data: null, error };
  });
}

/**
 * Clear all questions for a student (useful for system-wide updates)
 */
export async function clearAllQuestionsForStudent(
  studentId: string
): Promise<{ data: null; error: any }> {
  return supabaseRequest(async () => {
    // First get all topics for this student
    const { data: topics, error: topicsError } = await supabase
      .from('discussion_topics')
      .select('id')
      .eq('student_id', studentId);

    if (topicsError) {
      return { data: null, error: topicsError };
    }

    if (!topics || topics.length === 0) {
      return { data: null, error: null };
    }

    // Delete all questions for these topics
    const topicIds = topics.map(t => t.id);
    const { error } = await supabase
      .from('discussion_questions')
      .delete()
      .in('topic_id', topicIds);

    return { data: null, error };
  });
}